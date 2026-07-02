"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface VoteControlsProps {
  targetType: "thread" | "reply";
  targetId: string;
  score: number;
  userVote?: number;
  onVote?: (newScore: number, newUserVote: number) => void;
}

export default function VoteControls({
  targetType,
  targetId,
  score,
  userVote = 0,
  onVote,
}: VoteControlsProps) {
  const { user } = useAuth();
  const [currentScore, setCurrentScore] = useState(score);
  const [currentVote, setCurrentVote] = useState(userVote);
  const [voting, setVoting] = useState(false);

  async function handleVote(direction: 1 | -1) {
    if (!user || voting) return;
    setVoting(true);

    try {
      if (currentVote === direction) {
        // Remove vote
        const res = await fetch("/api/forum/vote", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_id: targetId, target_type: targetType }),
        });
        if (res.ok) {
          const newScore = currentScore - direction;
          const newVote = 0;
          setCurrentScore(newScore);
          setCurrentVote(newVote);
          onVote?.(newScore, newVote);
        }
      } else {
        // Add or change vote
        const res = await fetch("/api/forum/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_id: targetId,
            target_type: targetType,
            vote_type: direction,
          }),
        });
        if (res.ok) {
          const diff = direction - currentVote;
          const newScore = currentScore + diff;
          setCurrentScore(newScore);
          setCurrentVote(direction);
          onVote?.(newScore, direction);
        }
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={!user || voting}
        className={`p-1 rounded transition-colors ${
          currentVote === 1
            ? "text-[#D4A843]"
            : "text-[#F0E6D3]/30 hover:text-[#D4A843]"
        } ${!user ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        title="Upvote"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 3l7 8H3l7-8z" />
        </svg>
      </button>

      <span
        className={`font-[family-name:var(--font-mono)] text-sm font-bold min-w-[2ch] text-center ${
          currentVote !== 0 ? "text-[#D4A843]" : "text-[#F0E6D3]/50"
        }`}
      >
        {currentScore}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={!user || voting}
        className={`p-1 rounded transition-colors ${
          currentVote === -1
            ? "text-[#E89B2E]"
            : "text-[#F0E6D3]/30 hover:text-[#E89B2E]"
        } ${!user ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        title="Downvote"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 17l-7-8h14l-7 8z" />
        </svg>
      </button>
    </div>
  );
}
