-- Add user_id column to submissions for user→submission linking
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Index for looking up submissions by user
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
