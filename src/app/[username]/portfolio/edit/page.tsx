"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { PortfolioSettings, PortfolioTrack, PortfolioTestimonial, SubscriptionTier } from "@/lib/types";
import TrackUploader from "@/components/portfolio/TrackUploader";
import ThemeSelector from "@/components/portfolio/ThemeSelector";
import TierGate from "@/components/portfolio/TierGate";
import AnalyticsDashboard from "@/components/portfolio/AnalyticsDashboard";

type Tab = "profile" | "tracks" | "testimonials" | "gear" | "settings" | "theme" | "analytics";

export default function PortfolioEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const username = decodeURIComponent(params.username as string);
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [tracks, setTracks] = useState<PortfolioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [headline, setHeadline] = useState("");
  const [customBio, setCustomBio] = useState("");
  const [gearList, setGearList] = useState<string[]>([]);
  const [gearInput, setGearInput] = useState("");
  const [testimonials, setTestimonials] = useState<PortfolioTestimonial[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactFormEnabled, setContactFormEnabled] = useState(true);
  const [showRates, setShowRates] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");
  const [perSongRate, setPerSongRate] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("studio-gold");
  const [showBadge, setShowBadge] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    async function checkAccess() {
      const { data: profile } = await supabase
        .from("profiles").select("id, display_name").eq("id", user!.id).single();

      const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      if (!profile || slugify(profile.display_name || "") !== username.toLowerCase()) {
        router.push("/"); return;
      }

      const { data: tierData } = await supabase
        .rpc("get_user_tier", { p_user_id: user!.id });
      setTier((tierData as SubscriptionTier) || "free");

      const { data: s } = await supabase
        .from("portfolio_settings").select("*").eq("user_id", user!.id).single();

      if (s) {
        setHeadline(s.headline || "");
        setCustomBio(s.custom_bio || "");
        setGearList(s.gear_list || []);
        setTestimonials(s.client_testimonials || []);
        setContactEmail(s.contact_email || "");
        setContactFormEnabled(s.contact_form_enabled !== false);
        setShowRates(s.show_rates || false);
        setHourlyRate(s.hourly_rate?.toString() || "");
        setPerSongRate(s.per_song_rate?.toString() || "");
        setSelectedTheme(s.theme || "studio-gold");
        setShowBadge(s.show_badge !== false);
        setAnalyticsEnabled(s.analytics_enabled !== false);
      }

      const { data: t } = await supabase
        .from("portfolio_tracks").select("*").eq("user_id", user!.id)
        .order("is_featured", { ascending: false }).order("sort_order", { ascending: true });
      setTracks(t || []);
      setLoading(false);
    }
    checkAccess();
  }, [user, authLoading, username]);

  const saveSettings = useCallback(async () => {
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch("/api/portfolio/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline || null, custom_bio: customBio || null,
          gear_list: gearList, client_testimonials: testimonials,
          contact_email: contactEmail || null, contact_form_enabled: contactFormEnabled,
          show_rates: showRates, hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          per_song_rate: perSongRate ? parseFloat(perSongRate) : null,
          theme: selectedTheme, show_badge: showBadge, analytics_enabled: analyticsEnabled,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSaveMsg("✓ Saved"); setTimeout(() => setSaveMsg(""), 2000);
    } catch (err) {
      setSaveMsg(`✗ ${err instanceof Error ? err.message : "Save failed"}`);
    } finally { setSaving(false); }
  }, [headline, customBio, gearList, testimonials, contactEmail, contactFormEnabled, showRates, hourlyRate, perSongRate, selectedTheme, showBadge, analyticsEnabled]);

  const addGear = () => { if (gearInput.trim()) { setGearList([...gearList, gearInput.trim()]); setGearInput(""); } };
  const removeGear = (i: number) => setGearList(gearList.filter((_, idx) => idx !== i));
  const addTestimonial = () => setTestimonials([...testimonials, { name: "", quote: "", project: "" }]);
  const updateTestimonial = (i: number, field: keyof PortfolioTestimonial, value: string) => {
    const u = [...testimonials]; u[i] = { ...u[i], [field]: value }; setTestimonials(u);
  };
  const removeTestimonial = (i: number) => setTestimonials(testimonials.filter((_, idx) => idx !== i));

  const toggleTrackFeatured = async (track: PortfolioTrack) => {
    const res = await fetch(`/api/portfolio/tracks/${track.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !track.is_featured }),
    });
    if (res.ok) setTracks(prev => prev.map(t => t.id === track.id ? { ...t, is_featured: !t.is_featured } : t));
  };
  const toggleTrackPublic = async (track: PortfolioTrack) => {
    const res = await fetch(`/api/portfolio/tracks/${track.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: !track.is_public }),
    });
    if (res.ok) setTracks(prev => prev.map(t => t.id === track.id ? { ...t, is_public: !t.is_public } : t));
  };
  const deleteTrack = async (track: PortfolioTrack) => {
    if (!confirm(`Delete "${track.title}"?`)) return;
    const res = await fetch(`/api/portfolio/tracks/${track.id}`, { method: "DELETE" });
    if (res.ok) setTracks(prev => prev.filter(t => t.id !== track.id));
  };
  const moveTrack = async (track: PortfolioTrack, dir: "up" | "down") => {
    const idx = tracks.findIndex(t => t.id === track.id);
    const si = dir === "up" ? idx - 1 : idx + 1;
    if (si < 0 || si >= tracks.length) return;
    const nt = [...tracks];
    const tmp = nt[idx].sort_order; nt[idx] = { ...nt[idx], sort_order: nt[si].sort_order }; nt[si] = { ...nt[si], sort_order: tmp };
    [nt[idx], nt[si]] = [nt[si], nt[idx]]; setTracks(nt);
    await Promise.all([
      fetch(`/api/portfolio/tracks/${nt[idx].id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: nt[idx].sort_order }) }),
      fetch(`/api/portfolio/tracks/${nt[si].id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: nt[si].sort_order }) }),
    ]);
  };

  if (authLoading || loading) return <div className="min-h-screen carbon-fiber flex items-center justify-center"><p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs">Loading editor...</p></div>;

  if (tier === "free") return (
    <div className="min-h-screen carbon-fiber flex items-center justify-center">
      <div className="card-float noise carbon-fiber-walnut rounded-2xl p-12 text-center max-w-md">
        <div className="text-5xl mb-4">🎛️</div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#F0E6D3] uppercase tracking-wider mb-4">Portfolio Editor</h1>
        <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm mb-6">Upgrade to Pro or Studio to unlock the portfolio editor.</p>
        <div className="bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-xl p-4 mb-6">
          <p className="text-[#D4A843] font-[family-name:var(--font-mono)] text-xs">For testing, add a row to the <code>subscriptions</code> table with your user_id and tier = &apos;pro&apos; or &apos;studio&apos;.</p>
        </div>
        <a href={`/${username}`} className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.15em] px-8 py-3 rounded-lg font-bold inline-block">Back to Profile</a>
      </div>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "tracks", label: "Tracks", icon: "🎵" },
    { id: "testimonials", label: "Testimonials", icon: "💬" },
    { id: "gear", label: "Gear", icon: "⚙️" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "theme", label: "Theme", icon: "🎨" },
    { id: "analytics", label: "Analytics", icon: "📊" },
  ];

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none" />
      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#F0E6D3] uppercase tracking-wider">Portfolio Editor</h1>
            <p className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 mt-1">Editing portfolio for @{username}</p>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && <span className={`font-[family-name:var(--font-mono)] text-xs ${saveMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{saveMsg}</span>}
            <button onClick={saveSettings} disabled={saving} className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.15em] px-6 py-2.5 rounded-lg font-bold disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-48 flex-shrink-0">
            <div className="card-float noise carbon-fiber-walnut rounded-xl p-2 space-y-1 sticky top-6">
              {tabs.map(tab => {
                if (tab.id === "analytics" && tier !== "studio") return null;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg font-[family-name:var(--font-mono)] text-xs transition-all ${activeTab === tab.id ? "bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20" : "text-[#F0E6D3]/40 hover:text-[#F0E6D3]/60 hover:bg-[#2A1810]/30 border border-transparent"}`}>
                    <span className="mr-2">{tab.icon}</span>{tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="card-float noise carbon-fiber-walnut rounded-2xl p-8">

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider heading-wave">Profile &amp; Bio</h2>
                  <div>
                    <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">Headline</label>
                    <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Grammy-nominated mix engineer" className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm" />
                  </div>
                  <div>
                    <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">Custom Bio</label>
                    <textarea rows={6} value={customBio} onChange={e => setCustomBio(e.target.value)} placeholder="Tell visitors about your background, experience, and what makes your work unique..." className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm resize-none" />
                  </div>
                </div>
              )}

              {/* Tracks Tab */}
              {activeTab === "tracks" && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider heading-wave">Tracks</h2>
                  <TierGate requiredTier="pro" fallback={<div className="text-center py-8"><p className="text-[#D4A843] font-[family-name:var(--font-mono)] text-sm">Upgrade to Pro to upload tracks.</p></div>}>
                    <TrackUploader onUploadComplete={track => setTracks(prev => [...prev, track as PortfolioTrack])} onError={err => setSaveMsg(`✗ ${err}`)} />
                  </TierGate>
                  {tracks.length > 0 && (
                    <div className="space-y-2 mt-6">
                      <h3 className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 uppercase tracking-wider">Your Tracks ({tracks.length})</h3>
                      {tracks.map((track, i) => (
                        <div key={track.id} className="flex items-center gap-3 bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-lg p-3">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => moveTrack(track, "up")} disabled={i === 0} className="text-[#F0E6D3]/30 hover:text-[#D4A843] disabled:opacity-20 text-xs">▲</button>
                            <button onClick={() => moveTrack(track, "down")} disabled={i === tracks.length - 1} className="text-[#F0E6D3]/30 hover:text-[#D4A843] disabled:opacity-20 text-xs">▼</button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3] truncate">{track.title}</p>
                            <span className="text-[10px] font-[family-name:var(--font-mono)] text-[#F0E6D3]/30">{track.file_format?.toUpperCase()} · {track.play_count} plays</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleTrackFeatured(track)} className={`text-xs px-2 py-1 rounded font-[family-name:var(--font-mono)] transition-colors ${track.is_featured ? "bg-[#D4A843]/20 text-[#D4A843] border border-[#D4A843]/30" : "text-[#F0E6D3]/30 border border-[#3A2818]/30 hover:border-[#D4A843]/30"}`}>★</button>
                            <button onClick={() => toggleTrackPublic(track)} className={`text-xs px-2 py-1 rounded font-[family-name:var(--font-mono)] transition-colors ${track.is_public ? "bg-green-900/30 text-green-400 border border-green-800/30" : "text-[#F0E6D3]/30 border border-[#3A2818]/30"}`}>{track.is_public ? "Public" : "Private"}</button>
                            <button onClick={() => deleteTrack(track)} className="text-xs px-2 py-1 rounded font-[family-name:var(--font-mono)] text-red-400/50 hover:text-red-400 border border-transparent hover:border-red-900/30">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Testimonials Tab */}
              {activeTab === "testimonials" && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider heading-wave">Client Testimonials</h2>
                  {testimonials.map((t, i) => (
                    <div key={i} className="bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843]">Testimonial {i + 1}</span>
                        <button onClick={() => removeTestimonial(i)} className="text-red-400/50 hover:text-red-400 text-xs">Remove</button>
                      </div>
                      <input type="text" value={t.name} onChange={e => updateTestimonial(i, "name", e.target.value)} placeholder="Client name" className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm" />
                      <input type="text" value={t.project || ""} onChange={e => updateTestimonial(i, "project", e.target.value)} placeholder="Project name (optional)" className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm" />
                      <textarea rows={3} value={t.quote} onChange={e => updateTestimonial(i, "quote", e.target.value)} placeholder="What they said..." className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm resize-none" />
                    </div>
                  ))}
                  <button onClick={addTestimonial} className="w-full border-2 border-dashed border-[#3A2818]/40 rounded-xl p-4 text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs hover:border-[#3A2818] hover:text-[#F0E6D3]/50 transition-colors">+ Add Testimonial</button>
                </div>
              )}

              {/* Gear Tab */}
              {activeTab === "gear" && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider heading-wave">Gear &amp; Plugins</h2>
                  <div className="flex gap-2">
                    <input type="text" value={gearInput} onChange={e => setGearInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addGear())} placeholder="Add gear (e.g. Neumann U87, SSL G-Bus)" className="flex-1 bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm" />
                    <button onClick={addGear} className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-xs uppercase px-4 py-2 rounded-lg font-bold">Add</button>
                  </div>
                  <div className="space-y-2">
                    {gearList.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-lg px-4 py-2">
                        <span className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/70">{item}</span>
                        <button onClick={() => removeGear(i)} className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider heading-wave">Contact &amp; Rates</h2>
                  <div>
                    <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">Contact Email</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={contactFormEnabled} onChange={e => setContactFormEnabled(e.target.checked)} className="w-4 h-4 accent-[#D4A843]" />
                    <span className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/70">Enable contact form on portfolio</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={showRates} onChange={e => setShowRates(e.target.checked)} className="w-4 h-4 accent-[#D4A843]" />
                    <span className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/70">Show rates on portfolio</span>
                  </label>
                  {showRates && (
                    <div className="grid grid-cols-2 gap-4 ml-7">
                      <div>
                        <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">Hourly Rate ($)</label>
                        <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="150" className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm" />
                      </div>
                      <div>
                        <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">Per Song Rate ($)</label>
                        <input type="number" value={perSongRate} onChange={e => setPerSongRate(e.target.value)} placeholder="500" className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm" />
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={showBadge} onChange={e => setShowBadge(e.target.checked)} className="w-4 h-4 accent-[#D4A843]" />
                    <span className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/70">Show tier badge on profile</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={analyticsEnabled} onChange={e => setAnalyticsEnabled(e.target.checked)} className="w-4 h-4 accent-[#D4A843]" />
                    <span className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/70">Enable analytics tracking</span>
                  </label>
                </div>
              )}

              {/* Theme Tab */}
              {activeTab === "theme" && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider heading-wave">Theme</h2>
                  <ThemeSelector selected={selectedTheme} onSelect={setSelectedTheme} />
                </div>
              )}

              {/* Analytics Tab (Studio only) */}
              {activeTab === "analytics" && tier === "studio" && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider heading-wave">Analytics</h2>
                  <AnalyticsDashboard />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
