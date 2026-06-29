"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useVoteSocket } from "@/lib/useVoteSocket";
import { createClient } from "@/lib/supabase/client";
import FaderConsole from "@/components/vote/FaderConsole";
import NowPlaying from "@/components/vote/NowPlaying";
import Leaderboard from "@/components/vote/Leaderboard";
import BooleanVotes from "@/components/vote/BooleanVotes";
import MidiPanel from "@/components/vote/MidiPanel";
import { useMidi } from "@/lib/useMidi";

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

  const [episode, setEpisode] = useState<EpisodeData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [voteState, setVoteState] = useState<VoteState>("loading");

  // Viewer ID (persisted in localStorage like standalone)
  const [viewerId] = useState(() => {
    if (typeof window === "undefined") return "v_server";
    let vid = localStorage.getItem("mt_vid");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("mt_vid", vid);
    }
    return vid;
  });

  // WebSocket only connects when live
  const {
    connected,
    contestant,
    leaderboard,
    votingOpen,
    viewerScores,
    // booleanVotes tracked for future sync
    booleanVotes: _booleanVotes,
    audioState,
    sendMessage,
  } = useVoteSocket(voteState === "live" ? WS_URL : "");

  const [currentScores, setCurrentScores] = useState<Record<string, number>>(
    {}
  );
  const [currentAvg, setCurrentAvg] = useState(7);
  const lastSentRef = useRef(0);

  // Judge mode detection
  const [isJudge, setIsJudge] = useState(false);
  const [judgeReady, setJudgeReady] = useState(!user); // true immediately for anonymous, false until check completes
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("is_judge")
          .eq("id", user.id)
          .single();
        if (data?.is_judge) setIsJudge(true);
      } catch {
        // ignore — unlock voting regardless
      } finally {
        setJudgeReady(true);
      }
    })();
  }, [user]);
  const [toast, setToast] = useState<{
    text: string;
    type: "ok" | "err";
  } | null>(null);

  // MIDI controller support
  const [midiEnabled, setMidiEnabled] = useState(false);
  const faderConsoleRef = useRef<((metricKey: string, score: number) => void) | null>(null);
  const {
    midiSupported,
    connected: midiConnected,
    learnMode,
    learnTarget,
    mappings: midiMappings,
    booleanMappings,
    toggleLearn,
    clearMapping,
    clearBooleanMapping,
  } = useMidi({
    enabled: midiEnabled,
    onScoreChange: (metricKey, score) => {
      faderConsoleRef.current?.(metricKey, score);
    },
    onBooleanVote: (key) => {
      // Send boolean vote via WebSocket
      if (connected && contestant?.name) {
        sendMessage("boolean-vote-viewer", {
          key,
          viewer: `user_${user?.id}`,
        });
      }
    },
  });

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

  // Subscribe to episode status changes via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const channel = supabase
      .channel("episode-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "episodes" },
        (payload) => {
          const updated = payload.new as EpisodeData;
          setEpisode((prev) => {
            if (!prev || prev.id === updated.id) {
              setVoteState(getVoteState(updated.status));
              return updated;
            }
            if (updated.status === "live") {
              setVoteState(getVoteState(updated.status));
              return updated;
            }
            return prev;
          });
          // Stop polling once we get a realtime event
          if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
        }
      )
      .subscribe((status) => {
        // If subscription fails, fall back to polling
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          pollTimer = setInterval(async () => {
            try {
              const res = await fetch("/api/episodes/active");
              const data = await res.json();
              if (data.episode) {
                setEpisode((prev) => {
                  if (!prev || prev.status !== data.episode.status) {
                    setVoteState(getVoteState(data.episode.status));
                    return data.episode;
                  }
                  return prev;
                });
              }
            } catch { /* silent */ }
          }, 15000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  // Show toast
  const showToast = useCallback((text: string, type: "ok" | "err") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Real-time vote: send on every fader change (throttled to 100ms)
  const handleScoresChange = useCallback(
    (_scores: Record<string, number>, avg: number) => {
      setCurrentScores(_scores);
      setCurrentAvg(avg);

      if (!connected || !contestant?.name || !judgeReady) return;

      const now = Date.now();
      if (now - lastSentRef.current < 100) return;
      lastSentRef.current = now;

      const displayName =
        user?.user_metadata?.display_name ||
        user?.email?.split("@")[0] ||
        "Anonymous";

      const voteType = isJudge ? "judge-vote" : "viewer-vote";

      sendMessage(voteType, {
        viewer: `user_${user?.id}`,
        displayName,
        contestant: contestant.name,
        metrics: _scores,
        total: +avg.toFixed(2),
      });
    },
    [connected, contestant, user, sendMessage, isJudge, judgeReady]
  );

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
      {isJudge && (
        <div
          className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded"
          style={{
            background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(232,155,46,0.08))",
            border: "1px solid rgba(212,168,67,0.3)",
            boxShadow: "0 0 15px rgba(212,168,67,0.12)",
          }}
        >
          <svg className="w-4 h-4" style={{ color: "var(--color-studio-gold)" }} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span
            className="font-[family-name:var(--font-mono)] text-xs tracking-[3px] uppercase font-bold"
            style={{ color: "var(--color-studio-gold)" }}
          >
            Judge Mode
          </span>
        </div>
      )}
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
    <div className="flex flex-wrap justify-center gap-3 mt-4 mb-6">
      <a
        href={episode?.youtube_url || "https://youtube.com"}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded text-[10px] tracking-[2px] uppercase font-bold transition-all duration-200 hover:scale-105"
        style={{
          background: "rgba(255,0,0,0.12)",
          border: "1px solid rgba(255,0,0,0.3)",
          color: "#FF0000",
        }}
      >
        ▶ YouTube
      </a>
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
      <a
        href="https://open.spotify.com"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded text-[10px] tracking-[2px] uppercase font-bold transition-all duration-200 hover:scale-105"
        style={{
          background: "rgba(30,215,96,0.12)",
          border: "1px solid rgba(30,215,96,0.3)",
          color: "#1ED760",
        }}
      >
        🎧 Spotify
      </a>
      <a
        href="https://podcasts.apple.com"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded text-[10px] tracking-[2px] uppercase font-bold transition-all duration-200 hover:scale-105"
        style={{
          background: "rgba(157,59,255,0.12)",
          border: "1px solid rgba(157,59,255,0.3)",
          color: "#9D3BFF",
        }}
      >
        🎧 Apple Podcasts
      </a>
      <a
        href="https://music.amazon.com"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 rounded text-[10px] tracking-[2px] uppercase font-bold transition-all duration-200 hover:scale-105"
        style={{
          background: "rgba(51,186,204,0.12)",
          border: "1px solid rgba(51,186,204,0.3)",
          color: "#33BACC",
        }}
      >
        🎧 Amazon Music
      </a>
    </div>
  );

  // ─── State: No Episode ─────────────────────────────────────────
  // ─── (rendered below as overlay on faders) ─────────────────────

  // ─── State: Ready (upcoming) ───────────────────────────────────
  // ─── (rendered below as overlay on faders) ─────────────────────

  // ─── Not-live overlay (covers fader console) ────────────────────
  const NotLiveOverlay = () => {
    if (voteState === "live") return null;

    return (
      <div
        className="absolute inset-0 z-30 rounded-lg flex flex-col items-center justify-center px-6 py-8"
        style={{
          background:
            "linear-gradient(180deg, rgba(26,15,10,0.94), rgba(26,15,10,0.92))",
          border: "1px solid rgba(212,168,67,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* No Episode */}
        {voteState === "no_episode" && (
          <div className="text-center">
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(24px,4vw,36px)] font-black tracking-[4px] uppercase"
              style={{ color: "var(--color-studio-gold)" }}
            >
              Same Place
            </div>
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(24px,4vw,36px)] font-black tracking-[4px] uppercase -mt-1"
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
              className="text-xs tracking-[2px] mt-4 max-w-[320px]"
              style={{ color: "rgba(240,230,211,0.5)" }}
            >
              Voting opens when the show goes live. Submit your track in the
              meantime!
            </p>
            <SubmitLink />
          </div>
        )}

        {/* Ready / Upcoming */}
        {voteState === "ready" && episode && (
          <div className="text-center">
            <div
              className="text-[9px] tracking-[4px] uppercase mb-2"
              style={{ color: "rgba(76,175,80,0.6)" }}
            >
              🔴 Coming Soon
            </div>
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(20px,3vw,28px)] font-bold"
              style={{ color: "var(--color-cream-linen)" }}
            >
              {episode.title || `Episode ${episode.episode_number}`}
            </div>
            {episode.air_date && (
              <div
                className="mt-3 px-4 py-2 rounded inline-block"
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
              className="text-xs tracking-[2px] mt-3"
              style={{ color: "rgba(212,168,67,0.5)" }}
            >
              Voting opens when the show goes live. Get ready!
            </p>
            {episode.guest_judges && episode.guest_judges.length > 0 && (
              <div className="mt-3">
                <div
                  className="text-[8px] tracking-[3px] uppercase mb-1.5"
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
          </div>
        )}

        {/* Post / Published */}
        {voteState === "post" && episode && (
          <div className="text-center">
            <div
              className="text-[9px] tracking-[4px] uppercase mb-2"
              style={{ color: "rgba(212,168,67,0.4)" }}
            >
              Episode {episode.episode_number} —{" "}
              {episode.status === "published"
                ? "Published"
                : "Post-Production"}
            </div>
            <div
              className="font-[family-name:var(--font-display)] text-[clamp(20px,3vw,28px)] font-bold"
              style={{ color: "var(--color-cream-linen)" }}
            >
              {episode.title || `Episode ${episode.episode_number}`}
            </div>
            <p
              className="text-sm tracking-[3px] uppercase mt-3"
              style={{ color: "rgba(212,168,67,0.5)" }}
            >
              That&apos;s a wrap! Check back soon for the next episode.
            </p>
            <SubmitLink />
          </div>
        )}
      </div>
    );
  };

  // ─── Live: not logged in ───────────────────────────────────────
  if (voteState === "live" && !user) {
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

  // ─── Main page (all states) ────────────────────────────────────
  const isLive = voteState === "live";

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col items-center carbon-fiber">
      {/* WS Status (only when live) */}
      {isLive && (
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
      )}

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
            {isLive ? "Score the mix in real-time" : "Voting console"}
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

        {/* Now Playing (only when live) */}
        {isLive && (
          <NowPlaying contestant={contestant} audioState={audioState} />
        )}

        {/* Fader Console + Inactive Overlay — stacked */}
        <div className="relative mt-8">
          <FaderConsole
            onScoresChange={handleScoresChange}
            disabled={!isLive || !connected || !votingOpen || !contestant}
            viewerScores={viewerScores}
            onScoreRef={faderConsoleRef}
          >
            {/* Boolean Votes — rendered inside FaderConsole area */}
            {isLive && contestant && (
              <BooleanVotes
                disabled={!votingOpen}
                viewerId={viewerId}
                contestantName={contestant.name}
                sendMessage={sendMessage}
              />
            )}
          </FaderConsole>

          {/* Not-live overlay (episode states) */}
          {!isLive && <NotLiveOverlay />}

          {/* Live but voting closed — between contestants */}
          {isLive && !votingOpen && (
            <div
              className="absolute inset-0 z-30 rounded-lg flex flex-col items-center justify-center px-6 py-8"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,15,10,0.92), rgba(26,15,10,0.88))",
                border: "1px solid rgba(212,168,67,0.12)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div className="text-center">
                <div
                  className="text-[9px] tracking-[4px] uppercase mb-3"
                  style={{ color: "rgba(76,175,80,0.6)" }}
                >
                  🔴 Live
                </div>
                <div
                  className="font-[family-name:var(--font-display)] text-[clamp(20px,3vw,28px)] font-bold"
                  style={{ color: "var(--color-cream-linen)" }}
                >
                  Waiting for Next Contestant
                </div>
                <p
                  className="text-xs tracking-[2px] mt-3"
                  style={{ color: "rgba(212,168,67,0.5)" }}
                >
                  Voting opens when the song starts playing.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MIDI Controller Section */}
        <div className="mt-6">
          <div
            className="rounded-lg px-6 py-6 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(42,24,16,0.85), rgba(26,15,10,0.9))",
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
              <button
                onClick={() => {
                  if (!midiEnabled) setMidiEnabled(true);
                  toggleLearn();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[10px] tracking-[2px] uppercase"
                style={{
                  border: `1px solid ${
                    learnMode
                      ? "var(--color-studio-gold)"
                      : "rgba(212,168,67,0.2)"
                  }`,
                  background: learnMode
                    ? "rgba(212,168,67,0.08)"
                    : "rgba(26,15,10,0.7)",
                  color: learnMode
                    ? "var(--color-studio-gold)"
                    : "rgba(212,168,67,0.4)",
                  cursor: "pointer",
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: learnMode
                      ? "var(--color-amber-glow)"
                      : midiConnected
                      ? "#4CAF50"
                      : "#666",
                    boxShadow: learnMode
                      ? "0 0 8px rgba(232,155,46,0.6)"
                      : midiConnected
                      ? "0 0 6px rgba(76,175,80,0.5)"
                      : "none",
                    animation: learnMode ? "midiPulse 1s ease-in-out infinite" : "none",
                  }}
                />
                {learnMode ? "Cancel" : "MIDI Learn"}
              </button>
            </div>

            {/* Status */}
            <div
              className="flex items-center gap-2 mb-3"
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: midiConnected ? "#4CAF50" : "#666",
                  boxShadow: midiConnected ? "0 0 6px rgba(76,175,80,0.5)" : "none",
                }}
              />
              <span
                className="text-[9px] tracking-[1px]"
                style={{
                  color: midiConnected
                    ? "rgba(76,175,80,0.6)"
                    : "rgba(212,168,67,0.3)",
                }}
              >
                {learnTarget
                  ? "MOVE A FADER OR PRESS A PAD..."
                  : midiConnected
                  ? "CONNECTED — click any row to map"
                  : "NO DEVICE DETECTED"}
              </span>
            </div>

            {/* Metric rows + Quick votes */}
            {midiEnabled && (
              <MidiPanel
                learnMode={learnMode}
                learnTarget={learnTarget}
                mappings={midiMappings}
                booleanMappings={booleanMappings}
                metrics={[
                  { key: "lowEnd", label: "Low End" },
                  { key: "clarity", label: "Clarity" },
                  { key: "balance", label: "Balance" },
                  { key: "midRange", label: "Mid Range" },
                  { key: "image", label: "Image" },
                  { key: "highEnd", label: "High End" },
                  { key: "overall", label: "Overall" },
                ]}
                booleanVotes={[
                  { key: "loveThisMix", emoji: "🔥", label: "Love" },
                  { key: "addToPlaylist", emoji: "💿", label: "Playlist" },
                  { key: "greatProduction", emoji: "🎧", label: "Production" },
                  { key: "crankIt", emoji: "🔊", label: "Crank It" },
                  { key: "horribleMix", emoji: "🗑️", label: "Horrible" },
                  { key: "skip", emoji: "❌", label: "Skip" },
                ]}
                onToggleLearn={toggleLearn}
                onClearMapping={clearMapping}
                onClearBooleanMapping={clearBooleanMapping}
                connected={midiConnected}
              />
            )}
          </div>
        </div>

        {/* Leaderboard — hidden for now */}
        {/* {isLive && <Leaderboard entries={leaderboard} />} */}
      </div>

      {toastEl}
    </div>
  );
}
