-- Storage policy: users can delete their own avatar (needed for upsert)
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars');
