"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/components/LoadingScreen";

// Generate particles with fixed seeds to avoid hydration mismatch
function generateParticles(count: number) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 137.508;
    particles.push({
      id: i,
      left: `${(seed * 3.7) % 100}%`,
      top: `${(seed * 2.3) % 100}%`,
      size: 1 + (seed % 2),
      duration: 8 + (seed % 12),
      delay: seed % 6,
      opacity: 0.2 + (seed % 0.5),
    });
  }
  return particles;
}

const particles = generateParticles(40);

// ─── Scroll reveal hook ───
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─── Staggered children reveal ───
function useStaggerReveal(count: number, baseDelay = 120) {
  const ref = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(
    new Array(count).fill(false)
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              setVisibleItems((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * baseDelay);
          }
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [count, baseDelay]);

  return { ref, visibleItems };
}

// ─── Parallax on scroll ───
function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      setOffset((center - viewCenter) * speed);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return { ref, offset };
}

// ─── VU Meter component ───
function VuMeter({
  label,
  value,
  visible,
  delay = 0,
}: {
  label: string;
  value: number;
  visible: boolean;
  delay?: number;
}) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setCurrentValue((prev) => {
          const next = prev + 0.02;
          if (next >= value) return value;
          return next;
        });
      }, 16);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [visible, value, delay]);

  const rotation = -45 + (currentValue / 10) * 90;

  return (
    <div
      className="flex flex-col items-center gap-3"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      <div className="relative w-24 h-16 md:w-28 md:h-20">
        <div
          className="absolute inset-0 rounded-t-full overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #0F0A07 0%, #1A0F0A 100%)",
            border: "1px solid #3A2818",
            borderBottom: "none",
          }}
        >
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[90%] h-[60%]">
            <div className="absolute bottom-0 left-[10%] w-[50%] h-[2px] rounded-full" style={{ background: "rgba(76, 175, 80, 0.4)" }} />
            <div className="absolute bottom-0 left-[60%] w-[20%] h-[2px] rounded-full" style={{ background: "rgba(255, 193, 7, 0.4)" }} />
            <div className="absolute bottom-0 left-[80%] w-[15%] h-[2px] rounded-full" style={{ background: "rgba(196, 57, 42, 0.4)" }} />
          </div>
          <div
            className="absolute bottom-0 left-1/2 origin-bottom"
            style={{
              width: "2px",
              height: "70%",
              background: "linear-gradient(to top, #D4A843, #F0D68A)",
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 6px rgba(212, 168, 67, 0.4)",
              marginLeft: "-1px",
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
            style={{
              background: "radial-gradient(circle, #D4A843, #8B6914)",
              boxShadow: "0 0 8px rgba(212, 168, 67, 0.3)",
            }}
          />
        </div>
        <div
          className="absolute -inset-2 rounded-t-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center bottom, rgba(212, 168, 67, ${visible ? 0.08 : 0}) 0%, transparent 70%)`,
            transition: "all 1s ease",
          }}
        />
      </div>
      <span
        className="font-[family-name:var(--font-mono)] text-[10px] md:text-xs uppercase tracking-[0.2em]"
        style={{
          color: visible ? "#D4A843" : "rgba(212, 168, 67, 0.2)",
          transition: "color 0.6s ease",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Scroll progress bar ───
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[100]">
      <div
        className="h-full"
        style={{
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #D4A843, #E89B2E)",
          boxShadow: "0 0 10px rgba(212, 168, 67, 0.5)",
          transition: "width 0.1s linear",
        }}
      />
    </div>
  );
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const howItWorks = useScrollReveal(0.1);
  const scoreSection = useScrollReveal(0.1);
  const communitySection = useScrollReveal(0.1);
  const episodesSection = useScrollReveal(0.1);
  const steps = useStaggerReveal(4, 200);
  const metrics = useStaggerReveal(7, 100);
  const heroParallax = useParallax(0.15);
  const waveformParallax = useParallax(-0.08);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 2600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(
        !!(target.tagName === "A" || target.tagName === "BUTTON" || target.closest("a") || target.closest("button"))
      );
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  const showSteps = [
    {
      number: "01",
      title: "The Pull",
      subtitle: "Your name gets drawn",
      description: "Submit your best mix. If fate picks you, your track goes live on stream \u2014 no second takes, no safety net.",
      icon: (
        <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="24" cy="24" r="18" strokeDasharray="4 3" opacity="0.3" />
          <circle cx="24" cy="24" r="8" opacity="0.6" />
          <path d="M24 16V32M16 24H32" strokeWidth="1" opacity="0.4" />
          <circle cx="24" cy="24" r="3" fill="#D4A843" opacity="0.8" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "The Play",
      subtitle: "Your track goes live",
      description: "Your mix plays to the audience in real-time. Viewers hear exactly what the host hears \u2014 on their own monitors, their own headphones.",
      icon: (
        <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 14L36 24L18 34V14Z" fill="#D4A843" opacity="0.3" stroke="#D4A843" />
          <path d="M38 18C40 20 40 28 38 30" opacity="0.4" />
          <path d="M42 14C45 18 45 30 42 34" opacity="0.2" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "The Critique",
      subtitle: "Real-time mix analysis",
      description: "Seven metrics. Low end, clarity, balance, mids, image, highs, overall. The host breaks it down \u2014 specific, direct, no fluff.",
      icon: (
        <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 30 Q12 18 18 24 Q24 30 30 16 Q36 8 42 20" stroke="#D4A843" strokeWidth="2" opacity="0.6" />
          <line x1="6" y1="36" x2="42" y2="36" opacity="0.15" />
          <line x1="6" y1="24" x2="42" y2="24" opacity="0.1" />
          <line x1="6" y1="12" x2="42" y2="12" opacity="0.1" />
          <circle cx="18" cy="24" r="2" fill="#D4A843" opacity="0.5" />
          <circle cx="30" cy="16" r="2" fill="#D4A843" opacity="0.5" />
        </svg>
      ),
    },
    {
      number: "04",
      title: "The Rise",
      subtitle: "Climb the leaderboard",
      description: "Your score locks in. The leaderboard shifts. Top mixers earn the Golden Knob \u2014 the mark of someone who actually knows their craft.",
      icon: (
        <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="24" cy="22" r="12" strokeDasharray="4 3" opacity="0.3" />
          <circle cx="24" cy="22" r="8" opacity="0.4" />
          <circle cx="24" cy="22" r="4" fill="#D4A843" opacity="0.6" />
          <line x1="24" y1="18" x2="26" y2="15" stroke="#F0D68A" strokeWidth="2" />
          <rect x="18" y="36" width="12" height="4" rx="1" fill="#D4A843" opacity="0.3" />
          <rect x="21" y="34" width="6" height="2" fill="#D4A843" opacity="0.2" />
        </svg>
      ),
    },
  ];

  const scoringMetrics = [
    { label: "Low End", value: 7.5 },
    { label: "Clarity", value: 8.2 },
    { label: "Balance", value: 6.8 },
    { label: "Mid Range", value: 7.0 },
    { label: "Image", value: 8.5 },
    { label: "High End", value: 7.3 },
    { label: "Overall", value: 7.6 },
  ];

  return (
    <>
      <LoadingScreen />
      <ScrollProgress />

      {/* Custom cursor */}
      <div className="cursor-dot" style={{ left: mousePos.x - 4, top: mousePos.y - 4, opacity: loaded ? 1 : 0 }} />
      <div className={`cursor-ring ${isHovering ? "hovering" : ""}`} style={{ left: mousePos.x - 18, top: mousePos.y - 18, opacity: loaded ? 1 : 0 }} />

      <div className="custom-cursor flex flex-col min-h-screen relative overflow-hidden carbon-fiber">
        <div className="fixed inset-0 warm-light-bg pointer-events-none" />

        {/* Floating dust particles */}
        <div className="fixed inset-0 pointer-events-none">
          {particles.map((p) => (
            <div key={p.id} className="particle" style={{ left: p.left, top: p.top, width: `${p.size}px`, height: `${p.size}px`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, opacity: p.opacity }} />
          ))}
        </div>

        {/* ═══ HERO ═══ */}
        <main ref={heroRef} className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative min-h-screen">
          <div ref={heroParallax.ref} className={`max-w-3xl mx-auto text-center relative z-10 ${loaded ? "hero-entrance" : "opacity-0"}`} style={{ transform: `translateY(${heroParallax.offset}px)` }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(212, 168, 67, 0.06) 0%, transparent 70%)", animation: "glowPulse 6s ease-in-out infinite" }} />

            <div className="flex items-end justify-center gap-[3px] h-20 mb-14 relative">
              {Array.from({ length: 50 }).map((_, i) => {
                const centerDist = Math.abs(i - 24.5) / 25;
                const baseHeight = 15 + (1 - centerDist) * 55;
                const isAlt = i % 3 === 0;
                return (
                  <div key={i} className="w-[3px] rounded-full origin-bottom" style={{ background: `linear-gradient(to top, #D4A843, ${i % 2 === 0 ? "#E89B2E" : "#F0D68A"})`, height: `${baseHeight}%`, animation: `${isAlt ? "waveform-breathe-alt" : "waveform-breathe"} ${2.5 + (i % 7) * 0.4}s ease-in-out ${i * 0.06}s infinite`, opacity: 0.3 + (1 - centerDist) * 0.5, filter: `blur(${centerDist > 0.7 ? 0.5 : 0}px)` }} />
                );
              })}
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl lg:text-8xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-6 gold-shimmer">Mix Techniques</h1>
            <p className="font-[family-name:var(--font-mono)] text-[#D4A843] text-lg md:text-xl tracking-[0.3em] uppercase mb-14 tagline-glow">Show Us Your Mix</p>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm md:text-base max-w-xl mx-auto mb-14 leading-relaxed tracking-wide">A music production show celebrating the art and craft of mixing. Submit your best work and let the world hear what you can do behind the board.</p>
            <Link href="/submit" className="btn-3d inline-block text-[#1A0F0A] font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.2em] px-12 py-5 rounded-lg font-bold">Submit Your Mix</Link>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-hint">
            <span className="font-[family-name:var(--font-mono)] text-[#D4A843]/40 text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#D4A843]/40"><path d="M4 8L10 14L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </main>

        {/* ═══ WAVEFORM DIVIDER ═══ */}
        <div className="relative h-24 overflow-hidden">
          <div ref={waveformParallax.ref} className="absolute inset-0 flex items-center justify-center" style={{ transform: `translateY(${waveformParallax.offset}px)` }}>
            <div className="flex items-center gap-[2px]">
              {Array.from({ length: 80 }).map((_, i) => {
                const cd = Math.abs(i - 39.5) / 40;
                return <div key={i} className="w-[1.5px] rounded-full" style={{ height: `${4 + (1 - cd) * 20}px`, background: `rgba(212, 168, 67, ${0.08 + (1 - cd) * 0.12})` }} />;
              })}
            </div>
          </div>
        </div>

        {/* ═══ HOW IT WORKS ═══ */}
        <section ref={howItWorks.ref} className="relative py-24 md:py-32 px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F0A07] via-[#110B08] to-[#0F0A07]" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20" style={{ opacity: howItWorks.visible ? 1 : 0, transform: howItWorks.visible ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-4">The Format</p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold mb-6">How It Works</h2>
              <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/40 to-transparent mx-auto" />
            </div>

            <div ref={steps.ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
              {showSteps.map((step, i) => (
                <div key={step.number} className="relative group" style={{ opacity: steps.visibleItems[i] ? 1 : 0, transform: steps.visibleItems[i] ? "translateY(0) scale(1)" : "translateY(50px) scale(0.95)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                  <div className="card-float noise rounded-xl p-6 md:p-8 h-full relative overflow-hidden carbon-fiber-walnut">
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #D4A843, transparent)", opacity: steps.visibleItems[i] ? 0.4 : 0, transition: "opacity 1s ease 0.3s" }} />
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-[family-name:var(--font-display)] text-5xl md:text-6xl font-bold" style={{ background: "linear-gradient(180deg, rgba(212, 168, 67, 0.15) 0%, rgba(212, 168, 67, 0.03) 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>{step.number}</span>
                      <div className="text-[#D4A843]/30 group-hover:text-[#D4A843]/60 transition-colors duration-500">{step.icon}</div>
                    </div>
                    <h3 className="font-[family-name:var(--font-display)] text-xl md:text-2xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-2">{step.title}</h3>
                    <p className="font-[family-name:var(--font-mono)] text-[#D4A843] text-xs tracking-[0.2em] uppercase mb-4">{step.subtitle}</p>
                    <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm leading-relaxed">{step.description}</p>
                    <div className="mt-6 flex items-end gap-[1px] h-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                      {Array.from({ length: 30 }).map((_, j) => {
                        const cd = Math.abs(j - 14.5) / 15;
                        return <div key={j} className="w-[1px] rounded-full bg-[#D4A843]" style={{ height: `${3 + (1 - cd) * 14}px` }} />;
                      })}
                    </div>
                  </div>
                  {i < showSteps.length - 1 && <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-[1px] bg-[#D4A843]/10" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ THE SCORE ═══ */}
        <section ref={scoreSection.ref} className="relative py-24 md:py-32 px-6 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(212, 168, 67, 0.03) 0%, transparent 60%)" }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16" style={{ opacity: scoreSection.visible ? 1 : 0, transform: scoreSection.visible ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-4">The Metrics</p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold mb-6">The Score</h2>
              <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm md:text-base max-w-lg mx-auto leading-relaxed">Seven dimensions of a great mix. The host scores each one. Viewers vote. The combined score tells the full story.</p>
            </div>

            <div ref={metrics.ref} className="flex flex-wrap justify-center gap-6 md:gap-8 mb-16">
              {scoringMetrics.map((metric, i) => (
                <VuMeter key={metric.label} label={metric.label} value={metric.value} visible={metrics.visibleItems[i]} delay={i * 80} />
              ))}
            </div>

            <div className="text-center" style={{ opacity: scoreSection.visible ? 1 : 0, transform: scoreSection.visible ? "translateY(0)" : "translateY(20px)", transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s" }}>
              <div className="inline-flex items-center gap-4 md:gap-6 px-8 py-4 rounded-xl carbon-fiber-walnut border border-[#3A2818]/40">
                <div className="text-center">
                  <p className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#D4A843] font-bold">60%</p>
                  <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-[10px] tracking-[0.2em] uppercase">Host</p>
                </div>
                <span className="font-[family-name:var(--font-mono)] text-[#D4A843]/30 text-xl">+</span>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#D4A843] font-bold">40%</p>
                  <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-[10px] tracking-[0.2em] uppercase">Viewers</p>
                </div>
                <span className="font-[family-name:var(--font-mono)] text-[#D4A843]/30 text-xl">=</span>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#F0E6D3] font-bold gold-shimmer">Final</p>
                  <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-[10px] tracking-[0.2em] uppercase">Score</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ JOIN THE SESSION ═══ */}
        <section ref={communitySection.ref} className="relative py-24 md:py-32 px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F0A07] via-[#110B08] to-[#0F0A07]" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center" style={{ opacity: communitySection.visible ? 1 : 0, transform: communitySection.visible ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-4">The Community</p>
              <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold mb-6">Join the Session</h2>
              <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm md:text-base max-w-lg mx-auto leading-relaxed mb-12">This isn&apos;t a spectator sport. Submit your mix, vote live during episodes, and connect with producers and engineers who actually care about the craft.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Forum",
                  description: "Ask questions, share techniques, get feedback on your mixes. Where the working engineers hang out.",
                  cta: "Visit Forum",
                  href: "/forum",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  title: "Classifieds",
                  description: "Looking for mixing work or a mixing engineer? Post a listing, find your match.",
                  cta: "Browse Listings",
                  href: "/classifieds",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: "Submit",
                  description: "Got a mix you're proud of? Upload it. If your name gets pulled, your track goes live on stream in front of the audience.",
                  cta: "Submit Your Mix",
                  href: "/submit",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  title: "Vote Live",
                  description: "Watch episodes live and score mixes in real-time. Your votes count toward the final score. The audience has power here.",
                  cta: "Start Voting",
                  href: "/vote",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  ),
                },
                {
                  title: "Discord",
                  description: "Where the community lives. Submit tracks, get feedback, talk shop with producers who know their stuff.",
                  cta: "Join Server",
                  href: "https://discord.gg/52wavtq9ep",
                  icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                  ),
                },
              ].map((card, i) => (
                <div
                  key={card.title}
                  className="card-float noise rounded-xl p-6 md:p-8 text-center carbon-fiber-walnut relative overflow-hidden"
                  style={{
                    opacity: communitySection.visible ? 1 : 0,
                    transform: communitySection.visible ? "translateY(0)" : "translateY(30px)",
                    transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + i * 0.15}s`,
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, #D4A843, transparent)", opacity: 0.2 }} />
                  <div className="text-[#D4A843]/40 mb-4 flex justify-center">{card.icon}</div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold mb-3">{card.title}</h3>
                  <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/35 text-sm leading-relaxed mb-6">{card.description}</p>
                  <Link href={card.href} className="inline-block font-[family-name:var(--font-mono)] text-xs text-[#D4A843] tracking-[0.15em] uppercase hover:text-[#E89B2E] transition-colors link-shimmer">
                    {card.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ EPISODES TEASER ═══ */}
        <section ref={episodesSection.ref} className="relative py-24 md:py-32 px-6">
          <div className="max-w-4xl mx-auto relative z-10">
            <div
              className="card-float noise rounded-2xl p-8 md:p-12 carbon-fiber-walnut text-center relative overflow-hidden"
              style={{
                opacity: episodesSection.visible ? 1 : 0,
                transform: episodesSection.visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.98)",
                transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #D4A843, transparent)", opacity: 0.3 }} />

              <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-4">Coming Soon</p>
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl lg:text-5xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold mb-4">Season 1</h2>
              <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm max-w-md mx-auto leading-relaxed mb-8">The first episode is being assembled. Submissions are open. The patch bay is filling up. When it's time, names will be pulled.</p>

              {/* Animated waveform */}
              <div className="flex items-end justify-center gap-[2px] h-10 mb-8">
                {Array.from({ length: 40 }).map((_, i) => {
                  const cd = Math.abs(i - 19.5) / 20;
                  return (
                    <div
                      key={i}
                      className="w-[2px] rounded-full origin-bottom"
                      style={{
                        height: `${10 + (1 - cd) * 30}px`,
                        background: `linear-gradient(to top, #D4A843, #E89B2E)`,
                        opacity: 0.15 + (1 - cd) * 0.2,
                        animation: `waveform-breathe ${2 + (i % 5) * 0.3}s ease-in-out ${i * 0.05}s infinite`,
                      }}
                    />
                  );
                })}
              </div>

              <Link
                href="/submit"
                className="btn-3d inline-block text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] px-8 py-4 rounded-lg font-bold"
              >
                Get In The Pool
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-[#3A2818]/50 py-10 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 font-[family-name:var(--font-display)] text-[#F0E6D3] text-lg tracking-[0.2em] uppercase font-bold link-shimmer">
                <img src="/logo-gold.png" alt="" className="w-7 h-7 object-contain" />
                MIX <span style={{ color: "#D4A843" }}>TECHNIQUES</span>
              </Link>

              {/* Links */}
              <div className="flex items-center gap-8">
                <Link href="/submit" className="nav-link font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 hover:text-[#D4A843] transition-colors tracking-wider uppercase">Submit</Link>
                <Link href="/vote" className="nav-link font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 hover:text-[#D4A843] transition-colors tracking-wider uppercase">Vote</Link>
                <Link href="/forum" className="nav-link font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 hover:text-[#D4A843] transition-colors tracking-wider uppercase">Forum</Link>
                <Link href="/classifieds" className="nav-link font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 hover:text-[#D4A843] transition-colors tracking-wider uppercase">Classifieds</Link>
                <Link href="/pricing" className="nav-link font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 hover:text-[#D4A843] transition-colors tracking-wider uppercase">Pricing</Link>
                <a href="https://discord.gg/52wavtq9ep" target="_blank" rel="noopener noreferrer" className="nav-link font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 hover:text-[#D4A843] transition-colors tracking-wider uppercase">Discord</a>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[#3A2818]/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/15 text-xs tracking-wider">© {new Date().getFullYear()} Mix Techniques. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <Link href="/legal/terms" className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/15 text-[10px] tracking-wider hover:text-[#D4A843]/50 transition-colors uppercase">Terms</Link>
                <Link href="/legal/privacy" className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/15 text-[10px] tracking-wider hover:text-[#D4A843]/50 transition-colors uppercase">Privacy</Link>
                <Link href="/legal/release" className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/15 text-[10px] tracking-wider hover:text-[#D4A843]/50 transition-colors uppercase">Release Forms</Link>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[2px] h-[8px] rounded-full bg-[#D4A843]/20" style={{ animation: `waveform-breathe ${2 + i * 0.3}s ease-in-out ${i * 0.1}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}