-- Migration: 013-performance-indexes-3
-- Description: Index manquants sur des lectures fréquentes :
--   - fighters(region_id)        : lutteurs d'une région (pages Régions, éditions, app mobile)
--   - fighter_cards(fighter_id)  : cartons d'un lutteur (fiche lutteur)
-- Date: 2026-11-24

CREATE INDEX IF NOT EXISTS idx_fighters_region_id ON fighters (region_id);
CREATE INDEX IF NOT EXISTS idx_fighter_cards_fighter_id ON fighter_cards (fighter_id);

DO $$
BEGIN
    RAISE NOTICE 'Migration 013 appliquee avec succes';
END $$;
