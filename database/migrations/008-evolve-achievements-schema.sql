-- ============================================================================
-- Migration: 008-evolve-achievements-schema.sql
-- Description: Fait évoluer fighter_achievements pour supporter toutes les
--              catégories d'acteurs (lutteurs, régions, autres) sans supprimer
--              aucun champ existant, en préparation du renommage en achievements.
-- Date: 2026-11-04
-- ============================================================================

-- 1. Ajouter le champ entity_type ('fighter', 'region', 'others') avec défaut 'fighter'
ALTER TABLE fighter_achievements 
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'fighter';

-- 2. Ajouter la référence au match source (traçabilité de l'attribution automatique)
ALTER TABLE fighter_achievements 
ADD COLUMN IF NOT EXISTS match_id INTEGER;

-- 3. Ajouter les champs pour les autres acteurs de la lutte ('others')
ALTER TABLE fighter_achievements 
ADD COLUMN IF NOT EXISTS other_actor_name VARCHAR(255);

ALTER TABLE fighter_achievements 
ADD COLUMN IF NOT EXISTS other_actor_role VARCHAR(100);

-- 4. Initialiser entity_type pour toutes les distinctions existantes
UPDATE fighter_achievements 
SET entity_type = 'fighter' 
WHERE entity_type IS NULL;

-- 5. Rendre fighter_id nullable pour permettre les distinctions régionales et tiers
ALTER TABLE fighter_achievements 
ALTER COLUMN fighter_id DROP NOT NULL;

-- 6. Rendre region_id nullable (au cas où un acteur tiers n'a pas de région affiliée)
ALTER TABLE fighter_achievements 
ALTER COLUMN region_id DROP NOT NULL;

-- 7. Clé étrangère pour match_id avec suppression en cascade
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_fighter_achievements_match_id'
    ) THEN
        ALTER TABLE fighter_achievements
        ADD CONSTRAINT fk_fighter_achievements_match_id
        FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE SET NULL;
    END IF;
END $$;

-- 8. Contrainte CHECK sur entity_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_fighter_achievements_entity_type'
    ) THEN
        ALTER TABLE fighter_achievements
        ADD CONSTRAINT chk_fighter_achievements_entity_type
        CHECK (entity_type IN ('fighter', 'region', 'others'));
    END IF;
END $$;

-- 9. Index de performance et d'intégrité
CREATE INDEX IF NOT EXISTS idx_fighter_achievements_entity_type 
ON fighter_achievements (entity_type);

CREATE INDEX IF NOT EXISTS idx_fighter_achievements_match_id 
ON fighter_achievements (match_id);

CREATE INDEX IF NOT EXISTS idx_fighter_achievements_region_position 
ON fighter_achievements (region_id, edition_id, position) 
WHERE entity_type = 'region';

-- 10. Index d'unicité partielle pour l'idempotence de l'attribution automatique :
-- Empêche qu'un même lutteur ait deux fois le même résultat sur la même édition
CREATE UNIQUE INDEX IF NOT EXISTS uq_fighter_achievements_fighter_edition_pos
ON fighter_achievements (edition_id, fighter_id, type, position)
WHERE entity_type = 'fighter' AND fighter_id IS NOT NULL;

-- Empêche qu'une région ait deux fois le même résultat officiel sur la même édition
CREATE UNIQUE INDEX IF NOT EXISTS uq_fighter_achievements_region_edition_pos
ON fighter_achievements (edition_id, region_id, type, position)
WHERE entity_type = 'region' AND region_id IS NOT NULL;
