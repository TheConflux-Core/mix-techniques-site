"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import VuMeter from "./VuMeter";

interface FaderProps {
  metricKey: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
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

  // Color based on score
  let fillColor = "var(--color-studio-gold)";
  let fillGlow = "rgba(212,168,67,0.3)";
  if (value >= 8) { fillColor = "#4CAF50"; fillGlow = "rgba(76,175,80,0.4)"; }
  else if (value >= 6) { fillColor = "var(--color-studio-gold)"; fillGlow = "rgba(212,168,67,0.3)"; }
  else if (value >= 4) { fillColor = "var(--color-amber-glow)"; fillGlow = "rgba(232,155,46,0.3)"; }
  else { fillColor = "#C4392A"; fillGlow = "rgba(196,57,42,0.3)"; }

  // Value color
  let valColor = "var(--color-amber-glow)";
  let valGlow = "0 0 10px rgba(232,155,46,0.3)";
  if (value >= 8) { valColor = "#4CAF50"; valGlow = "0 0 10px rgba(76,175,80,0.4)"; }
  else if (value >= 6) { valColor = "var(--color-amber-glow)"; valGlow = "0 0 10px rgba(232,155,46,0.3)"; }
  else if (value >= 4) { valColor = "var(--color-amber-glow)"; valGlow = "0 0 10px rgba(232,155,46,0.3)"; }
  else { valColor = "#C4392A"; valGlow = "0 0 10px rgba(196,57,42,0.3)"; }

  // Scale labels
  const scaleLabels: number[] = [];
  for (let t = max; t >= min; t--) {
    scaleLabels.push(t);
  }

  return (
    <div
      className={`flex flex-col items-center w-[clamp(44px,12vw,130px)] select-none ${
        disabled ? "pointer-events-none" : ""
      }`}
    >
      {/* VU Meter — analog gauge showing user's score */}
      <VuMeter
        score={value}
        label={label}
        size="sm"
      />

      {/* Spacer between VU and fader */}
      <div className="h-2" />

      {/* Fader body */}
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
                background: `linear-gradient(180deg, ${fillColor}, ${fillColor}4D)`,
                boxShadow: `0 0 6px ${fillGlow}`,
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

      </div>

      {/* Value */}
      <div
        className="text-[clamp(18px,2.5vw,24px)] font-bold min-w-[50px] text-center font-[family-name:var(--font-mono)] mt-2.5"
        style={{
          color: valColor,
          textShadow: valGlow,
        }}
      >
        {value.toFixed(1)}
      </div>
    </div>
  );
}
