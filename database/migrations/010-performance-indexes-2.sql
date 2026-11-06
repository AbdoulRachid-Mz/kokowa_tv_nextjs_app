-- Migration: 010-performance-indexes-2
-- Description: Index complémentaires pour les requêtes mobiles optimisées (lots B/D)
-- Date: 2026-11-06

-- 1. Cartons par match (support de getCardsForMatches)
CREATE INDEX IF NOT EXISTS idx_fighter_cards_match_id
  ON fighter_cards(match_id, minute_given);

-- 2. Matchs par lutteur (OR fighter1/fighter2)
CREATE INDEX IF NOT EXISTS idx_matches_fighter1_id ON matches(fighter1_id);
CREATE INDEX IF NOT EXISTS idx_matches_fighter2_id ON matches(fighter2_id);

-- 3. Matchs par date (listes/tri)
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date DESC);

-- 4. Régions participantes d'une édition (lookup par région)
CREATE INDEX IF NOT EXISTS idx_edition_regions_region_id
  ON edition_regions(region_id, edition_id);

-- 5. Lutteurs participants d'une édition (lookup par lutteur)
CREATE INDEX IF NOT EXISTS idx_edition_fighters_fighter_id
  ON edition_fighters(fighter_id, edition_id);

-- 6. Transferts par lutteur / région
CREATE INDEX IF NOT EXISTS idx_fighter_transfers_fighter_id
  ON fighter_transfers(fighter_id, transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_fighter_transfers_from_region
  ON fighter_transfers(from_region_id, transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_fighter_transfers_to_region
  ON fighter_transfers(to_region_id, transfer_date DESC);

-- 7. Interactions par entité (listing par entité)
CREATE INDEX IF NOT EXISTS idx_interactions_entity_created
  ON interactions(entity_type, entity_id, created_at DESC);

-- 8. Messages par entité et date
CREATE INDEX IF NOT EXISTS idx_messages_entity_created
  ON messages(entity_type, entity_id, created_at DESC);

-- 9. Médias par entité
CREATE INDEX IF NOT EXISTS idx_media_entity
  ON media(entity_type, entity_id, is_featured DESC, created_at);

-- 10. Articles publiés
CREATE INDEX IF NOT EXISTS idx_articles_status_published
  ON articles(status, published_at DESC);

-- 11. Arbitres par sous-groupe (corrélation matches)
CREATE INDEX IF NOT EXISTS idx_sub_groups_main_referee
  ON sub_groups(main_referee_id);

-- 12. Arbitres par région/actif
CREATE INDEX IF NOT EXISTS idx_referees_region_active
  ON referees(region_id, is_active);

-- 13. Publicités actives par position
CREATE INDEX IF NOT EXISTS idx_advertisements_active_position
  ON advertisements(is_active, position, priority DESC);

-- 14. Succès d'équipe par membre
CREATE INDEX IF NOT EXISTS idx_team_achievements_member
  ON team_achievements(team_member_id, achievement_date DESC);

-- 15. Succès lutteurs par lutteur
CREATE INDEX IF NOT EXISTS idx_fighter_achievements_fighter
  ON fighter_achievements(fighter_id, year DESC);

-- 16. Phases / groupes d'une édition
CREATE INDEX IF NOT EXISTS idx_phases_edition_order
  ON phases(edition_id, phase_order);
CREATE INDEX IF NOT EXISTS idx_phase_groups_phase_order
  ON phase_groups(phase_id, group_order);

-- 17. Éditions d'une compétition
CREATE INDEX IF NOT EXISTS idx_competition_editions_competition_year
  ON competition_editions(competition_id, year DESC);

DO $$
BEGIN
    RAISE NOTICE 'Migration 010-performance-indexes-2 appliquee avec succes';
END $$;
