-- Migration: 007-performance-indexes
-- Description: Ajouter des index stratégiques pour optimiser les performances des requêtes
-- Date: 2026-10-22

-- 1. Optimisation du filtrage des combattants par édition et statut d'élimination
CREATE INDEX IF NOT EXISTS idx_edition_fighters_edition_eliminated 
ON edition_fighters(edition_id, is_eliminated);

-- 2. Optimisation des matches par sous-groupe et statut
CREATE INDEX IF NOT EXISTS idx_matches_sub_group_status 
ON matches(sub_group_id, status);

-- 3. Optimisation des sous-groupes par groupe de phase
CREATE INDEX IF NOT EXISTS idx_sub_groups_group_id 
ON sub_groups(group_id);

-- 4. Optimisation de la résolution des utilisateurs par Firebase auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id 
ON users(auth_id);

-- 5. Optimisation des interactions mobiles (likes, vues, etc.)
CREATE INDEX IF NOT EXISTS idx_interactions_user_entity 
ON interactions(user_id, entity_type, entity_id);

-- 6. Optimisation des messages et commentaires par entité
CREATE INDEX IF NOT EXISTS idx_messages_entity 
ON messages(entity_type, entity_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 007-performance-indexes appliquée avec succès';
END $$;
