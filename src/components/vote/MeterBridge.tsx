"use client";

import type { ViewerScores } from "@/lib/useVoteSocket";

interface MeterBridgeProps {
  viewerScores: ViewerScores;
}

const METRIC_KEYS = [
  "lowEnd",
  "clarity",
  "balance",
  "midRange",
  "image",
  "highEnd",
  "overall",
];

const METRIC_LABELS: Record<string, string> = {
  lowEnd: "LOW",
  clarity: "CLR",
  balance: "BAL",
  midRange: "MID",
  image: "IMG",
  highEnd: "HI",
  overall: "OV",
};

export default function MeterBridge({ viewerScores }: MeterBridgeProps) {
  const scores = viewerScores.metrics;

  return (
    <div
      className="relative overflow-hidden rounded-md px-3 py-2.5 mb-4"
      style={{
        background:
          "linear-gradient(180deg, rgba(42,24,16,0.7), rgba(26,15,10,0.8))",
        border: "1px solid rgba(212,168,67,0.06)",
        boxShadow:
          "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(212,168,67,0.03)",
        backgroundImage:
          "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)",
      }}
    >
      {/* Section label */}
      <div
        className="text-[7px] tracking-[3px] uppercase text-center mb-1.5"
        style={{ color: "rgba(212,168,67,0.25)" }}
      >
        VIEWER AGGREGATE
      </div>

      {/* Meters */}
      <div className="flex justify-center gap-[clamp(6px,1.5vw,14px)] items-end">
        {METRIC_KEYS.map((key) => {
          const score = scores[key] ?? 0;
          const pct = ((score - 1) / 9) * 100; // 1-10 scale → 0-100%
          const clampedPct = Math.max(0, Math.min(100, pct));

          // Color based on score
          let barColor = "var(--color-studio-gold)";
          let barGlow = "0 0 4px rgba(212,168,67,0.3)";
          if (score >= 8) {
            barColor = "#4CAF50";
            barGlow = "0 0 6px rgba(76,175,80,0.4)";
          } else if (score < 4) {
            barColor = "#C4392A";
            barGlow = "0 0 4px rgba(196,57,42,0.3)";
          }

          return (
            <div
              key={key}
              className="flex flex-col items-center"
              style={{ minWidth: "clamp(28px, 5vw, 50px)" }}
            >
              {/* Bar container */}
              <div
                className="relative w-full rounded-t overflow-hidden"
                style={{
                  height: "clamp(20px, 4vh, 36px)",
                  background: "rgba(26,15,10,0.9)",
                  border: "1px solid rgba(212,168,67,0.05)",
                }}
              >
                {/* Fill — grows from left to right (horizontal VU meter) */}
                <div
                  className="absolute bottom-0 left-0 top-0 rounded-l transition-all duration-300"
                  style={{
                    width: `${clampedPct}%`,
                    background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                    boxShadow: barGlow,
                  }}
                />
                {/* Peak indicator */}
                {score > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-px transition-all duration-300"
                    style={{
                      left: `${clampedPct}%`,
                      background: barColor,
                      boxShadow: barGlow,
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <div
                className="text-[7px] tracking-[1px] mt-1 font-[family-name:var(--font-mono)]"
                style={{ color: "rgba(212,168,67,0.3)" }}
              >
                {METRIC_LABELS[key] || key.slice(0, 3).toUpperCase()}
              </div>

              {/* Value */}
              <div
                className="text-[8px] font-bold font-[family-name:var(--font-mono)]"
                style={{ color: "rgba(212,168,67,0.5)" }}
              >
                {score > 0 ? score.toFixed(1) : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vote count */}
      {viewerScores.votes > 0 && (
        <div
          className="text-center mt-1.5 text-[7px] tracking-[2px]"
          style={{ color: "rgba(212,168,67,0.2)" }}
        >
          {viewerScores.votes} VOTES
        </div>
      )}
    </div>
  );
}
