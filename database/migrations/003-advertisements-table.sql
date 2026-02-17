-- Migration: 003-advertisements-table
-- Description: Création de la table de gestion des publicités
-- Date: 2024-01-22T10:00:00.000Z
-- Auteur: system

-- =============================================
-- MIGRATION: CRÉATION TABLE ADVERTISEMENTS
-- =============================================

-- Création de la table advertisements
CREATE TABLE IF NOT EXISTS advertisements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media VARCHAR(255),
    media_type VARCHAR(20) CHECK (
        media_type IN ('image', 'video', 'html')
    ) DEFAULT 'image',
    price DECIMAL(10, 2) DEFAULT 0.00,
    link_url VARCHAR(255),
    position VARCHAR(30) CHECK (
        position IN (
            'header',
            'sidebar',
            'footer',
            'in_content',
            'popup',
            'banner_top',
            'banner_bottom',
            'mobile_sticky'
        )
    ) NOT NULL,
    priority INTEGER DEFAULT 0,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    click_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    target_audience VARCHAR(50),
    advertiser_name VARCHAR(255),
    advertiser_contact VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pour mettre à jour updated_at automatiquement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_advertisements_updated_at'
  ) THEN
    CREATE TRIGGER update_advertisements_updated_at
    BEFORE UPDATE ON advertisements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Création des index pour les performances
CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements (position);
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements (is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_advertisements_priority ON advertisements (priority DESC);

-- Index pour les recherches par période
CREATE INDEX IF NOT EXISTS idx_advertisements_date_range ON advertisements (start_date, end_date);

-- Index pour les recherches par annonceur
CREATE INDEX IF NOT EXISTS idx_advertisements_advertiser ON advertisements (advertiser_name);

-- =============================================
-- DONNÉES INITIALES (optionnelles)
-- =============================================

-- Insertion de données de démonstration (à décommenter si nécessaire)
/*
INSERT INTO advertisements (
    title, 
    description, 
    media_type, 
    position, 
    priority, 
    is_active,
    advertiser_name
) VALUES 
    ('Bannière principale', 'Bannière publicitaire en haut du site', 'image', 'header', 10, true, 'Régie publicitaire'),
    ('Annonce latérale', 'Publicité dans la barre latérale', 'image', 'sidebar', 5, true, 'Annonceur local'),
    ('Popup promotionnel', 'Popup pour promotions spéciales', 'html', 'popup', 8, false, 'Marketing Pro');
*/

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 004-advertisements-table appliquée avec succès';
END $$;