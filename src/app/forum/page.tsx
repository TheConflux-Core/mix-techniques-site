"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ForumCategory } from "@/lib/types";
import CategoryCard from "@/components/forum/CategoryCard";

export default function ForumPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/forum/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

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
            <li className="text-[#F0E6D3]/60">Forum</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="heading-wave font-[family-name:var(--font-display)] text-4xl md:text-5xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-4">
            The Forum
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/80 text-sm tracking-[0.2em] uppercase">
            Where producers connect, share, and level up
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/40 to-transparent mx-auto mt-6" />
        </div>

        {/* Categories grid */}
        {loading ? (
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
              Loading forum...
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎙️</div>
            <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider">
              Forum coming soon
            </p>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/25 text-sm mt-2">
              Categories haven&apos;t been set up yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
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
