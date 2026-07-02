"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface ReviewFormProps {
  listingId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ listingId, onSuccess, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [projectType, setProjectType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/classifieds/${listingId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          review_text: reviewText.trim() || null,
          project_type: projectType.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review");
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-6">
        <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm">
          <a href="/login" className="text-[#D4A843] hover:text-[#E89B2E] transition-colors">
            Log in
          </a>{" "}
          to leave a review.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-400 text-sm font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Star Rating */}
      <div>
        <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
          Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl transition-colors cursor-pointer"
              style={{
                color:
                  star <= (hoverRating || rating) ? "#D4A843" : "#3A2818",
              }}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/40 ml-2">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {/* Project Type */}
      <div>
        <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
          Project Type (optional)
        </label>
        <input
          type="text"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          placeholder="e.g. Single, EP, Album"
          maxLength={100}
          className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
        />
      </div>

      {/* Review Text */}
      <div>
        <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
          Review (optional)
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience working with this person..."
          maxLength={5000}
          rows={4}
          className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none resize-none transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[#F0E6D3]/40 hover:text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm px-6 py-2 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
