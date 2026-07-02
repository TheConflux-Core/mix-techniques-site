import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscription";
import MembershipClient from "./MembershipClient";

export const metadata: Metadata = {
  title: "Membership — Mix Techniques",
  description: "Manage your Mix Techniques subscription.",
};

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/membership");
  }

  const tier = await getUserTier(supabase, user.id);

  // Pull subscription details (best-effort; null if user is on free)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const params = await searchParams;
  const checkoutSuccess = params.checkout === "success";
  const checkoutCancelled = params.checkout === "cancelled";

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none" />

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 relative z-10">
        <div className="text-center mb-10">
          <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-4">
            Membership
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold heading-wave">
            Your Tier
          </h1>
        </div>

        {checkoutSuccess && (
          <div className="mb-8 card-float noise carbon-fiber-walnut rounded-2xl p-6 border border-[#D4A843]/40">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg text-[#F0E6D3] uppercase tracking-wider mb-1">
                  Welcome to {tier === "studio" ? "Studio" : "Pro"}
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/60 text-sm">
                  Your subscription is active. Stripe will email you a receipt. Your portfolio
                  will be live within a few seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {checkoutCancelled && (
          <div className="mb-8 card-float noise carbon-fiber-walnut rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">↩️</div>
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg text-[#F0E6D3] uppercase tracking-wider mb-1">
                  Checkout Cancelled
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/60 text-sm">
                  No charge was made. You can try again or stick with your current tier.
                </p>
              </div>
            </div>
          </div>
        )}

        <MembershipClient
          tier={tier}
          subscription={
            sub
              ? {
                  status: sub.status,
                  currentPeriodEnd: sub.current_period_end,
                  cancelAtPeriodEnd: sub.cancel_at_period_end,
                }
              : null
          }
          userEmail={user.email || ""}
        />

        <div className="mt-10 text-center">
          <Link
            href="/pricing"
            className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/40 hover:text-[#D4A843] tracking-wider uppercase"
          >
            ← Back to Pricing
          </Link>
        </div>
      </main>
    </div>
  );
}