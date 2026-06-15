-- Mix Techniques - Seed Data
-- Run this after the migration

INSERT INTO seasons (number, name, start_date, status)
VALUES (1, 'Season 1', CURRENT_DATE, 'active')
ON CONFLICT (number) DO NOTHING;
