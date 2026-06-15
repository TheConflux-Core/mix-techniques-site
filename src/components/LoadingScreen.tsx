"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1800);
    const removeTimer = setTimeout(() => setVisible(false), 2600);
    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`loading-screen ${fadeOut ? "fade-out" : ""}`}>
      {/* Animated "M" waveform logo */}
      <svg
        width="80"
        height="60"
        viewBox="0 0 80 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6"
      >
        <path
          className="loading-m-path"
          d="M5 55 L5 10 L20 35 L35 10 L40 10 L40 55"
          stroke="#D4A843"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          className="loading-m-path"
          d="M45 55 L45 10 L60 35 L75 10"
          stroke="#D4A843"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ animationDelay: "0.2s" }}
        />
      </svg>

      {/* Title */}
      <h1 className="loading-title font-[family-name:var(--font-display)] text-[#F0E6D3] text-xl md:text-2xl uppercase tracking-[0.2em] font-bold">
        Mix Techniques
      </h1>

      {/* Waveform bars below title */}
      <div className="flex items-end justify-center gap-[2px] h-6 mt-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="w-[2px] rounded-full bg-[#D4A843]"
            style={{
              height: `${20 + Math.abs(Math.sin(i * 0.6)) * 80}%`,
              opacity: 0,
              animation: `fadeIn 0.3s ease-out ${1.0 + i * 0.04}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Decorative line */}
      <div className="loading-line mt-4" />
    </div>
  );
}
