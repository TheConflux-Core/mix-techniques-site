-- Mix Techniques - Initial Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    number INT NOT NULL UNIQUE,
    name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Episodes
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id INT REFERENCES seasons(id),
    episode_number INT NOT NULL,
    title VARCHAR(255),
    air_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'planned',
    youtube_url TEXT,
    podcast_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    genre VARCHAR(50) NOT NULL,
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    track_url TEXT NOT NULL,
    track_title VARCHAR(255),
    track_duration INTERVAL,
    sample_rate INT,
    bit_depth INT,
    file_format VARCHAR(10),
    waveform_data JSONB,
    status VARCHAR(20) DEFAULT 'submitted',
    episode_id UUID REFERENCES episodes(id),
    season_id INT REFERENCES seasons(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scores
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id),
    episode_id UUID REFERENCES episodes(id),
    host_score DECIMAL(3,1),
    guest_scores JSONB DEFAULT '{}',
    audience_score DECIMAL(3,1),
    notes TEXT,
    golden_knob BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_genre ON submissions(genre);
CREATE INDEX IF NOT EXISTS idx_submissions_season ON submissions(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season_id);
