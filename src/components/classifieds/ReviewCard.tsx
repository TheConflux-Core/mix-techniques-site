"use client";

import { ClassifiedReview } from "@/lib/types";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-[#D4A843]" : "text-[#3A2818]"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

interface ReviewCardProps {
  review: ClassifiedReview;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="p-4 rounded-xl hover:bg-[#2A1810]/20 transition-colors">
      {/* Author */}
      <div className="flex items-center gap-2 mb-2">
        {review.reviewer?.avatar_url ? (
          <img
            src={review.reviewer.avatar_url}
            alt=""
            className="w-6 h-6 rounded-full border border-[#3A2818]"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#3A2818] flex items-center justify-center text-[#F0E6D3]/30 text-[10px]">
            🎧
          </div>
        )}
        <span className="font-[family-name:var(--font-display)] text-[#F0E6D3] text-xs uppercase tracking-wider">
          {review.reviewer?.display_name || "Unknown"}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/20 text-[10px]">
          {timeAgo(review.created_at)}
        </span>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-2">
        <StarRating rating={review.rating} />
        {review.project_type && (
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/30 bg-[#2A1810] px-2 py-0.5 rounded-full">
            {review.project_type}
          </span>
        )}
      </div>

      {/* Body */}
      {review.review_text && (
        <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/70 text-sm leading-relaxed whitespace-pre-wrap">
          {review.review_text}
        </div>
      )}
    </div>
  );
}
