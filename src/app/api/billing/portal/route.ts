import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/billing";

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session so the user can manage their
 * subscription (update card, cancel, view invoices). Returns the portal URL.
 *
 * If the user doesn't have a Stripe customer record yet, returns 400.
 *
 * If Stripe is not configured, returns 503.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Billing is not configured yet.", code: "stripe_not_configured" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        {
          error: "No active subscription found. Use /pricing to start one.",
          code: "no_customer",
        },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      `https://${request.headers.get("host")}` ||
      "https://mixtechniques.com";

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/dashboard/membership`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Portal error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}