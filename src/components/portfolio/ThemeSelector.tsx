"use client";

interface ThemeSelectorProps {
  selected: string;
  onSelect: (theme: string) => void;
}

const THEMES = [
  {
    id: "studio-gold",
    name: "Studio Gold",
    description: "Warm gold & mahogany — the signature look",
    colors: ["#1A0F0A", "#2A1810", "#D4A843", "#E89B2E", "#F0E6D3"],
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark & moody with blue accents",
    colors: ["#0A0E1A", "#141B2A", "#4A7AFF", "#6B9FFF", "#C8D6F0"],
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Warm sepia tones with analog feel",
    colors: ["#1A1510", "#2E2418", "#C49530", "#D4A843", "#E8DCC8"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean black & white with subtle accents",
    colors: ["#0A0A0A", "#1A1A1A", "#FFFFFF", "#888888", "#F5F5F5"],
  },
];

export default function ThemeSelector({ selected, onSelect }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme.id)}
          className={`text-left p-4 rounded-xl border-2 transition-all duration-300 ${
            selected === theme.id
              ? "border-[#D4A843] bg-[#D4A843]/5 shadow-[0_0_20px_rgba(212,168,67,0.1)]"
              : "border-[#3A2818]/40 bg-[#1A0F0A]/60 hover:border-[#3A2818]"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              {theme.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-[#3A2818]/40"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {selected === theme.id && (
              <span className="text-[#D4A843] text-xs font-[family-name:var(--font-mono)]">✓</span>
            )}
          </div>
          <h4 className="font-[family-name:var(--font-display)] text-sm text-[#F0E6D3] mb-0.5">
            {theme.name}
          </h4>
          <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40">
            {theme.description}
          </p>
        </button>
      ))}
    </div>
  );
}
