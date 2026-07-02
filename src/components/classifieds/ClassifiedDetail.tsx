"use client";

import { useState } from "react";
import Link from "next/link";
import { ClassifiedListing, ClassifiedReview } from "@/lib/types";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import ContactModal from "./ContactModal";

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

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const textSize = size === "lg" ? "text-xl" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-0.5 ${textSize}`}>
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

interface ClassifiedDetailProps {
  listing: ClassifiedListing;
  reviews: ClassifiedReview[];
  currentUserId?: string;
}

export default function ClassifiedDetail({
  listing,
  reviews,
  currentUserId,
}: ClassifiedDetailProps) {
  const [showContact, setShowContact] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [allReviews, setAllReviews] = useState(reviews);

  const isLfw = listing.listing_type === "lfw";
  const isOwner = currentUserId === listing.author_id;
  const memberSince = listing.author?.created_at
    ? new Date(listing.author.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  async function refreshReviews() {
    try {
      const res = await fetch(`/api/classifieds/${listing.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setAllReviews(data.data || []);
      }
    } catch {}
    setShowReviewForm(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-xs font-[family-name:var(--font-mono)] uppercase tracking-wider px-3 py-1 rounded-full font-bold ${
              isLfw ? "bg-[#D4A843] text-[#1A0F0A]" : "bg-[#E89B2E] text-[#1A0F0A]"
            }`}
          >
            {isLfw ? "Looking For Work" : "Looking For Mixing"}
          </span>
          {listing.is_featured && (
            <span className="text-xs font-[family-name:var(--font-mono)] uppercase tracking-wider px-3 py-1 rounded-full bg-[#D4A843]/20 text-[#D4A843] border border-[#D4A843]/30">
              ⭐ Featured
            </span>
          )}
          {listing.is_bumped && (
            <span className="text-xs font-[family-name:var(--font-mono)] uppercase tracking-wider px-3 py-1 rounded-full bg-[#E89B2E]/20 text-[#E89B2E] border border-[#E89B2E]/30">
              🔼 Bumped
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="heading-wave font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold mb-4">
          {listing.title}
        </h1>

        {/* Author Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#2A1810]/30 border border-[#3A2818]/50">
          {listing.author?.avatar_url ? (
            <img
              src={listing.author.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full border-2 border-[#3A2818]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#3A2818] flex items-center justify-center text-[#F0E6D3]/30 text-lg">
              🎧
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/${listing.author?.display_name?.toLowerCase().replace(/\s+/g, "-") || ""}`}
                className="font-[family-name:var(--font-display)] text-[#F0E6D3] hover:text-[#D4A843] transition-colors uppercase tracking-wider font-bold"
              >
                {listing.author?.display_name || "Unknown"}
              </Link>
              {listing.is_verified && <span title="Verified">✅</span>}
            </div>
            <div className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 mt-1">
              {listing.author?.location && <span>📍 {listing.author.location}</span>}
              {memberSince && <span>Member since {memberSince}</span>}
            </div>
          </div>
          <div className="text-right font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/20">
            <div>{listing.view_count} views</div>
            <div>{listing.contact_count} contacts</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6">
        <h2 className="font-[family-name:var(--font-display)] text-[#D4A843] text-sm uppercase tracking-wider mb-3">
          Description
        </h2>
        <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/75 text-sm leading-relaxed whitespace-pre-wrap">
          {listing.description}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pricing */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[#D4A843] text-sm uppercase tracking-wider mb-3">
            {isLfw ? "Rates" : "Budget"}
          </h2>
          <div className="space-y-2 font-[family-name:var(--font-mono)] text-sm">
            {isLfw ? (
              <>
                {listing.rate_per_song && (
                  <div className="flex justify-between">
                    <span className="text-[#F0E6D3]/50">Per Song</span>
                    <span className="text-[#D4A843]">${listing.rate_per_song}</span>
                  </div>
                )}
                {listing.rate_per_hour && (
                  <div className="flex justify-between">
                    <span className="text-[#F0E6D3]/50">Per Hour</span>
                    <span className="text-[#D4A843]">${listing.rate_per_hour}</span>
                  </div>
                )}
                {listing.rate_per_stem && (
                  <div className="flex justify-between">
                    <span className="text-[#F0E6D3]/50">Per Stem</span>
                    <span className="text-[#D4A843]">${listing.rate_per_stem}</span>
                  </div>
                )}
                {listing.turnaround_days && (
                  <div className="flex justify-between">
                    <span className="text-[#F0E6D3]/50">Turnaround</span>
                    <span className="text-[#F0E6D3]/70">{listing.turnaround_days} days</span>
                  </div>
                )}
                {!listing.rate_per_song && !listing.rate_per_hour && !listing.rate_per_stem && (
                  <span className="text-[#F0E6D3]/30">Rates negotiable — contact for details</span>
                )}
              </>
            ) : (
              <>
                {listing.budget_min && listing.budget_max ? (
                  <div className="flex justify-between">
                    <span className="text-[#F0E6D3]/50">Budget Range</span>
                    <span className="text-[#D4A843]">
                      ${listing.budget_min} – ${listing.budget_max}
                    </span>
                  </div>
                ) : listing.budget_min ? (
                  <div className="flex justify-between">
                    <span className="text-[#F0E6D3]/50">Min Budget</span>
                    <span className="text-[#D4A843]">${listing.budget_min}</span>
                  </div>
                ) : listing.budget_max ? (
                  <div className="flex justify-between">
                    <span className="text-[#F0E6D3]/50">Max Budget</span>
                    <span className="text-[#D4A843]">${listing.budget_max}</span>
                  </div>
                ) : (
                  <span className="text-[#F0E6D3]/30">Budget negotiable</span>
                )}
                {listing.deadline && (
                  <div className="flex justify-between">
                    <span className="text-[#F0E6D3]/50">Deadline</span>
                    <span className="text-[#F0E6D3]/70">
                      {new Date(listing.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Specialties & Genres */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[#D4A843] text-sm uppercase tracking-wider mb-3">
            Specialties & Genres
          </h2>
          {listing.specialties && listing.specialties.length > 0 && (
            <div className="mb-3">
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/30 uppercase tracking-wider">
                Specialties
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {listing.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="text-xs font-[family-name:var(--font-mono)] px-2.5 py-1 rounded-full bg-[#2A1810] text-[#F0E6D3]/60 border border-[#3A2818]/50"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
          {listing.genres && listing.genres.length > 0 && (
            <div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/30 uppercase tracking-wider">
                Genres
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {listing.genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-xs font-[family-name:var(--font-mono)] px-2.5 py-1 rounded-full bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio & References */}
      {(listing.portfolio_url || listing.reference_tracks) && (
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[#D4A843] text-sm uppercase tracking-wider mb-3">
            Portfolio & References
          </h2>
          <div className="space-y-2 font-[family-name:var(--font-mono)] text-sm">
            {listing.portfolio_url && (
              <div>
                <span className="text-[#F0E6D3]/50">Portfolio: </span>
                <a
                  href={listing.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4A843] hover:text-[#E89B2E] transition-colors underline"
                >
                  {listing.portfolio_url}
                </a>
              </div>
            )}
            {listing.reference_tracks && (
              <div>
                <span className="text-[#F0E6D3]/50">Reference Tracks: </span>
                <span className="text-[#F0E6D3]/70">{listing.reference_tracks}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating Summary */}
      {listing.avg_rating && (
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-[family-name:var(--font-display)] text-4xl text-[#D4A843] font-bold">
                {listing.avg_rating}
              </div>
              <StarRating rating={listing.avg_rating} size="lg" />
            </div>
            <div className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/40">
              Based on {listing.review_count}{" "}
              {listing.review_count === 1 ? "review" : "reviews"}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {currentUserId && !isOwner && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowContact(true)}
            className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold cursor-pointer"
          >
            Contact
          </button>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-[#2A1810] text-[#D4A843] border border-[#3A2818] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold hover:border-[#D4A843]/50 transition-colors cursor-pointer"
          >
            Leave Review
          </button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6">
          <h2 className="font-[family-name:var(--font-display)] text-[#D4A843] text-sm uppercase tracking-wider mb-4">
            Leave a Review
          </h2>
          <ReviewForm
            listingId={listing.id}
            onSuccess={refreshReviews}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Reviews */}
      <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6">
        <h2 className="font-[family-name:var(--font-display)] text-[#D4A843] text-sm uppercase tracking-wider mb-4">
          Reviews ({allReviews.length})
        </h2>
        {allReviews.length === 0 ? (
          <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-sm text-center py-8">
            No reviews yet.
          </p>
        ) : (
          <div className="space-y-2">
            {allReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {showContact && (
        <ContactModal
          listingId={listing.id}
          listingTitle={listing.title}
          onClose={() => setShowContact(false)}
        />
      )}
    </div>
  );
}
