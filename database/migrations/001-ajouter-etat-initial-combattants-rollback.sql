-- Rollback: 001-ajouter-etat-initial-combattants
-- Description: Ajouter les champs fighter1_initial_state et fighter2_initial_state à la table matches
-- Date: 2025-12-26T20:29:45.811Z

-- =============================================
-- ROLLBACK: AJOUTER-ETAT-INITIAL-COMBATTANTS
-- =============================================

-- Écrivez vos commandes SQL de rollback ici
-- Doit inverser les changements de la migration correspondante
-- Exemple: ALTER TABLE table_name DROP COLUMN new_column;

-- =============================================
-- FIN DU ROLLBACK
-- =============================================

-- Rollback: 002-ajouter-etat-initial-combattants
-- Description: Retirer les champs fighter1_initial_state et fighter2_initial_state de la table matches
-- Date: 2024-01-15

-- =============================================
-- ROLLBACK: AJOUTER-ETAT-INITIAL-COMBATTANTS
-- =============================================

-- 1. Suppression des index
DROP INDEX IF EXISTS idx_matches_fighter1_state;
DROP INDEX IF EXISTS idx_matches_fighter2_state;

-- 2. Suppression des contraintes CHECK
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_fighter1_initial_state_check;

ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_fighter2_initial_state_check;

-- 3. Suppression des colonnes
ALTER TABLE matches 
DROP COLUMN IF EXISTS fighter1_initial_state,
DROP COLUMN IF EXISTS fighter2_initial_state;

-- =============================================
-- FIN DU ROLLBACK
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Rollback de 002-ajouter-etat-initial-combattants terminé avec succès';
END $$;
