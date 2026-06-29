"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "mt-backstage-confirmed";

export default function BackstageRequirementsModal() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [hasDiscord, setHasDiscord] = useState(false);
  const [hasGear, setHasGear] = useState(false);
  const [understands, setUnderstands] = useState(false);

  useEffect(() => {
    // Check if already confirmed this browser
    const confirmed = localStorage.getItem(STORAGE_KEY);
    if (!confirmed) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const canDismiss = hasDiscord && hasGear && understands;

  const handleDismiss = () => {
    if (!canDismiss) return;
    localStorage.setItem(STORAGE_KEY, "true");
    setFadeOut(true);
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8"
      style={{
        background: "rgba(10, 7, 5, 0.85)",
        backdropFilter: "blur(8px)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.4s ease-out",
      }}
    >
      <div
        className="card-float noise carbon-fiber-walnut rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
        style={{
          transform: fadeOut ? "scale(0.96) translateY(10px)" : "scale(1) translateY(0)",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #D4A843, transparent)", opacity: 0.4 }} />

        <div className="p-6 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎤</div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold mb-3">
              Before You Submit
            </h2>
            <p className="font-[family-name:var(--font-mono)] text-[#D4A843] text-xs tracking-[0.25em] uppercase">
              Read this carefully
            </p>
          </div>

          {/* Alert box */}
          <div className="rounded-xl p-5 md:p-6 mb-6" style={{ background: "rgba(196, 57, 42, 0.08)", border: "1px solid rgba(196, 57, 42, 0.2)" }}>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/80 text-sm leading-relaxed">
              <strong className="text-[#C4392A]">This is a live show with a real interview segment.</strong>{" "}
              If your name gets pulled, you <strong className="text-[#F0E6D3]">must</strong> be available
              to join us on camera in Discord for the interview. If we play your entire track and there&apos;s
              no artist to talk to, it kills the show. Don&apos;t submit unless you can commit to this.
            </p>
          </div>

          {/* Process steps */}
          <div className="space-y-4 mb-8">
            <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.08em] font-bold">
              How It Works If You&apos;re Pulled
            </h3>

            {[
              {
                step: "1",
                title: "Your name gets announced",
                detail: "We'll post it in Discord (#live-episode-chat) and it will appear on mixtechniques.com if you're logged in.",
                color: "#D4A843",
              },
              {
                step: "2",
                title: "You get access to the Green Room",
                detail: "You'll be granted permission to join the Green Room voice channel. Our staff and show runners will be there to greet you, test your mic and camera, and walk you through the process.",
                color: "#D4A843",
              },
              {
                step: "3",
                title: "Mic & camera check",
                detail: "Once you're confirmed ready — mic on, camera on, good to go — the producer will signal the host that we have a live contestant backstage.",
                color: "#D4A843",
              },
              {
                step: "4",
                title: "Your track plays live",
                detail: "The host will shake the drum and reveal your name on stream. Your mix plays to the live audience. The host and judges critique it in real-time.",
                color: "#E89B2E",
              },
              {
                step: "5",
                title: "You join the interview",
                detail: "After your song ends, the producer will send you an invite code to the On Air channel. You'll join the host and judges on camera for the interview and verdict.",
                color: "#E89B2E",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `linear-gradient(135deg, ${item.color}22, ${item.color}08)`, border: `1px solid ${item.color}33` }}
                >
                  <span className="font-[family-name:var(--font-display)] text-xs font-bold" style={{ color: item.color }}>
                    {item.step}
                  </span>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-sm text-[#F0E6D3] font-bold tracking-wide">
                    {item.title}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs leading-relaxed mt-1">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Requirements */}
          <div className="rounded-xl p-5 md:p-6 mb-8 carbon-fiber border border-[#3A2818]/40">
            <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-4">
              What You Need
            </h3>
            <div className="space-y-3">
              {[
                { icon: "💬", text: "Access to our Discord server and the #live-episode-chat channel" },
                { icon: "🎙️", text: "A working microphone" },
                { icon: "📹", text: "A working camera (webcam or phone)" },
                { icon: "⏰", text: "Availability during live episodes to join if pulled" },
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{req.icon}</span>
                  <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/60 text-sm">{req.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discord link */}
          <div className="text-center mb-8">
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-xs mb-3 uppercase tracking-wider">
              Not in the server yet?
            </p>
            <a
              href="https://discord.gg/52wavtq9ep"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-[family-name:var(--font-mono)] text-sm text-[#D4A843] tracking-wider uppercase hover:text-[#E89B2E] transition-colors"
              style={{ background: "rgba(212, 168, 67, 0.08)", border: "1px solid rgba(212, 168, 67, 0.15)" }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Join the Discord
            </a>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 mb-8">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={hasDiscord}
                  onChange={(e) => setHasDiscord(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded border border-[#3A2818] bg-[#0F0A07] peer-checked:bg-[#D4A843] peer-checked:border-[#D4A843] transition-all duration-200 flex items-center justify-center">
                  {hasDiscord && (
                    <svg className="w-3 h-3 text-[#1A0F0A]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-xs leading-relaxed">
                I have access to the Mix Techniques Discord server and can see the <strong className="text-[#F0E6D3]/70">#live-episode-chat</strong> channel.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={hasGear}
                  onChange={(e) => setHasGear(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded border border-[#3A2818] bg-[#0F0A07] peer-checked:bg-[#D4A843] peer-checked:border-[#D4A843] transition-all duration-200 flex items-center justify-center">
                  {hasGear && (
                    <svg className="w-3 h-3 text-[#1A0F0A]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-xs leading-relaxed">
                I have a working <strong className="text-[#F0E6D3]/70">microphone</strong> and <strong className="text-[#F0E6D3]/70">camera</strong>, and I&apos;m prepared to join a live video call if my name is pulled.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={understands}
                  onChange={(e) => setUnderstands(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded border border-[#3A2818] bg-[#0F0A07] peer-checked:bg-[#D4A843] peer-checked:border-[#D4A843] transition-all duration-200 flex items-center justify-center">
                  {understands && (
                    <svg className="w-3 h-3 text-[#1A0F0A]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-xs leading-relaxed">
                I understand that if my name is pulled, I <strong className="text-[#C4392A]">must</strong> be available to join the Green Room and go on camera for the interview. Submitting without being available will hurt the show.
              </span>
            </label>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleDismiss}
            disabled={!canDismiss}
            className="btn-3d w-full text-[#1A0F0A] font-[family-name:var(--font-display)] text-base uppercase tracking-[0.15em] py-4 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
          >
            I Understand &amp; Agree
          </button>

          {!canDismiss && (
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/20 text-[10px] text-center mt-3 tracking-wider">
              Check all three boxes to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
