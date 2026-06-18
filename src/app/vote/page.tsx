"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useVoteSocket } from "@/lib/useVoteSocket";
import FaderConsole from "@/components/vote/FaderConsole";
import NowPlaying from "@/components/vote/NowPlaying";
import Leaderboard from "@/components/vote/Leaderboard";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8765";

interface EpisodeData {
  id: string;
  season_id: number;
  episode_number: number;
  title: string | null;
  description: string | null;
  air_date: string | null;
  status: string;
  youtube_url: string | null;
  podcast_url: string | null;
  guest_judges: string[] | null;
  submissions_open: boolean;
}

type VoteState = "loading" | "no_episode" | "ready" | "live" | "post";

function getVoteState(status: string | null): Exclude<VoteState, "loading"> {
  if (!status) return "no_episode";
  if (status === "live") return "live";
  if (status === "ready") return "ready";
  return "post"; // post_production or published
}

export default function VotePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [episode, setEpisode] = useState<EpisodeData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [voteState, setVoteState] = useState<VoteState>("loading");

  // WebSocket only connects when live
  const { connected, contestant, leaderboard, sendMessage } =
    useVoteSocket(voteState === "live" ? WS_URL : "");

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

  // Fetch the active episode on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchEpisode() {
      try {
        const res = await fetch("/api/episodes/active");
        const data = await res.json();
        if (cancelled) return;
        setEpisode(data.episode);
        setVoteState(getVoteState(data.episode?.status ?? null));
      } catch {
        if (!cancelled) {
          setEpisode(null);
          setVoteState("no_episode");
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    }
    fetchEpisode();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // ─── Toast UI ──────────────────────────────────────────────────
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

  // ─── Loading ───────────────────────────────────────────────────
  if (authLoading || fetching) {
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

  // ─── Shared header ─────────────────────────────────────────────
  const PageHeader = () => (
    <div className="text-center mb-7">
      <h1
        className="font-[family-name:var(--font-display)] font-black text-[clamp(24px,4vw,36px)] tracking-[6px] uppercase"
        style={{ color: "var(--color-cream-linen)" }}
      >
        MIX{" "}
        <span style={{ color: "var(--color-studio-gold)" }}>TECHNIQUES</span>
      </h1>
      <div
        className="w-full h-px mt-4"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-studio-gold), transparent)",
          opacity: 0.25,
        }}
      />
    </div>
  );

  // ─── Shared card wrapper ───────────────────────────────────────
  const Card = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`relative overflow-hidden rounded-md px-6 py-5 ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(42,24,16,0.85), rgba(26,15,10,0.9))",
        border: "1px solid rgba(212,168,67,0.1)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background:
            "linear-gradient(180deg, var(--color-studio-gold), var(--color-amber-glow))",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );

  // ─── Submit link ───────────────────────────────────────────────
  const SubmitLink = () => (
    <a
      href="/submit"
      className="inline-block mt-5 px-6 py-2.5 rounded text-xs tracking-[3px] uppercase font-bold transition-all duration-200 hover:scale-105"
      style={{
        background:
          "linear-gradient(135deg, var(--color-studio-gold), var(--color-amber-glow))",
        color: "var(--color-obsidian)",
        boxShadow: "0 2px 12px rgba(212,168,67,0.25)",
      }}
    >
      Submit Your Music
    </a>
  );

  // ─── Format date nicely ────────────────────────────────────────
  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  // ─── Stream links ──────────────────────────────────────────────
  const StreamLinks = () => (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {episode?.youtube_url && (
        <a
          href={episode.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded text-[10px] tracking-[2px] uppercase font-bold transition-all duration-200 hover:scale-105"
          style={{
            background: "rgba(212,168,67,0.15)",
            border: "1px solid rgba(212,168,67,0.3)",
            color: "var(--color-studio-gold)",
          }}
        >
          ▶ YouTube
        </a>
      )}
      <a
        href="https://twitch.tv"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded text-[10px] tracking-[2px] uppercase font-bold transition-all duration-200 hover:scale-105"
        style={{
          background: "rgba(145,70,255,0.15)",
          border: "1px solid rgba(145,70,255,0.3)",
          color: "#9146FF",
        }}
      >
        ▶ Twitch
      </a>
      <a
        href="https://kick.com"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded text-[10px] tracking-[2px] uppercase font-bold transition-all duration-200 hover:scale-105"
        style={{
          background: "rgba(83,252,24,0.1)",
          border: "1px solid rgba(83,252,24,0.3)",
          color: "#53FC18",
        }}
      >
        ▶ Kick
      </a>
    </div>
  );

  // ─── State: No Episode ─────────────────────────────────────────
  if (voteState === "no_episode") {
    return (
      <div className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center">
        <div className="w-full max-w-[600px] px-5 py-6">
          <PageHeader />
          <Card className="text-center">
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(28px,5vw,42px)] font-black tracking-[4px] uppercase"
              style={{ color: "var(--color-studio-gold)" }}
            >
              Same Place
            </div>
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(28px,5vw,42px)] font-black tracking-[4px] uppercase -mt-1"
              style={{ color: "var(--color-cream-linen)" }}
            >
              — Same Time
            </div>
            <p
              className="text-sm tracking-[3px] uppercase mt-4"
              style={{ color: "rgba(212,168,67,0.5)" }}
            >
              New episodes every week!
            </p>
            <div
              className="w-16 h-px mx-auto mt-4"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--color-studio-gold), transparent)",
                opacity: 0.3,
              }}
            />
            <p
              className="text-xs tracking-[2px] mt-4"
              style={{ color: "rgba(240,230,211,0.4)" }}
            >
              In the meantime, submit your track for a chance to be featured.
            </p>
            <SubmitLink />
          </Card>
        </div>
      </div>
    );
  }

  // ─── State: Ready (upcoming) ───────────────────────────────────
  if (voteState === "ready" && episode) {
    return (
      <div className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center">
        <div className="w-full max-w-[600px] px-5 py-6">
          <PageHeader />
          <Card className="text-center">
            <div
              className="text-[9px] tracking-[4px] uppercase mb-2"
              style={{ color: "rgba(212,168,67,0.4)" }}
            >
              Upcoming Episode
            </div>
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(22px,3.5vw,32px)] font-bold"
              style={{ color: "var(--color-cream-linen)" }}
            >
              {episode.title || `Episode ${episode.episode_number}`}
            </div>
            <div
              className="text-[11px] tracking-[2px] mt-1"
              style={{ color: "rgba(212,168,67,0.5)" }}
            >
              Episode {episode.episode_number}
            </div>

            {episode.air_date && (
              <div
                className="mt-4 px-4 py-2.5 rounded inline-block"
                style={{
                  background: "rgba(26,15,10,0.5)",
                  border: "1px solid rgba(212,168,67,0.15)",
                }}
              >
                <div
                  className="text-[8px] tracking-[3px] uppercase mb-0.5"
                  style={{ color: "rgba(212,168,67,0.35)" }}
                >
                  Air Date
                </div>
                <div
                  className="text-sm tracking-[1px]"
                  style={{ color: "var(--color-studio-gold)" }}
                >
                  {formatDate(episode.air_date)}
                </div>
              </div>
            )}

            <p
              className="text-xs tracking-[2px] mt-4"
              style={{ color: "rgba(240,230,211,0.5)" }}
            >
              The submission window opens 2 hours prior to the show&apos;s start
              time.
            </p>

            {episode.guest_judges && episode.guest_judges.length > 0 && (
              <div className="mt-4">
                <div
                  className="text-[8px] tracking-[3px] uppercase mb-2"
                  style={{ color: "rgba(212,168,67,0.35)" }}
                >
                  Guest Judges
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {episode.guest_judges.map((judge) => (
                    <span
                      key={judge}
                      className="px-3 py-1 rounded text-[11px] tracking-[1px]"
                      style={{
                        background: "rgba(212,168,67,0.1)",
                        border: "1px solid rgba(212,168,67,0.2)",
                        color: "var(--color-studio-gold)",
                      }}
                    >
                      {judge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <SubmitLink />
          </Card>
        </div>
      </div>
    );
  }

  // ─── State: Live (full voting experience) ──────────────────────
  if (voteState === "live") {
    // Require login for voting
    if (!user) {
      return (
        <div className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center">
          <div className="w-full max-w-[600px] px-5 py-6">
            <PageHeader />
            <Card className="text-center">
              <div
                className="text-[9px] tracking-[4px] uppercase mb-2"
                style={{ color: "rgba(76,175,80,0.6)" }}
              >
                🔴 We&apos;re Live
              </div>
              <div
                className="font-[family-name:var(--font-display)] text-[clamp(22px,3.5vw,30px)] font-bold"
                style={{ color: "var(--color-cream-linen)" }}
              >
                {episode?.title || "Mix Techniques is LIVE"}
              </div>
              <p
                className="text-xs tracking-[2px] mt-3"
                style={{ color: "rgba(240,230,211,0.5)" }}
              >
                The voting window is open while each song is playing… please
                tune in!
              </p>
              <StreamLinks />
              <div className="mt-6">
                <a
                  href="/login"
                  className="inline-block px-6 py-2.5 rounded text-xs tracking-[3px] uppercase font-bold transition-all duration-200 hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-studio-gold), var(--color-amber-glow))",
                    color: "var(--color-obsidian)",
                    boxShadow: "0 2px 12px rgba(212,168,67,0.25)",
                  }}
                >
                  Log In to Vote
                </a>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Logged-in live voting experience
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
          <span
            style={{
              color: connected
                ? "rgba(76,175,80,0.6)"
                : "rgba(212,168,67,0.3)",
            }}
          >
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
              MIX{" "}
              <span style={{ color: "var(--color-studio-gold)" }}>
                TECHNIQUES
              </span>
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

          {/* Stream links */}
          <StreamLinks />

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

  // ─── State: Post-production / Published ────────────────────────
  if ((voteState === "post") && episode) {
    return (
      <div className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center">
        <div className="w-full max-w-[600px] px-5 py-6">
          <PageHeader />
          <Card className="text-center">
            <div
              className="text-[9px] tracking-[4px] uppercase mb-2"
              style={{ color: "rgba(212,168,67,0.4)" }}
            >
              Episode {episode.episode_number} —{" "}
              {episode.status === "published" ? "Published" : "Post-Production"}
            </div>
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(22px,3.5vw,30px)] font-bold"
              style={{ color: "var(--color-cream-linen)" }}
            >
              {episode.title || `Episode ${episode.episode_number}`}
            </div>
            <p
              className="text-sm tracking-[3px] uppercase mt-4"
              style={{ color: "rgba(212,168,67,0.5)" }}
            >
              That&apos;s a wrap! Check back soon for the next episode.
            </p>

            {/* Final leaderboard placeholder */}
            <div className="mt-5">
              <Leaderboard entries={[]} />
            </div>

            <SubmitLink />
          </Card>
        </div>
      </div>
    );
  }

  // Fallback — shouldn't reach here
  return null;
}
