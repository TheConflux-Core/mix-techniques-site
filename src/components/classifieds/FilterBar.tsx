"use client";

const GENRE_OPTIONS = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Metal", "Jazz", "Electronic",
  "Country", "Folk", "Classical", "Latin", "Reggae", "Indie", "Other",
];

const SPECIALTY_OPTIONS = [
  "Mixing", "Mastering", "Recording", "Production", "Beat-Making",
  "Vocal Tuning", "Sound Design", "Arrangement", "Session Musician",
  "Songwriting", "Editing", "Restoration",
];

interface FilterBarProps {
  activeType: "all" | "lfw" | "lfm";
  onTypeChange: (type: "all" | "lfw" | "lfm") => void;
  genre: string;
  onGenreChange: (genre: string) => void;
  specialty: string;
  onSpecialtyChange: (specialty: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
}

export default function FilterBar({
  activeType,
  onTypeChange,
  genre,
  onGenreChange,
  specialty,
  onSpecialtyChange,
  sort,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Type Tabs */}
      <div className="flex gap-2">
        {(["all", "lfw", "lfm"] as const).map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeType === type
                ? type === "lfw"
                  ? "bg-[#D4A843] text-[#1A0F0A] font-bold"
                  : type === "lfm"
                  ? "bg-[#E89B2E] text-[#1A0F0A] font-bold"
                  : "bg-[#3A2818] text-[#D4A843] font-bold"
                : "bg-[#1A0F0A] text-[#F0E6D3]/40 border border-[#3A2818] hover:border-[#D4A843]/50 hover:text-[#F0E6D3]/70"
            }`}
          >
            {type === "all" ? "All" : type === "lfw" ? "Looking For Work" : "Looking For Mixing"}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Genre */}
        <select
          value={genre}
          onChange={(e) => onGenreChange(e.target.value)}
          className="bg-[#0F0A07] border border-[#3A2818] rounded-lg px-3 py-2 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-xs focus:border-[#D4A843] focus:outline-none transition-colors cursor-pointer"
        >
          <option value="">All Genres</option>
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {/* Specialty */}
        <select
          value={specialty}
          onChange={(e) => onSpecialtyChange(e.target.value)}
          className="bg-[#0F0A07] border border-[#3A2818] rounded-lg px-3 py-2 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-xs focus:border-[#D4A843] focus:outline-none transition-colors cursor-pointer"
        >
          <option value="">All Specialties</option>
          {SPECIALTY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-[#0F0A07] border border-[#3A2818] rounded-lg px-3 py-2 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-xs focus:border-[#D4A843] focus:outline-none transition-colors cursor-pointer ml-auto"
        >
          <option value="newest">Newest</option>
          <option value="featured">Featured</option>
          <option value="bumped">Recently Bumped</option>
        </select>
      </div>
    </div>
  );
}
