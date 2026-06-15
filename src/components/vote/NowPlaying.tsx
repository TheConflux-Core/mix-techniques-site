"use client";

interface Contestant {
  name: string;
  city?: string;
  genre?: string;
  handle?: string;
}

interface NowPlayingProps {
  contestant: Contestant | null;
}

export default function NowPlaying({ contestant }: NowPlayingProps) {
  return (
    <div
      className="relative overflow-hidden rounded-md px-6 py-4 mb-6 flex items-center gap-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(42,24,16,0.85), rgba(26,15,10,0.9))",
        border: "1px solid rgba(212,168,67,0.1)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Gold accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: "linear-gradient(180deg, var(--color-studio-gold), var(--color-amber-glow))",
        }}
      />

      {/* Music note icon */}
      <div
        className={`w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center ${
          contestant ? "animate-pulse" : ""
        }`}
        style={{
          background: "radial-gradient(circle, rgba(212,168,67,0.15), rgba(26,15,10,0.8))",
          border: "1px solid rgba(212,168,67,0.2)",
        }}
      >
        <span
          className={`text-xl ${contestant ? "animate-bounce" : ""}`}
          style={{
            color: "var(--color-studio-gold)",
            opacity: 0.7,
            animationDuration: "1.5s",
          }}
        >
          ♪
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[9px] tracking-[3px] uppercase mb-1"
          style={{ color: "rgba(212,168,67,0.4)" }}
        >
          NOW PLAYING
        </div>

        {contestant ? (
          <>
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(16px,2.5vw,22px)] font-bold truncate"
              style={{ color: "var(--color-cream-linen)" }}
            >
              {contestant.name}
            </div>
            <div
              className="text-[clamp(11px,1.5vw,13px)] mt-0.5"
              style={{ color: "rgba(240,230,211,0.5)" }}
            >
              {[contestant.city, contestant.genre, contestant.handle]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </>
        ) : (
          <div
            className="text-xs tracking-[2px] text-center"
            style={{ color: "rgba(212,168,67,0.25)" }}
          >
            Waiting for contestant…
          </div>
        )}
      </div>
    </div>
  );
}
