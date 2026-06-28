"use client";

import type { MidiMapping } from "@/lib/useMidi";

interface MidiPanelProps {
  learnMode: boolean;
  learnTarget: string | null;
  mappings: MidiMapping;
  booleanMappings: MidiMapping;
  metrics: { key: string; label: string }[];
  booleanVotes: { key: string; emoji: string; label: string }[];
  onToggleLearn: (targetKey?: string) => void;
  onClearMapping: (cc: string) => void;
  onClearBooleanMapping: (cc: string) => void;
  connected: boolean;
}

export default function MidiPanel({
  learnMode,
  learnTarget,
  mappings,
  booleanMappings,
  metrics,
  booleanVotes,
  onToggleLearn,
  onClearMapping,
  onClearBooleanMapping,
  connected,
}: MidiPanelProps) {
  // Reverse maps
  const metricToCc: Record<string, string> = {};
  Object.entries(mappings).forEach(([cc, metric]) => {
    metricToCc[metric] = cc;
  });
  const boolToCc: Record<string, string> = {};
  Object.entries(booleanMappings).forEach(([cc, key]) => {
    boolToCc[key] = cc;
  });

  return (
    <div className="space-y-3">
      {/* Metric faders section */}
      <div>
        <div
          className="text-[11px] tracking-[3px] uppercase mb-2"
          style={{ color: "rgba(212,168,67,0.4)" }}
        >
          Fader Controls
        </div>
        <div className="space-y-1.5">
          {metrics.map((m) => {
            const cc = metricToCc[m.key];
            const isLearning = learnTarget === m.key;
            return (
              <div
                key={m.key}
                className="flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition-all"
                style={{
                  border: `1px solid ${
                    isLearning
                      ? "var(--color-amber-glow)"
                      : cc
                      ? "rgba(212,168,67,0.15)"
                      : "rgba(212,168,67,0.06)"
                  }`,
                  background: isLearning
                    ? "rgba(232,155,46,0.08)"
                    : "transparent",
                  animation: isLearning ? "midiPulse 1s ease-in-out infinite" : "none",
                }}
                onClick={() => onToggleLearn(m.key)}
              >
                <span
                  className="text-[13px] tracking-[2px] uppercase flex-1 font-medium"
                  style={{
                    color: cc
                      ? "rgba(212,168,67,0.7)"
                      : "rgba(212,168,67,0.35)",
                  }}
                >
                  {m.label}
                </span>
                <span
                  className="text-[12px] tracking-[1px] min-w-[60px] text-right font-medium"
                  style={{ color: cc ? "rgba(212,168,67,0.5)" : "rgba(212,168,67,0.25)" }}
                >
                  {cc ? `CC ${cc}` : "\u2014"}
                </span>
                {cc && (
                  <span
                    className="text-[12px] cursor-pointer px-1.5 transition-colors"
                    style={{ color: "rgba(196,57,42,0.4)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearMapping(cc);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#C4392A")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(196,57,42,0.4)")}
                  >
                    ✕
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick votes section */}
      <div>
        <div
          className="text-[11px] tracking-[3px] uppercase mb-2"
          style={{ color: "rgba(212,168,67,0.4)" }}
        >
          Quick Vote Buttons
        </div>
        <div className="space-y-1.5">
          {booleanVotes.map((btn) => {
            const cc = boolToCc[btn.key];
            const isLearning = learnTarget === btn.key;
            return (
              <div
                key={btn.key}
                className="flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition-all"
                style={{
                  border: `1px solid ${
                    isLearning
                      ? "var(--color-amber-glow)"
                      : cc
                      ? "rgba(212,168,67,0.15)"
                      : "rgba(212,168,67,0.06)"
                  }`,
                  background: isLearning
                    ? "rgba(232,155,46,0.08)"
                    : "transparent",
                  animation: isLearning ? "midiPulse 1s ease-in-out infinite" : "none",
                }}
                onClick={() => onToggleLearn(btn.key)}
              >
                <span
                  className="text-[13px] tracking-[2px] uppercase flex-1 font-medium"
                  style={{
                    color: cc
                      ? "rgba(212,168,67,0.7)"
                      : "rgba(212,168,67,0.35)",
                  }}
                >
                  {btn.emoji} {btn.label}
                </span>
                <span
                  className="text-[12px] tracking-[1px] min-w-[60px] text-right font-medium"
                  style={{ color: cc ? "rgba(212,168,67,0.5)" : "rgba(212,168,67,0.25)" }}
                >
                  {cc ? `CC ${cc}` : "\u2014"}
                </span>
                {cc && (
                  <span
                    className="text-[12px] cursor-pointer px-1.5 transition-colors"
                    style={{ color: "rgba(196,57,42,0.4)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearBooleanMapping(cc);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#C4392A")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(196,57,42,0.4)")}
                  >
                    ✕
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <div
        className="text-[11px] tracking-[1px] text-center pt-1"
        style={{ color: "rgba(212,168,67,0.25)" }}
      >
        {learnTarget
          ? "Move a fader, knob, or press a pad on your controller"
          : "Click any row to map a MIDI control"}
      </div>
    </div>
  );
}
