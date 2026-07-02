"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { SubscriptionTier } from "@/lib/types";

interface TierGateProps {
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  studio: 2,
};

export default function TierGate({ requiredTier, children, fallback = null }: TierGateProps) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()
      .then(({ data }) => {
        setTier((data?.tier as SubscriptionTier) || "free");
        setLoading(false);
      });
  }, [user]);

  if (loading) return null;

  if (TIER_LEVELS[tier] >= TIER_LEVELS[requiredTier]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
