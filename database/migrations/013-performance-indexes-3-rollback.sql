-- Rollback: 013-performance-indexes-3

DROP INDEX IF EXISTS idx_fighters_region_id;
DROP INDEX IF EXISTS idx_fighter_cards_fighter_id;
