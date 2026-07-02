-- Mix Techniques — Atomic increment helpers + trigger fixes
-- Run AFTER portfolio schema (009)

-- ═══════════════════════════════════════════════════════════
-- ATOMIC VIEW COUNT INCREMENT (fixes race condition)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_thread_view_count(thread_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE forum_threads
    SET view_count = view_count + 1
    WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_classified_view_count(classified_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE classifieds
    SET view_count = view_count + 1
    WHERE id = classified_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- PORTFOLIO TRACKS: Fix role constraint
-- The API sends 'mixed' which is the correct default
-- This just documents the allowed values for clarity:
--   'mixed', 'mastered', 'produced', 'co-produced'
-- No schema change needed — the CHECK constraint already allows these.
-- ═══════════════════════════════════════════════════════════
