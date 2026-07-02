"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import ClassifiedForm from "@/components/classifieds/ClassifiedForm";

export default function PostClassifiedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen carbon-fiber relative">
        <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
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
              Loading...
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
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔒</div>
            <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider mb-2">
              Login Required
            </p>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-sm mb-6">
              You need to be logged in to post a listing.
            </p>
            <Link
              href="/login"
              className="btn-3d inline-block text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
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
            <li className="text-[#F0E6D3]/60">Post</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="heading-wave font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-3">
            Post a Listing
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/80 text-sm tracking-[0.15em]">
            Let the community know what you&apos;re looking for
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/40 to-transparent mx-auto mt-6" />
        </div>

        {/* Form */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-8">
          <ClassifiedForm />
        </div>
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
