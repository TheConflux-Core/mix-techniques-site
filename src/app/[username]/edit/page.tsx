"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Profile, GENRE_OPTIONS, SocialLinks } from "@/lib/types";

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    location: "",
    genre: "",
    website: "",
    social_links: {
      instagram: "",
      twitter: "",
      tiktok: "",
      youtube: "",
      soundcloud: "",
    } as SocialLinks,
  });

  const username = decodeURIComponent(params.username as string);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        router.push("/");
        return;
      }

      // Verify slugified name matches
      const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      if (slugify(data.display_name || "") !== username.toLowerCase()) {
        router.push("/");
        return;
      }

      setProfile(data);
      setForm({
        display_name: data.display_name || "",
        bio: data.bio || "",
        location: data.location || "",
        genre: data.genre || "",
        website: data.website || "",
        social_links: data.social_links || {
          instagram: "",
          twitter: "",
          tiktok: "",
          youtube: "",
          soundcloud: "",
        },
      });
      setAvatarPreview(data.avatar_url);
      setLoading(false);
    }

    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      fetchProfile();
    }
  }, [user, authLoading]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `${user.id}/avatar.${ext}`;

    setUploadingAvatar(true);
    setError(null);

    try {
      // Delete existing avatar first (upsert requires DELETE policy we don't have)
      await supabase.storage
        .from("avatars")
        .remove([filePath])
        .catch(() => {}); // Ignore if file doesn't exist

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarPreview(publicUrl);
      if (profile) {
        setProfile({ ...profile, avatar_url: publicUrl });
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name,
          bio: form.bio || null,
          location: form.location || null,
          genre: form.genre || null,
          website: form.website || null,
          social_links: form.social_links,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (platform: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value },
    }));
  };

  const getInputClasses = () =>
    "w-full bg-[#0F0A07] border border-[#3A2818] text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm rounded-lg px-4 py-3 placeholder:text-[#F0E6D3]/20 transition-all duration-300 hover:border-[#3A2818]/80";

  if (loading || authLoading) {
    return (
      <div className="min-h-screen carbon-fiber flex items-center justify-center">
        <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] uppercase">
          Loading...
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const initial = profile.display_name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none" />

      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#F0E6D3] uppercase tracking-wider mb-8 heading-wave">
            Edit Profile
          </h1>

          {error && (
            <div className="bg-[#C4392A]/10 border border-[#C4392A]/30 text-[#C4392A] px-4 py-3 rounded-lg font-[family-name:var(--font-mono)] text-sm mb-6 error-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-700/30 text-green-400 px-4 py-3 rounded-lg font-[family-name:var(--font-mono)] text-sm mb-6 animate-fade-in">
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6 mb-2">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-[80px] h-[80px] rounded-full object-cover border-2 border-[#3A2818] group-hover:border-[#D4A843]/40 transition-all"
                  />
                ) : (
                  <div
                    className="w-[80px] h-[80px] rounded-full border-2 border-[#3A2818] flex items-center justify-center text-2xl font-bold font-[family-name:var(--font-display)] group-hover:border-[#D4A843]/40 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #D4A843 0%, #B8862D 50%, #E89B2E 100%)",
                      color: "#1A0F0A",
                    }}
                  >
                    {initial}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-[family-name:var(--font-mono)]">
                    {uploadingAvatar ? "..." : "📷"}
                  </span>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-[#D4A843] font-[family-name:var(--font-mono)] text-xs tracking-wider hover:text-[#E89B2E] transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? "Uploading..." : "Change Photo"}
                </button>
                <p className="text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] text-[10px] mt-1">
                  JPG, PNG or WebP
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
                Display Name
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className={getInputClasses()}
                placeholder="Your display name"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
                Bio <span className="text-[#F0E6D3]/20">(max 500 chars)</span>
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 500) })}
                className={`${getInputClasses()} resize-none h-24`}
                placeholder="Tell the world about yourself..."
                maxLength={500}
              />
              <p className="text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] text-[10px] mt-1 text-right">
                {form.bio.length}/500
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={getInputClasses()}
                placeholder="City, State/Country"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
                Genre
              </label>
              <select
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className={`${getInputClasses()} appearance-none cursor-pointer`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10L6 8z' fill='%23D4A843'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                }}
              >
                <option value="">Select your discipline</option>
                {GENRE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
                Website
              </label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className={getInputClasses()}
                placeholder="https://your-site.com"
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-3 uppercase tracking-[0.15em]">
                Social Links
              </label>
              <div className="space-y-3 pl-4 border-l-2 border-[#3A2818]/60">
                {["instagram", "twitter", "tiktok", "youtube", "soundcloud"].map((platform) => (
                  <div key={platform}>
                    <label className="block text-xs text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] mb-1.5 capitalize tracking-wider">
                      {platform === "twitter" ? "Twitter/X" : platform}
                    </label>
                    <input
                      type="text"
                      value={(form.social_links as any)[platform] || ""}
                      onChange={(e) => updateSocial(platform, e.target.value)}
                      className="w-full bg-[#0F0A07] border border-[#3A2818] text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm rounded-lg px-4 py-2.5 placeholder:text-[#F0E6D3]/15 transition-all duration-300 hover:border-[#3A2818]/80"
                      placeholder={`https://${platform === "twitter" ? "x.com" : platform}.com/...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="btn-3d w-full text-[#1A0F0A] font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.2em] py-5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Profile"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
