"use client";

import { useState, useCallback } from "react";

interface BooleanVotesProps {
  disabled: boolean;
  viewerId: string;
  contestantName: string;
  sendMessage: (type: string, data: Record<string, unknown>) => boolean;
}

const VOTE_BUTTONS = [
  { key: "loveThisMix", emoji: "🔥", label: "Love" },
  { key: "addToPlaylist", emoji: "💿", label: "Playlist" },
  { key: "greatProduction", emoji: "🎧", label: "Production" },
  { key: "crankIt", emoji: "🔊", label: "Crank It" },
  { key: "horribleMix", emoji: "🗑️", label: "Horrible" },
  { key: "skip", emoji: "❌", label: "Skip" },
];

export default function BooleanVotes({
  disabled,
  viewerId,
  contestantName,
  sendMessage,
}: BooleanVotesProps) {
  const [activeVotes, setActiveVotes] = useState<Record<string, boolean>>({});

  const handleClick = useCallback(
    (key: string) => {
      if (disabled || !contestantName) return;
      const nowActive = !activeVotes[key];
      setActiveVotes((prev) => ({ ...prev, [key]: nowActive }));
      sendMessage("boolean-vote-viewer", {
        key,
        viewer: viewerId,
      });
    },
    [disabled, contestantName, viewerId, activeVotes, sendMessage]
  );

  return (
    <div className="relative z-10 mt-4">
      <div
        className="text-[11px] tracking-[3px] uppercase text-center mb-3"
        style={{ color: "rgba(212,168,67,0.4)" }}
      >
        QUICK VOTES
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {VOTE_BUTTONS.map((btn) => {
          const isActive = !!activeVotes[btn.key];
          return (
            <button
              key={btn.key}
              onClick={() => handleClick(btn.key)}
              disabled={disabled}
              className="font-[family-name:var(--font-mono)] text-[12px] tracking-[1px] px-5 py-2.5 rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: isActive
                  ? "1px solid var(--color-amber-glow)"
                  : "1px solid rgba(212,168,67,0.15)",
                background: isActive
                  ? "rgba(232,155,46,0.12)"
                  : "rgba(26,15,10,0.6)",
                color: isActive
                  ? "var(--color-amber-glow)"
                  : "rgba(212,168,67,0.4)",
                boxShadow: isActive
                  ? "0 0 12px rgba(232,155,46,0.2)"
                  : "none",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {btn.emoji} {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
