import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSbClient } from "@supabase/supabase-js";

/**
 * POST /api/staff/memberships/set-tier
 *
 * Body: { user_id: string, tier: "free" | "pro" | "studio" }
 *
 * Staff-only manual tier override. Used for testing + for upgrading users
 * by hand when Stripe isn't configured (or for promotional upgrades).
 *
 * Auth: requires an authenticated user whose email is in the STAFF_EMAILS
 * env var (comma-separated). The check mirrors the one on the page.
 *
 * Implementation note: we use the service-role client to write the row,
 * since the regular RLS only allows users to read/write their own
 * subscription. Staff needs cross-user write access.
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

    const body = await request.json().catch(() => ({}));
    const userId = body?.user_id as string | undefined;
    const tier = body?.tier as "free" | "pro" | "studio" | undefined;

    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }
    if (!tier || !["free", "pro", "studio"].includes(tier)) {
      return NextResponse.json(
        { error: "tier must be 'free', 'pro', or 'studio'" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured (no service role key)" },
        { status: 500 }
      );
    }

    const adminSupabase = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user exists
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (tier === "free") {
      // Demotion path — mark any active sub canceled and tier=free.
      // We do not delete the row so audit history survives.
      const { error } = await adminSupabase
        .from("subscriptions")
        .update({
          tier: "free",
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .in("status", ["active", "trialing", "past_due"]);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, user_id: userId, tier: "free" });
    }

    // Upgrade path — UPSERT a manual subscription row. No Stripe IDs.
    const { error } = await adminSupabase.from("subscriptions").upsert(
      {
        user_id: userId,
        tier,
        status: "active",
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_end: null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      },
      {
        // Match by user_id where status is one of the active values (the
        // partial unique index from migration 011). If no row matches, INSERT.
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      // If we hit a partial-unique conflict (user already has an active
      // row), UPDATE the existing row instead.
      if (error.code === "23505") {
        const { error: updateErr } = await adminSupabase
          .from("subscriptions")
          .update({
            tier,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .in("status", ["active", "trialing", "past_due"]);

        if (updateErr) {
          return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, user_id: userId, tier });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: userId, tier });
  } catch (err: any) {
    console.error("Staff set-tier error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}