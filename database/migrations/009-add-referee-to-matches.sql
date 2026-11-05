-- Migration 009 : Ajouter referee_id dans la table matches
-- Chaque match peut avoir son propre arbitre indépendamment du sous-groupe
-- Pour les phases 'group', matches.referee_id = sub_groups.main_referee_id (synchronisé)
-- Pour les autres phases, matches.referee_id est indépendant

-- 1. Ajouter la colonne referee_id (nullable)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS referee_id INTEGER;

-- 2. Contrainte de clé étrangère (SET NULL si l'arbitre est supprimé)
ALTER TABLE matches ADD CONSTRAINT fk_matches_referee_id
  FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE SET NULL;

-- 3. Index pour les recherches par arbitre
CREATE INDEX IF NOT EXISTS idx_matches_referee_id ON matches(referee_id);

-- 4. Migration des données existantes :
--    Initialiser matches.referee_id depuis sub_groups.main_referee_id
--    pour ne pas perdre les arbitres déjà désignés
UPDATE matches m
SET referee_id = sg.main_referee_id
FROM sub_groups sg
WHERE m.sub_group_id = sg.id
  AND sg.main_referee_id IS NOT NULL
  AND m.referee_id IS NULL;
