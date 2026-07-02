"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export default function Navbar() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="w-full border-b border-[#3A2818]/60 bg-[#1A0F0A]/95 backdrop-blur-md sticky top-0 z-50 nav-glow">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 font-[family-name:var(--font-display)] text-[#F0E6D3] text-xl md:text-2xl tracking-[0.2em] uppercase font-bold link-shimmer"
        >
          <img src="/logo-gold.png" alt="" className="w-8 h-8 object-contain" />
          MIX <span style={{ color: "#D4A843" }}>TECHNIQUES</span>
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
          <Link
            href="/forum"
            className="nav-link font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/50 hover:text-[#D4A843] transition-colors tracking-wider"
          >
            Forum
          </Link>
          <Link
            href="/classifieds"
            className="nav-link font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/50 hover:text-[#D4A843] transition-colors tracking-wider"
          >
            Classifieds
          </Link>

          {!loading && (
            <>
              <Link
                href="/vote"
                className="nav-link font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/50 hover:text-[#D4A843] transition-colors tracking-wider"
              >
                Vote
              </Link>
              {user ? (
                <>
                  <Link
                    href={`/${slugify(user.user_metadata?.display_name || user.email?.split("@")[0] || "")}`}
                    className="flex items-center gap-2 nav-link"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover border border-[#3A2818]"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-[family-name:var(--font-display)]"
                        style={{
                          background: "linear-gradient(135deg, #D4A843 0%, #B8862D 100%)",
                          color: "#1A0F0A",
                        }}
                      >
                        {(user.user_metadata?.display_name || user.email?.split("@")[0] || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843]/70 tracking-wider hidden md:inline">
                      {user.user_metadata?.display_name || user.email?.split("@")[0]}
                    </span>
                  </Link>
                  <button
                    onClick={signOut}
                    className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 hover:text-[#D4A843] transition-colors tracking-wider cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="nav-link font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/50 hover:text-[#D4A843] transition-colors tracking-wider"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="nav-link font-[family-name:var(--font-mono)] text-sm text-[#D4A843] hover:text-[#E89B2E] transition-colors tracking-wider"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
