# Billing Setup — Mix Techniques

## What Was Built (This Session)

Stripe billing integration for Pro ($10/mo) and Studio ($25/mo) tiers.
Plus a manual tier-flip path for testing without Stripe.

### Files Added

| Path | Purpose |
|------|---------|
| `src/lib/billing.ts` | Tier config, Stripe client singleton, status → tier mapping |
| `src/lib/subscription.ts` | `getUserTier()` helper — single source of truth, used by all API routes |
| `src/app/api/billing/checkout/route.ts` | Create Stripe Checkout session |
| `src/app/api/billing/webhook/route.ts` | Receive Stripe events (idempotent, signature-verified) |
| `src/app/api/billing/portal/route.ts` | Create Stripe Customer Portal session |
| `src/app/api/staff/memberships/set-tier/route.ts` | Manual tier override (staff only) |
| `src/app/pricing/page.tsx` + `PricingClient.tsx` | Public pricing page |
| `src/app/dashboard/membership/page.tsx` + `MembershipClient.tsx` | User subscription dashboard |
| `src/app/staff/memberships/page.tsx` + `MembershipsClient.tsx` | Staff manual tier UI |
| `supabase/migrations/011_billing_schema.sql` | Schema fixes: get_user_tier() RPC, partial unique indexes |
| `src/components/Navbar.tsx` | Added Pricing link |
| `src/app/page.tsx` | Added Forum/Classifieds to homepage cards + footer |
| `src/app/api/portfolio/{tracks,settings,analytics,[username]}/route.ts` | Use RPC instead of broken `.single()` lookup |
| `src/components/portfolio/TierGate.tsx` | Use RPC instead of broken lookup |
| `src/app/{dashboard/portfolio,[username]/portfolio/edit}/page.tsx` | Use RPC instead of broken lookup |

### Bugs Fixed While Building This

| Bug | Was | Now |
|-----|-----|-----|
| Tier lookup `.single()` race | 406 when user has multiple subscription rows | `maybeSingle()` + order by `updated_at` |
| `status='active'` filter | Excluded `trialing` and `past_due` users (they appeared as Free) | `get_user_tier()` RPC includes all valid active states |
| `UNIQUE(user_id)` constraint | Blocked re-subscription after cancellation | Partial unique — only enforces one active row |
| Missing unique on `stripe_subscription_id` | Webhook idempotency impossible | Unique index added |
| Forum + Classifieds invisible from homepage | Built, never surfaced | Added to "Join the Session" cards + footer |

---

## What You (Don) Need To Do

### 1. Run the new migration in Supabase

1. Open https://supabase.com/dashboard/project/wsaasqrcojnenwevfabo/sql/new
2. Paste the contents of `supabase/migrations/011_billing_schema.sql`
3. Click Run

This adds the `get_user_tier()` function and fixes the unique constraints.

### 2. Set up Stripe (when ready — the site works without it)

**Create a Stripe account** at https://dashboard.stripe.com/register (if you don't have one).

**Get your API keys:**
1. https://dashboard.stripe.com/apikeys
2. Copy the **Secret key** (starts with `sk_test_` for testing, `sk_live_` for prod)
3. Copy the **Publishable key** (not currently used server-side but Stripe will ask)

**Create the products + prices:**
1. https://dashboard.stripe.com/products → "Add product"
2. Product 1: **Mix Techniques Pro** → Recurring price → $10.00 USD → Monthly
   - Copy the Price ID (starts with `price_`)
3. Product 2: **Mix Techniques Studio** → Recurring price → $25.00 USD → Monthly
   - Copy the Price ID

**Set up the webhook:**
1. https://dashboard.stripe.com/webhooks → "Add endpoint"
2. Endpoint URL: `https://mixtechniques.com/api/billing/webhook`
   (use `https://www.mixtechniques.com/api/billing/webhook` if that's your canonical)
3. Events to send:
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
STRIPE_PRICE_ID_STUDIO=price_...
STAFF_EMAILS=don@theconflux.com,your-other-staff@email.com
```

3. Redeploy (Settings → Deployments → click "..." → Redeploy)

**Test it:**
1. Visit https://mixtechniques.com/pricing
2. Click "Choose Pro"
3. Use test card `4242 4242 4242 4242` with any future date + any CVC + any ZIP
4. You should land on https://mixtechniques.com/dashboard/membership?checkout=success
5. Visit https://mixtechniques.com/[your-username]/portfolio — should now work

### 3. Manual tier flip (no Stripe needed — for testing now)

Until you set up Stripe, you can flip your own tier to test the portfolio:

1. Make sure `STAFF_EMAILS` includes your email (default is `don@theconflux.com`)
2. Visit https://mixtechniques.com/staff/memberships
3. Search for your user
4. Click `pro` or `studio`
5. Visit `/[your-username]/portfolio` — should now be live

### 4. Confirm Vercel has the existing env vars

If you haven't redeployed since adding new env vars, your live site won't see them.
The current prod `.env.local` (local only) has Supabase keys + WebSocket URL.
You need those same Supabase keys + WS URL on Vercel for the site to function.

---

## What's NOT Built Yet (Future Work)

- **Webhook signature secret rotation** — Stripe has a "Roll secret" feature; if you roll it, update Vercel immediately or events will 400.
- **Custom domain for portfolios** (Studio tier) — mentioned in tier copy, not implemented.
- **Promo codes** — enabled on checkout but no codes created yet.
- **Receipts / invoice history UI** — Stripe emails them; could add an in-app view later.
- **Annual pricing** — current is monthly only. Easy to add a second set of prices.
- **Tax collection** — Stripe Tax can be enabled per-product when you're ready.

---

## Important Architecture Notes

**Webhook idempotency:** The webhook handler uses `UPSERT ... ON CONFLICT (stripe_subscription_id)`. If Stripe retries (network blip, server 5xx), re-delivering the same event produces the same final state, not duplicate rows.

**Service role in webhook:** The webhook uses the service-role Supabase client because Stripe webhooks are server-to-server and unauthenticated. RLS would block the write. This is gated by webhook signature verification — unsigned requests get 400 before reaching the database.

**Tier lookup single source of truth:** All tier checks go through `get_user_tier()` RPC. Never query `subscriptions` directly with `.single()`. The partial unique constraint allows multiple rows over a user's lifetime (cancelled + new), and `.single()` would 406 on the second row.

**Past-due behavior:** A user with a single failed payment stays at their tier (Stripe retries for ~3 weeks). They get `'past_due'` status in our table, shown as "Payment Failed — Update Card" in the membership dashboard. Only when Stripe sends `customer.subscription.deleted` do we mark them `free`.

**Free user portfolios:** Currently a free user gets `404` on `/[username]/portfolio`. If you want free users to have basic portfolios (avatar + bio + contact form), tell me — it's a 30-line change. Right now portfolios are gated behind Pro because that's how the schema was built.