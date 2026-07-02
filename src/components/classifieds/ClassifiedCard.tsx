"use client";

import Link from "next/link";
import { ClassifiedListing } from "@/lib/types";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
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

interface ClassifiedCardProps {
  listing: ClassifiedListing;
}

export default function ClassifiedCard({ listing }: ClassifiedCardProps) {
  const isLfw = listing.listing_type === "lfw";

  return (
    <Link
      href={`/classifieds/${listing.id}`}
      className="group block card-float noise carbon-fiber-walnut rounded-2xl p-5 relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,168,67,0.1)]"
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: isLfw
            ? "linear-gradient(to right, transparent, #D4A843, transparent)"
            : "linear-gradient(to right, transparent, #E89B2E, transparent)",
        }}
      />

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
            isLfw
              ? "bg-[#D4A843] text-[#1A0F0A]"
              : "bg-[#E89B2E] text-[#1A0F0A]"
          }`}
        >
          {isLfw ? "LFW" : "LFM"}
        </span>
        {listing.is_featured && (
          <span className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4A843]/20 text-[#D4A843] border border-[#D4A843]/30">
            ⭐ Featured
          </span>
        )}
        {listing.is_verified && (
          <span title="Verified" className="text-sm">
            ✅
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-[family-name:var(--font-display)] text-[#F0E6D3] group-hover:text-[#D4A843] transition-colors text-base font-bold uppercase tracking-wider line-clamp-1 mb-2">
        {listing.title}
      </h3>

      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        {listing.author?.avatar_url ? (
          <img
            src={listing.author.avatar_url}
            alt=""
            className="w-5 h-5 rounded-full border border-[#3A2818]"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-[#3A2818]" />
        )}
        <span className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50">
          {listing.author?.display_name || "Unknown"}
        </span>
      </div>

      {/* Description */}
      <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs leading-relaxed line-clamp-2 mb-3">
        {listing.description}
      </p>

      {/* Specialties */}
      {listing.specialties && listing.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.specialties.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="text-[10px] font-[family-name:var(--font-mono)] px-2 py-0.5 rounded-full bg-[#2A1810] text-[#F0E6D3]/50 border border-[#3A2818]/50"
            >
              {spec}
            </span>
          ))}
          {listing.specialties.length > 3 && (
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-[#F0E6D3]/30">
              +{listing.specialties.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Pricing */}
      <div className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843] mb-3">
        {isLfw ? (
          <>
            {listing.rate_per_song && <span>${listing.rate_per_song}/song</span>}
            {listing.rate_per_song && listing.rate_per_hour && <span> · </span>}
            {listing.rate_per_hour && <span>${listing.rate_per_hour}/hr</span>}
          </>
        ) : (
          <>
            {listing.budget_min && listing.budget_max ? (
              <span>
                ${listing.budget_min}–${listing.budget_max} budget
              </span>
            ) : listing.budget_min ? (
              <span>From ${listing.budget_min}</span>
            ) : listing.budget_max ? (
              <span>Up to ${listing.budget_max}</span>
            ) : (
              <span className="text-[#F0E6D3]/30">Budget negotiable</span>
            )}
          </>
        )}
      </div>

      {/* Footer: rating + meta */}
      <div className="flex items-center justify-between pt-3 border-t border-[#3A2818]/30">
        <div className="flex items-center gap-2">
          {listing.avg_rating ? (
            <>
              <StarRating rating={listing.avg_rating} />
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/30">
                ({listing.review_count})
              </span>
            </>
          ) : (
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/20">
              No reviews
            </span>
          )}
        </div>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/20">
          {timeAgo(listing.created_at)}
        </span>
      </div>
    </Link>
  );
}
