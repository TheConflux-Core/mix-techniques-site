-- Add discord_handle to profiles table
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_handle text;

-- Backfill from most recent submission per user
UPDATE profiles p
SET discord_handle = s.discord_handle
FROM (
  SELECT DISTINCT ON (user_id)
    user_id, discord_handle
  FROM submissions
  WHERE discord_handle IS NOT NULL
  ORDER BY user_id, created_at DESC
) s
WHERE p.id = s.user_id
  AND p.discord_handle IS NULL;
