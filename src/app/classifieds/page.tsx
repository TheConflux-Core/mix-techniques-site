"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ClassifiedListing } from "@/lib/types";
import ClassifiedList from "@/components/classifieds/ClassifiedList";
import FilterBar from "@/components/classifieds/FilterBar";

export default function ClassifiedsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ClassifiedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [activeType, setActiveType] = useState<"all" | "lfw" | "lfm">("all");
  const [genre, setGenre] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [sort, setSort] = useState("newest");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", activeType);
      if (genre) params.set("genre", genre);
      if (specialty) params.set("specialty", specialty);
      params.set("sort", sort);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/classifieds?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.data || []);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (err) {
      console.error("Failed to fetch classifieds:", err);
    } finally {
      setLoading(false);
    }
  }, [activeType, genre, specialty, sort, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeType, genre, specialty, sort]);

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
            <li className="text-[#F0E6D3]/60">Classifieds</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="heading-wave font-[family-name:var(--font-display)] text-4xl md:text-5xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-4">
            Classifieds
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/80 text-sm tracking-[0.2em] uppercase">
            Find your next mix engineer or land your next gig
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/40 to-transparent mx-auto mt-6" />
        </div>

        {/* Post Button */}
        <div className="flex items-center justify-between mb-6">
          <p className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30">
            {total} {total === 1 ? "listing" : "listings"} found
          </p>
          {user && (
            <Link
              href="/classifieds/post"
              className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-6 py-2.5 rounded-lg font-bold"
            >
              + Post a Listing
            </Link>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          activeType={activeType}
          onTypeChange={setActiveType}
          genre={genre}
          onGenreChange={setGenre}
          specialty={specialty}
          onSpecialtyChange={setSpecialty}
          sort={sort}
          onSortChange={setSort}
        />

        {/* Listings */}
        <div className="mt-8">
          <ClassifiedList listings={listings} loading={loading} />
        </div>

        {/* Pagination */}
        {(page > 1 || hasMore) && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/40 hover:text-[#D4A843] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer px-4 py-2 border border-[#3A2818] rounded-lg"
            >
              ← Previous
            </button>
            <span className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30">
              Page {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/40 hover:text-[#D4A843] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer px-4 py-2 border border-[#3A2818] rounded-lg"
            >
              Next →
            </button>
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
