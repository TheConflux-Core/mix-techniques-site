"use client";

import { ClassifiedListing } from "@/lib/types";
import ClassifiedCard from "./ClassifiedCard";

interface ClassifiedListProps {
  listings: ClassifiedListing[];
  loading: boolean;
}

export default function ClassifiedList({ listings, loading }: ClassifiedListProps) {
  if (loading) {
    return (
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
          Loading listings...
        </p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📋</div>
        <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider">
          No listings found
        </p>
        <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/25 text-sm mt-2">
          Try adjusting your filters or be the first to post.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ClassifiedCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
