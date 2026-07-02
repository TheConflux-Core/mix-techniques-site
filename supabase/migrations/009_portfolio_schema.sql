-- Mix Techniques — Portfolio Schema
-- Run in Supabase SQL editor AFTER classifieds schema (008)

-- ═══════════════════════════════════════════════════════════
-- SUBSCRIPTIONS / TIERS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'studio')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════
-- PORTFOLIO TRACKS (pro/studio users only)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS portfolio_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(50),
    role VARCHAR(50) DEFAULT 'mixed', -- mixed, mastered, produced, co-produced
    audio_url TEXT NOT NULL, -- storage path
    waveform_peaks JSONB, -- pre-computed peaks for waveform rendering
    duration_seconds FLOAT,
    file_format VARCHAR(10), -- wav, flac, mp3
    sample_rate INT,
    bit_depth INT,
    file_size_bytes BIGINT,
    play_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE, -- show on portfolio homepage
    is_public BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_tracks_user ON portfolio_tracks(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_tracks_featured ON portfolio_tracks(user_id, is_featured DESC);

-- ═══════════════════════════════════════════════════════════
-- PORTFOLIO SETTINGS (one per user)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS portfolio_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    theme VARCHAR(50) DEFAULT 'studio-gold',
    layout VARCHAR(50) DEFAULT 'standard', -- standard, grid, showcase
    headline VARCHAR(200), -- e.g. "Mix Engineer | 10+ Years Experience"
    custom_bio TEXT, -- longer bio for portfolio page
    gear_list TEXT[] DEFAULT '{}', -- hardware/software they use
    client_testimonials JSONB DEFAULT '[]', -- [{name, quote, project}]
    contact_email VARCHAR(255),
    contact_form_enabled BOOLEAN DEFAULT TRUE,
    show_rates BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10,2),
    per_song_rate DECIMAL(10,2),
    custom_domain VARCHAR(255),
    analytics_enabled BOOLEAN DEFAULT TRUE,
    social_links JSONB DEFAULT '{}',
    show_badge BOOLEAN DEFAULT TRUE, -- show verified badge
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- PORTFOLIO ANALYTICS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS portfolio_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('page_view', 'track_play', 'track_download', 'contact_click', 'share')),
    track_id UUID REFERENCES portfolio_tracks(id) ON DELETE SET NULL,
    referrer TEXT,
    visitor_ip_hash VARCHAR(64), -- hashed for privacy
    visitor_country VARCHAR(2),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_user ON portfolio_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_type ON portfolio_analytics(user_id, event_type, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- PORTFOLIO CONTACT MESSAGES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS portfolio_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_name VARCHAR(200) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    project_type VARCHAR(50), -- mixing, mastering, production
    budget_range VARCHAR(50),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_contacts_user ON portfolio_contacts(portfolio_user_id, read_at);

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_contacts ENABLE ROW LEVEL SECURITY;

-- Subscriptions: users can read their own
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
    ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Portfolio tracks: everyone can read public tracks, owner can manage
CREATE POLICY "Public portfolio tracks are viewable by everyone"
    ON portfolio_tracks FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own tracks"
    ON portfolio_tracks FOR ALL USING (auth.uid() = user_id);

-- Portfolio settings: everyone can read, owner can manage
CREATE POLICY "Portfolio settings are viewable by everyone"
    ON portfolio_settings FOR SELECT USING (true);

CREATE POLICY "Users can manage own portfolio settings"
    ON portfolio_settings FOR ALL USING (auth.uid() = user_id);

-- Analytics: owner can read, system inserts
CREATE POLICY "Users can view own analytics"
    ON portfolio_analytics FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert analytics"
    ON portfolio_analytics FOR INSERT WITH CHECK (true);

-- Contacts: only portfolio owner can read
CREATE POLICY "Portfolio owner can view contacts"
    ON portfolio_contacts FOR SELECT USING (auth.uid() = portfolio_user_id);

CREATE POLICY "Anyone can send portfolio contact"
    ON portfolio_contacts FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS portfolio_tracks_updated_at ON portfolio_tracks;
CREATE TRIGGER portfolio_tracks_updated_at
    BEFORE UPDATE ON portfolio_tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS portfolio_settings_updated_at ON portfolio_settings;
CREATE TRIGGER portfolio_settings_updated_at
    BEFORE UPDATE ON portfolio_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create portfolio settings when user subscribes to pro
CREATE OR REPLACE FUNCTION auto_create_portfolio_settings()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tier IN ('pro', 'studio') THEN
        INSERT INTO portfolio_settings (user_id)
        VALUES (NEW.user_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_portfolio ON subscriptions;
CREATE TRIGGER trigger_auto_portfolio
    AFTER INSERT OR UPDATE OF tier ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION auto_create_portfolio_settings();
