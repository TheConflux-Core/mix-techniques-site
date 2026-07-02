// Mix Techniques — Micro-transactions foundation
//
// Prepared-for-later feature surface. NOT active today — Stripe env vars
// aren't wired, the staff admin UI doesn't exist, and the classifieds
// `is_featured` / `is_bumped` columns have no admin endpoint.
//
// This file is the foundation. When we want to turn it on, we:
//   1. Add Stripe Products + Prices for each ProductKind
//   2. Wire a /api/billing/checkout-once route (one-time payments, not subscriptions)
//   3. Build a staff panel UI for the products to be granted
//   4. Add `paid_at` and `expires_at` columns if missing
//
// Schema note: the `is_featured` and `is_bumped` columns on classifieds
// already exist (migration 008). What we need to add when activating:
//   - paid_at TIMESTAMPTZ  -- when the boost was purchased
//   - expires_at TIMESTAMPTZ  -- when the boost wears off (NOW() + duration)
//   - stripe_payment_intent_id  -- audit trail back to Stripe
// Both columns fit cleanly into the existing schema without breaking changes.

export type ProductKind = "featured_listing" | "bump_listing" | "verified_badge";

export interface ProductConfig {
  kind: ProductKind;
  name: string;
  description: string;
  priceCents: number;
  currency: "usd";
  durationDays: number | null; // null = permanent
  // Stripe price ID for one-time payments (different from subscription prices).
  stripePriceId: string | null;
}

export const PRODUCTS: Record<ProductKind, ProductConfig> = {
  featured_listing: {
    kind: "featured_listing",
    name: "Featured Listing",
    description: "Pin your classified to the top of the page for 7 days.",
    priceCents: 500,
    currency: "usd",
    durationDays: 7,
    stripePriceId: process.env.STRIPE_PRICE_ID_FEATURED || null,
  },
  bump_listing: {
    kind: "bump_listing",
    name: "Bump Listing",
    description: "Move your classified back to the top of the new listings.",
    priceCents: 200,
    currency: "usd",
    durationDays: 1,
    stripePriceId: process.env.STRIPE_PRICE_ID_BUMP || null,
  },
  verified_badge: {
    kind: "verified_badge",
    name: "Verified Badge",
    description: "Show a verified badge on your forum posts and classifieds. One-time, permanent.",
    priceCents: 1000,
    currency: "usd",
    durationDays: null,
    stripePriceId: process.env.STRIPE_PRICE_ID_VERIFIED || null,
  },
};

export function getProduct(kind: ProductKind): ProductConfig {
  return PRODUCTS[kind];
}

/**
 * When a payment for a ProductKind succeeds, returns the SQL-friendly values
 * to write into the target table. The caller (one-time payment webhook) merges
 * these into the right table based on kind:
 *
 *   featured_listing / bump_listing -> classifieds SET paid_at, expires_at, ...
 *   verified_badge -> profiles SET verified_at, verified_payment_id, ...
 */
export function productEffect(kind: ProductKind, now = new Date()) {
  const product = PRODUCTS[kind];
  const expiresAt =
    product.durationDays === null
      ? null
      : new Date(now.getTime() + product.durationDays * 24 * 60 * 60 * 1000);

  return {
    paidAt: now.toISOString(),
    expiresAt: expiresAt?.toISOString() ?? null,
  };
}