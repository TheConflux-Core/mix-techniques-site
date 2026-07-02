// Mix Techniques — Billing helpers
// Single source of truth for Stripe prices, tier lookup, and feature gates.
//
// Business model (decided 2026-07-02):
//   - One subscription tier: $15/month, called "Pro"
//   - Free tier: profile at /[username], submit mixes, vote, forum, classifieds
//   - Pro: portfolio at /[username]/portfolio with up to MAX_TRACKS_PER_USER tracks
//   - Track limit protects us from "unlimited storage" cost blowups. 3-5 mixes
//     is enough to showcase someone's best engineering work — that's the
//     product positioning.
//   - Micro-transactions (featured listings, bumps) prepared for later, see
//     src/lib/microtransactions.ts for the future-ready foundation.

import Stripe from "stripe";

export type Tier = "free" | "pro";

// ─── Limits & Pricing Constants ─────────────────────────────────────────────
// Change here, not in API routes or DB.

export const PRICING = {
  proMonthly: 1500, // cents — $15.00
  currency: "usd",
} as const;

// How many tracks a Pro user can have on their portfolio. Keeps storage costs
// predictable and forces users to upload only their best work (which is the
// product positioning — "your showcase of best engineering").
export const MAX_TRACKS_PER_USER = 5;

// Max file size per track (Pro). 50MB covers ~5 min of WAV at 44.1kHz/16-bit.
export const MAX_TRACK_BYTES = 50 * 1024 * 1024;

// Allowed audio formats — keep this small to prevent weird MIME gymnastics.
export const ALLOWED_AUDIO_EXTS = ["wav", "flac", "mp3", "aiff"] as const;
export const ALLOWED_AUDIO_MIME = [
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/mpeg",
  "audio/mp3",
  "audio/aiff",
  "audio/x-aiff",
] as const;

export interface TierConfig {
  id: Tier;
  name: string;
  priceMonthly: number; // cents
  blurb: string;
  features: string[];
  // Stripe price ID — read from env at runtime. If missing, the checkout
  // route returns 503 and the UI shows the manual upgrade path.
  stripePriceId: string | null;
}

export const TIERS: Record<Tier, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    blurb:
      "Your profile is live. Submit mixes, vote, talk shop in the forum, post classifieds.",
    features: [
      "Public profile at /[username]",
      "Submit mixes to episodes",
      "Vote live during episodes",
      "Forum access (read + post)",
      "Classifieds (browse + post)",
    ],
    stripePriceId: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: PRICING.proMonthly,
    blurb:
      "A real portfolio you can hand to clients. Up to 5 tracks, audio player, custom layout.",
    features: [
      "Everything in Free",
      `Portfolio at /[username]/portfolio`,
      `Up to ${MAX_TRACKS_PER_USER} audio tracks (WAV / FLAC / MP3 / AIFF)`,
      "Custom waveform audio player",
      "Choose from 4 portfolio themes",
      "Testimonials + gear/plugin list",
      "Contact form on your portfolio",
      "Verified badge on forum + classifieds",
      "No ads on forum",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO || null,
  },
};

export function isPaidTier(tier: Tier | null | undefined): boolean {
  return tier === "pro";
}

/**
 * Returns the user's tier from a subscription row. Encodes the
 * Stripe status → our tier mapping.
 *
 *   'active'    -> use tier as-is
 *   'trialing'  -> use tier as-is
 *   'past_due'  -> keep tier (don't downgrade on a single failed payment — Stripe retries)
 *   'canceled', 'incomplete', 'incomplete_expired', 'unpaid' -> 'free'
 *
 * Note: there is exactly one paid tier now (pro), so tier can only be 'free'
 * or 'pro'. The code accepts both for forward compat — if we ever add a
 * second paid tier, the helper doesn't need to change.
 */
export function tierFromSubscription(
  subscription: { tier: string; status: string } | null | undefined
): Tier {
  if (!subscription) return "free";
  if (
    subscription.status !== "active" &&
    subscription.status !== "trialing" &&
    subscription.status !== "past_due"
  ) {
    return "free";
  }
  return subscription.tier === "pro" ? "pro" : "free";
}

// ─── Stripe singleton (server-only) ──────────────────────────────────────────
// Used by all non-webhook routes (checkout, portal). The webhook route
// instantiates its own client so signature verification works on the raw body.

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  stripeClient = new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
    typescript: true,
  });
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PRO);
}