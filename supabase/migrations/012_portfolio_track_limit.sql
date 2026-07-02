-- Mix Techniques — Portfolio track limit
-- Run AFTER portfolio schema (009), atomic increments (010), billing schema (011)
--
-- Background: Pro tier at $15/mo grants up to MAX_TRACKS_PER_USER tracks
-- (currently 5). Free users have zero. Enforced server-side at the API layer
-- AND as a DB-level safety net via trigger so a buggy client can never
-- over-insert (which would burn Supabase storage costs without revenue).
--
-- The trigger uses a SQL function so we can raise a real Postgres error that
-- surfaces as a 400 in the API. Clean rollback via DROP TRIGGER.

-- ─── 1. Track-count helper ──────────────────────────────────────────────────
-- Returns the current count of portfolio tracks for a user.
-- Security definer so it works under RLS-restricted callers.

CREATE OR REPLACE FUNCTION count_portfolio_tracks(p_user_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER FROM portfolio_tracks WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── 2. Tier-check helper ───────────────────────────────────────────────────
-- Single source of truth for "is this user allowed to upload tracks?"
-- The API calls this first; the DB trigger calls it as a backstop.

CREATE OR REPLACE FUNCTION user_can_upload_tracks(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_tier VARCHAR(20);
BEGIN
    v_tier := get_user_tier(p_user_id);
    RETURN v_tier = 'pro';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── 3. Track-limit guard trigger ───────────────────────────────────────────
-- Fires BEFORE INSERT on portfolio_tracks. If the user is Pro but already has
-- 5 tracks, abort with a clear error. If the user is Free, abort too.
--
-- WHY this exists: the API route also checks, but if a future bug or a direct
-- SQL insert slips past it, this is the safety net that prevents over-storage.

CREATE OR REPLACE FUNCTION enforce_portfolio_track_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_tier VARCHAR(20);
    v_count INTEGER;
    v_max INTEGER := 5;  -- MUST match MAX_TRACKS_PER_USER in src/lib/billing.ts
BEGIN
    v_tier := get_user_tier(NEW.user_id);

    IF v_tier != 'pro' THEN
        RAISE EXCEPTION 'portfolio_tracks_forbidden: user % is on % tier — upgrade to Pro to upload tracks', NEW.user_id, v_tier
            USING ERRCODE = 'P0001';
    END IF;

    SELECT COUNT(*) INTO v_count FROM portfolio_tracks WHERE user_id = NEW.user_id;
    IF v_count >= v_max THEN
        RAISE EXCEPTION 'portfolio_track_limit_reached: max % tracks per user (current count: %)', v_max, v_count
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_portfolio_track_limit ON portfolio_tracks;
CREATE TRIGGER trigger_enforce_portfolio_track_limit
    BEFORE INSERT ON portfolio_tracks
    FOR EACH ROW
    EXECUTE FUNCTION enforce_portfolio_track_limit();

-- ─── 4. Backfill: any Pro users over the limit keep their existing tracks ────
-- We do NOT delete. Existing rows pass the trigger (it only fires on INSERT).
-- Future inserts are blocked until they manually delete down to <= 5.
-- This protects users who happened to have more than 5 from a past test run.

COMMENT ON TRIGGER trigger_enforce_portfolio_track_limit ON portfolio_tracks IS
    'Enforces MAX_TRACKS_PER_USER (5) on portfolio_tracks. Backstop for the API check. Aborts inserts for non-Pro users.';

COMMENT ON FUNCTION count_portfolio_tracks(UUID) IS
    'Returns the number of portfolio tracks a user has. Use for limit display in UI.';

COMMENT ON FUNCTION user_can_upload_tracks(UUID) IS
    'Returns true if the user is on Pro tier. Single source of truth for upload permission.';