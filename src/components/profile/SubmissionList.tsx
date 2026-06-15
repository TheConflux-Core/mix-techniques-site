"use client";

import { Submission, STATUS_COLORS, GENRE_OPTIONS } from "@/lib/types";
import WaveformPreview from "@/components/WaveformPreview";

interface SubmissionListProps {
  submissions: Submission[];
}

const GENRE_LABELS: Record<string, string> = Object.fromEntries(
  GENRE_OPTIONS.map((g) => [g.value, g.label])
);

export default function SubmissionList({ submissions }: SubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-sm italic">
        No submissions yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="p-5 rounded-xl border border-[#3A2818]/40 bg-[#0F0A07]/40 hover:border-[#3A2818]/70 transition-all duration-300"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">🎵</span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-[#F0E6D3] text-lg tracking-wide">
                  {sub.track_title || "Untitled Track"}
                </h3>
                <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs tracking-wider">
                  Submitted {new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sub.genre && (
                <span className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-xs tracking-wider">
                  {GENRE_LABELS[sub.genre] || sub.genre}
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-xs font-[family-name:var(--font-mono)] tracking-wider border ${
                  STATUS_COLORS[sub.status] || "border-[#3A2818] text-[#F0E6D3]/50"
                }`}
              >
                {sub.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {sub.waveform_data && sub.waveform_data.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-[#3A2818]/30">
              <WaveformPreview peaks={sub.waveform_data} height={60} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
