-- Mix Techniques — Forum Schema
-- Run in Supabase SQL editor

-- ═══════════════════════════════════════════════════════════
-- FORUM CATEGORIES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🎛️',
    color VARCHAR(7) DEFAULT '#D4A843',
    sort_order INT DEFAULT 0,
    thread_count INT DEFAULT 0,
    post_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- FORUM THREADS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_solved BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    vote_score INT DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    last_reply_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_slug ON forum_threads(slug);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned_last ON forum_threads(is_pinned DESC, last_reply_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created ON forum_threads(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- FORUM REPLIES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    vote_score INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent ON forum_replies(parent_id);

-- ═══════════════════════════════════════════════════════════
-- FORUM VOTES (upvote/downvote on replies and threads)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS forum_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('thread', 'reply')),
    vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_id, target_type)
);

CREATE INDEX IF NOT EXISTS idx_forum_votes_target ON forum_votes(target_id, target_type);

-- ═══════════════════════════════════════════════════════════
-- FORUM AUDIO EMBEDS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS forum_audio_embeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    post_type VARCHAR(10) NOT NULL CHECK (post_type IN ('thread', 'reply')),
    audio_url TEXT NOT NULL,
    waveform_peaks JSONB,
    title VARCHAR(255),
    duration_seconds FLOAT,
    file_format VARCHAR(10),
    sample_rate INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_audio_post ON forum_audio_embeds(post_id, post_type);

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_audio_embeds ENABLE ROW LEVEL SECURITY;

-- Categories: everyone can read
CREATE POLICY "Forum categories are viewable by everyone"
    ON forum_categories FOR SELECT USING (true);

-- Threads: everyone can read, authenticated can create, author can update/delete
CREATE POLICY "Forum threads are viewable by everyone"
    ON forum_threads FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads"
    ON forum_threads FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own threads"
    ON forum_threads FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own threads"
    ON forum_threads FOR DELETE
    USING (auth.uid() = author_id);

-- Replies: everyone can read, authenticated can create, author can update/delete
CREATE POLICY "Forum replies are viewable by everyone"
    ON forum_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies"
    ON forum_replies FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own replies"
    ON forum_replies FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own replies"
    ON forum_replies FOR DELETE
    USING (auth.uid() = author_id);

-- Votes: authenticated can read/insert/update/delete own
CREATE POLICY "Forum votes are viewable by everyone"
    ON forum_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
    ON forum_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
    ON forum_votes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
    ON forum_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Audio embeds: everyone can read, authenticated can create own
CREATE POLICY "Forum audio embeds are viewable by everyone"
    ON forum_audio_embeds FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create audio embeds"
    ON forum_audio_embeds FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forum_threads WHERE id = post_id AND author_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM forum_replies WHERE id = post_id AND author_id = auth.uid()
        )
    );

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS: Auto-update thread reply_count and last_reply_at
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_thread_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_threads
        SET reply_count = reply_count + 1,
            last_reply_at = NEW.created_at,
            last_reply_by = NEW.author_id
        WHERE id = NEW.thread_id;

        UPDATE forum_categories
        SET post_count = post_count + 1
        WHERE id = (SELECT category_id FROM forum_threads WHERE id = NEW.thread_id);

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_threads
        SET reply_count = GREATEST(reply_count - 1, 0)
        WHERE id = OLD.thread_id;

        UPDATE forum_categories
        SET post_count = GREATEST(post_count - 1, 0)
        WHERE id = (SELECT category_id FROM forum_threads WHERE id = OLD.thread_id);

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_reply_count ON forum_replies;
CREATE TRIGGER trigger_reply_count
    AFTER INSERT OR DELETE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_thread_on_reply();

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Auto-update thread vote_score
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_vote_score()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.target_type = 'thread' THEN
            UPDATE forum_threads
            SET vote_score = (
                SELECT COALESCE(SUM(vote_type), 0)
                FROM forum_votes
                WHERE target_id = NEW.target_id AND target_type = 'thread'
            )
            WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'reply' THEN
            UPDATE forum_replies
            SET vote_score = (
                SELECT COALESCE(SUM(vote_type), 0)
                FROM forum_votes
                WHERE target_id = NEW.target_id AND target_type = 'reply'
            )
            WHERE id = NEW.target_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'thread' THEN
            UPDATE forum_threads
            SET vote_score = (
                SELECT COALESCE(SUM(vote_type), 0)
                FROM forum_votes
                WHERE target_id = OLD.target_id AND target_type = 'thread'
            )
            WHERE id = OLD.target_id;
        ELSIF OLD.target_type = 'reply' THEN
            UPDATE forum_replies
            SET vote_score = (
                SELECT COALESCE(SUM(vote_type), 0)
                FROM forum_votes
                WHERE target_id = OLD.target_id AND target_type = 'reply'
            )
            WHERE id = OLD.target_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_vote_score ON forum_votes;
CREATE TRIGGER trigger_vote_score
    AFTER INSERT OR UPDATE OR DELETE ON forum_votes
    FOR EACH ROW EXECUTE FUNCTION update_vote_score();

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Auto-update thread_count on category
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_category_thread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_categories SET thread_count = thread_count + 1 WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_categories SET thread_count = GREATEST(thread_count - 1, 0) WHERE id = OLD.category_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_thread_count ON forum_threads;
CREATE TRIGGER trigger_thread_count
    AFTER INSERT OR DELETE ON forum_threads
    FOR EACH ROW EXECUTE FUNCTION update_category_thread_count();

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: updated_at
-- ═══════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS forum_threads_updated_at ON forum_threads;
CREATE TRIGGER forum_threads_updated_at
    BEFORE UPDATE ON forum_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS forum_replies_updated_at ON forum_replies;
CREATE TRIGGER forum_replies_updated_at
    BEFORE UPDATE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- SEED DATA: Default Categories
-- ═══════════════════════════════════════════════════════════

INSERT INTO forum_categories (name, slug, description, icon, color, sort_order) VALUES
    ('Mixing Help', 'mixing-help', 'Get help with your mixes. Post your tracks, ask questions, and get feedback from the community.', '🎛️', '#D4A843', 1),
    ('Plugin Reviews', 'plugin-reviews', 'Review and discuss plugins. Share your honest opinions on the latest and greatest tools.', '🔌', '#E89B2E', 2),
    ('Gear Talk', 'gear-talk', 'Hardware, interfaces, monitors, microphones — if it''s physical, we talk about it here.', '🎚️', '#B8862D', 3),
    ('Technique Deep Dives', 'technique-deep-dives', 'In-depth discussions on mixing techniques, signal processing, and audio theory.', '📚', '#C4962E', 4),
    ('Genre-Specific', 'genre-specific', 'Mixing tips and discussions organized by genre. Hip hop, rock, electronic, and more.', '🎵', '#D4A843', 5),
    ('Show Discussion', 'show-discussion', 'Discuss episodes, contestants, scores, and moments from Mix Techniques.', '🎬', '#E89B2E', 6),
    ('Industry & Career', 'industry-career', 'Building a career in audio engineering, finding clients, pricing your work.', '💼', '#B8862D', 7),
    ('Off Topic', 'off-topic', 'Hang out. Talk about anything. Keep it respectful.', '🍺', '#8B7355', 8)
ON CONFLICT (slug) DO NOTHING;
