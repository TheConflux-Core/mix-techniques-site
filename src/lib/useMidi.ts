"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface MidiMapping {
  [cc: string]: string; // cc number → metric key or boolean key
}

/**
 * MIDI controller hook for viewer voting.
 * Maps CC messages to metric score changes and boolean vote toggles.
 */
export function useMidi(options: {
  enabled: boolean;
  onScoreChange: (metricKey: string, score: number) => void;
  onBooleanVote?: (key: string) => void;
}) {
  const { enabled, onScoreChange, onBooleanVote } = options;
  const onScoreChangeRef = useRef(onScoreChange);
  onScoreChangeRef.current = onScoreChange;
  const onBooleanVoteRef = useRef(onBooleanVote);
  onBooleanVoteRef.current = onBooleanVote;

  const [midiSupported, setMidiSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!navigator.requestMIDIAccess;
  });
  const [connected, setConnected] = useState(false);
  const [learnMode, setLearnMode] = useState(false);
  const [learnTarget, setLearnTarget] = useState<string | null>(null);
  // metric mappings: CC → metric key
  const [mappings, setMappings] = useState<MidiMapping>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("mt_vote_midi") || "{}");
    } catch {
      return {};
    }
  });
  // boolean mappings: CC → boolean vote key
  const [booleanMappings, setBooleanMappings] = useState<MidiMapping>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("mt_vote_midi_bool") || "{}");
    } catch {
      return {};
    }
  });

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const midiInputRef = useRef<MIDIInput | null>(null);
  const learnTargetRef = useRef<string | null>(null);
  learnTargetRef.current = learnTarget;
  const learnModeRef = useRef(false);
  learnModeRef.current = learnMode;

  // Save mappings
  useEffect(() => {
    try {
      localStorage.setItem("mt_vote_midi", JSON.stringify(mappings));
    } catch {
      /* silent */
    }
  }, [mappings]);

  useEffect(() => {
    try {
      localStorage.setItem("mt_vote_midi_bool", JSON.stringify(booleanMappings));
    } catch {
      /* silent */
    }
  }, [booleanMappings]);

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

      // Learn mode — assign CC to target
      if (currentTarget) {
        const boolKeys = ["loveThisMix", "addToPlaylist", "greatProduction", "crankIt", "horribleMix", "skip"];
        if (boolKeys.includes(currentTarget)) {
          // Boolean mapping
          setBooleanMappings((prev) => {
            const next = { ...prev };
            delete next[String(cc)];
            Object.keys(next).forEach((k) => {
              if (next[k] === currentTarget) delete next[k];
            });
            next[String(cc)] = currentTarget;
            return next;
          });
        } else {
          // Metric mapping
          setMappings((prev) => {
            const next = { ...prev };
            delete next[String(cc)];
            Object.keys(next).forEach((k) => {
              if (next[k] === currentTarget) delete next[k];
            });
            next[String(cc)] = currentTarget;
            return next;
          });
        }
        setLearnTarget(null);
        return;
      }

      // Normal — apply CC to mapped metric (continuous, value 0-127)
      const metric = mappings[String(cc)];
      if (metric) {
        const score = Math.round((value / 127) * 20) / 2;
        const clamped = Math.max(1, Math.min(10, score));
        onScoreChangeRef.current(metric, clamped);
      }

      // Boolean vote — trigger on any value > 0 (toggle)
      const boolKey = booleanMappings[String(cc)];
      if (boolKey && value > 0) {
        onBooleanVoteRef.current?.(boolKey);
      }
    };
    setConnected(true);
  }, [mappings, booleanMappings]);

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
    (targetKey?: string) => {
      if (targetKey) {
        setLearnTarget(targetKey);
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

  const clearBooleanMapping = useCallback((cc: string) => {
    setBooleanMappings((prev) => {
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
    booleanMappings,
    toggleLearn,
    clearMapping,
    clearBooleanMapping,
    setLearnTarget,
  };
}
