"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useVoteSocket } from "@/lib/useVoteSocket";
import FaderConsole from "@/components/vote/FaderConsole";
import NowPlaying from "@/components/vote/NowPlaying";
import Leaderboard from "@/components/vote/Leaderboard";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8765";

export default function VotePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { connected, contestant, leaderboard, sendMessage } =
    useVoteSocket(WS_URL);

  const [currentScores, setCurrentScores] = useState<Record<string, number>>(
    {}
  );
  const [currentAvg, setCurrentAvg] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [votedContestants, setVotedContestants] = useState<Set<string>>(
    new Set()
  );
  const [toast, setToast] = useState<{
    text: string;
    type: "ok" | "err";
  } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Reset submitted state when contestant changes
  useEffect(() => {
    if (contestant?.name) {
      setSubmitted(votedContestants.has(contestant.name));
    } else {
      setSubmitted(false);
    }
  }, [contestant?.name, votedContestants]);

  // Show toast
  const showToast = useCallback((text: string, type: "ok" | "err") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleScoresChange = useCallback(
    (_scores: Record<string, number>, avg: number) => {
      setCurrentScores(_scores);
      setCurrentAvg(avg);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (!connected) {
      showToast("Not connected to server", "err");
      return;
    }
    if (!contestant?.name) {
      showToast("No active contestant", "err");
      return;
    }

    const displayName =
      user?.user_metadata?.display_name ||
      user?.email?.split("@")[0] ||
      "Anonymous";

    const ok = sendMessage("viewer-vote", {
      viewer: `user_${user?.id}`,
      displayName,
      contestant: contestant.name,
      metrics: currentScores,
      total: +currentAvg.toFixed(2),
    });

    if (ok) {
      setSubmitted(true);
      setVotedContestants((prev) => new Set(prev).add(contestant.name));
      showToast("Score submitted!", "ok");
    } else {
      showToast("Failed to send vote", "err");
    }
  }, [
    connected,
    contestant,
    user,
    sendMessage,
    currentScores,
    currentAvg,
    showToast,
  ]);

  // Toast UI
  const toastEl = toast ? (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[2px] px-6 py-2.5 rounded z-[200] pointer-events-none transition-all duration-300 ${
        toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(42,24,16,0.95), rgba(26,15,10,0.98))",
        border: `1px solid ${
          toast.type === "ok"
            ? "rgba(76,175,80,0.3)"
            : "rgba(196,57,42,0.3)"
        }`,
        color: toast.type === "ok" ? "#4CAF50" : "#C4392A",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      {toast.text}
    </div>
  ) : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-sm tracking-[3px] uppercase"
          style={{ color: "rgba(212,168,67,0.4)" }}
        >
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col items-center">
      {/* WS Status indicator */}
      <div className="fixed top-3 right-4 z-[100] flex items-center gap-1.5 text-[9px] tracking-[2px] uppercase">
        <div
          className="w-1.5 h-1.5 rounded-full transition-all duration-300"
          style={{
            background: connected ? "#4CAF50" : "#C4392A",
            boxShadow: connected
              ? "0 0 6px rgba(76,175,80,0.5)"
              : "none",
          }}
        />
        <span style={{ color: connected ? "rgba(76,175,80,0.6)" : "rgba(212,168,67,0.3)" }}>
          {connected ? "LIVE" : "OFFLINE"}
        </span>
      </div>

      {/* Page container */}
      <div className="w-full max-w-[1100px] px-5 py-6 pb-10 relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-7">
          <h1
            className="font-[family-name:var(--font-display)] font-black text-[clamp(24px,4vw,36px)] tracking-[6px] uppercase"
            style={{ color: "var(--color-cream-linen)" }}
          >
            MIX <span style={{ color: "var(--color-studio-gold)" }}>TECHNIQUES</span>
          </h1>
          <p
            className="text-[clamp(10px,1.5vw,13px)] tracking-[4px] uppercase mt-1"
            style={{ color: "rgba(212,168,67,0.45)" }}
          >
            Score the mix in real-time
          </p>
          <div
            className="w-full h-px mt-4"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-studio-gold), transparent)",
              opacity: 0.25,
            }}
          />
        </div>

        {/* Now Playing */}
        <NowPlaying contestant={contestant} />

        {/* Fader Console */}
        <FaderConsole
          onScoresChange={handleScoresChange}
          onSubmit={handleSubmit}
          disabled={!connected || !contestant}
          submitted={submitted}
        />

        {/* Leaderboard */}
        <Leaderboard entries={leaderboard} />
      </div>

      {toastEl}
    </div>
  );
}
