"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import SubmissionForm from "@/components/SubmissionForm";
import BackstageRequirementsModal from "@/components/BackstageRequirementsModal";

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-sm tracking-[3px] uppercase"
          style={{ color: "rgba(212,168,67,0.4)" }}
        >
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen page-enter">
      <BackstageRequirementsModal />

      {/* Carbon fiber background */}
      <div className="fixed inset-0 carbon-fiber pointer-events-none" />
      {/* Warm light ambience */}
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />

      <main className="flex-1 flex items-start justify-center px-4 py-12 md:py-16 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="heading-wave font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-4">
              Submit Your Mix
            </h1>
            <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/80 text-sm tracking-[0.25em] uppercase tagline-glow">
              Let&apos;s hear what you&apos;ve got
            </p>
          </div>

          {/* Floating Form Card */}
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-10 relative overflow-hidden">
            {/* Subtle gold border accent at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/30 to-transparent" />
            <SubmissionForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#3A2818]/30 py-6 px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/15 text-xs tracking-wider">
            © {new Date().getFullYear()} Mix Techniques
          </p>
        </div>
      </footer>
    </div>
  );
}
