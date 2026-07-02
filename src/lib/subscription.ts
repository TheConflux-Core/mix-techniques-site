// Mix Techniques — Subscription lookup helper
//
// All API routes that need to check a user's tier should call this.
// The lookup goes through the get_user_tier() Postgres function (see
// supabase/migrations/011_billing_schema.sql) which encodes the
// status → tier mapping in one place.
//
// Single-call, .maybeSingle()-style, no race on multiple subscription rows.

import type { SupabaseClient } from "@supabase/supabase-js";

export type Tier = "free" | "pro" | "studio";

export async function getUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<Tier> {
  const { data, error } = await supabase.rpc("get_user_tier", {
    p_user_id: userId,
  });

  if (error) {
    console.error("get_user_tier RPC error:", error.message);
    return "free";
  }

  const t = data as Tier | null;
  if (t === "pro" || t === "studio") return t;
  return "free";
}

export async function isPaidUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const tier = await getUserTier(supabase, userId);
  return tier === "pro" || tier === "studio";
}