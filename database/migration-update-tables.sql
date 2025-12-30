-- migration-update-tables.sql
-- Script de migration pour ajouter les nouveaux champs aux tables existantes
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans effet secondaire

-- =============================================
-- MISE À JOUR DES TABLES EXISTANTES
-- =============================================

-- 1. Mise à jour de la table competition_editions
DO $$
BEGIN
    -- Ajouter la contrainte UNIQUE sur edition_number si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'competition_editions_edition_number_unique'
    ) THEN
        ALTER TABLE competition_editions 
        ADD CONSTRAINT competition_editions_edition_number_unique 
        UNIQUE (edition_number);
    END IF;
END $$;

-- 2. Mise à jour de la table edition_fighters
DO $$
BEGIN
    -- Ajouter la colonne is_champion si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'edition_fighters' 
        AND column_name = 'is_champion'
    ) THEN
        ALTER TABLE edition_fighters 
        ADD COLUMN is_champion BOOLEAN DEFAULT FALSE;
    END IF;

    -- Ajouter la colonne is_eliminated si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'edition_fighters' 
        AND column_name = 'is_eliminated'
    ) THEN
        ALTER TABLE edition_fighters 
        ADD COLUMN is_eliminated BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Mise à jour de la table edition_regions
DO $$
BEGIN
    -- Ajouter la colonne is_eliminated si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'edition_regions' 
        AND column_name = 'is_eliminated'
    ) THEN
        ALTER TABLE edition_regions 
        ADD COLUMN is_eliminated BOOLEAN DEFAULT FALSE;
    END IF;

    -- Ajouter la colonne points si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'edition_regions' 
        AND column_name = 'points'
    ) THEN
        ALTER TABLE edition_regions 
        ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Mise à jour de la table phases
DO $$
BEGIN
    -- Ajouter la contrainte UNIQUE sur phase_order si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'phases_phase_order_unique'
    ) THEN
        ALTER TABLE phases 
        ADD CONSTRAINT phases_phase_order_unique 
        UNIQUE (phase_order);
    END IF;
END $$;

-- 5. Mise à jour de la table phase_groups
DO $$
BEGIN
    -- Ajouter la colonne date si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'phase_groups' 
        AND column_name = 'date'
    ) THEN
        ALTER TABLE phase_groups 
        ADD COLUMN date DATE;
    END IF;
END $$;

-- 6. Mise à jour de la table sub_groups
DO $$
BEGIN
    -- Ajouter la colonne period si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sub_groups' 
        AND column_name = 'period'
    ) THEN
        ALTER TABLE sub_groups 
        ADD COLUMN period VARCHAR(10) 
        CHECK (period IN ('matin', 'soir')) 
        DEFAULT 'matin';
    END IF;

    -- Ajouter la colonne score_region1 si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sub_groups' 
        AND column_name = 'score_region1'
    ) THEN
        ALTER TABLE sub_groups 
        ADD COLUMN score_region1 INTEGER;
    END IF;

    -- Ajouter la colonne score_region2 si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sub_groups' 
        AND column_name = 'score_region2'
    ) THEN
        ALTER TABLE sub_groups 
        ADD COLUMN score_region2 INTEGER;
    END IF;

    -- Ajouter la colonne nulls si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sub_groups' 
        AND column_name = 'nulls'
    ) THEN
        ALTER TABLE sub_groups 
        ADD COLUMN nulls INTEGER;
    END IF;

    -- Ajouter la colonne status si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sub_groups' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE sub_groups 
        ADD COLUMN status VARCHAR(20) 
        CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled', 'postponed')) 
        DEFAULT 'upcoming';
    END IF;
END $$;

-- =============================================
-- MISE À JOUR DES TRIGGERS
-- =============================================

-- Mettre à jour le trigger pour les coaches s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_coaches_updated_at'
    ) THEN
        CREATE TRIGGER update_coaches_updated_at
        BEFORE UPDATE ON coaches
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- AJOUT DE NOUVELLES FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour calculer les points d'une région dans une édition
CREATE OR REPLACE FUNCTION calculate_region_points(
    p_edition_id INTEGER,
    p_region_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER := 0;
BEGIN
    -- Calculer les points à partir des matches
    SELECT COALESCE(SUM(
        CASE 
            WHEN m.winner_fighter_id IS NOT NULL AND f.region_id = p_region_id THEN 3
            WHEN m.match_result = 'draw' AND (f1.region_id = p_region_id OR f2.region_id = p_region_id) THEN 1
            ELSE 0
        END
    ), 0)
    INTO total_points
    FROM matches m
    LEFT JOIN fighters f ON m.winner_fighter_id = f.id
    LEFT JOIN fighters f1 ON m.fighter1_id = f1.id
    LEFT JOIN fighters f2 ON m.fighter2_id = f2.id
    INNER JOIN sub_groups sg ON m.sub_group_id = sg.id
    INNER JOIN phase_groups pg ON sg.group_id = pg.id
    INNER JOIN phases ph ON pg.phase_id = ph.id
    WHERE ph.edition_id = p_edition_id
      AND (f.region_id = p_region_id OR f1.region_id = p_region_id OR f2.region_id = p_region_id);
    
    RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour automatiquement les scores des sous-groupes
CREATE OR REPLACE FUNCTION update_sub_group_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le match est terminé, mettre à jour les scores du sous-groupe
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Calculer les scores pour les deux régions
        UPDATE sub_groups sg
        SET 
            score_region1 = (
                SELECT COUNT(*) FROM matches m2
                WHERE m2.sub_group_id = sg.id
                AND m2.status = 'completed'
                AND m2.winner_fighter_id IN (
                    SELECT f.id FROM fighters f WHERE f.region_id = sg.region1_id
                )
            ),
            score_region2 = (
                SELECT COUNT(*) FROM matches m2
                WHERE m2.sub_group_id = sg.id
                AND m2.status = 'completed'
                AND m2.winner_fighter_id IN (
                    SELECT f.id FROM fighters f WHERE f.region_id = sg.region2_id
                )
            ),
            nulls = (
                SELECT COUNT(*) FROM matches m2
                WHERE m2.sub_group_id = sg.id
                AND m2.status = 'completed'
                AND m2.match_result = 'draw'
            )
        WHERE sg.id = NEW.sub_group_id;
        
        -- Mettre à jour le statut du sous-groupe si tous les matchs sont terminés
        UPDATE sub_groups sg
        SET status = 'completed',
            is_completed = TRUE
        WHERE sg.id = NEW.sub_group_id
        AND NOT EXISTS (
            SELECT 1 FROM matches m2
            WHERE m2.sub_group_id = sg.id
            AND m2.status NOT IN ('completed', 'cancelled')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les scores des sous-groupes
DROP TRIGGER IF EXISTS update_sub_group_scores_trigger ON matches;
CREATE TRIGGER update_sub_group_scores_trigger
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_sub_group_scores();

-- =============================================
-- AJOUT DE NOUVEAUX INDEX POUR LES PERFORMANCES
-- =============================================

-- Index pour les recherches par statut dans sub_groups
CREATE INDEX IF NOT EXISTS idx_sub_groups_status ON sub_groups (status);
CREATE INDEX IF NOT EXISTS idx_sub_groups_period ON sub_groups (period);

-- Index pour les recherches par date dans phase_groups
CREATE INDEX IF NOT EXISTS idx_phase_groups_date ON phase_groups (date);

-- Index pour les recherches par is_champion dans edition_fighters
CREATE INDEX IF NOT EXISTS idx_edition_fighters_champion ON edition_fighters (is_champion);
CREATE INDEX IF NOT EXISTS idx_edition_fighters_eliminated ON edition_fighters (is_eliminated);

-- Index pour les recherches par points dans edition_regions
CREATE INDEX IF NOT EXISTS idx_edition_regions_points ON edition_regions (points);
CREATE INDEX IF NOT EXISTS idx_edition_regions_eliminated ON edition_regions (is_eliminated);

-- =============================================
-- AJOUT DE VUES UTILES
-- =============================================

-- Vue pour les statistiques des sous-groupes
CREATE OR REPLACE VIEW sub_group_stats AS
SELECT 
    sg.id,
    sg.name,
    sg.status,
    sg.period,
    sg.score_region1,
    sg.score_region2,
    sg.nulls,
    sg.is_completed,
    r1.name as region1_name,
    r2.name as region2_name,
    COUNT(m.id) as total_matches,
    COUNT(m.id) FILTER (WHERE m.status = 'completed') as completed_matches,
    COUNT(m.id) FILTER (WHERE m.status = 'live') as live_matches
FROM sub_groups sg
LEFT JOIN regions r1 ON sg.region1_id = r1.id
LEFT JOIN regions r2 ON sg.region2_id = r2.id
LEFT JOIN matches m ON sg.id = m.sub_group_id
GROUP BY sg.id, sg.name, sg.status, sg.period, sg.score_region1, sg.score_region2, 
         sg.nulls, sg.is_completed, r1.name, r2.name;

-- Vue pour les statistiques des éditions
CREATE OR REPLACE VIEW edition_stats AS
SELECT 
    ce.id,
    ce.edition_number,
    ce.year,
    ce.theme,
    COUNT(DISTINCT ef.id) as total_fighters,
    COUNT(DISTINCT ef.id) FILTER (WHERE ef.is_champion = TRUE) as champion_fighters,
    COUNT(DISTINCT er.id) as total_regions,
    COUNT(DISTINCT er.id) FILTER (WHERE er.is_eliminated = TRUE) as eliminated_regions,
    SUM(er.points) as total_points
FROM competition_editions ce
LEFT JOIN edition_fighters ef ON ce.id = ef.edition_id
LEFT JOIN edition_regions er ON ce.id = er.edition_id
GROUP BY ce.id, ce.edition_number, ce.year, ce.theme;

-- =============================================
-- MISE À JOUR DES DONNÉES PAR DÉFAUT
-- =============================================

-- Mettre à jour les app_settings si nécessaire
INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, is_public, is_editable) 
VALUES 
('sub_group_default_period', 'matin', 'string', 'competition', 'Période par défaut pour les sous-groupes', FALSE, TRUE),
('points_per_win', '3', 'number', 'scoring', 'Points par victoire', FALSE, TRUE),
('points_per_draw', '1', 'number', 'scoring', 'Points par match nul', FALSE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================
-- LOG DE LA MIGRATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration des nouvelles colonnes et contraintes terminée avec succès';
    RAISE NOTICE '📊 Nouvelles fonctionnalités disponibles :';
    RAISE NOTICE '   - Suivi des champions par édition (edition_fighters.is_champion)';
    RAISE NOTICE '   - Suivi des éliminations (edition_fighters.is_eliminated, edition_regions.is_eliminated)';
    RAISE NOTICE '   - Points par région (edition_regions.points)';
    RAISE NOTICE '   - Périodes de sous-groupes (matin/soir)';
    RAISE NOTICE '   - Scores des sous-groupes (score_region1, score_region2, nulls)';
    RAISE NOTICE '   - Statuts des sous-groupes (upcoming, ongoing, completed, etc.)';
END $$;