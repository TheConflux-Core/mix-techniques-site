"use client";

interface LeaderboardEntry {
  name: string;
  avg: number;
  votes: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-md px-6 py-5 mt-auto"
      style={{
        background:
          "linear-gradient(135deg, rgba(42,24,16,0.7), rgba(26,15,10,0.8))",
        border: "1px solid rgba(212,168,67,0.08)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Gold accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background:
            "linear-gradient(180deg, var(--color-studio-gold), transparent)",
        }}
      />

      <div
        className="text-[9px] tracking-[4px] uppercase mb-3.5 relative z-10"
        style={{ color: "rgba(212,168,67,0.4)" }}
      >
        Leaderboard — This Episode
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        {entries.length === 0 ? (
          <div
            className="text-xs text-center py-3 tracking-[2px]"
            style={{ color: "rgba(212,168,67,0.2)" }}
          >
            No votes yet this episode
          </div>
        ) : (
          entries.slice(0, 5).map((entry, i) => {
            let rankColor = "var(--color-studio-gold)";
            let rankGlow = "";
            if (i === 0) {
              rankColor = "var(--color-studio-gold)";
              rankGlow = "0 0 8px rgba(212,168,67,0.4)";
            } else if (i === 1) {
              rankColor = "rgba(212,168,67,0.7)";
            } else if (i === 2) {
              rankColor = "rgba(212,168,67,0.5)";
            }

            return (
              <div
                key={entry.name}
                className="flex items-center gap-3 px-3 py-2 rounded"
                style={{
                  background: "rgba(26,15,10,0.4)",
                  border: "1px solid rgba(212,168,67,0.04)",
                }}
              >
                <div
                  className="font-[family-name:var(--font-display)] text-lg font-bold min-w-[28px] text-center"
                  style={{ color: rankColor, textShadow: rankGlow }}
                >
                  {i + 1}
                </div>
                <div
                  className="text-[13px] flex-1 truncate"
                  style={{ color: "var(--color-cream-linen)" }}
                >
                  {entry.name}
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: "var(--color-amber-glow)" }}
                >
                  {entry.avg.toFixed(1)}
                </div>
                <div
                  className="text-[10px] tracking-[1px] ml-1"
                  style={{ color: "rgba(212,168,67,0.3)" }}
                >
                  {entry.votes} votes
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
