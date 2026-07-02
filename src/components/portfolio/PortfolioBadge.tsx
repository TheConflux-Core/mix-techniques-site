"use client";

import { SubscriptionTier } from "@/lib/types";

interface PortfolioBadgeProps {
  tier: SubscriptionTier;
  size?: "sm" | "md" | "lg";
}

const BADGE_CONFIG: Record<SubscriptionTier, { label: string; icon: string; colors: string }> = {
  free: { label: "", icon: "", colors: "" },
  pro: {
    label: "PRO",
    icon: "🎧",
    colors: "bg-gradient-to-r from-[#D4A843] to-[#E89B2E] text-[#1A0F0A]",
  },
};

export default function PortfolioBadge({ tier, size = "sm" }: PortfolioBadgeProps) {
  const config = BADGE_CONFIG[tier];
  if (!config.label) return null;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-[family-name:var(--font-mono)] font-bold uppercase tracking-widest rounded-full ${config.colors} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}