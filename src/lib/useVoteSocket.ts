"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface Contestant {
  name: string;
  city?: string;
  genre?: string;
  handle?: string;
}

export interface LeaderboardEntry {
  name: string;
  avg: number;
  votes: number;
}

export interface ViewerScores {
  metrics: Record<string, number>;
  total: number;
  votes: number;
}

export interface VoteMessage {
  type: string;
  data?: Record<string, unknown>;
}

export interface BooleanVoteState {
  [key: string]: { active: boolean; viewerVotes: number };
}

export interface AudioState {
  playing: boolean;
  url: string | null;
  title: string | null;
  artist: string | null;
}

export function useVoteSocket(serverUrl: string) {
  const [connected, setConnected] = useState(false);
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [votingOpen, setVotingOpen] = useState(false);
  const [viewerScores, setViewerScores] = useState<ViewerScores>({
    metrics: {},
    total: 0,
    votes: 0,
  });
  const [booleanVotes, setBooleanVotes] = useState<BooleanVoteState>({});
  const [audioState, setAudioState] = useState<AudioState>({
    playing: false,
    url: null,
    title: null,
    artist: null,
  });
  const [episode, setEpisode] = useState<number>(1);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current) return;
    if (!serverUrl) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(serverUrl);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      wsRef.current = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      let msg: VoteMessage;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      handleMessage(msg);
    };

    wsRef.current = ws;
  }, [serverUrl]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectRef.current || !mountedRef.current) return;
    reconnectRef.current = setTimeout(() => {
      reconnectRef.current = null;
      connect();
    }, 2000);
  }, [connect]);

  const handleMessage = useCallback((msg: VoteMessage) => {
    switch (msg.type) {
      case "state": {
        const d = msg.data as Record<string, unknown> | undefined;
        if (!d) break;
        if (d.contestant) applyContestant(d.contestant as unknown as Contestant);
        if (d.leaderboard) applyLeaderboard(d.leaderboard);
        if (d.votingOpen !== undefined) setVotingOpen(!!d.votingOpen);
        if (d.viewerMetrics || d.viewerVotes !== undefined) {
          setViewerScores({
            metrics: (d.viewerMetrics as Record<string, number>) || {},
            total: (d.viewerTotal as number) || 0,
            votes: (d.viewerVotes as number) || 0,
          });
        }
        if (d.episode !== undefined) setEpisode(d.episode as number);
        if (d.audio) {
          const audio = d.audio as Record<string, unknown>;
          if (audio.playing && audio.url) {
            setAudioState({
              playing: true,
              url: audio.url as string,
              title: (audio.title as string) || null,
              artist: (audio.artist as string) || null,
            });
            setVotingOpen(true);
          } else if (!audio.playing) {
            setAudioState((prev) => ({ ...prev, playing: false }));
            setVotingOpen(false);
          }
        }
        break;
      }
      case "contestant-update":
        applyContestant(msg.data as unknown as Contestant);
        break;
      case "next-contestant":
        setContestant(null);
        setVotingOpen(false);
        setViewerScores({ metrics: {}, total: 0, votes: 0 });
        setBooleanVotes({});
        setAudioState({ playing: false, url: null, title: null, artist: null });
        break;
      case "leaderboard-update":
        applyLeaderboard(msg.data);
        break;
      case "viewer-score-update": {
        const d = msg.data as Record<string, unknown> | undefined;
        if (d) {
          setViewerScores({
            metrics: (d.metrics as Record<string, number>) || {},
            total: (d.total as number) || 0,
            votes: (d.votes as number) || 0,
          });
        }
        break;
      }
      case "voting-open":
        setVotingOpen(true);
        break;
      case "voting-closed":
        setVotingOpen(false);
        break;
      case "play-track": {
        const d = msg.data as Record<string, unknown> | undefined;
        if (d && d.url) {
          setAudioState({
            playing: true,
            url: d.url as string,
            title: (d.title as string) || null,
            artist: (d.artist as string) || null,
          });
          setVotingOpen(true);
        }
        break;
      }
      case "pause-track":
        setAudioState((prev) => ({ ...prev, playing: false }));
        setVotingOpen(false);
        break;
      case "seek-track": {
        // Seek is handled by the audio element directly in the component
        break;
      }
      case "boolean-vote": {
        const d = msg.data as Record<string, unknown> | undefined;
        if (d && d.key) {
          const key = d.key as string;
          setBooleanVotes((prev) => ({
            ...prev,
            [key]: {
              active: d.active !== undefined ? !!d.active : !prev[key]?.active,
              viewerVotes: (d.viewerVotes as number) ?? prev[key]?.viewerVotes ?? 0,
            },
          }));
        }
        break;
      }
      case "boolean-vote-viewer":
        // Ack — handled by caller
        break;
      case "viewer-vote-ack":
        break;
      case "episode-update": {
        const d = msg.data as Record<string, unknown> | undefined;
        if (d && d.episode !== undefined) {
          setEpisode(d.episode as number);
        }
        break;
      }
    }
  }, []);

  function applyContestant(c: Contestant | null) {
    if (!c || !c.name) {
      setContestant(null);
    } else {
      setContestant(c);
    }
  }

  function applyLeaderboard(data: unknown) {
    if (!data) return;
    let entries: LeaderboardEntry[] = [];
    if (Array.isArray(data)) {
      entries = data as LeaderboardEntry[];
    } else if (typeof data === "object") {
      entries = Object.entries(data as Record<string, { avg?: number; votes?: number }>).map(
        ([name, v]) => ({
          name,
          avg: v.avg ?? (v as unknown as number) ?? 0,
          votes: v.votes ?? 0,
        })
      );
    }
    entries.sort((a, b) => b.avg - a.avg);
    setLeaderboard(entries.slice(0, 5));
  }

  const sendMessage = useCallback(
    (type: string, data: Record<string, unknown>) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify({ type, data }));
      return true;
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    connected,
    contestant,
    leaderboard,
    votingOpen,
    viewerScores,
    booleanVotes,
    audioState,
    episode,
    sendMessage,
  };
}
