import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TIERS, getStripe, tierFromSubscription, isStripeConfigured } from "@/lib/billing";

/**
 * POST /api/billing/checkout
 *
 * Body: { tier: "pro" | "studio" }
 *
 * Creates a Stripe Checkout session in subscription mode. We attach the
 * authenticated user's email + Supabase user id to the session metadata so
 * the webhook can resolve the subscription back to the right row.
 *
 * If the user already has an active paid subscription, returns 400 — they
 * should use /api/billing/portal instead.
 *
 * If Stripe is not configured (e.g. dev / pre-launch), returns 503 so the UI
 * can fall back to the "Contact us for manual upgrade" path.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "Billing is not configured yet. Please contact us for a manual upgrade.",
          code: "stripe_not_configured",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const userEmail = session.user.email || undefined;

    const body = await request.json().catch(() => ({}));
    const requestedTier = body?.tier as "pro" | "studio" | undefined;
    if (!requestedTier || (requestedTier !== "pro" && requestedTier !== "studio")) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'pro' or 'studio'." },
        { status: 400 }
      );
    }

    const tierConfig = TIERS[requestedTier];
    if (!tierConfig.stripePriceId) {
      return NextResponse.json(
        {
          error: `${tierConfig.name} is not available for online purchase yet. Please contact us for a manual upgrade.`,
          code: "tier_not_buyable",
        },
        { status: 503 }
      );
    }

    // Check if user already has an active paid subscription — direct to portal
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("tier, status, stripe_customer_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      const currentTier = tierFromSubscription(existingSub);
      if (currentTier === requestedTier || currentTier === "studio") {
        return NextResponse.json(
          {
            error: "You already have an active subscription. Use the customer portal to manage it.",
            code: "already_subscribed",
          },
          { status: 400 }
        );
      }
    }

    const stripe = getStripe();
    const origin =
      request.headers.get("origin") ||
      `https://${request.headers.get("host")}` ||
      "https://mixtechniques.com";

    // Look up or create the Stripe customer so future renewals / portal
    // sessions stay tied to the same customer record.
    let customerId = existingSub?.stripe_customer_id || undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: tierConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/membership?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: {
        supabase_user_id: userId,
        tier: requestedTier,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          tier: requestedTier,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
  } catch (err: any) {
    console.error("Checkout error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}