import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Stripe webhook handler — Mix Techniques subscriptions
//
// Why this matters: Stripe is the source of truth for who has paid. The
// `subscriptions` table on our side mirrors Stripe state so the rest of the app
// can do simple "what tier is this user?" lookups without calling Stripe on
// every page load.
//
// Critical invariants:
//   1. Signature verification is mandatory. Never trust an unsigned request.
//   2. The handler is idempotent — Stripe may retry on any 5xx. Re-running the
//      same event must produce the same final state, not duplicate rows.
//   3. We resolve user by `subscription.metadata.supabase_user_id` (set at
//      checkout time). Fallback: customer.metadata.supabase_user_id. Last
//      resort: look up by email — slow and racy, only used for events that
//      arrive before the customer record is updated.
//
// Required env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic"; // never cache
export const runtime = "nodejs";        // raw body access for signature verify

function getStripeInstance(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-06-24.dahlia",
    typescript: true,
  });
}

interface SubscriptionMetadata {
  supabase_user_id?: string;
  tier?: string;
}

async function resolveUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subscription: Stripe.Subscription
): Promise<string | null> {
  // 1. Subscription metadata (set at checkout)
  const subMeta = (subscription.metadata || {}) as SubscriptionMetadata;
  if (subMeta.supabase_user_id) return subMeta.supabase_user_id;

  // 2. Customer metadata (set when customer was created)
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const stripe = getStripeInstance();
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer.deleted) {
    const custMeta = (customer.metadata || {}) as SubscriptionMetadata;
    if (custMeta.supabase_user_id) return custMeta.supabase_user_id;
  }

  // 3. Last resort: lookup by email. Stripe customers have email; Supabase
  //    auth.users.email matches. We can't query auth.users from PostgREST
  //    without service role.
  if (!customer.deleted && customer.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", customer.email)
      .limit(1)
      .maybeSingle();
    if (profile?.id) return profile.id;
  }

  return null;
}

function tierFromStripePriceId(priceId: string | undefined): "pro" | null {
  if (!priceId) return null;
  // Exact match against configured price id.
  if (process.env.STRIPE_PRICE_ID_PRO && priceId === process.env.STRIPE_PRICE_ID_PRO) {
    return "pro";
  }
  return null;
}

/**
 * Default tier fallback: we currently have exactly one paid product (Pro at
 * $15/mo). If we can't match the price ID against STRIPE_PRICE_ID_PRO for
 * any reason (env var missing on the server, new price created, price ID
 * rotation), default to "pro" rather than silently dropping the user's
 * subscription. This means a misconfiguration can't lock paid users out.
 *
 * If we ever add a second paid product, this MUST be replaced with a strict
 * fail-loud path (return null, write nothing) instead.
 */
function defaultTierForUnknownPrice(priceId: string | undefined): "pro" {
  console.warn(
    `tierFromStripePriceId returned null for price id: ${priceId}. STRIPE_PRICE_ID_PRO=${process.env.STRIPE_PRICE_ID_PRO ?? "(unset)"}. Falling back to 'pro' because we have only one paid product.`
  );
  return "pro";
}

/**
 * Map Stripe subscription.status -> our local status string.
 * Subscriptions table CHECK constraint accepts: active, trialing, canceled, past_due, free
 * (per migration 009 — extend if you add new statuses)
 */
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
      return status;
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    case "paused":
      // These are transitional or unpaid — surface as 'past_due' so we keep
      // the user's tier while Stripe retries, and downgrade cleanly when
      // Stripe sends us 'customer.subscription.deleted'.
      return "past_due";
    default:
      return "past_due";
  }
}

async function upsertSubscription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  args: {
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    stripePriceId: string;
    tier: "pro";
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  }
) {
  // Idempotent upsert keyed on stripe_subscription_id (unique per migration 009).
  // We use UPSERT so re-delivery of the same event is a no-op.
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: args.userId,
      stripe_subscription_id: args.stripeSubscriptionId,
      stripe_customer_id: args.stripeCustomerId,
      stripe_price_id: args.stripePriceId,
      tier: args.tier,
      status: args.status,
      current_period_start: args.currentPeriodStart?.toISOString() || null,
      current_period_end: args.currentPeriodEnd?.toISOString() || null,
      cancel_at_period_end: args.cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_subscription_id",
    }
  );

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Webhook missing signature or secret");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripeInstance();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // We use the service-role client here intentionally — Stripe webhooks are
  // server-to-server and the user is not authenticated. The subscriptions
  // table RLS only allows users to read/update their own row, which is fine
  // for normal traffic; the webhook needs write access for any user.
  // Service role is gated by the presence of STRIPE_WEBHOOK_SECRET being
  // valid (otherwise we 400 before reaching this point).
  const supabase = await createClient();
  // The createClient() above uses the user's cookie session. For webhook
  // operations we need service-role to bypass RLS. Create a separate client.
  // (We can't share the cookie client because there's no user here.)
  const { createClient: createSbClient } = await import("@supabase/supabase-js");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const adminSupabase = createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // The subscription itself is what matters — this event is mainly
        // useful for the customer_id <-> user_id link. We let
        // customer.subscription.created handle the actual row write.
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id, "for customer", session.customer);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(adminSupabase, subscription);
        if (!userId) {
          console.error("Could not resolve user_id for subscription", subscription.id);
          return NextResponse.json(
            { error: "Could not resolve user" },
            { status: 200 } // 200 so Stripe doesn't retry forever for an unrecoverable state
          );
        }

        const item = subscription.items.data[0];
        const priceId = item?.price?.id;
        let tier = tierFromStripePriceId(priceId);
        if (!tier) {
          // Don't drop the user — fallback to 'pro' since we have one paid
          // product. Log loudly so misconfigurations surface in Vercel logs.
          tier = defaultTierForUnknownPrice(priceId);
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await upsertSubscription(adminSupabase, {
          userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          stripePriceId: priceId,
          tier,
          status: mapStripeStatus(subscription.status),
          currentPeriodStart: (item as any).current_period_start
            ? new Date((item as any).current_period_start * 1000)
            : null,
          currentPeriodEnd: (item as any).current_period_end
            ? new Date((item as any).current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        });

        console.log(
          `Subscription ${event.type}: ${subscription.id} -> user=${userId} tier=${tier} status=${subscription.status}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(adminSupabase, subscription);
        if (!userId) {
          console.error("Could not resolve user_id for deleted subscription", subscription.id);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // Mark canceled. The trigger from migration 009 (trigger_auto_portfolio)
        // should flip the user back to free when tier changes from pro/studio
        // to free — but since we're just updating status here, we explicitly
        // set tier='free' on cancellation so the rest of the app sees a
        // consistent state immediately rather than waiting for a sync job.
        const { error } = await adminSupabase
          .from("subscriptions")
          .update({
            status: "canceled",
            tier: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          throw new Error(`Failed to mark subscription canceled: ${error.message}`);
        }

        console.log(`Subscription canceled: ${subscription.id} -> user=${userId} -> free`);
        break;
      }

      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        // For now these map to 'past_due' / 'active'. Stripe pause is rare.
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(adminSupabase, subscription);
        if (!userId) break;

        const newStatus = event.type.endsWith("resumed") ? "active" : "paused";
        // 'paused' isn't in our CHECK constraint — fall back to 'past_due'
        const safeStatus = newStatus === "paused" ? "past_due" : newStatus;
        await adminSupabase
          .from("subscriptions")
          .update({
            status: safeStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id;
        if (!subId) break;

        // Don't downgrade on a single failed payment — Stripe will retry.
        await adminSupabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subId);
        break;
      }

      default:
        // Acknowledge so Stripe doesn't retry for events we don't care about
        console.log("Unhandled webhook event type:", event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err?.message || err);
    // Return 500 so Stripe retries — events are idempotent so retries are safe.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

// Stripe sends POSTs with a content-type of application/json but the body is
// the raw event string. Next.js App Router gives us the raw body via
// request.text() as long as we don't parse it ourselves. Good.