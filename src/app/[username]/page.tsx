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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
      </div>
    </div>
  );
}
