"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ClassifiedListing, ClassifiedReview } from "@/lib/types";
import ClassifiedDetail from "@/components/classifieds/ClassifiedDetail";

export default function ClassifiedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [listing, setListing] = useState<ClassifiedListing | null>(null);
  const [reviews, setReviews] = useState<ClassifiedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/classifieds/${id}`);
        if (!res.ok) {
          throw new Error("Listing not found");
        }
        const data = await res.json();
        setListing(data);

        // Fetch reviews
        const reviewRes = await fetch(`/api/classifieds/${id}/reviews`);
        if (reviewRes.ok) {
          const reviewData = await reviewRes.json();
          setReviews(reviewData.data || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen carbon-fiber relative">
        <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex items-end justify-center gap-[2px] h-10 mb-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-full origin-bottom"
                  style={{
                    background: "linear-gradient(to top, #D4A843, #E89B2E)",
                    height: "60%",
                    animation: `waveform-breathe ${1.5 + (i % 5) * 0.3}s ease-in-out ${i * 0.08}s infinite`,
                    opacity: 0.4,
                  }}
                />
              ))}
            </div>
            <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] uppercase">
              Loading listing...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen carbon-fiber relative">
        <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😕</div>
            <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider">
              {error || "Listing not found"}
            </p>
            <Link
              href="/classifieds"
              className="inline-block mt-4 font-[family-name:var(--font-mono)] text-[#D4A843] hover:text-[#E89B2E] text-sm transition-colors"
            >
              ← Back to Classifieds
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30">
            <li>
              <Link href="/" className="hover:text-[#D4A843] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/classifieds" className="hover:text-[#D4A843] transition-colors">
                Classifieds
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#F0E6D3]/60 truncate max-w-[200px]">{listing.title}</li>
          </ol>
        </nav>

        <ClassifiedDetail
          listing={listing}
          reviews={reviews}
          currentUserId={user?.id}
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-[#3A2818]/30 py-6 px-6 mt-12 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/15 text-xs tracking-wider">
            © {new Date().getFullYear()} Mix Techniques
          </p>
        </div>
      </footer>
    </div>
  );
}
