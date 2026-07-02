"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SubscriptionInfo {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Props {
  tier: "free" | "pro" | "studio";
  subscription: SubscriptionInfo | null;
  userEmail: string;
}

const TIER_DISPLAY = {
  free: { name: "Free", color: "#F0E6D3", blurb: "Public profile + community access." },
  pro: { name: "Pro", color: "#D4A843", blurb: "Portfolio, audio uploads, themes." },
  studio: { name: "Studio", color: "#E89B2E", blurb: "Everything in Pro + analytics + larger uploads." },
};

export default function MembershipClient({ tier, subscription, userEmail }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const display = TIER_DISPLAY[tier];

  async function handleUpgrade(targetTier: "pro" | "studio") {
    setError("");
    setBusy(targetTier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier }),
      });
      const data = await res.json();

      if (res.status === 503) {
        setError(
          "Online checkout isn't available yet. Email hello@mixtechniques.com to upgrade manually."
        );
        return;
      }

      if (data.code === "already_subscribed") {
        // User already has a subscription — send to portal
        return handleManage();
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

  async function handleManage() {
    setError("");
    setBusy("manage");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();

      if (res.status === 503) {
        setError(
          "Customer portal isn't available yet. Email hello@mixtechniques.com for help."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Portal failed");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const hasActivePaidSub = (tier === "pro" || tier === "studio") && subscription;

  return (
    <>
      {error && (
        <div className="mb-6 text-red-400 font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs uppercase tracking-wider mb-1">
              Current Tier
            </p>
            <h2
              className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-[0.1em] font-bold"
              style={{ color: display.color }}
            >
              {display.name}
            </h2>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-xs mt-2">
              {display.blurb}
            </p>
          </div>

          {hasActivePaidSub && (
            <div className="text-right">
              <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs uppercase tracking-wider mb-1">
                Status
              </p>
              <p
                className={`font-[family-name:var(--font-mono)] text-sm ${
                  subscription?.status === "active"
                    ? "text-green-400/80"
                    : subscription?.status === "trialing"
                      ? "text-blue-400/80"
                      : subscription?.status === "past_due"
                        ? "text-yellow-400/80"
                        : "text-red-400/80"
                }`}
              >
                {subscription?.status === "past_due"
                  ? "Payment Failed — Update Card"
                  : subscription?.cancelAtPeriodEnd
                    ? "Cancels at Period End"
                    : subscription?.status}
              </p>
              {subscription?.currentPeriodEnd && (
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs mt-1">
                  {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {tier === "free" && (
          <>
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={busy !== null}
              className="w-full btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] px-8 py-4 rounded-lg font-bold disabled:opacity-50"
            >
              {busy === "pro" ? "Loading..." : "Upgrade to Pro — $10/mo"}
            </button>
            <button
              onClick={() => handleUpgrade("studio")}
              disabled={busy !== null}
              className="w-full bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/30 hover:bg-[#D4A843]/25 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] px-8 py-4 rounded-lg font-bold disabled:opacity-50"
            >
              {busy === "studio" ? "Loading..." : "Upgrade to Studio — $25/mo"}
            </button>
          </>
        )}

        {tier === "pro" && (
          <>
            <button
              onClick={() => handleUpgrade("studio")}
              disabled={busy !== null}
              className="w-full btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] px-8 py-4 rounded-lg font-bold disabled:opacity-50"
            >
              {busy === "studio" ? "Loading..." : "Upgrade to Studio — $25/mo"}
            </button>
            <button
              onClick={handleManage}
              disabled={busy !== null}
              className="w-full bg-[#3A2818]/40 text-[#F0E6D3]/70 hover:bg-[#3A2818]/60 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] px-8 py-4 rounded-lg font-bold disabled:opacity-50"
            >
              {busy === "manage" ? "Loading..." : "Manage Subscription (Cancel / Update Card)"}
            </button>
          </>
        )}

        {tier === "studio" && (
          <button
            onClick={handleManage}
            disabled={busy !== null}
            className="w-full btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] px-8 py-4 rounded-lg font-bold disabled:opacity-50"
          >
            {busy === "manage" ? "Loading..." : "Manage Subscription (Cancel / Update Card)"}
          </button>
        )}

        {hasActivePaidSub && (
          <div className="text-center pt-2">
            <Link
              href={tier === "studio" ? "/dashboard/portfolio" : "/[username]/portfolio/edit".replace("[username]", "")}
              className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843] hover:text-[#E89B2E] tracking-wider uppercase"
            >
              {tier === "studio" ? "Open Studio Dashboard →" : "Edit Your Portfolio →"}
            </Link>
          </div>
        )}
      </div>

      <p className="text-center mt-8 font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-xs">
        Logged in as {userEmail}
      </p>
    </>
  );
}