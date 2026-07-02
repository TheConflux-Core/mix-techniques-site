"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { PortfolioTrack, SubscriptionTier } from "@/lib/types";
import PortfolioBadge from "@/components/portfolio/PortfolioBadge";

export default function DashboardPortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [tracks, setTracks] = useState<PortfolioTrack[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [profileSlug, setProfileSlug] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    async function load() {
      // Get profile slug
      const { data: profile } = await supabase
        .from("profiles").select("display_name").eq("id", user!.id).single();

      if (profile) {
        const slug = profile.display_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "";
        setProfileSlug(slug);
      }

      // Get tier via RPC (handles trialing + past_due correctly)
      const { data: tierData } = await supabase
        .rpc("get_user_tier", { p_user_id: user!.id });
      setTier((tierData as SubscriptionTier) || "free");

      // Get tracks
      const { data: t } = await supabase
        .from("portfolio_tracks").select("*").eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      setTracks(t || []);
      setTotalPlays((t || []).reduce((sum, tr) => sum + (tr.play_count || 0), 0));

      setLoading(false);
    }
    load();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="min-h-screen carbon-fiber flex items-center justify-center"><p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#F0E6D3] uppercase tracking-wider">Portfolio Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <PortfolioBadge tier={tier} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {profileSlug && (
              <>
                <a href={`/${profileSlug}`} className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/40 hover:text-[#D4A843] transition-colors">View Profile</a>
                {tier !== "free" && (
                  <a href={`/${profileSlug}/portfolio`} className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/40 hover:text-[#D4A843] transition-colors">View Portfolio</a>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card-float noise carbon-fiber-walnut rounded-xl p-6 text-center">
            <div className="font-[family-name:var(--font-display)] text-3xl text-[#D4A843]">{tracks.length}</div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">Tracks</div>
          </div>
          <div className="card-float noise carbon-fiber-walnut rounded-xl p-6 text-center">
            <div className="font-[family-name:var(--font-display)] text-3xl text-[#D4A843]">{totalPlays}</div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">Total Plays</div>
          </div>
          <div className="card-float noise carbon-fiber-walnut rounded-xl p-6 text-center">
            <div className="font-[family-name:var(--font-display)] text-3xl text-[#D4A843]">{tracks.filter(t => t.is_featured).length}</div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">Featured</div>
          </div>
        </div>

        {/* Quick links */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tier !== "free" && profileSlug && (
              <a href={`/${profileSlug}/portfolio/edit`} className="flex items-center gap-3 bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-xl px-5 py-4 hover:border-[#D4A843]/30 transition-colors group">
                <span className="text-xl">✏️</span>
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3] group-hover:text-[#D4A843] transition-colors">Edit Portfolio</p>
                  <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/30">Update tracks, bio, theme</p>
                </div>
              </a>
            )}
            {tier === "free" && (
              <div className="flex items-center gap-3 bg-[#D4A843]/5 border border-[#D4A843]/20 rounded-xl px-5 py-4">
                <span className="text-xl">⬆️</span>
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-sm text-[#D4A843]">Upgrade to Pro</p>
                  <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/30">Unlock portfolio features</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent tracks */}
        {tracks.length > 0 && (
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">Recent Tracks</h2>
            <div className="space-y-2">
              {tracks.slice(0, 5).map(track => (
                <div key={track.id} className="flex items-center justify-between bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    {track.is_featured && <span className="text-[#D4A843] text-xs">★</span>}
                    <span className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]">{track.title}</span>
                  </div>
                  <div className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/30">
                    <span>{track.file_format?.toUpperCase()}</span>
                    <span>▶ {track.play_count}</span>
                    <span className={track.is_public ? "text-green-400/50" : "text-[#F0E6D3]/20"}>{track.is_public ? "Public" : "Private"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
