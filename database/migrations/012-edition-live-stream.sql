-- Migration: 012-edition-live-stream
-- Description: Direct vidéo par édition (lien YouTube Live, Facebook Live...).
--              L'admin lance/arrête le direct depuis la page de l'édition ; le lien
--              est aussi publié dans Firebase RTDB (editions/{id}/liveUrl) pour l'app mobile.
-- Date: 2026-11-24

ALTER TABLE competition_editions
  ADD COLUMN IF NOT EXISTS live_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS live_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS live_started_at TIMESTAMP;

DO $$
BEGIN
    RAISE NOTICE 'Migration 012 appliquee avec succes';
END $$;
