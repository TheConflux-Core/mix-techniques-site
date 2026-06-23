"use client";

import VuMeter from "./VuMeter";

interface ConsoleBridgeProps {
  hostAvg: number;      // 0-10
  viewerAvg: number;    // 0-10
  viewerVotes: number;  // total vote count
}

export default function ConsoleBridge({
  hostAvg,
  viewerAvg,
  viewerVotes,
}: ConsoleBridgeProps) {
  return (
    <div
      className="relative overflow-hidden rounded-md px-4 py-4 mb-5"
      style={{
        background: "linear-gradient(180deg, rgba(42,24,16,0.7), rgba(26,15,10,0.85))",
        border: "1px solid rgba(212,168,67,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,168,67,0.04)",
        backgroundImage: `
          repeating-linear-gradient(2deg, transparent, transparent 4px, rgba(212,168,67,0.01) 4px, rgba(212,168,67,0.01) 5px),
          repeating-linear-gradient(92deg, transparent, transparent 4px, rgba(212,168,67,0.008) 4px, rgba(212,168,67,0.008) 5px)
        `,
      }}
    >
      {/* Section label */}
      <div
        className="text-[9px] tracking-[4px] uppercase text-center mb-3"
        style={{ color: "rgba(212,168,67,0.3)" }}
      >
        CONSOLE BRIDGE
      </div>

      {/* Meters row */}
      <div className="flex items-center justify-center gap-6">
        {/* Your Score Meter */}
        <VuMeter
          score={hostAvg}
          label="YOUR AVG"
          size="md"
        />

        {/* Gold divider */}
        <div
          className="w-px self-stretch"
          style={{
            background: "linear-gradient(180deg, transparent, var(--color-studio-gold), transparent)",
            opacity: 0.25,
          }}
        />

        {/* Viewer Avg Meter */}
        <VuMeter
          score={viewerAvg}
          label="COMMUNITY"
          size="md"
        />
      </div>

      {/* Vote count */}
      {viewerVotes > 0 && (
        <div
          className="text-center mt-2.5 text-[8px] tracking-[2px] font-[family-name:var(--font-mono)]"
          style={{ color: "rgba(212,168,67,0.25)" }}
        >
          {viewerVotes} {viewerVotes === 1 ? "VOTE" : "VOTES"}
        </div>
      )}

      {/* Subtle bottom edge highlight */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.08), transparent)",
        }}
      />
    </div>
  );
}
