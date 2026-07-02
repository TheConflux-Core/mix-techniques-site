"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ClassifiedListing, ClassifiedReview, ClassifiedContact } from "@/lib/types";

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

type Tab = "listings" | "messages" | "reviews";

export default function MyClassifiedsPage() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<ClassifiedListing[]>([]);
  const [messages, setMessages] = useState<(ClassifiedContact & { sender?: any; listing?: any })[]>([]);
  const [reviews, setReviews] = useState<(ClassifiedReview & { reviewer?: any; listing?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("listings");

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      try {
        const res = await fetch("/api/classifieds/my");
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings || []);
          setMessages(data.messages || []);
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error("Failed to fetch my classifieds:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  async function handleStatusChange(listingId: string, status: string) {
    try {
      const res = await fetch(`/api/classifieds/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, status: status as any } : l))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleDelete(listingId: string) {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(`/api/classifieds/${listingId}`, { method: "DELETE" });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== listingId));
      }
    } catch (err) {
      console.error("Failed to delete listing:", err);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen carbon-fiber relative">
        <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
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
              Loading dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen carbon-fiber relative">
        <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔒</div>
            <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider">
              Login Required
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "text-green-400 bg-green-900/20 border-green-800/30",
    paused: "text-yellow-400 bg-yellow-900/20 border-yellow-800/30",
    closed: "text-[#F0E6D3]/40 bg-[#2A1810] border-[#3A2818]/30",
    hired: "text-blue-400 bg-blue-900/20 border-blue-800/30",
  };

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
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
            <li className="text-[#F0E6D3]/60">My Listings</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="heading-wave font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-3">
            My Classifieds
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/80 text-sm tracking-[0.15em]">
            Manage your listings, messages, and reviews
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/40 to-transparent mx-auto mt-6" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(["listings", "messages", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#D4A843] text-[#1A0F0A] font-bold"
                  : "bg-[#1A0F0A] text-[#F0E6D3]/40 border border-[#3A2818] hover:border-[#D4A843]/50 hover:text-[#F0E6D3]/70"
              }`}
            >
              {tab === "listings" && `Listings (${listings.length})`}
              {tab === "messages" && `Messages (${messages.length})`}
              {tab === "reviews" && `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            {listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📋</div>
                <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider">
                  No listings yet
                </p>
                <Link
                  href="/classifieds/post"
                  className="inline-block mt-4 btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold"
                >
                  Post Your First Listing
                </Link>
              </div>
            ) : (
              listings.map((listing) => (
                <div
                  key={listing.id}
                  className="card-float noise carbon-fiber-walnut rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                          listing.listing_type === "lfw"
                            ? "bg-[#D4A843] text-[#1A0F0A]"
                            : "bg-[#E89B2E] text-[#1A0F0A]"
                        }`}
                      >
                        {listing.listing_type.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          statusColors[listing.status] || statusColors.active
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                    <Link
                      href={`/classifieds/${listing.id}`}
                      className="font-[family-name:var(--font-display)] text-[#F0E6D3] hover:text-[#D4A843] transition-colors uppercase tracking-wider font-bold text-sm"
                    >
                      {listing.title}
                    </Link>
                    <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/30 mt-1">
                      {listing.view_count} views · {listing.contact_count} contacts · Created{" "}
                      {timeAgo(listing.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {listing.status === "active" && (
                      <button
                        onClick={() => handleStatusChange(listing.id, "paused")}
                        className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg bg-yellow-900/20 text-yellow-400 border border-yellow-800/30 hover:bg-yellow-900/40 transition-colors cursor-pointer"
                      >
                        Pause
                      </button>
                    )}
                    {listing.status === "paused" && (
                      <button
                        onClick={() => handleStatusChange(listing.id, "active")}
                        className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg bg-green-900/20 text-green-400 border border-green-800/30 hover:bg-green-900/40 transition-colors cursor-pointer"
                      >
                        Activate
                      </button>
                    )}
                    {(listing.status === "active" || listing.status === "paused") && (
                      <button
                        onClick={() => handleStatusChange(listing.id, "closed")}
                        className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#2A1810] text-[#F0E6D3]/40 border border-[#3A2818]/30 hover:text-[#F0E6D3]/70 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/40 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">✉️</div>
                <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider">
                  No messages yet
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="card-float noise carbon-fiber-walnut rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {msg.sender?.avatar_url ? (
                      <img
                        src={msg.sender.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full border border-[#3A2818]"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#3A2818]" />
                    )}
                    <span className="font-[family-name:var(--font-display)] text-[#F0E6D3] text-xs uppercase tracking-wider">
                      {msg.sender?.display_name || "Unknown"}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/20 text-[10px]">
                      {timeAgo(msg.created_at)}
                    </span>
                    {msg.listing && (
                      <Link
                        href={`/classifieds/${msg.listing.id}`}
                        className="font-[family-name:var(--font-mono)] text-[10px] text-[#D4A843]/60 hover:text-[#D4A843] transition-colors ml-auto truncate max-w-[200px]"
                      >
                        Re: {msg.listing.title}
                      </Link>
                    )}
                  </div>
                  <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/60 text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">⭐</div>
                <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider">
                  No reviews yet
                </p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="card-float noise carbon-fiber-walnut rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {review.reviewer?.avatar_url ? (
                      <img
                        src={review.reviewer.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full border border-[#3A2818]"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#3A2818]" />
                    )}
                    <span className="font-[family-name:var(--font-display)] text-[#F0E6D3] text-xs uppercase tracking-wider">
                      {review.reviewer?.display_name || "Unknown"}
                    </span>
                    <StarRating rating={review.rating} />
                    <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/20 text-[10px]">
                      {timeAgo(review.created_at)}
                    </span>
                    {review.listing && (
                      <Link
                        href={`/classifieds/${review.listing.id}`}
                        className="font-[family-name:var(--font-mono)] text-[10px] text-[#D4A843]/60 hover:text-[#D4A843] transition-colors ml-auto truncate max-w-[200px]"
                      >
                        on: {review.listing.title}
                      </Link>
                    )}
                  </div>
                  {review.review_text && (
                    <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/60 text-sm leading-relaxed whitespace-pre-wrap">
                      {review.review_text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
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
