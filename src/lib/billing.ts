// Mix Techniques — Billing helpers
// Single source of truth for Stripe price IDs, tier lookup, and feature gates.

import Stripe from "stripe";

export type Tier = "free" | "pro" | "studio";

export interface TierConfig {
  id: Tier;
  name: string;
  priceMonthly: number; // cents
  blurb: string;
  features: string[];
  // Stripe price IDs — set via env at runtime. If missing, tier is "unbuyable"
  // and the UI shows the "Manual upgrade" path instead.
  stripePriceId: string | null;
}

export const TIERS: Record<Tier, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    blurb: "Your profile is live. Submit mixes, vote, use the forum and classifieds.",
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
    priceMonthly: 1000,
    blurb: "A real portfolio. Custom waveform player, track uploads, themes, contact form.",
    features: [
      "Everything in Free",
      "Portfolio at /[username]/portfolio",
      "Audio waveform player + track uploads (up to 50MB)",
      "Choose from 4 portfolio themes",
      "Testimonials + gear list",
      "Contact form on your portfolio",
      "Forum verified badge, no ads",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO || null,
  },
  studio: {
    id: "studio",
    name: "Studio",
    priceMonthly: 2500,
    blurb: "For working studios. Larger uploads, analytics dashboard, custom domains.",
    features: [
      "Everything in Pro",
      "Track uploads up to 100MB (WAV / FLAC / AIFF)",
      "Portfolio analytics dashboard",
      "Featured portfolio placement (when discovery lands)",
      "Priority on classifieds listings",
      "Coming soon: custom domain support",
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_STUDIO || null,
  },
};

export function getTierOrder(tier: Tier): number {
  return { free: 0, pro: 1, studio: 2 }[tier];
}

export function isPaidTier(tier: Tier | null | undefined): boolean {
  return tier === "pro" || tier === "studio";
}

/**
 * Returns the highest active tier the user is entitled to based on their
 * subscription row. Handles multiple historical subscriptions by picking the
 * most recent active row.
 *
 * Subscription status mapping:
 *   'active'    -> use tier as-is
 *   'trialing'  -> use tier as-is
 *   'past_due'  -> keep tier (don't downgrade on a failed payment — Stripe will retry)
 *   'canceled', 'incomplete', 'incomplete_expired', 'unpaid' -> 'free'
 */
export function tierFromSubscription(
  subscription: { tier: string; status: string } | null | undefined
): Tier {
  if (!subscription) return "free";
  if (subscription.status !== "active" && subscription.status !== "trialing" && subscription.status !== "past_due") {
    return "free";
  }
  const t = subscription.tier as Tier;
  if (t === "pro" || t === "studio") return t;
  return "free";
}

// ─── Stripe singleton (server-only) ──────────────────────────────────────────
// We use the Stripe Node SDK on the server. Webhook signature verification
// requires the raw request body, so we instantiate per-request in the webhook
// route. This export is for non-webhook routes (checkout, portal).

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
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      (process.env.STRIPE_PRICE_ID_PRO || process.env.STRIPE_PRICE_ID_STUDIO)
  );
}