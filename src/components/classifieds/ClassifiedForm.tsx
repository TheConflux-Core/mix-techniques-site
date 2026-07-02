"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClassifiedListing } from "@/lib/types";

const GENRE_OPTIONS = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Metal", "Jazz", "Electronic",
  "Country", "Folk", "Classical", "Latin", "Reggae", "Indie", "Other",
];

const SPECIALTY_OPTIONS = [
  "Mixing", "Mastering", "Recording", "Production", "Beat-Making",
  "Vocal Tuning", "Sound Design", "Arrangement", "Session Musician",
  "Songwriting", "Editing", "Restoration",
];

interface ClassifiedFormProps {
  existing?: ClassifiedListing;
  onSuccess?: (listing: ClassifiedListing) => void;
}

export default function ClassifiedForm({ existing, onSuccess }: ClassifiedFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [listingType, setListingType] = useState<"lfw" | "lfm">(existing?.listing_type || "lfw");
  const [title, setTitle] = useState(existing?.title || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [genres, setGenres] = useState<string[]>(existing?.genres || []);
  const [specialties, setSpecialties] = useState<string[]>(existing?.specialties || []);
  const [ratePerSong, setRatePerSong] = useState(existing?.rate_per_song?.toString() || "");
  const [ratePerHour, setRatePerHour] = useState(existing?.rate_per_hour?.toString() || "");
  const [ratePerStem, setRatePerStem] = useState(existing?.rate_per_stem?.toString() || "");
  const [turnaroundDays, setTurnaroundDays] = useState(existing?.turnaround_days?.toString() || "");
  const [budgetMin, setBudgetMin] = useState(existing?.budget_min?.toString() || "");
  const [budgetMax, setBudgetMax] = useState(existing?.budget_max?.toString() || "");
  const [deadline, setDeadline] = useState(existing?.deadline?.split("T")[0] || "");
  const [portfolioUrl, setPortfolioUrl] = useState(existing?.portfolio_url || "");
  const [referenceTracks, setReferenceTracks] = useState(existing?.reference_tracks || "");

  const isEditing = !!existing;

  function toggleGenre(genre: string) {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }

  function toggleSpecialty(specialty: string) {
    setSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    const body: Record<string, any> = {
      listing_type: listingType,
      title: title.trim(),
      description: description.trim(),
      genres,
      specialties,
      portfolio_url: portfolioUrl.trim() || null,
      reference_tracks: referenceTracks.trim() || null,
    };

    if (listingType === "lfw") {
      body.rate_per_song = ratePerSong ? parseFloat(ratePerSong) : null;
      body.rate_per_hour = ratePerHour ? parseFloat(ratePerHour) : null;
      body.rate_per_stem = ratePerStem ? parseFloat(ratePerStem) : null;
      body.turnaround_days = turnaroundDays ? parseInt(turnaroundDays, 10) : null;
    } else {
      body.budget_min = budgetMin ? parseFloat(budgetMin) : null;
      body.budget_max = budgetMax ? parseFloat(budgetMax) : null;
      body.deadline = deadline || null;
    }

    try {
      const url = isEditing ? `/api/classifieds/${existing.id}` : "/api/classifieds";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} listing`);
      }

      const listing = await res.json();
      onSuccess?.(listing);
      if (!isEditing) {
        router.push(`/classifieds/${listing.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-red-400 text-sm font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Listing Type Toggle */}
      <div>
        <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
          Listing Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setListingType("lfw")}
            className={`flex-1 py-3 rounded-lg font-[family-name:var(--font-display)] text-sm uppercase tracking-wider font-bold transition-all cursor-pointer ${
              listingType === "lfw"
                ? "bg-[#D4A843] text-[#1A0F0A]"
                : "bg-[#0F0A07] text-[#F0E6D3]/40 border border-[#3A2818] hover:border-[#D4A843]/50"
            }`}
          >
            🎛️ Looking For Work
          </button>
          <button
            type="button"
            onClick={() => setListingType("lfm")}
            className={`flex-1 py-3 rounded-lg font-[family-name:var(--font-display)] text-sm uppercase tracking-wider font-bold transition-all cursor-pointer ${
              listingType === "lfm"
                ? "bg-[#E89B2E] text-[#1A0F0A]"
                : "bg-[#0F0A07] text-[#F0E6D3]/40 border border-[#3A2818] hover:border-[#E89B2E]/50"
            }`}
          >
            🎤 Looking For Mixing
          </button>
        </div>
        <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/20 mt-1">
          {listingType === "lfw"
            ? "You're a mix engineer offering your services"
            : "You're an artist looking for a mix engineer"}
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            listingType === "lfw"
              ? "e.g. Professional Mix Engineer — 10+ Years Experience"
              : "e.g. Need Mix Engineer for Hip-Hop EP"
          }
          maxLength={200}
          required
          className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
        />
        <div className="text-right text-[10px] text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] mt-1">
          {title.length}/200
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your services, experience, or project in detail..."
          maxLength={10000}
          rows={8}
          required
          className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none resize-none transition-colors"
        />
        <div className="text-right text-[10px] text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] mt-1">
          {description.length}/10000
        </div>
      </div>

      {/* Genres */}
      <div>
        <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
          Genres
        </label>
        <div className="flex flex-wrap gap-2">
          {GENRE_OPTIONS.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`text-xs font-[family-name:var(--font-mono)] px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                genres.includes(genre)
                  ? "bg-[#D4A843] text-[#1A0F0A] font-bold"
                  : "bg-[#0F0A07] text-[#F0E6D3]/40 border border-[#3A2818] hover:border-[#D4A843]/50"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Specialties */}
      <div>
        <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
          Specialties
        </label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleSpecialty(specialty)}
              className={`text-xs font-[family-name:var(--font-mono)] px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                specialties.includes(specialty)
                  ? "bg-[#E89B2E] text-[#1A0F0A] font-bold"
                  : "bg-[#0F0A07] text-[#F0E6D3]/40 border border-[#3A2818] hover:border-[#E89B2E]/50"
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Fields */}
      {listingType === "lfw" ? (
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 space-y-4">
          <h3 className="font-[family-name:var(--font-display)] text-[#D4A843] text-sm uppercase tracking-wider">
            Rates & Availability
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Rate Per Song ($)
              </label>
              <input
                type="number"
                value={ratePerSong}
                onChange={(e) => setRatePerSong(e.target.value)}
                placeholder="150"
                min="0"
                step="0.01"
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Rate Per Hour ($)
              </label>
              <input
                type="number"
                value={ratePerHour}
                onChange={(e) => setRatePerHour(e.target.value)}
                placeholder="50"
                min="0"
                step="0.01"
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Rate Per Stem ($)
              </label>
              <input
                type="number"
                value={ratePerStem}
                onChange={(e) => setRatePerStem(e.target.value)}
                placeholder="15"
                min="0"
                step="0.01"
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Turnaround (days)
              </label>
              <input
                type="number"
                value={turnaroundDays}
                onChange={(e) => setTurnaroundDays(e.target.value)}
                placeholder="7"
                min="1"
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 space-y-4">
          <h3 className="font-[family-name:var(--font-display)] text-[#E89B2E] text-sm uppercase tracking-wider">
            Budget & Timeline
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Budget Min ($)
              </label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="100"
                min="0"
                step="0.01"
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Budget Max ($)
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="500"
                min="0"
                step="0.01"
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm focus:border-[#D4A843] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Portfolio & References */}
      <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 space-y-4">
        <h3 className="font-[family-name:var(--font-display)] text-[#D4A843] text-sm uppercase tracking-wider">
          Portfolio & References
        </h3>
        <div>
          <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
            Portfolio URL
          </label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
            Reference Tracks
          </label>
          <textarea
            value={referenceTracks}
            onChange={(e) => setReferenceTracks(e.target.value)}
            placeholder="Links or descriptions of reference tracks..."
            maxLength={2000}
            rows={3}
            className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none resize-none transition-colors"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[#F0E6D3]/40 hover:text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm px-6 py-3 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || !description.trim() || submitting}
          className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-10 py-3 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Update Listing"
            : "Create Listing"}
        </button>
      </div>
    </form>
  );
}
