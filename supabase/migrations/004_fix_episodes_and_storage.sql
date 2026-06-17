-- Fix episodes table: add missing columns
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS submissions_open BOOLEAN DEFAULT FALSE;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS description TEXT;

-- Create submissions storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for submissions bucket
CREATE POLICY "Submissions files are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'submissions');

CREATE POLICY "Authenticated users can upload submissions"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'submissions');

CREATE POLICY "Users can update own submissions files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'submissions');

-- Seed: create an open episode for testing
INSERT INTO seasons (number, name, start_date, status)
VALUES (1, 'Season 1', CURRENT_DATE, 'active')
ON CONFLICT (number) DO NOTHING;

INSERT INTO episodes (season_id, episode_number, title, description, status, submissions_open)
SELECT id, 1, 'Pilot Episode', 'The very first episode of Mix Techniques. Show us your mix!', 'planned', true
FROM seasons WHERE number = 1
ON CONFLICT DO NOTHING;
