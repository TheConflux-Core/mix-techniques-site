"use client";

import Link from "next/link";
import { ForumCategory } from "@/lib/types";

interface CategoryCardProps {
  category: ForumCategory;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/forum/${category.slug}`}
      className="group block card-float noise carbon-fiber-walnut rounded-2xl p-6 relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,168,67,0.1)]"
    >
      {/* Gold accent border top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(to right, transparent, ${category.color || "#D4A843"}, transparent)`,
        }}
      />

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{
            background: `${category.color || "#D4A843"}15`,
            border: `1px solid ${category.color || "#D4A843"}30`,
          }}
        >
          {category.icon || "💬"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="font-[family-name:var(--font-display)] text-lg text-[#F0E6D3] uppercase tracking-wider font-bold group-hover:text-[#D4A843] transition-colors">
            {category.name}
          </h3>

          {/* Description */}
          {category.description && (
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm mt-1 line-clamp-2">
              {category.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30">
            <span>
              <span className="text-[#D4A843]">{category.thread_count}</span>{" "}
              {category.thread_count === 1 ? "thread" : "threads"}
            </span>
            <span>
              <span className="text-[#D4A843]">{category.post_count}</span>{" "}
              {category.post_count === 1 ? "post" : "posts"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
