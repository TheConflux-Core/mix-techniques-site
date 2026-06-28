"use client";

import type { MidiMapping } from "@/lib/useMidi";

interface MidiPanelProps {
  learnMode: boolean;
  learnTarget: string | null;
  mappings: MidiMapping;
  metrics: { key: string; label: string }[];
  onToggleLearn: (metricKey?: string) => void;
  onClearMapping: (cc: string) => void;
  connected: boolean;
}

export default function MidiPanel({
  learnMode,
  learnTarget,
  mappings,
  metrics,
  onToggleLearn,
  onClearMapping,
  connected,
}: MidiPanelProps) {
  // Reverse map: metric → CC
  const metricToCc: Record<string, string> = {};
  Object.entries(mappings).forEach(([cc, metric]) => {
    metricToCc[metric] = cc;
  });

  return (
    <div
      className="rounded-lg px-5 py-4 mb-5 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(42,24,16,0.85), rgba(26,15,10,0.9))",
        border: "1px solid rgba(212,168,67,0.1)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-[9px] tracking-[3px] uppercase"
          style={{ color: "rgba(212,168,67,0.5)" }}
        >
          MIDI Controller
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: learnTarget
                ? "var(--color-amber-glow)"
                : connected
                ? "#4CAF50"
                : "#666",
              boxShadow: learnTarget
                ? "0 0 8px rgba(232,155,46,0.6)"
                : connected
                ? "0 0 6px rgba(76,175,80,0.5)"
                : "none",
              animation: learnTarget ? "midiPulse 1s ease-in-out infinite" : "none",
            }}
          />
          <span
            className="text-[9px] tracking-[1px]"
            style={{
              color: connected
                ? "rgba(76,175,80,0.6)"
                : "rgba(212,168,67,0.3)",
            }}
          >
            {learnTarget
              ? "MOVE FADER..."
              : connected
              ? "CONNECTED"
              : "NO DEVICE"}
          </span>
        </div>
      </div>

      {/* Metric rows */}
      <div className="space-y-1">
        {metrics.map((m) => {
          const cc = metricToCc[m.key];
          const isLearning = learnTarget === m.key;
          return (
            <div
              key={m.key}
              className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-all"
              style={{
                border: `1px solid ${
                  isLearning
                    ? "var(--color-amber-glow)"
                    : cc
                    ? "rgba(212,168,67,0.12)"
                    : "rgba(212,168,67,0.04)"
                }`,
                background: isLearning
                  ? "rgba(232,155,46,0.06)"
                  : "transparent",
                animation: isLearning ? "midiPulse 1s ease-in-out infinite" : "none",
              }}
              onClick={() => onToggleLearn(m.key)}
            >
              <span
                className="text-[10px] tracking-[2px] uppercase flex-1"
                style={{
                  color: cc
                    ? "rgba(212,168,67,0.6)"
                    : "rgba(212,168,67,0.35)",
                }}
              >
                {m.label}
              </span>
              <span
                className="text-[10px] tracking-[1px] min-w-[50px] text-right"
                style={{ color: "rgba(212,168,67,0.3)" }}
              >
                {cc ? `CC ${cc}` : "\u2014"}
              </span>
              {cc && (
                <span
                  className="text-[10px] cursor-pointer px-1 transition-colors"
                  style={{ color: "rgba(196,57,42,0.4)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearMapping(cc);
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#C4392A")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      "rgba(196,57,42,0.4)")
                  }
                >
                  ✕
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <div
        className="text-[9px] tracking-[1px] text-center mt-3"
        style={{ color: "rgba(212,168,67,0.2)" }}
      >
        {learnTarget
          ? "Move a fader or knob on your controller"
          : "Click a metric row to map a MIDI control"}
      </div>
    </div>
  );
}
