"use client";

import { useState, useEffect } from "react";
import { PortfolioTestimonial } from "@/lib/types";

interface TestimonialSectionProps {
  testimonials: PortfolioTestimonial[];
}

export default function TestimonialSection({ testimonials }: TestimonialSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];

  return (
    <div className="relative">
      <div className="text-center">
        {/* Quote marks */}
        <div className="text-[#D4A843]/20 text-5xl font-[family-name:var(--font-display)] leading-none mb-4">
          &ldquo;
        </div>

        {/* Quote text */}
        <blockquote className="font-[family-name:var(--font-display)] text-lg md:text-xl text-[#F0E6D3]/80 italic leading-relaxed max-w-2xl mx-auto mb-6 transition-opacity duration-500">
          {current.quote}
        </blockquote>

        {/* Attribution */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-[family-name:var(--font-mono)] text-sm text-[#D4A843] font-medium">
            {current.name}
          </span>
          {current.project && (
            <span className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30">
              {current.project}
            </span>
          )}
        </div>

        {/* Dots */}
        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "bg-[#D4A843] w-6"
                    : "bg-[#3A2818] hover:bg-[#3A2818]/80"
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
