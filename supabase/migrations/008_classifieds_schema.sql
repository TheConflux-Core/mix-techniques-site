-- Mix Techniques — Classifieds Schema
-- Run in Supabase SQL editor AFTER forum schema (007)

-- ═══════════════════════════════════════════════════════════
-- CLASSIFIEDS LISTINGS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS classifieds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_type VARCHAR(10) NOT NULL CHECK (listing_type IN ('lfw', 'lfm')),
    -- lfw = Looking For Work (engineer posting services)
    -- lfm = Looking For Mixing (artist/engineer seeking someone)
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    genres TEXT[] DEFAULT '{}',
    -- For LFW: pricing info
    rate_per_song DECIMAL(10,2),
    rate_per_hour DECIMAL(10,2),
    rate_per_stem DECIMAL(10,2),
    turnaround_days INT,
    -- For LFM: budget info
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    deadline DATE,
    -- Shared
    specialties TEXT[] DEFAULT '{}', -- vocal mixing, mastering, beat production, etc.
    portfolio_url TEXT,
    reference_tracks TEXT, -- "I want it to sound like..."
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    is_bumped BOOLEAN DEFAULT FALSE,
    bumped_until TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'hired')),
    view_count INT DEFAULT 0,
    contact_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classifieds_author ON classifieds(author_id);
CREATE INDEX IF NOT EXISTS idx_classifieds_type ON classifieds(listing_type);
CREATE INDEX IF NOT EXISTS idx_classifieds_status ON classifieds(status);
CREATE INDEX IF NOT EXISTS idx_classifieds_featured ON classifieds(is_featured DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classifieds_created ON classifieds(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- CLASSIFIED REVIEWS (after job completion)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS classified_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES classifieds(id) ON DELETE SET NULL,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    project_type VARCHAR(50), -- mixing, mastering, production, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reviewer_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON classified_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON classified_reviews(listing_id);

-- ═══════════════════════════════════════════════════════════
-- CLASSIFIED CONTACTS (track who contacted whom)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS classified_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_listing ON classified_contacts(listing_id);
CREATE INDEX IF NOT EXISTS idx_contacts_receiver ON classified_contacts(receiver_id, read_at);

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_contacts ENABLE ROW LEVEL SECURITY;

-- Classifieds: everyone can read active listings
CREATE POLICY "Classifieds are viewable by everyone"
    ON classifieds FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create listings"
    ON classifieds FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own listings"
    ON classifieds FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own listings"
    ON classifieds FOR DELETE
    USING (auth.uid() = author_id);

-- Reviews: everyone can read
CREATE POLICY "Reviews are viewable by everyone"
    ON classified_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
    ON classified_reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own reviews"
    ON classified_reviews FOR UPDATE
    USING (auth.uid() = reviewer_id);

-- Contacts: only sender and receiver can see
CREATE POLICY "Contacts viewable by sender and receiver"
    ON classified_contacts FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send contacts"
    ON classified_contacts FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS classifieds_updated_at ON classifieds;
CREATE TRIGGER classifieds_updated_at
    BEFORE UPDATE ON classifieds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment contact_count on listing
CREATE OR REPLACE FUNCTION update_classified_contact_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE classifieds
        SET contact_count = contact_count + 1
        WHERE id = NEW.listing_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE classifieds
        SET contact_count = GREATEST(contact_count - 1, 0)
        WHERE id = OLD.listing_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_contact_count ON classified_contacts;
CREATE TRIGGER trigger_contact_count
    AFTER INSERT OR DELETE ON classified_contacts
    FOR EACH ROW EXECUTE FUNCTION update_classified_contact_count();

-- ═══════════════════════════════════════════════════════════
-- SEED: Default specialties (used as tag suggestions)
-- ═══════════════════════════════════════════════════════════
-- These are just suggestions, users can type custom ones
-- Stored as an enum-like reference, not a separate table
