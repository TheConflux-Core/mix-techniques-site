"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface MidiMapping {
  [cc: string]: string; // cc number → metric key
}

/**
 * MIDI controller hook for viewer voting.
 * Maps CC messages to metric score changes.
 */
export function useMidi(options: {
  enabled: boolean;
  onScoreChange: (metricKey: string, score: number) => void;
}) {
  const { enabled, onScoreChange } = options;
  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;

  const [midiSupported, setMidiSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!navigator.requestMIDIAccess;
  });
  const [connected, setConnected] = useState(false);
  const [learnMode, setLearnMode] = useState(false);
  const [learnTarget, setLearnTarget] = useState<string | null>(null);
  const [mappings, setMappings] = useState<MidiMapping>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("mt_vote_midi") || "{}");
    } catch {
      return {};
    }
  });

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const midiInputRef = useRef<MIDIInput | null>(null);
  const learnTargetRef = useRef<string | null>(null);
  learnTargetRef.current = learnTarget;

  // Save mappings
  useEffect(() => {
    try {
      localStorage.setItem("mt_vote_midi", JSON.stringify(mappings));
    } catch {
      /* silent */
    }
  }, [mappings]);

  // Scan for inputs
  const scanInputs = useCallback(() => {
    const acc = midiAccessRef.current;
    if (!acc) return;

    // Disconnect old
    if (midiInputRef.current) {
      midiInputRef.current.onmidimessage = null;
      midiInputRef.current = null;
    }

    const inputs = acc.inputs;
    if (inputs.size === 0) {
      setConnected(false);
      return;
    }

    const first = inputs.values().next().value as MIDIInput;
    midiInputRef.current = first;
    first.onmidimessage = (ev: MIDIMessageEvent) => {
      const data = ev.data;
      if (!data || data.length < 3) return;
      const status = data[0] & 0xf0;
      const cc = data[1];
      const value = data[2];

      // Only CC messages
      if (status !== 0xb0) return;

      const currentTarget = learnTargetRef.current;

      // Learn mode — assign CC to metric
      if (currentTarget) {
        setMappings((prev) => {
          const next = { ...prev };
          // Remove old mapping for this CC
          delete next[String(cc)];
          // Remove old mapping for this metric
          Object.keys(next).forEach((k) => {
            if (next[k] === currentTarget) delete next[k];
          });
          next[String(cc)] = currentTarget;
          return next;
        });
        setLearnTarget(null);
        return;
      }

      // Normal — apply CC to mapped metric
      const metric = mappings[String(cc)];
      if (metric) {
        // 0-127 → 1.0-10.0 in 0.5 steps
        const score = Math.round((value / 127) * 20) / 2;
        const clamped = Math.max(1, Math.min(10, score));
        onScoreChangeRef.current(metric, clamped);
      }
    };
    setConnected(true);
  }, [mappings]);

  // Init MIDI — request access only when enabled
  useEffect(() => {
    if (!enabled) return;
    if (!navigator.requestMIDIAccess) {
      setMidiSupported(false);
      return;
    }

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((acc) => {
        midiAccessRef.current = acc;
        scanInputs();
        acc.onstatechange = scanInputs;
      })
      .catch(() => {
        setMidiSupported(false);
      });

    return () => {
      if (midiInputRef.current) {
        midiInputRef.current.onmidimessage = null;
      }
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null;
      }
    };
  }, [enabled, scanInputs]);

  const toggleLearn = useCallback(
    (metricKey?: string) => {
      if (metricKey) {
        setLearnTarget(metricKey);
      } else {
        setLearnMode((prev) => !prev);
        if (learnMode) setLearnTarget(null);
      }
    },
    [learnMode]
  );

  const clearMapping = useCallback((cc: string) => {
    setMappings((prev) => {
      const next = { ...prev };
      delete next[cc];
      return next;
    });
  }, []);

  return {
    midiSupported,
    connected,
    learnMode,
    learnTarget,
    mappings,
    toggleLearn,
    clearMapping,
    setLearnTarget,
  };
}
