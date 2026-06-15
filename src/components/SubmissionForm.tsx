"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import WaveformPreview from "./WaveformPreview";
import { useAuth } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { createClient } from "@/lib/supabase/client";
import { GENRE_OPTIONS } from "@/lib/types";

interface FormData {
  name: string;
  email: string;
  location: string;
  genre: string;
  trackTitle: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
    soundcloud: string;
  };
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_TYPES = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/flac", "audio/x-flac"];
const ACCEPTED_EXTENSIONS = [".wav", ".mp3", ".flac"];

export default function SubmissionForm() {
  const { user } = useAuth();
  const supabase = createClient();
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    location: "",
    genre: "",
    trackTitle: "",
    socialLinks: { instagram: "", twitter: "", tiktok: "", youtube: "", soundcloud: "" },
  });
  const [file, setFile] = useState<File | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakingFields, setShakingFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const computeWaveform = useCallback(async (audioFile: File) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const peakCount = 200;
      const blockSize = Math.floor(channelData.length / peakCount);
      const peakValues: number[] = [];
      for (let i = 0; i < peakCount; i++) {
        let max = 0;
        const start = i * blockSize;
        for (let j = start; j < start + blockSize && j < channelData.length; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > max) max = abs;
        }
        peakValues.push(max);
      }
      const maxPeak = Math.max(...peakValues, 0.01);
      const normalized = peakValues.map((p) => p / maxPeak);
      setPeaks(normalized);
      setDuration(audioBuffer.duration);
      audioContext.close();
    } catch (err) {
      console.error("Failed to decode audio:", err);
      setPeaks([]);
      setDuration(0);
    }
  }, []);

  const validateFile = (f: File): string | null => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(f.type)) {
      return "Invalid file type. Please upload a .wav, .mp3, or .flac file.";
    }
    if (f.size > MAX_FILE_SIZE) return "File is too large. Maximum size is 50MB.";
    return null;
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    const fileError = validateFile(selectedFile);
    if (fileError) { setError(fileError); return; }
    setFile(selectedFile);
    await computeWaveform(selectedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newShaking = new Set<string>();
    if (!form.name.trim()) { newErrors.name = "Name is required"; newShaking.add("name"); }
    if (!form.email.trim()) { newErrors.email = "Email is required"; newShaking.add("email"); }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { newErrors.email = "Invalid email address"; newShaking.add("email"); }
    if (!form.genre) { newErrors.genre = "Genre is required"; newShaking.add("genre"); }
    if (!form.trackTitle.trim()) { newErrors.trackTitle = "Track title is required"; newShaking.add("trackTitle"); }
    if (!file) { newErrors.file = "Audio file is required"; newShaking.add("file"); }
    setErrors(newErrors);
    setShakingFields(newShaking);
    // Clear shake after animation
    setTimeout(() => setShakingFields(new Set()), 500);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("metadata", JSON.stringify({
        name: form.name,
        email: form.email,
        location: form.location || null,
        genre: form.genre,
        track_title: form.trackTitle,
        social_links: form.socialLinks,
        waveform_data: peaks,
        duration: duration,
      }));
      const res = await fetch("/api/submissions", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
      setShakingFields((prev) => { const next = new Set(prev); next.delete(field); return next; });
    }
  };

  const updateSocial = (platform: string, value: string) => {
    setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [platform]: value } }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Pre-fill name/email from auth user and fetch profile slug
  useEffect(() => {
    if (!user || prefilled) return;

    const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || "";
    const email = user.email || "";

    setForm((prev) => ({
      ...prev,
      name: prev.name || displayName,
      email: prev.email || email,
    }));
    setPrefilled(true);

    // Fetch profile to get display_name for slug
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) {
          setProfileSlug(slugify(data.display_name));
        }
      });
  }, [user, prefilled, supabase]);

  // Generate sparkles on success
  useEffect(() => {
    if (isSuccess) {
      const newSparkles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        y: 30 + Math.random() * 40,
        delay: Math.random() * 0.8,
      }));
      setSparkles(newSparkles);
    }
  }, [isSuccess]);

  if (isSuccess) {
    return (
      <div className="text-center py-16 animate-fade-in relative">
        {/* Sparkle particles */}
        {sparkles.map((s) => (
          <div
            key={s.id}
            className="sparkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
        <div className="success-icon text-7xl mb-6">🎵</div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#F0E6D3] mb-4 uppercase tracking-wider brass-hover">
          Submission Received
        </h2>
        <p className="font-[family-name:var(--font-mono)] text-[#D4A843] text-lg tagline-glow mb-8">
          Your mix has been submitted. We&apos;ll be in touch.
        </p>
        {profileSlug && (
          <Link
            href={`/${profileSlug}`}
            className="inline-block font-[family-name:var(--font-mono)] text-sm text-[#D4A843]/80 hover:text-[#D4A843] border border-[#3A2818]/60 hover:border-[#D4A843]/40 px-6 py-3 rounded-lg transition-all tracking-wider"
          >
            View your profile →
          </Link>
        )}
      </div>
    );
  }

  const getInputClasses = (field: string) =>
    `w-full bg-[#0F0A07] border text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm rounded-lg px-4 py-3 placeholder:text-[#F0E6D3]/20 transition-all duration-300 ${
      shakingFields.has(field)
        ? "error-shake border-[#C4392A]"
        : "border-[#3A2818] hover:border-[#3A2818]/80"
    }`;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[#C4392A]/10 border border-[#C4392A]/30 text-[#C4392A] px-4 py-3 rounded-lg font-[family-name:var(--font-mono)] text-sm error-shake">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
          Name <span className="text-[#D4A843]">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
          className={getInputClasses("name")}
          placeholder="Your name"
        />
        {errors.name && <p className="text-[#C4392A] text-xs mt-1.5 font-[family-name:var(--font-mono)]">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
          Email <span className="text-[#D4A843]">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => updateForm("email", e.target.value)}
          className={getInputClasses("email")}
          placeholder="you@example.com"
        />
        {errors.email && <p className="text-[#C4392A] text-xs mt-1.5 font-[family-name:var(--font-mono)]">{errors.email}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
          Location
        </label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => updateForm("location", e.target.value)}
          className={getInputClasses("location")}
          placeholder="City, State/Country"
        />
      </div>

      {/* Genre — Brass selector */}
      <div>
        <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
          Genre <span className="text-[#D4A843]">*</span>
        </label>
        <select
          value={form.genre}
          onChange={(e) => updateForm("genre", e.target.value)}
          className={`${getInputClasses("genre")} appearance-none cursor-pointer`}
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
        {errors.genre && <p className="text-[#C4392A] text-xs mt-1.5 font-[family-name:var(--font-mono)]">{errors.genre}</p>}
      </div>

      {/* Social Links Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowSocial(!showSocial)}
          className="flex items-center gap-2 text-xs text-[#D4A843]/80 font-[family-name:var(--font-mono)] uppercase tracking-[0.15em] hover:text-[#D4A843] transition-colors link-shimmer"
        >
          <span className={`transform transition-transform duration-300 ${showSocial ? "rotate-90" : ""}`}>▸</span>
          Social Links (optional)
        </button>
        {showSocial && (
          <div className="mt-4 space-y-3 pl-4 border-l-2 border-[#3A2818]/60 animate-fade-in">
            {["instagram", "twitter", "tiktok", "youtube", "soundcloud"].map((platform) => (
              <div key={platform}>
                <label className="block text-xs text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] mb-1.5 capitalize tracking-wider">
                  {platform === "twitter" ? "Twitter/X" : platform}
                </label>
                <input
                  type="text"
                  value={(form.socialLinks as any)[platform]}
                  onChange={(e) => updateSocial(platform, e.target.value)}
                  className="w-full bg-[#0F0A07] border border-[#3A2818] text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm rounded-lg px-4 py-2.5 placeholder:text-[#F0E6D3]/15 transition-all duration-300 hover:border-[#3A2818]/80"
                  placeholder={`https://${platform === "twitter" ? "x.com" : platform}.com/...`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Track Title */}
      <div>
        <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
          Track Title <span className="text-[#D4A843]">*</span>
        </label>
        <input
          type="text"
          value={form.trackTitle}
          onChange={(e) => updateForm("trackTitle", e.target.value)}
          className={getInputClasses("trackTitle")}
          placeholder="Title of your track"
        />
        {errors.trackTitle && <p className="text-[#C4392A] text-xs mt-1.5 font-[family-name:var(--font-mono)]">{errors.trackTitle}</p>}
      </div>

      {/* Audio File — Patch Bay Drop Zone */}
      <div>
        <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
          Audio File <span className="text-[#D4A843]">*</span>
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 md:p-10 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
            isDragOver
              ? "drop-zone-active"
              : file
              ? "border-[#D4A843]/40 bg-[#D4A843]/[0.02]"
              : "border-[#3A2818]/60 hover:border-[#D4A843]/25 bg-[#0F0A07]/50 drop-zone-idle"
          } ${shakingFields.has("file") ? "error-shake" : ""}`}
        >
          <input ref={fileInputRef} type="file" accept=".wav,.mp3,.flac" onChange={handleFileInput} className="hidden" />

          {/* Patch bay dots decoration */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#D4A843]/20"
                style={isDragOver ? { background: "rgba(212,168,67,0.6)", boxShadow: "0 0 6px rgba(212,168,67,0.4)" } : {}}
              />
            ))}
          </div>

          {file ? (
            <div>
              <div className="text-3xl mb-3">🎧</div>
              <p className="text-[#D4A843] font-[family-name:var(--font-mono)] text-sm mb-1">{file.name}</p>
              <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs">
                {formatFileSize(file.size)} &bull; {file.name.split(".").pop()?.toUpperCase()}
                {duration > 0 && ` \u2022 ${formatDuration(duration)}`}
              </p>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-3 opacity-40">🔌</div>
              <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm mb-2">
                Drag and drop your audio file here
              </p>
              <p className="text-[#D4A843]/70 font-[family-name:var(--font-mono)] text-xs underline underline-offset-4">
                or click to browse
              </p>
              <p className="text-[#F0E6D3]/15 font-[family-name:var(--font-mono)] text-xs mt-3">
                .wav, .mp3, .flac &mdash; max 50MB
              </p>
            </div>
          )}
        </div>
        {errors.file && <p className="text-[#C4392A] text-xs mt-1.5 font-[family-name:var(--font-mono)]">{errors.file}</p>}
      </div>

      {/* Waveform Preview with ambient glow */}
      {peaks.length > 0 && (
        <div className="animate-fade-in">
          <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
            Waveform Preview
          </label>
          <div className="rounded-xl overflow-hidden border border-[#3A2818]/60 waveform-glow">
            <WaveformPreview peaks={peaks} height={100} />
          </div>
        </div>
      )}

      {/* Submit Button — Big, Gold, 3D */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-3d w-full text-[#1A0F0A] font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.2em] py-5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </span>
        ) : (
          "Submit Your Mix"
        )}
      </button>
    </form>
  );
}
