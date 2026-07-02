"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { MAX_TRACKS_PER_USER } from "@/lib/billing";

interface TierConfig {
  id: "free" | "pro";
  name: string;
  priceMonthly: number;
  blurb: string;
  features: string[];
  stripePriceId: string | null;
}

export default function PricingClient({ tiers }: { tiers: TierConfig[] }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSelect(tierId: string) {
    setError("");

    if (!user) {
      router.push(`/login?next=/pricing&intent=${tierId}`);
      return;
    }

    if (tierId === "free") {
      router.push("/");
      return;
    }

    setBusy(tierId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await res.json();

      if (res.status === 503) {
        // Stripe not configured yet — fall back to email
        setError(
          "Online checkout is not configured yet. Email hello@mixtechniques.com to upgrade manually for testing."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {error && (
        <div className="max-w-2xl mx-auto mb-8 text-red-400 font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-3 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {tiers.map((tier) => {
          const isFree = tier.id === "free";
          const isFeatured = tier.id === "pro";
          return (
            <div
              key={tier.id}
              className={`card-float noise carbon-fiber-walnut rounded-2xl p-8 relative overflow-hidden flex flex-col ${
                isFeatured ? "ring-2 ring-[#D4A843]/40" : ""
              }`}
            >
              {isFeatured && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A843] to-transparent" />
                  <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-[#D4A843]/15 border border-[#D4A843]/30">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#D4A843] uppercase tracking-wider">
                      One Simple Price
                    </span>
                  </div>
                </>
              )}

              <div className="mb-6">
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-2">
                  {tier.name}
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs leading-relaxed min-h-[3em]">
                  {tier.blurb}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-display)] text-5xl text-[#D4A843] font-bold">
                    {isFree ? "Free" : `$${tier.priceMonthly / 100}`}
                  </span>
                  {!isFree && (
                    <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs uppercase tracking-wider">
                      / month
                    </span>
                  )}
                </div>
                {!isFree && (
                  <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-[10px] uppercase tracking-wider mt-2">
                    Cancel anytime · No ads · Verified badge
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 font-[family-name:var(--font-mono)] text-[#F0E6D3]/70 text-xs leading-relaxed"
                  >
                    <span className="text-[#D4A843] mt-0.5 flex-shrink-0">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(tier.id)}
                disabled={loading || busy === tier.id}
                className={`w-full font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] px-6 py-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFree
                    ? "bg-[#3A2818]/40 text-[#F0E6D3]/70 hover:bg-[#3A2818]/60"
                    : "btn-3d text-[#1A0F0A]"
                }`}
              >
                {busy === tier.id
                  ? "Loading..."
                  : isFree
                    ? "Get Started"
                    : `Go Pro — $${tier.priceMonthly / 100}/mo`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center mt-8 font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-xs">
        {MAX_TRACKS_PER_USER} tracks is plenty for a best-work showcase. Most clients want to hear your
        top {MAX_TRACKS_PER_USER} anyway.
      </p>
    </>
  );
}