"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-[#3A2818]/60 bg-[#1A0F0A]/95 backdrop-blur-md sticky top-0 z-50 nav-glow">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-[#D4A843] text-xl md:text-2xl tracking-[0.2em] uppercase font-bold link-shimmer"
        >
          Mix Techniques
        </Link>
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="nav-link font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/50 hover:text-[#D4A843] transition-colors tracking-wider"
          >
            Home
          </Link>
          <Link
            href="/submit"
            className="nav-link font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/50 hover:text-[#D4A843] transition-colors tracking-wider"
          >
            Submit
          </Link>
        </div>
      </div>
    </nav>
  );
}
