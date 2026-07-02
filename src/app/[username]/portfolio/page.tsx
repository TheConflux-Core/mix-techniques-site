"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profile, PortfolioSettings, PortfolioTrack, SubscriptionTier } from "@/lib/types";
import WaveformPlayer from "@/components/portfolio/WaveformPlayer";
import TrackList from "@/components/portfolio/TrackList";
import TestimonialSection from "@/components/portfolio/TestimonialSection";
import GearList from "@/components/portfolio/GearList";
import PortfolioContactForm from "@/components/portfolio/PortfolioContactForm";
import PortfolioBadge from "@/components/portfolio/PortfolioBadge";

interface PortfolioData {
  profile: Profile;
  tier: SubscriptionTier;
  settings: PortfolioSettings | null;
  tracks: PortfolioTrack[];
}

export default function PortfolioPage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPortfolio() {
      setLoading(true);
      try {
        const res = await fetch(`/api/portfolio/${encodeURIComponent(username)}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (json.tier === "free" || !json.settings) {
          setNotFound(true);
        } else {
          setData(json);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }
    fetchPortfolio();
  }, [username]);

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
            Loading Portfolio...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen carbon-fiber flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6">🎧</div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#F0E6D3] uppercase tracking-wider mb-4">
            Portfolio Not Available
          </h1>
          <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm mb-6">
            This user hasn&apos;t set up their portfolio yet.
          </p>
          <a
            href={`/${username}`}
            className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.15em] px-8 py-3 rounded-lg font-bold inline-block"
          >
            View Profile
          </a>
        </div>
      </div>
    );
  }

  const { profile, tier, settings, tracks } = data;
  const initial = profile.display_name?.charAt(0)?.toUpperCase() || "?";
  const featuredTracks = tracks.filter((t) => t.is_featured);
  const regularTracks = tracks.filter((t) => !t.is_featured);

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Hero */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8 text-center">
          <div className="flex flex-col items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-[100px] h-[100px] rounded-full object-cover border-2 border-[#3A2818]"
              />
            ) : (
              <div
                className="w-[100px] h-[100px] rounded-full flex items-center justify-center text-3xl font-bold font-[family-name:var(--font-display)] border-2 border-[#3A2818]"
                style={{
                  background: "linear-gradient(135deg, #D4A843 0%, #B8862D 50%, #E89B2E 100%)",
                  color: "#1A0F0A",
                }}
              >
                {initial}
              </div>
            )}

            <div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-wider font-bold heading-wave">
                  {profile.display_name}
                </h1>
                <PortfolioBadge tier={tier} size="md" />
              </div>

              {settings?.headline && (
                <p className="font-[family-name:var(--font-display)] text-lg text-[#D4A843]/80 italic mb-2">
                  {settings.headline}
                </p>
              )}

              <div className="flex items-center justify-center gap-2 text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-xs tracking-wider">
                {profile.location && <span>{profile.location}</span>}
                {profile.genre && (
                  <>
                    <span className="text-[#3A2818]">·</span>
                    <span className="text-[#D4A843]/70">{profile.genre}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Bio */}
        {settings?.custom_bio && (
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-4 heading-wave">
              About
            </h2>
            <p className="text-[#F0E6D3]/70 font-[family-name:var(--font-mono)] text-sm leading-relaxed whitespace-pre-wrap">
              {settings.custom_bio}
            </p>
          </div>
        )}

        {/* Tracks */}
        {tracks.length > 0 && (
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
              Tracks
            </h2>
            {featuredTracks.length > 0 && (
              <div className="mb-4">
                <TrackList tracks={featuredTracks} />
              </div>
            )}
            {regularTracks.length > 0 && <TrackList tracks={regularTracks} compact />}
          </div>
        )}

        {/* Testimonials */}
        {settings?.client_testimonials && settings.client_testimonials.length > 0 && (
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
              Testimonials
            </h2>
            <TestimonialSection testimonials={settings.client_testimonials} />
          </div>
        )}

        {/* Gear */}
        {settings?.gear_list && settings.gear_list.length > 0 && (
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
              Gear &amp; Plugins
            </h2>
            <GearList gear={settings.gear_list} />
          </div>
        )}

        {/* Rates */}
        {settings?.show_rates && (settings.hourly_rate || settings.per_song_rate) && (
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
              Rates
            </h2>
            <div className="flex flex-wrap gap-4">
              {settings.hourly_rate && (
                <div className="bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-xl px-6 py-4 text-center">
                  <div className="font-[family-name:var(--font-display)] text-2xl text-[#D4A843]">
                    ${settings.hourly_rate}
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">
                    Per Hour
                  </div>
                </div>
              )}
              {settings.per_song_rate && (
                <div className="bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-xl px-6 py-4 text-center">
                  <div className="font-[family-name:var(--font-display)] text-2xl text-[#D4A843]">
                    ${settings.per_song_rate}
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">
                    Per Song
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Form */}
        {settings?.contact_form_enabled !== false && (
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8 mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6 heading-wave">
              Get In Touch
            </h2>
            <PortfolioContactForm username={username} />
          </div>
        )}
      </div>
    </div>
  );
}
