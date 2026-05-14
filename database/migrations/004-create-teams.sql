-- Migration: 004-create-teams
-- Description: Create team_members and team_achievements tables
-- Date: 2026-05-14T15:46:27Z
-- Auteur: system

-- =============================================
-- MIGRATION: CREATE-TEAMS
-- =============================================

CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '[]',
    badges JSONB DEFAULT '[]',
    expertise JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    is_lead BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    years_experience INTEGER DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    contributions_count INTEGER DEFAULT 0,
    position_order INTEGER DEFAULT 0,
    joined_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS team_achievements (
    id SERIAL PRIMARY KEY,
    team_member_id INTEGER REFERENCES team_members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_date DATE,
    category VARCHAR(100),
    icon VARCHAR(100),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 004-create-teams appliquée avec succès';
END $$;
