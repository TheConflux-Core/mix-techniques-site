import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSbClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/**
 * POST /api/staff/memberships/sync-from-stripe
 *
 * Body: { email: string } OR { user_id: string }
 *
 * Staff-only manual rescue path: pulls a user's most recent active
 * subscription directly from the Stripe API and writes it into our
 * subscriptions table. Use this when:
 *
 *   - A webhook was misconfigured and never delivered (webhook URL wrong,
 *     signing secret rotated, endpoint disabled in Stripe dashboard)
 *   - Stripe support manually fixed something on their end
 *   - You're migrating data and need to backfill
 *
 * This is intentionally a different code path from the webhook. The webhook
 * listens for events; this RESCUES by polling Stripe directly for the
 * current canonical state of the subscription.
 *
 * Auth: requires an authenticated user whose email is in STAFF_EMAILS.
 */

const STAFF_EMAILS = (process.env.STAFF_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (STAFF_EMAILS.length > 0 && !STAFF_EMAILS.includes((user.email || "").toLowerCase())) {
      return NextResponse.json({ error: "Forbidden — not a staff email" }, { status: 403 });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured (missing Stripe or Supabase service key)" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetEmail: string | undefined = body?.email;
    const targetUserId: string | undefined = body?.user_id;

    if (!targetEmail && !targetUserId) {
      return NextResponse.json(
        { error: "Provide either 'email' or 'user_id' in the request body" },
        { status: 400 }
      );
    }

    const adminSupabase = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve target user
    let targetUser: { id: string; email: string | null } | null = null;
    if (targetUserId) {
      const { data } = await adminSupabase
        .from("profiles")
        .select("id, email")
        .eq("id", targetUserId)
        .maybeSingle();
      targetUser = data;
    } else {
      const { data } = await adminSupabase
        .from("profiles")
        .select("id, email")
        .eq("email", targetEmail!)
        .maybeSingle();
      targetUser = data;
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found in profiles table" },
        { status: 404 }
      );
    }

    // Pull active subscriptions for this customer from Stripe. We don't
    // store stripe_customer_id on profiles, so we search by email.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
    });

    if (!targetUser.email) {
      return NextResponse.json(
        { error: "User has no email on file — can't search Stripe by email" },
        { status: 400 }
      );
    }

    const customers = await stripe.customers.list({
      email: targetUser.email,
      limit: 5,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        {
          error: `No Stripe customers found for email ${targetUser.email}. If the user paid as a guest, their Stripe email won't match their auth email.`,
        },
        { status: 404 }
      );
    }

    // Find the active subscription across all matching customers
    let foundSubscription: Stripe.Subscription | null = null;
    let foundCustomer: Stripe.Customer | null = null;
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 5,
      });
      const active = subs.data.find(
        (s) => s.status === "active" || s.status === "trialing" || s.status === "past_due"
      );
      if (active) {
        foundSubscription = active;
        foundCustomer = customer;
        break;
      }
    }

    if (!foundSubscription || !foundCustomer) {
      return NextResponse.json(
        {
          error: `No active subscriptions found for any Stripe customer matching ${targetUser.email}. The user may have not actually paid, or the subscription was canceled.`,
        },
        { status: 404 }
      );
    }

    // Map Stripe subscription to our row. Same logic as the webhook.
    const item = foundSubscription.items.data[0];
    const priceId = item?.price?.id;
    const tier: "pro" = "pro"; // Single paid product — see src/lib/billing.ts
    const status = foundSubscription.status;

    // Upsert into subscriptions table, keyed on stripe_subscription_id
    const { error: upsertErr } = await adminSupabase.from("subscriptions").upsert(
      {
        user_id: targetUser.id,
        stripe_subscription_id: foundSubscription.id,
        stripe_customer_id: foundCustomer.id,
        stripe_price_id: priceId || null,
        tier,
        status,
        current_period_start: (item as any).current_period_start
          ? new Date((item as any).current_period_start * 1000).toISOString()
          : null,
        current_period_end: (item as any).current_period_end
          ? new Date((item as any).current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: Boolean(foundSubscription.cancel_at_period_end),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    );

    if (upsertErr) {
      return NextResponse.json(
        { error: `Failed to write subscription: ${upsertErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: targetUser.id,
      email: targetUser.email,
      stripe_subscription_id: foundSubscription.id,
      stripe_customer_id: foundCustomer.id,
      stripe_price_id: priceId,
      tier,
      status,
      message: `Synced ${targetUser.email} → ${tier} (${status}). Refresh /dashboard/membership.`,
    });
  } catch (err: any) {
    console.error("Staff sync-from-stripe error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}