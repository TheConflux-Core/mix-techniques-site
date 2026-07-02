"use client";

import { PortfolioTrack } from "@/lib/types";
import WaveformPlayer from "./WaveformPlayer";

interface TrackListProps {
  tracks: PortfolioTrack[];
  compact?: boolean;
  onPlay?: (trackId: string) => void;
}

export default function TrackList({ tracks, compact = false, onPlay }: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-3">🎵</div>
        <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-sm">
          No tracks uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tracks.map((track) => (
        <div
          key={track.id}
          className={`group rounded-xl border transition-all duration-300 ${
            track.is_featured
              ? "border-[#D4A843]/30 bg-gradient-to-r from-[#2A1810]/80 to-[#1A0F0A]/80"
              : "border-[#3A2818]/40 bg-[#1A0F0A]/60 hover:border-[#3A2818]/80"
          } ${compact ? "p-3" : "p-4"}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {track.is_featured && (
                  <span className="text-[10px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-widest text-[#D4A843] bg-[#D4A843]/10 px-1.5 py-0.5 rounded">
                    ★ Featured
                  </span>
                )}
                <h3 className={`font-[family-name:var(--font-display)] text-[#F0E6D3] truncate ${compact ? "text-sm" : "text-base"}`}>
                  {track.title}
                </h3>
              </div>
              {track.description && !compact && (
                <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-xs mt-1 line-clamp-1">
                  {track.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-[family-name:var(--font-mono)] text-[#F0E6D3]/30">
              {track.play_count > 0 && (
                <span>▶ {track.play_count}</span>
              )}
              {track.file_format && (
                <span className="uppercase">{track.file_format}</span>
              )}
            </div>
          </div>

          <WaveformPlayer
            audioUrl={track.audio_url}
            peaks={track.waveform_peaks}
            title={track.title}
            compact={compact}
            onPlay={() => onPlay?.(track.id)}
          />
        </div>
      ))}
    </div>
  );
}
