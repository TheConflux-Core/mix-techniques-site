"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface WaveformPlayerProps {
  audioUrl: string;
  peaks: number[] | null;
  title: string;
  onPlay?: () => void;
  compact?: boolean;
}

export default function WaveformPlayer({
  audioUrl,
  peaks,
  title,
  onPlay,
  compact = false,
}: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate fallback peaks if none provided
  const displayPeaks = peaks || Array.from({ length: compact ? 80 : 200 }, () => Math.random() * 0.7 + 0.15);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, onPlay]);

  const handleWaveformClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !audioRef.current?.duration) return;
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const barHeight = compact ? 32 : 48;

  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "gap-4"}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play button */}
      <button
        onClick={togglePlay}
        className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
          compact ? "w-8 h-8" : "w-10 h-10"
        } ${
          isPlaying
            ? "bg-[#D4A843] text-[#1A0F0A] shadow-[0_0_15px_rgba(212,168,67,0.3)]"
            : "bg-[#2A1810] text-[#D4A843] border border-[#3A2818] hover:border-[#D4A843]/40"
        }`}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg width={compact ? 12 : 14} height={compact ? 12 : 14} viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width={compact ? 12 : 14} height={compact ? 12 : 14} viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9.5-5.5L3 1.5z" />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div
        ref={containerRef}
        className="flex-1 cursor-pointer group relative"
        onClick={handleWaveformClick}
        style={{ height: barHeight }}
      >
        <div className="flex items-end h-full gap-[1px]">
          {displayPeaks.map((peak, i) => {
            const pct = i / displayPeaks.length;
            const played = pct <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-t-[1px] transition-colors duration-100"
                style={{
                  height: `${Math.max(peak * 100, 4)}%`,
                  background: played
                    ? "linear-gradient(to top, #D4A843, #E89B2E)"
                    : "rgba(58, 40, 24, 0.6)",
                  minWidth: compact ? 1 : 1.5,
                }}
              />
            );
          })}
        </div>
        {/* Playhead line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[#F0E6D3]/60 pointer-events-none transition-[left] duration-75"
          style={{ left: `${progress * 100}%` }}
        />
      </div>

      {/* Time */}
      {!compact && (
        <div className="flex-shrink-0 font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 tabular-nums w-16 text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      )}
    </div>
  );
}
