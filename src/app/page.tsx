"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import Navbar from "@/components/Navbar";

// Generate particles with fixed seeds to avoid hydration mismatch
function generateParticles(count: number) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 137.508; // golden angle
    particles.push({
      id: i,
      left: `${(seed * 3.7) % 100}%`,
      top: `${(seed * 2.3) % 100}%`,
      size: 1 + (seed % 2),
      duration: 8 + (seed % 12),
      delay: (seed % 6),
      opacity: 0.2 + (seed % 0.5),
    });
  }
  return particles;
}

const particles = generateParticles(40);

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 2600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <>
      <LoadingScreen />

      {/* Custom cursor */}
      <div
        className="cursor-dot"
        style={{
          left: mousePos.x - 4,
          top: mousePos.y - 4,
          opacity: loaded ? 1 : 0,
        }}
      />
      <div
        className={`cursor-ring ${isHovering ? "hovering" : ""}`}
        style={{
          left: mousePos.x - 18,
          top: mousePos.y - 18,
          opacity: loaded ? 1 : 0,
        }}
      />

      <div className="custom-cursor flex flex-col min-h-screen relative overflow-hidden carbon-fiber">
        <Navbar />

        {/* Background warm light ambience */}
        <div className="fixed inset-0 warm-light-bg pointer-events-none" />

        {/* Floating dust particles */}
        <div className="fixed inset-0 pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>

        {/* Hero Section */}
        <main
          ref={heroRef}
          className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative"
        >
          <div
            className={`max-w-3xl mx-auto text-center relative z-10 ${
              loaded ? "hero-entrance" : "opacity-0"
            }`}
          >
            {/* Radial glow behind waveform */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(212, 168, 67, 0.06) 0%, transparent 70%)",
                animation: "glowPulse 6s ease-in-out infinite",
              }}
            />

            {/* Organic breathing waveform */}
            <div className="flex items-end justify-center gap-[3px] h-20 mb-14 relative">
              {Array.from({ length: 50 }).map((_, i) => {
                const centerDist = Math.abs(i - 24.5) / 25;
                const baseHeight = 15 + (1 - centerDist) * 55;
                const isAlt = i % 3 === 0;
                return (
                  <div
                    key={i}
                    className="w-[3px] rounded-full origin-bottom"
                    style={{
                      background: `linear-gradient(to top, #D4A843, ${
                        i % 2 === 0 ? "#E89B2E" : "#F0D68A"
                      })`,
                      height: `${baseHeight}%`,
                      animation: `${
                        isAlt ? "waveform-breathe-alt" : "waveform-breathe"
                      } ${2.5 + (i % 7) * 0.4}s ease-in-out ${i * 0.06}s infinite`,
                      opacity: 0.3 + (1 - centerDist) * 0.5,
                      filter: `blur(${centerDist > 0.7 ? 0.5 : 0}px)`,
                    }}
                  />
                );
              })}
            </div>

            {/* Title with gold shimmer on hover */}
            <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl lg:text-8xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-6 gold-shimmer">
              Mix Techniques
            </h1>

            {/* Tagline with glow pulse */}
            <p className="font-[family-name:var(--font-mono)] text-[#D4A843] text-lg md:text-xl tracking-[0.3em] uppercase mb-14 tagline-glow">
              Show Us Your Mix
            </p>

            {/* Description */}
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm md:text-base max-w-xl mx-auto mb-14 leading-relaxed tracking-wide">
              A music production show celebrating the art and craft of mixing.
              Submit your best work and let the world hear what you can do
              behind the board.
            </p>

            {/* 3D CTA Button */}
            <Link
              href="/submit"
              className="btn-3d inline-block text-[#1A0F0A] font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.2em] px-12 py-5 rounded-lg font-bold"
            >
              Submit Your Mix
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-hint">
            <span className="font-[family-name:var(--font-mono)] text-[#D4A843]/40 text-[10px] uppercase tracking-[0.3em]">
              Scroll
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-[#D4A843]/40"
            >
              <path
                d="M4 8L10 14L16 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#3A2818]/50 py-6 px-6 relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/20 text-xs tracking-wider">
              © {new Date().getFullYear()} Mix Techniques
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] h-[8px] rounded-full bg-[#D4A843]/20"
                  style={{
                    animation: `waveform-breathe ${2 + i * 0.3}s ease-in-out ${
                      i * 0.1
                    }s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
