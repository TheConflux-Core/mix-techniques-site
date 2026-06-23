"use client";

interface VuMeterProps {
  score: number;        // 0-10
  label: string;        // e.g. "LOW END", "VIEWER AVG"
  size?: "sm" | "md";   // sm for per-fader, md for bridge
  color?: string;       // needle color (default gold)
}

export default function VuMeter({
  score,
  label,
  size = "sm",
  color = "var(--color-studio-gold)",
}: VuMeterProps) {
  // Clamp score 0-10
  const clamped = Math.max(0, Math.min(10, score));

  // Map score to rotation: 0 → -55deg, 10 → +55deg
  const rotation = -55 + (clamped / 10) * 110;

  // Size config
  const isMd = size === "md";
  const gaugeSize = isMd ? 100 : 60;
  const needleHeight = isMd ? 42 : 32;
  const fontSize = isMd ? "text-[10px]" : "text-[7px]";
  const scoreSize = isMd ? "text-[14px]" : "text-[10px]";
  const vuSize = isMd ? "text-[11px]" : "text-[8px]";

  return (
    <div className="flex flex-col items-center select-none">
      {/* Gauge body */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: gaugeSize,
          height: gaugeSize,
          background: "radial-gradient(ellipse at 50% 60%, #1A0F0A 0%, #0F0A07 70%)",
          border: "2px solid rgba(212,168,67,0.15)",
          boxShadow: `
            inset 0 2px 8px rgba(0,0,0,0.6),
            inset 0 -1px 4px rgba(212,168,67,0.05),
            0 2px 12px rgba(0,0,0,0.4)
          `,
        }}
      >
        {/* Carbon fiber texture overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(2deg, transparent, transparent 2px, rgba(212,168,67,0.015) 2px, rgba(212,168,67,0.015) 3px),
              repeating-linear-gradient(92deg, transparent, transparent 2px, rgba(212,168,67,0.01) 2px, rgba(212,168,67,0.01) 3px)
            `,
          }}
        />

        {/* Arc tick marks */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Outer arc ticks */}
          {Array.from({ length: 11 }, (_, i) => {
            const angle = -55 + i * 11; // -55 to +55 in 11deg steps
            const rad = (angle * Math.PI) / 180;
            const cx = 50, cy = 58;
            const r1 = isMd ? 42 : 25;
            const r2 = isMd ? 38 : 22;
            const x1 = cx + r1 * Math.sin(rad);
            const y1 = cy - r1 * Math.cos(rad);
            const x2 = cx + r2 * Math.sin(rad);
            const y2 = cy - r2 * Math.cos(rad);
            const isMajor = i % 5 === 0;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMajor ? "rgba(212,168,67,0.4)" : "rgba(212,168,67,0.15)"}
                strokeWidth={isMajor ? 1.5 : 0.8}
              />
            );
          })}

          {/* Scale numbers: 0, 5, 10 */}
          {[
            { val: 0, angle: -55 },
            { val: 5, angle: 0 },
            { val: 10, angle: 55 },
          ].map(({ val, angle }) => {
            const rad = (angle * Math.PI) / 180;
            const cx = 50, cy = 58;
            const r = isMd ? 33 : 19;
            const x = cx + r * Math.sin(rad);
            const y = cy - r * Math.cos(rad);
            return (
              <text
                key={val}
                x={x} y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(212,168,67,0.35)"
                fontSize={isMd ? 7 : 5}
                fontFamily="var(--font-mono)"
              >
                {val}
              </text>
            );
          })}
        </svg>

        {/* VU label */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 font-[family-name:var(--font-display)] font-bold tracking-[2px] ${vuSize}`}
          style={{
            bottom: isMd ? 18 : 11,
            color: "rgba(212,168,67,0.3)",
            textShadow: "0 0 8px rgba(212,168,67,0.15)",
          }}
        >
          VU
        </div>

        {/* Needle */}
        <div
          className="absolute left-1/2 z-10"
          style={{
            bottom: isMd ? 18 : 12,
            width: 2,
            height: needleHeight,
            background: `linear-gradient(to top, ${color}, rgba(212,168,67,0.4))`,
            transformOrigin: "50% 100%",
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            borderRadius: 1,
            boxShadow: `0 0 ${isMd ? 10 : 6}px rgba(212,168,67,0.5)`,
            transition: "transform 0.15s ease-out",
          }}
        >
          {/* Pivot dot */}
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: isMd ? 7 : 5,
              height: isMd ? 7 : 5,
              background: color,
              boxShadow: `0 0 ${isMd ? 12 : 8}px rgba(212,168,67,0.6)`,
            }}
          />
        </div>

        {/* Subtle inner glow at top */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 30%, rgba(212,168,67,0.03) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Score value */}
      <div
        className={`font-[family-name:var(--font-mono)] font-bold mt-1 ${scoreSize}`}
        style={{
          color,
          textShadow: `0 0 8px rgba(212,168,67,0.3)`,
        }}
      >
        {score > 0 ? score.toFixed(1) : "—"}
      </div>

      {/* Label */}
      <div
        className={`${fontSize} tracking-[1.5px] uppercase whitespace-nowrap mt-0.5`}
        style={{ color: "rgba(212,168,67,0.4)" }}
      >
        {label}
      </div>
    </div>
  );
}
