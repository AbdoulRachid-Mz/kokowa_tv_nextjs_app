-- Migration: 011-fighter-cards-minute-given-varchar
-- Description: Passe la colonne minute_given de TIME a VARCHAR(20) pour
--              supporter des durees de match superieures a 59 minutes
--              (ex: "121:56"), evitant l'erreur PostgreSQL 22008.
-- Date: 2026-11-09

ALTER TABLE fighter_cards
  ALTER COLUMN minute_given TYPE VARCHAR(20)
  USING minute_given::text;

DO $$
BEGIN
    RAISE NOTICE 'Migration 011 appliquee avec succes';
END $$;
