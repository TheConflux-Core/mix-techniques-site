"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface FaderProps {
  metricKey: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  viewerScore?: number;
}

const MIN = 1;
const MAX = 10;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function snapToHalf(v: number) {
  return Math.round(v * 2) / 2;
}

export default function Fader({
  metricKey: _metricKey,
  label,
  value,
  onChange,
  min = MIN,
  max = MAX,
  disabled = false,
  viewerScore = 0,
}: FaderProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const posToScore = useCallback(
    (clientY: number) => {
      const body = bodyRef.current;
      if (!body) return value;
      const r = body.getBoundingClientRect();
      const pct = clamp((r.bottom - clientY) / r.height, 0, 1);
      const raw = min + pct * (max - min);
      return clamp(snapToHalf(raw), min, max);
    },
    [min, max, value]
  );

  // Mouse handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragging(true);
      onChange(posToScore(e.clientY));
    },
    [disabled, onChange, posToScore]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      onChange(posToScore(e.clientY));
    };
    const onMouseUp = () => setDragging(false);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, onChange, posToScore]);

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragging(true);
      onChange(posToScore(e.touches[0].clientY));
    },
    [disabled, onChange, posToScore]
  );

  useEffect(() => {
    if (!dragging) return;
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      onChange(posToScore(e.touches[0].clientY));
    };
    const onTouchEnd = () => setDragging(false);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging, onChange, posToScore]);

  // Click on track to jump
  const onTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      onChange(posToScore(e.clientY));
    },
    [disabled, onChange, posToScore]
  );

  const pct = ((value - min) / (max - min)) * 100;
  const viewerPct = viewerScore > 0
    ? Math.max(0, Math.min(100, ((viewerScore - 1) / 9) * 100))
    : 0;

  // Scale labels
  const scaleLabels: number[] = [];
  for (let t = max; t >= min; t--) {
    scaleLabels.push(t);
  }

  // Viewer VU color
  let vuColor = "var(--color-studio-gold)";
  let vuGrad = "linear-gradient(180deg, var(--color-studio-gold), rgba(212,168,67,0.4))";
  let vuGlow = "0 0 4px rgba(212,168,67,0.3)";
  if (viewerScore >= 8) {
    vuColor = "#4CAF50";
    vuGrad = "linear-gradient(180deg, #4CAF50, #2E7D32)";
    vuGlow = "0 0 6px rgba(76,175,80,0.4)";
  } else if (viewerScore < 4 && viewerScore > 0) {
    vuColor = "#C4392A";
    vuGrad = "linear-gradient(180deg, #C4392A, #8B2020)";
    vuGlow = "0 0 4px rgba(196,57,42,0.3)";
  }

  return (
    <div
      className={`flex flex-col items-center w-[clamp(44px,12vw,130px)] select-none ${
        disabled ? "pointer-events-none" : ""
      }`}
    >
      {/* Label */}
      <div
        className="text-[clamp(8px,1.2vw,10px)] tracking-[2px] uppercase text-center whitespace-nowrap mb-2.5"
        style={{ color: "rgba(212,168,67,0.5)" }}
      >
        {label}
      </div>

      {/* Fader + VU row */}
      <div className="flex items-stretch gap-1.5">
        {/* Fader body */}
        <div
          ref={bodyRef}
          className="relative w-[50px] h-[clamp(160px,30vh,240px)] touch-none"
          style={{ touchAction: "none" }}
        >
          {/* Scale */}
          <div className="absolute -left-[18px] top-0 bottom-0 flex flex-col justify-between pointer-events-none">
            {scaleLabels.map((t) => (
              <div
                key={t}
                className="text-[8px] leading-none"
                style={{ color: "rgba(212,168,67,0.2)" }}
              >
                {t}
              </div>
            ))}
          </div>

          {/* Track */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-2 h-full rounded overflow-hidden cursor-pointer"
            style={{
              background: "rgba(26,15,10,0.9)",
              border: "1px solid rgba(212,168,67,0.08)",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
              backgroundImage:
                "repeating-linear-gradient(180deg, transparent, transparent 9px, rgba(212,168,67,0.05) 9px, rgba(212,168,67,0.05) 10px)",
            }}
            onClick={onTrackClick}
          >
            {/* Fill */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b"
              style={{
                height: `${pct}%`,
                background:
                  "linear-gradient(180deg, var(--color-studio-gold), rgba(212,168,67,0.3))",
                transition: dragging ? "none" : "height 0.08s ease-out",
              }}
            />
          </div>

          {/* Cap */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[42px] h-5 rounded z-5 cursor-grab"
            style={{
              bottom: `calc(${pct}% - 10px)`,
              background: dragging
                ? "linear-gradient(180deg, #FFF5E6, #E8D8BC)"
                : "linear-gradient(180deg, #F0E6D3, #D4C4A8)",
              border: "1px solid rgba(212,168,67,0.3)",
              boxShadow: dragging
                ? "0 2px 8px rgba(0,0,0,0.4), 0 0 25px rgba(212,168,67,0.4)"
                : "0 2px 8px rgba(0,0,0,0.4), 0 0 10px rgba(212,168,67,0.1)",
              cursor: dragging ? "grabbing" : "grab",
              transition: dragging
                ? "none"
                : "bottom 0.08s ease-out, box-shadow 0.15s",
              touchAction: "none",
            }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            <div
              className="absolute top-[3px] left-2 right-2 h-px rounded"
              style={{ background: "rgba(255,255,255,0.4)" }}
            />
            <div
              className="absolute bottom-[3px] left-2 right-2 h-px rounded"
              style={{ background: "rgba(26,15,10,0.2)" }}
            />
          </div>
        </div>

        {/* VU Meter — viewer aggregate for this metric */}
        <div className="flex flex-col items-center w-3">
          <div
            className="flex-1 w-full rounded-sm overflow-hidden relative"
            style={{
              background: "rgba(26,15,10,0.9)",
              border: "1px solid rgba(212,168,67,0.08)",
            }}
          >
            {viewerScore > 0 ? (
              <>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-b-sm transition-all duration-500"
                  style={{
                    height: `${viewerPct}%`,
                    background: vuGrad,
                    boxShadow: vuGlow,
                  }}
                />
                <div
                  className="absolute left-0 right-0 h-px transition-all duration-500"
                  style={{
                    bottom: `${viewerPct}%`,
                    background: "rgba(240,230,211,0.5)",
                  }}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full" style={{ background: "rgba(212,168,67,0.1)" }} />
              </div>
            )}
          </div>
          <div
            className="text-[7px] font-bold mt-0.5 font-[family-name:var(--font-mono)]"
            style={{ color: viewerScore > 0 ? "rgba(212,168,67,0.45)" : "rgba(212,168,67,0.15)" }}
          >
            {viewerScore > 0 ? viewerScore.toFixed(1) : "—"}
          </div>
        </div>
      </div>

      {/* Value */}
      <div
        className="text-[clamp(18px,2.5vw,24px)] font-bold min-w-[50px] text-center font-[family-name:var(--font-mono)] mt-2.5"
        style={{
          color: "var(--color-amber-glow)",
          textShadow: "0 0 10px rgba(232,155,46,0.3)",
        }}
      >
        {value.toFixed(1)}
      </div>
    </div>
  );
}
