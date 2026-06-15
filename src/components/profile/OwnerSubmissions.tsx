"use client";

import { Submission, STATUS_COLORS, GENRE_OPTIONS } from "@/lib/types";
import WaveformPreview from "@/components/WaveformPreview";
import Link from "next/link";

interface OwnerSubmissionsProps {
  submissions: Submission[];
}

const GENRE_LABELS: Record<string, string> = Object.fromEntries(
  GENRE_OPTIONS.map((g) => [g.value, g.label])
);

const STATUS_BADGE_STYLES: Record<string, string> = {
  submitted: "bg-[#D4A843]/15 border-[#D4A843]/40 text-[#D4A843]",
  under_review: "bg-[#E89B2E]/15 border-[#E89B2E]/40 text-[#E89B2E]",
  selected: "bg-[#D4A843]/20 border-[#D4A843] text-[#D4A843]",
  aired: "bg-green-700/20 border-green-700/50 text-green-400",
  scored: "bg-purple-700/20 border-purple-700/50 text-purple-400",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  selected: "Selected",
  aired: "Aired",
  scored: "Scored",
};

export default function OwnerSubmissions({ submissions }: OwnerSubmissionsProps) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎙️</div>
        <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm mb-6">
          You haven&apos;t submitted any tracks yet.
        </p>
        <Link
          href="/submit"
          className="btn-3d inline-block text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.15em] px-8 py-3 rounded-lg font-bold"
        >
          Submit Your First Track
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="p-5 rounded-xl border border-[#3A2818]/40 bg-[#0F0A07]/50 hover:border-[#D4A843]/20 transition-all duration-300 group"
        >
          {/* Top row: title + status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg shrink-0">🎵</span>
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-[#F0E6D3] text-lg tracking-wide truncate">
                  {sub.track_title || "Untitled Track"}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs tracking-wider">
                  <span>
                    {new Date(sub.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {sub.genre && (
                    <>
                      <span className="text-[#3A2818]">·</span>
                      <span className="text-[#D4A843]/60">
                        {GENRE_LABELS[sub.genre] || sub.genre}
                      </span>
                    </>
                  )}
                  {sub.file_format && (
                    <>
                      <span className="text-[#3A2818]">·</span>
                      <span className="uppercase">{sub.file_format}</span>
                    </>
                  )}
                  {sub.track_duration && (
                    <>
                      <span className="text-[#3A2818]">·</span>
                      <span>{sub.track_duration}</span>
                    </>
                  )}
                  {sub.sample_rate && (
                    <>
                      <span className="text-[#3A2818]">·</span>
                      <span>{(sub.sample_rate / 1000).toFixed(1)}kHz</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-3 py-1 rounded-full text-xs font-[family-name:var(--font-mono)] tracking-wider border ${
                  STATUS_BADGE_STYLES[sub.status] || "border-[#3A2818] text-[#F0E6D3]/50"
                }`}
              >
                {STATUS_LABELS[sub.status] || sub.status}
              </span>
            </div>
          </div>

          {/* Waveform */}
          {sub.waveform_data && sub.waveform_data.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-[#3A2818]/30 mb-4">
              <WaveformPreview peaks={sub.waveform_data} height={60} />
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between pt-3 border-t border-[#3A2818]/20">
            <div className="flex items-center gap-3">
              <button
                className="text-xs font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 hover:text-[#D4A843] transition-colors tracking-wider flex items-center gap-1.5"
                title="Edit submission"
              >
                <span>✏️</span>
                <span>Edit</span>
              </button>
              <button
                className="text-xs font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 hover:text-[#C4392A] transition-colors tracking-wider flex items-center gap-1.5"
                title="Delete submission"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            </div>
            {sub.episode_id && (
              <span className="text-xs font-[family-name:var(--font-mono)] text-[#D4A843]/50 tracking-wider">
                Episode assigned
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Submit Another CTA */}
      <div className="pt-4 text-center">
        <Link
          href="/submit"
          className="btn-3d inline-block text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.15em] px-8 py-3 rounded-lg font-bold"
        >
          Submit Another Track
        </Link>
      </div>
    </div>
  );
}
