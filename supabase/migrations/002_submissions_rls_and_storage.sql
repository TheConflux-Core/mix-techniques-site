-- Add track_signed_url column to submissions (for Supabase Storage signed URLs)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS track_signed_url TEXT;

-- RLS policies for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can read submissions (profile pages, public)
CREATE POLICY "Submissions are viewable by everyone"
    ON submissions FOR SELECT
    USING (true);

-- Authenticated users can insert submissions
CREATE POLICY "Authenticated users can submit"
    ON submissions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can update their own submissions (matched by email)
CREATE POLICY "Users can update own submissions"
    ON submissions FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Storage policy: authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');

-- Storage policy: users can update their own avatar
CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
