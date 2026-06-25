"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

interface BackstageSubmission {
  id: string;
  name: string;
  track_title: string | null;
  genre: string | null;
  status: string;
  episode_id: string | null;
  episodes?: { episode_number: number; title: string | null } | null;
}

type BackstageStatus = "loading" | "no_submission" | "waiting" | "live" | "complete";

export default function BackstagePage() {
  const { user, loading: authLoading } = useAuth();
  const [submission, setSubmission] = useState<BackstageSubmission | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);

  const [status, setStatus] = useState<BackstageStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  // Fetch the user's pulled/selected submission
  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    async function fetchSubmission() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("submissions")
          .select("id, name, track_title, genre, status, episode_id, episodes(episode_number, title)")
          .or(`user_id.eq.${user!.id},email.eq.${user!.email}`)
          .in("status", ["pulled", "selected", "staged"])
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError || !data) {
          setStatus("no_submission");
          return;
        }

        setSubmission(data as unknown as BackstageSubmission);

        if (data.status === "aired") {
          setStatus("complete");
        } else {
          setStatus("waiting");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching submission:", err);
          setStatus("no_submission");
        }
      }
    }

    fetchSubmission();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Once we have a submission, fetch or create the backstage room
  useEffect(() => {
    if (!submission || status === "no_submission" || status === "complete") return;

    let cancelled = false;
    async function setupRoom() {
      try {
        // First, try to get existing room
        const getRes = await fetch(
          `/api/backstage?submission_id=${submission!.id}`
        );

        let url: string | null = null;

        if (getRes.ok) {
          const getData = await getRes.json();
          url = getData.room_url;
        }

        // If no room exists, create one
        if (!url) {
          const createRes = await fetch("/api/backstage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              submission_id: submission!.id,
              episode_id: submission!.episode_id || "",
            }),
          });

          if (!createRes.ok) {
            const errData = await createRes.json();
            throw new Error(errData.error || "Failed to create backstage room");
          }

          const createData = await createRes.json();
          url = createData.room_url;
        }

        if (cancelled) return;
        setRoomUrl(url);

        // Jitsi doesn't need tokens — room URL is enough
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to setup backstage";
          setError(message);
          console.error("Backstage setup error:", err);
        }
      }
    }

    setupRoom();
    return () => {
      cancelled = true;
    };
  }, [submission, status]);

  // Subscribe to submission status changes via Supabase Realtime
  useEffect(() => {
    if (!submission) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`backstage-${submission.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "submissions",
          filter: `id=eq.${submission.id}`,
        },
        (payload) => {
          const updated = payload.new as BackstageSubmission;
          setSubmission(updated);

          if (updated.status === "aired" || updated.status === "scored") {
            setStatus("complete");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submission?.id]);

  // ─── Loading ───────────────────────────────────────────────────
  if (authLoading || status === "loading") {
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

  // ─── Not logged in ─────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div
          className="relative overflow-hidden rounded-md px-8 py-10 max-w-md w-full text-center"
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
          <div
            className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[4px] uppercase mb-4"
            style={{ color: "var(--color-studio-gold)" }}
          >
            🎤 Backstage
          </div>
          <p
            className="text-sm tracking-[1px] mb-6"
            style={{ color: "rgba(240,230,211,0.6)" }}
          >
            Please log in to access the backstage area
          </p>
          <a
            href="/login?redirect=/backstage"
            className="inline-block px-6 py-2.5 rounded text-xs tracking-[3px] uppercase font-bold transition-all duration-200 hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, var(--color-studio-gold), var(--color-amber-glow))",
              color: "var(--color-obsidian)",
              boxShadow: "0 2px 12px rgba(212,168,67,0.25)",
            }}
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  // ─── No submission ─────────────────────────────────────────────
  if (status === "no_submission") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div
          className="relative overflow-hidden rounded-md px-8 py-10 max-w-md w-full text-center"
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
          <div
            className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[4px] uppercase mb-4"
            style={{ color: "var(--color-studio-gold)" }}
          >
            🎤 Backstage
          </div>
          <p
            className="text-sm tracking-[1px] mb-2"
            style={{ color: "rgba(240,230,211,0.6)" }}
          >
            No active backstage session found.
          </p>
          <p
            className="text-xs tracking-[1px] mb-6"
            style={{ color: "rgba(240,230,211,0.35)" }}
          >
            If your name was just pulled, it may take a moment to appear. Keep
            this page open.
          </p>
          <a
            href="/submit"
            className="inline-block px-6 py-2.5 rounded text-xs tracking-[3px] uppercase font-bold transition-all duration-200 hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, var(--color-studio-gold), var(--color-amber-glow))",
              color: "var(--color-obsidian)",
              boxShadow: "0 2px 12px rgba(212,168,67,0.25)",
            }}
          >
            Submit Your Music
          </a>
        </div>
      </div>
    );
  }

  // ─── Complete ──────────────────────────────────────────────────
  if (status === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div
          className="relative overflow-hidden rounded-md px-8 py-10 max-w-md w-full text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(42,24,16,0.85), rgba(26,15,10,0.9))",
            border: "1px solid rgba(76,175,80,0.2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{
              background: "linear-gradient(180deg, #4CAF50, #2E7D32)",
            }}
          />
          <div
            className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[4px] uppercase mb-4"
            style={{ color: "#4CAF50" }}
          >
            🎬 Segment Complete
          </div>
          <p
            className="text-sm tracking-[1px] mb-2"
            style={{ color: "rgba(240,230,211,0.7)" }}
          >
            Your segment is complete!
          </p>
          {submission && (
            <p
              className="text-xs tracking-[1px]"
              style={{ color: "rgba(240,230,211,0.4)" }}
            >
              {submission.name} — {submission.track_title || "Untitled"}
            </p>
          )}
          <p
            className="text-xs tracking-[2px] mt-4"
            style={{ color: "rgba(212,168,67,0.5)" }}
          >
            Thanks for being part of Mix Techniques! 🎶
          </p>
        </div>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div
          className="relative overflow-hidden rounded-md px-8 py-10 max-w-md w-full text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(42,24,16,0.85), rgba(26,15,10,0.9))",
            border: "1px solid rgba(196,57,42,0.3)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <div
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[3px] uppercase mb-4"
            style={{ color: "#C4392A" }}
          >
            ⚠️ Connection Error
          </div>
          <p
            className="text-sm tracking-[1px] mb-6"
            style={{ color: "rgba(240,230,211,0.6)" }}
          >
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              setStatus("loading");
              // Will re-trigger the effect
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded text-xs tracking-[3px] uppercase font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(196,57,42,0.2)",
              border: "1px solid rgba(196,57,42,0.4)",
              color: "#C4392A",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Waiting / Live — main backstage view ──────────────────────
  const isLive = submission?.status === "selected";

  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-8">
      {/* Header */}
      <div className="w-full max-w-[900px] mb-6">
        <h1
          className="font-[family-name:var(--font-display)] font-black text-[clamp(24px,4vw,36px)] tracking-[6px] uppercase text-center"
          style={{ color: "var(--color-cream-linen)" }}
        >
          🎤{" "}
          <span style={{ color: "var(--color-studio-gold)" }}>BACKSTAGE</span>
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

      {/* Status Panel */}
      <div
        className="w-full max-w-[900px] mb-6 relative overflow-hidden rounded-md px-6 py-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(42,24,16,0.85), rgba(26,15,10,0.9))",
          border: `1px solid ${isLive ? "rgba(76,175,80,0.3)" : "rgba(212,168,67,0.1)"}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{
            background: isLive
              ? "linear-gradient(180deg, #4CAF50, #2E7D32)"
              : "linear-gradient(180deg, var(--color-studio-gold), var(--color-amber-glow))",
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: isLive ? "#4CAF50" : "#E89B2E",
                  boxShadow: isLive
                    ? "0 0 8px rgba(76,175,80,0.6)"
                    : "0 0 8px rgba(232,155,46,0.4)",
                  animation: isLive ? "pulse-green 1.5s ease-in-out infinite" : undefined,
                }}
              />
              <span
                className="text-[10px] tracking-[3px] uppercase font-bold"
                style={{
                  color: isLive
                    ? "rgba(76,175,80,0.8)"
                    : "rgba(232,155,46,0.8)",
                }}
              >
                {isLive ? "YOU'RE LIVE!" : "Waiting…"}
              </span>
            </div>

            {/* Name and track */}
            {submission && (
              <>
                <div
                  className="font-[family-name:var(--font-display)] text-lg font-bold tracking-[2px]"
                  style={{ color: "var(--color-cream-linen)" }}
                >
                  {submission.name}
                </div>
                <div
                  className="text-xs tracking-[1px] mt-0.5"
                  style={{ color: "rgba(212,168,67,0.6)" }}
                >
                  {submission.track_title || "Untitled Track"}
                  {submission.genre && (
                    <span
                      className="ml-2 px-2 py-0.5 rounded text-[9px] tracking-[1px] uppercase"
                      style={{
                        background: "rgba(212,168,67,0.1)",
                        border: "1px solid rgba(212,168,67,0.2)",
                      }}
                    >
                      {submission.genre.replace("_", " ")}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Message */}
          <div
            className="text-xs tracking-[1px] max-w-[300px]"
            style={{ color: "rgba(240,230,211,0.5)" }}
          >
            {isLive
              ? "You're on! The host has brought you on air."
              : "Your name has been pulled! Stay ready — the host will bring you on air shortly."}
          </div>
        </div>
      </div>

      {/* Jitsi Meet Iframe */}
      <div className="w-full max-w-[900px]">
        {roomUrl ? (
          <iframe
            src={`${roomUrl}#config.prejoinPageEnabled=false&config.startWithVideoMuted=false&config.startWithAudioMuted=false&interfaceConfig.TOOLBAR_BUTTONS=chat,camera,toggle-camera,microphone,settings`}
            allow="camera;microphone;fullscreen"
            style={{
              width: "100%",
              height: "600px",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              height: "600px",
              background:
                "linear-gradient(135deg, rgba(42,24,16,0.6), rgba(26,15,10,0.7))",
              border: "1px solid rgba(212,168,67,0.1)",
            }}
          >
            <div className="text-center">
              <div
                className="text-sm tracking-[3px] uppercase mb-2"
                style={{ color: "rgba(212,168,67,0.4)" }}
              >
                {error ? "Connection Error" : "Connecting…"}
              </div>
              {!error && (
                <div className="flex gap-1 justify-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "var(--color-studio-gold)",
                        opacity: 0.4,
                        animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes pulse-green {
          0%, 100% {
            box-shadow: 0 0 4px rgba(76, 175, 80, 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 12px rgba(76, 175, 80, 0.8);
            transform: scale(1.15);
          }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
