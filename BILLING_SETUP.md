# Billing Setup — Mix Techniques

## Business Model (decided 2026-07-02)

**One subscription tier: Pro at $15/month.**

- **Free:** Profile at `/[username]`, submit mixes, vote, forum, classifieds
- **Pro ($15/mo):** Portfolio at `/[username]/portfolio` with up to **5 tracks**, custom audio player, 4 themes, testimonials, gear list, contact form, verified badge, no ads

**Track limit of 5 is the protection against runaway storage costs.** It's also the product positioning — clients want to hear your best 3-5 mixes, not your full catalog. Don't change `MAX_TRACKS_PER_USER` in `src/lib/billing.ts` without talking to me first; the DB trigger in migration 012 hardcodes the same number and they need to stay in sync.

**No micro-transactions are active today.** The schema foundation is in `src/lib/microtransactions.ts` and the env vars are reserved in `.env.local` (`STRIPE_PRICE_ID_FEATURED`, `STRIPE_PRICE_ID_BUMP`, `STRIPE_PRICE_ID_VERIFIED`). When we want to flip them on, the work is: create the Stripe products, build a `staff-panel` UI to grant them, and write a one-time-payment webhook. Not built yet.

---

## What Was Built (This Session)

| Path | Purpose |
|------|---------|
| `src/lib/billing.ts` | Tier config (1 paid tier), Stripe client, status → tier mapping, limit constants |
| `src/lib/microtransactions.ts` | Future-ready foundation for featured/bump/verified products |
| `src/lib/subscription.ts` | `getUserTier()` helper — single source of truth, used by all API routes |
| `src/app/api/billing/checkout/route.ts` | Create Stripe Checkout session (Pro only) |
| `src/app/api/billing/webhook/route.ts` | Receive Stripe events (idempotent, signature-verified) |
| `src/app/api/billing/portal/route.ts` | Create Stripe Customer Portal session |
| `src/app/api/staff/memberships/set-tier/route.ts` | Manual tier override (staff only) |
| `src/app/api/portfolio/tracks/route.ts` | Track limit (5) enforced server-side; cleaner error messages |
| `src/app/api/portfolio/analytics/route.ts` | Now Pro-gated (was Studio-gated) — analytics included in $15 |
| `src/app/pricing/page.tsx` + `PricingClient.tsx` | 2-card pricing page (Free + Pro) |
| `src/app/dashboard/membership/page.tsx` + `MembershipClient.tsx` | User subscription dashboard |
| `src/app/staff/memberships/page.tsx` + `MembershipsClient.tsx` | Staff manual tier UI |
| `src/app/dashboard/portfolio/page.tsx` | Shows `tracks/5` count + upgrade CTA |
| `supabase/migrations/011_billing_schema.sql` | `get_user_tier()` RPC, partial unique indexes, idempotency |
| `supabase/migrations/012_portfolio_track_limit.sql` | Track-count trigger as DB safety net |
| `src/components/Navbar.tsx` | Added Pricing link |
| `src/app/page.tsx` | Added Forum/Classifieds to homepage cards + footer |

---

## What You (Don) Need To Do

### 1. Run the new migrations in Supabase

1. Open https://supabase.com/dashboard/project/wsaasqrcojnenwevfabo/sql/new
2. Paste and run **`supabase/migrations/011_billing_schema.sql`**
3. Open a new query
4. Paste and run **`supabase/migrations/012_portfolio_track_limit.sql`**

Both are idempotent (safe to re-run). Migration 011 adds `get_user_tier()` + fixes unique constraints. Migration 012 adds the trigger that blocks over-5-track uploads at the DB level.

### 2. Set up Stripe (when ready — the site works without it)

**Create a Stripe account** at https://dashboard.stripe.com/register (if you don't have one).

**Get your API keys:**
1. https://dashboard.stripe.com/apikeys
2. Copy the **Secret key** (starts with `sk_test_` for testing, `sk_live_` for prod)

**Create the product + price:**
1. https://dashboard.stripe.com/products → "Add product"
2. **Name:** Mix Techniques Pro
3. **Price:** Recurring → $15.00 USD → Monthly
4. Copy the **Price ID** (starts with `price_`)

**Set up the webhook:**
1. https://dashboard.stripe.com/webhooks → "Add endpoint"
2. **Endpoint URL:** `https://mixtechniques.com/api/billing/webhook`
3. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (starts with `whsec_`)

**Add to Vercel env vars:**
1. https://vercel.com/dashboard → your project → Settings → Environment Variables
2. Add (production + preview):

```
STRIPE_SECRET_KEY=sk_test_...   (or sk_live_... for prod)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STAFF_EMAILS=don@theconflux.com,your-other-staff@email.com
```

3. **Redeploy** (Settings → Deployments → click "..." → Redeploy)

**Test it:**
1. Visit https://mixtechniques.com/pricing
2. Click "Go Pro — $15/month"
3. Use test card `4242 4242 4242 4242` with any future date + any CVC + any ZIP
4. You should land on https://mixtechniques.com/dashboard/membership?checkout=success
5. Visit https://mixtechniques.com/[your-username]/portfolio — should now be live

### 3. Manual tier flip (no Stripe needed — for testing right now)

Until you set up Stripe, you can flip your own tier to test the portfolio:

1. Make sure `STAFF_EMAILS` includes your email (default is `don@theconflux.com`)
2. Visit https://mixtechniques.com/staff/memberships
3. Search for your user
4. Click `pro`
5. Visit `/[your-username]/portfolio` — should now be live

### 4. Confirm Vercel has the existing env vars

If you haven't redeployed since adding new env vars, your live site won't see them.
The current prod `.env.local` (local only) has Supabase keys + WebSocket URL.
You need those same Supabase keys + WS URL on Vercel for the site to function.

---

## What's NOT Built Yet (Future Work)

- **Stripe Tax** — enable per-product when you're ready to handle sales tax
- **Promo codes** — checkout session has `allow_promotion_codes: true` enabled but no codes created
- **Receipts / invoice history UI** — Stripe emails them; could add in-app view later
- **Annual pricing** — current is monthly only; a 12-month price would need a second `STRIPE_PRICE_ID_*` env var and a UI toggle
- **Micro-transactions** — schema is ready, Stripe products not created, no admin UI to grant them. See `src/lib/microtransactions.ts`
- **Tier downgrade flow** — when user cancels, they're immediately flipped to free. We could add a "Pro until end of period" grace that respects `cancel_at_period_end`. Easy add if you want it.

---

## Critical Architecture Notes

**Webhook idempotency:** The webhook handler uses `UPSERT ... ON CONFLICT (stripe_subscription_id)`. If Stripe retries (network blip, server 5xx), re-delivering the same event produces the same final state, not duplicate rows. **Requires migration 011 to have run.**

**Service role in webhook:** The webhook uses the service-role Supabase client because Stripe webhooks are unauthenticated. RLS would block the write. This is gated by webhook signature verification — unsigned requests get 400 before reaching the database.

**Tier lookup single source of truth:** All tier checks go through `get_user_tier()` RPC. Never query `subscriptions` directly with `.single()`. The partial unique constraint allows multiple rows over a user's lifetime (cancelled + new), and `.single()` would 406 on the second row. **Requires migration 011 to have run.**

**Past-due behavior:** A user with a single failed payment stays at their tier (Stripe retries for ~3 weeks). They get `'past_due'` status, shown as "Payment Failed — Update Card" in the membership dashboard. Only when Stripe sends `customer.subscription.deleted` do we mark them `free`.

**Track limit:** The DB trigger (migration 012) uses a hardcoded `v_max INTEGER := 5` which must match `MAX_TRACKS_PER_USER` in `src/lib/billing.ts`. If you change one, change both. The trigger fires BEFORE INSERT, so it catches direct DB inserts too, not just API traffic.

**Staff flip writes a row without Stripe IDs.** When staff manually grants Pro, the subscriptions row has `stripe_customer_id = NULL` and `stripe_subscription_id = NULL`. Webhook won't update it (no Stripe IDs to match on). If the same user later subscribes via Stripe, a new row will be created via webhook upsert — which would create TWO rows, but the partial unique index prevents that. The staff-flipped row gets "abandoned" and the Stripe one wins. That's fine.

**Free user portfolios:** Currently a free user gets `404` on `/[username]/portfolio`. If you want free users to have basic portfolios (avatar + bio + contact form), tell me — it's a 30-line change. Right now portfolios are gated behind Pro because that's how the schema was built.