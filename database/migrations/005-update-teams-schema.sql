-- Migration: 005-update-teams-schema
-- Description: Update team_members table to match legacy PHP/Mobile schema
-- Date: 2026-05-14T17:15:00Z
-- Auteur: system

-- =============================================
-- MIGRATION: UPDATE-TEAMS-SCHEMA
-- =============================================

ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255),
ADD COLUMN IF NOT EXISTS cover_image VARCHAR(255),
ADD COLUMN IF NOT EXISTS quote TEXT,
ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'full-time';

-- Migrate existing full_name data to first_name/last_name if possible
-- Simple split for existing data
UPDATE team_members 
SET 
    first_name = split_part(full_name, ' ', 1),
    last_name = substr(full_name, strpos(full_name, ' ') + 1)
WHERE full_name IS NOT NULL AND first_name IS NULL;

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 005-update-teams-schema appliquée avec succès';
END $$;
