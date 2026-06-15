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

export interface VoteMessage {
  type: string;
  data?: Record<string, unknown>;
}

export function useVoteSocket(serverUrl: string) {
  const [connected, setConnected] = useState(false);
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current) return;

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
        break;
      }
      case "contestant-update":
        applyContestant(msg.data as unknown as Contestant);
        break;
      case "next-contestant":
        setContestant(null);
        break;
      case "leaderboard-update":
        applyLeaderboard(msg.data);
        break;
      case "viewer-vote-ack":
        // handled by caller
        break;
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

  return { connected, contestant, leaderboard, sendMessage };
}
