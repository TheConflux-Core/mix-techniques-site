"use client";

interface GearListProps {
  gear: string[];
}

const GEAR_ICONS: Record<string, string> = {
  microphone: "🎤",
  mic: "🎤",
  monitor: "🔊",
  monitors: "🔊",
  headphone: "🎧",
  headphones: "🎧",
  interface: "🔌",
  daw: "💻",
  plugin: "🔌",
  compressor: "📊",
  eq: "📈",
  reverb: "🌊",
  console: "🎛️",
  preamp: "🔊",
  synth: "🎹",
  keyboard: "🎹",
  guitar: "🎸",
  bass: "🎸",
  drum: "🥁",
  default: "⚙️",
};

function getGearIcon(gear: string): string {
  const lower = gear.toLowerCase();
  for (const [key, icon] of Object.entries(GEAR_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return GEAR_ICONS.default;
}

export default function GearList({ gear }: GearListProps) {
  if (gear.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {gear.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-lg px-4 py-3 hover:border-[#3A2818]/60 transition-colors"
        >
          <span className="text-lg">{getGearIcon(item)}</span>
          <span className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/70">
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}
