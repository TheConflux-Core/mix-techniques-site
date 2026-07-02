-- Mix Techniques — Billing schema fixes
-- Run AFTER portfolio schema (009) and atomic increments (010)
--
-- Three problems this migration fixes:
--
-- 1. UNIQUE(user_id) on subscriptions prevents users from ever re-subscribing
--    after cancellation. Switch to a partial unique that only enforces
--    one active subscription per user (any non-canceled row).
--
-- 2. stripe_subscription_id is not unique. The webhook handler uses
--    UPSERT ... ON CONFLICT (stripe_subscription_id) which requires a unique
--    constraint. Add one.
--
-- 3. The status CHECK constraint was missing values the webhook needs and
--    was too narrow (no 'trialing' visible in queries when stripe trial used).
--    Also, API routes were filtering `status = 'active'` which excluded
--    trialing + past_due users — a paid user on Stripe trial would appear as
--    free. Replace those lookups with the new get_user_tier() SQL function
--    which encodes the mapping in one place.
--
-- 4. Add current_period_end index so "expiring soon" queries and renewal
--    syncing are fast once we have volume.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Drop the over-strict UNIQUE(user_id) constraint
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

-- Partial unique: at most one non-canceled subscription per user.
-- This lets us INSERT a new row after the old one is canceled.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_subscriptions_active_user
    ON subscriptions(user_id)
    WHERE status IN ('active', 'trialing', 'past_due');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Unique constraint on stripe_subscription_id (webhook idempotency key)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS uniq_subscriptions_stripe_sub_id
    ON subscriptions(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Index on customer_id for portal session lookups
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
    ON subscriptions(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

-- Index on current_period_end for renewal / dunning queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
    ON subscriptions(current_period_end)
    WHERE status IN ('active', 'trialing');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Source of truth: get_user_tier()
--
-- Returns the highest active tier a user is entitled to. Encodes the
-- status → tier mapping in one place so API routes don't drift.
--
-- Returns:
--   'free'    - no active paid subscription, or subscription canceled/expired
--   'pro'     - active Pro
--   'studio'  - active Studio
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_tier VARCHAR(20);
    v_status VARCHAR(20);
BEGIN
    -- Pick the most recently updated active-or-trialing-or-past_due row.
    -- 'past_due' is included so a user with a single failed payment doesn't
    -- get downgraded to free until Stripe confirms the subscription is dead.
    SELECT tier, status
      INTO v_tier, v_status
      FROM subscriptions
     WHERE user_id = p_user_id
       AND status IN ('active', 'trialing', 'past_due')
     ORDER BY updated_at DESC
     LIMIT 1;

    IF v_tier IS NULL THEN
        RETURN 'free';
    END IF;

    -- Defensive: if the row somehow has a weird tier value, default to free
    IF v_tier NOT IN ('free', 'pro', 'studio') THEN
        RETURN 'free';
    END IF;

    RETURN v_tier;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Companion helper: get_user_tier_strict()
--
-- Same as get_user_tier but only returns pro/studio (never 'free').
-- Useful when you want a boolean "is this user paid?" check without an
-- explicit string comparison.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_paid_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_tier VARCHAR(20);
BEGIN
    v_tier := get_user_tier(p_user_id);
    RETURN v_tier IN ('pro', 'studio');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Extend the status CHECK constraint to be safe with new values.
--    Original allowed: active, canceled, past_due, trialing
--    Adding 'free' is wrong (free is the absence of a subscription). Keep
--    existing values. We just document the canonical set here in a comment.
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN subscriptions.status IS
    'Stripe-derived subscription status. Allowed: active, trialing, past_due, canceled.';