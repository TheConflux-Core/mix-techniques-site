"use client";

import { useState } from "react";

interface ProfileLite {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface SubscriptionRow {
  user_id: string;
  tier: string;
  status: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  profile: ProfileLite | null;
}

export default function MembershipsClient({
  initialRows,
  currentUserEmail,
}: {
  initialRows: SubscriptionRow[];
  currentUserEmail: string;
}) {
  const [rows, setRows] = useState<SubscriptionRow[]>(initialRows);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.user_id.toLowerCase().includes(q) ||
      r.profile?.email?.toLowerCase().includes(q) ||
      r.profile?.display_name?.toLowerCase().includes(q) ||
      r.tier.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  async function setTier(userId: string, tier: "free" | "pro") {
    setError("");
    setSuccess("");
    setBusyId(userId);
    try {
      const res = await fetch("/api/staff/memberships/set-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      // Update local state optimistically
      setRows((prev) =>
        prev.map((r) => (r.user_id === userId ? { ...r, tier, status: "active", updated_at: new Date().toISOString() } : r))
      );
      setSuccess(`Set ${userId.slice(0, 8)} → ${tier}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function syncFromStripe(email: string) {
    setError("");
    setSuccess("");
    setBusyId(`sync-${email}`);
    try {
      const res = await fetch("/api/staff/memberships/sync-from-stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      // Refresh the table so the new row shows up
      const refresh = await fetch("/staff/memberships", { cache: "no-store" });
      // (Server component re-render is what actually updates state; we hint via success)
      setSuccess(
        `Synced ${email} from Stripe: ${data.tier} (${data.status}). Refresh the page to see the row.`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none" />
      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="mb-8">
          <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-3">
            Staff
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold heading-wave mb-2">
            Memberships
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs">
            Logged in as {currentUserEmail}. Use this to flip user tiers manually while Stripe is in test mode.
          </p>
        </div>

        <div className="mb-6 flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by email, name, user id, or tier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[240px] px-4 py-3 bg-[#1A0F0A]/60 border border-[#3A2818]/40 rounded-lg text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm focus:outline-none focus:border-[#D4A843]/60"
          />
          <button
            onClick={() => {
              const email = window.prompt("Email of user to sync from Stripe:");
              if (email) syncFromStripe(email.trim().toLowerCase());
            }}
            className="px-4 py-3 rounded-lg bg-[#D4A843]/15 border border-[#D4A843]/30 text-[#D4A843] font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider hover:bg-[#D4A843]/25 transition-colors"
            title="Pull a user's active subscription from Stripe into our DB. Use when a webhook was misconfigured."
          >
            Sync from Stripe
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-400 font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-green-400 font-[family-name:var(--font-mono)] bg-green-900/20 border border-green-900/30 rounded-lg px-4 py-3 text-sm">
            {success}
          </div>
        )}

        <div className="card-float noise carbon-fiber-walnut rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#1A0F0A]/60 border-b border-[#3A2818]/40">
              <tr>
                <th className="px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">Tier</th>
                <th className="px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">Updated</th>
                <th className="px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.user_id} className="border-b border-[#3A2818]/20 hover:bg-[#1A0F0A]/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.profile?.avatar_url ? (
                        <img
                          src={row.profile.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#3A2818] flex items-center justify-center text-xs text-[#F0E6D3]/40">
                          ?
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/80 text-xs truncate">
                          {row.profile?.display_name || "(no name)"}
                        </p>
                        <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-[10px] truncate">
                          {row.profile?.email || row.user_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-[family-name:var(--font-display)] text-sm uppercase tracking-wider"
                      style={{
                        color:
                          row.tier === "pro"
                            ? "#D4A843"
                            : "#F0E6D3",
                      }}
                    >
                      {row.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-[family-name:var(--font-mono)] text-xs ${
                        row.status === "active"
                          ? "text-green-400/70"
                          : row.status === "past_due"
                            ? "text-yellow-400/70"
                            : "text-[#F0E6D3]/40"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs">
                    {new Date(row.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {(["free", "pro"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTier(row.user_id, t)}
                          disabled={busyId === row.user_id || row.tier === t}
                          className="px-2 py-1 rounded text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider bg-[#3A2818]/40 text-[#F0E6D3]/60 hover:bg-[#3A2818]/60 hover:text-[#D4A843] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-sm">
                    {search ? "No matching subscriptions." : "No subscriptions yet. Users on Free tier won't appear here."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 hover:text-[#D4A843] tracking-wider uppercase"
          >
            ← Back to Site
          </a>
        </div>
      </main>
    </div>
  );
}