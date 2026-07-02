"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Profile, Submission } from "@/lib/types";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SubmissionList from "@/components/profile/SubmissionList";
import OwnerSubmissions from "@/components/profile/OwnerSubmissions";
import ScheduleSection from "@/components/profile/ScheduleSection";
import { SubscriptionTier, PortfolioSettings, PortfolioTrack } from "@/lib/types";
import WaveformPlayer from "@/components/portfolio/WaveformPlayer";
import PortfolioBadge from "@/components/portfolio/PortfolioBadge";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [portfolioTier, setPortfolioTier] = useState<SubscriptionTier>("free");
  const [portfolioSettings, setPortfolioSettings] = useState<PortfolioSettings | null>(null);
  const [portfolioTracks, setPortfolioTracks] = useState<PortfolioTrack[]>([]);
  const supabase = createClient();

  const username = decodeURIComponent(params.username as string);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);

      // Find profile by slugified display_name
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("display_name", username.replace(/-/g, " "));

      if (error || !profiles || profiles.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Find exact slug match
      const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const matched = profiles.find(
        (p) => slugify(p.display_name || "") === username.toLowerCase()
      );

      if (!matched) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(matched);

      // Fetch submissions — try by user email from auth, or by profile email if present
      let userEmail = matched.email || "";
      if (!userEmail) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser?.id === matched.id) {
            userEmail = authUser?.email || "";
          }
        } catch {}
      }

      const { data: subs } = userEmail
        ? await supabase
            .from("submissions")
            .select("*")
            .eq("email", userEmail)
            .order("created_at", { ascending: false })
        : { data: [] };

      setSubmissions(subs || []);

      // Fetch portfolio data
      try {
        const pRes = await fetch(`/api/portfolio/${encodeURIComponent(username)}`);
        if (pRes.ok) {
          const pData = await pRes.json();
          setPortfolioTier(pData.tier || "free");
          setPortfolioSettings(pData.settings || null);
          setPortfolioTracks(pData.tracks || []);
        }
      } catch {}

      setLoading(false);
    }

    fetchProfile();
  }, [username]);

  const isOwner = user?.id === profile?.id;

  if (loading) {
    return (
      <div className="min-h-screen carbon-fiber flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-end justify-center gap-[2px] h-10 mb-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full origin-bottom"
                style={{
                  background: "linear-gradient(to top, #D4A843, #E89B2E)",
                  height: "60%",
                  animation: `waveform-breathe ${1.5 + (i % 5) * 0.3}s ease-in-out ${i * 0.08}s infinite`,
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
          <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] uppercase">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen carbon-fiber flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6">🎧</div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#F0E6D3] uppercase tracking-wider mb-4">
            Producer Not Found
          </h1>
          <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm mb-6">
            This profile doesn&apos;t exist yet.
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.15em] px-8 py-3 rounded-lg font-bold"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-fiber relative">
      {/* Warm light ambience */}
      <div className="fixed inset-0 warm-light-bg pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Profile Header */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
          <ProfileHeader profile={profile} isOwner={isOwner} />
        </div>

        {/* Submissions — owner sees enhanced view, visitors see public list */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
            {isOwner ? "My Submissions" : "Submissions"}
          </h2>
          {isOwner ? (
            <OwnerSubmissions submissions={submissions} />
          ) : (
            <SubmissionList submissions={submissions} />
          )}
        </div>

        {/* Schedule */}
        {submissions.some((s) => s.episode_id) && (
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
              Schedule
            </h2>
            <ScheduleSection submissions={submissions} />
          </div>
        )}

        {/* Portfolio Section — Pro only */}
        {portfolioTier !== "free" && portfolioSettings && (
          <>
            {/* Badge + Link */}
            <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PortfolioBadge tier={portfolioTier} size="md" />
                  {portfolioSettings.headline && (
                    <span className="font-[family-name:var(--font-display)] text-sm text-[#D4A843]/80 italic">
                      {portfolioSettings.headline}
                    </span>
                  )}
                </div>
                <a
                  href={`/${username}/portfolio`}
                  className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.15em] px-5 py-2 rounded-lg font-bold"
                >
                  🎧 View Full Portfolio
                </a>
              </div>
            </div>

            {/* Featured Tracks Preview */}
            {portfolioTracks.length > 0 && (
              <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
                  Portfolio Tracks
                </h2>
                <div className="space-y-3">
                  {portfolioTracks
                    .filter((t) => t.is_featured)
                    .slice(0, 3)
                    .map((track) => (
                      <div key={track.id} className="bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-widest text-[#D4A843] bg-[#D4A843]/10 px-1.5 py-0.5 rounded">★ Featured</span>
                          <h3 className="font-[family-name:var(--font-display)] text-sm text-[#F0E6D3]">{track.title}</h3>
                        </div>
                        <WaveformPlayer audioUrl={track.audio_url} peaks={track.waveform_peaks} title={track.title} compact />
                      </div>
                    ))}
                </div>
                {portfolioTracks.length > 3 && (
                  <a
                    href={`/${username}/portfolio`}
                    className="block mt-4 text-center font-[family-name:var(--font-mono)] text-xs text-[#D4A843]/60 hover:text-[#D4A843] transition-colors"
                  >
                    View all {portfolioTracks.length} tracks →
                  </a>
                )}
              </div>
            )}

            {/* Testimonials Preview */}
            {portfolioSettings.client_testimonials && portfolioSettings.client_testimonials.length > 0 && (
              <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
                  Testimonials
                </h2>
                <blockquote className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3]/70 italic leading-relaxed">
                  &ldquo;{portfolioSettings.client_testimonials[0].quote}&rdquo;
                </blockquote>
                <div className="mt-3">
                  <span className="font-[family-name:var(--font-mono)] text-sm text-[#D4A843]">{portfolioSettings.client_testimonials[0].name}</span>
                  {portfolioSettings.client_testimonials[0].project && (
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 ml-2">— {portfolioSettings.client_testimonials[0].project}</span>
                  )}
                </div>
                {portfolioSettings.client_testimonials.length > 1 && (
                  <a
                    href={`/${username}/portfolio`}
                    className="block mt-4 font-[family-name:var(--font-mono)] text-xs text-[#D4A843]/60 hover:text-[#D4A843] transition-colors"
                  >
                    Read {portfolioSettings.client_testimonials.length} testimonials →
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
