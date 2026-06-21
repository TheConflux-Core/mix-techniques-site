"use client";

import { useState, useMemo, useCallback } from "react";
import Fader from "./Fader";

interface FaderConsoleProps {
  onScoresChange: (scores: Record<string, number>, avg: number) => void;
  onSubmit: () => void;
  disabled: boolean;
  submitted: boolean;
}

const METRICS = [
  { key: "lowEnd", label: "LOW END" },
  { key: "clarity", label: "CLARITY" },
  { key: "balance", label: "BALANCE" },
  { key: "dynamics", label: "DYNAMICS" },
  { key: "image", label: "IMAGE" },
];

const DEFAULT_SCORE = 7;

export default function FaderConsole({
  onScoresChange,
  onSubmit,
  disabled,
  submitted,
}: FaderConsoleProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    METRICS.forEach((m) => (initial[m.key] = DEFAULT_SCORE));
    return initial;
  });

  const avg = useMemo(() => {
    const sum = METRICS.reduce((acc, m) => acc + scores[m.key], 0);
    return sum / METRICS.length;
  }, [scores]);

  const handleChange = useCallback(
    (key: string, value: number) => {
      setScores((prev) => {
        const next = { ...prev, [key]: value };
        const sum = METRICS.reduce((acc, m) => acc + next[m.key], 0);
        onScoresChange(next, sum / METRICS.length);
        return next;
      });
    },
    [onScoresChange]
  );

  // Avg color
  let avgColor = "var(--color-studio-gold)";
  let avgGlow = "0 0 20px rgba(212,168,67,0.4)";
  if (avg >= 8) {
    avgColor = "#4CAF50";
    avgGlow = "0 0 20px rgba(76,175,80,0.4)";
  } else if (avg >= 6) {
    avgColor = "var(--color-studio-gold)";
    avgGlow = "0 0 20px rgba(212,168,67,0.4)";
  } else if (avg >= 4) {
    avgColor = "var(--color-amber-glow)";
    avgGlow = "0 0 20px rgba(232,155,46,0.3)";
  } else {
    avgColor = "#C4392A";
    avgGlow = "0 0 20px rgba(196,57,42,0.3)";
  }

  return (
    <div
      className={`relative rounded-lg px-4 pt-6 pb-7 mb-5 overflow-hidden transition-opacity duration-300 ${
        disabled ? "opacity-45" : "opacity-100"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(42,24,16,0.6), rgba(26,15,10,0.7))",
        border: "1px solid rgba(212,168,67,0.08)",
        boxShadow:
          "0 6px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(212,168,67,0.04)",
      }}
    >
      {/* Texture overlay */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(2deg, transparent, transparent 4px, rgba(212,168,67,0.01) 4px, rgba(212,168,67,0.01) 5px)",
        }}
      />

      {/* Section label */}
      <div
        className="text-[9px] tracking-[4px] uppercase text-center mb-5 relative z-10"
        style={{ color: "rgba(212,168,67,0.35)" }}
      >
        YOUR SCORE
      </div>

      {/* Faders */}
      <div className="flex justify-center gap-[clamp(12px,3vw,28px)] relative z-10">
        {METRICS.map((m) => (
          <Fader
            key={m.key}
            metricKey={m.key}
            label={m.label}
            value={scores[m.key]}
            onChange={(v) => handleChange(m.key, v)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="h-5" />

      {/* Submit row */}
      <div className="flex items-center justify-center gap-6 relative z-10 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[10px] tracking-[3px] uppercase"
            style={{ color: "rgba(212,168,67,0.4)" }}
          >
            Your Average
          </span>
          <span
            className="font-[family-name:var(--font-display)] text-[clamp(28px,4vw,40px)] font-black transition-colors duration-300"
            style={{ color: avgColor, textShadow: avgGlow }}
          >
            {avg.toFixed(1)}
          </span>
        </div>

        <button
          onClick={onSubmit}
          disabled={disabled || submitted}
          className="font-[family-name:var(--font-mono)] text-[11px] tracking-[3px] uppercase px-8 py-3 rounded border whitespace-nowrap transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: submitted
              ? "rgba(76,175,80,0.4)"
              : "rgba(212,168,67,0.3)",
            background: submitted
              ? "rgba(76,175,80,0.1)"
              : "linear-gradient(180deg, rgba(212,168,67,0.15), rgba(212,168,67,0.05))",
            color: submitted ? "#4CAF50" : "var(--color-studio-gold)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {submitted ? "Submitted" : "Submit Scores"}
        </button>
      </div>

      {/* Submitted overlay */}
      {submitted && (
        <div
          className="absolute inset-0 rounded-lg z-10 flex flex-col items-center justify-center gap-2"
          style={{ background: "rgba(26,15,10,0.7)" }}
        >
          <div className="text-4xl text-[#4CAF50]">✓</div>
          <div
            className="text-[11px] tracking-[3px] uppercase text-[#4CAF50]"
          >
            Scores Submitted
          </div>
        </div>
      )}
    </div>
  );
}
