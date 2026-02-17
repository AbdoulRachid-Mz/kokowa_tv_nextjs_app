-- =============================================
-- TABLES PRINCIPALES
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_id VARCHAR(255) UNIQUE,
    fcm_token TEXT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (
        role IN (
            'admin',
            'editor',
            'user',
            'moderator',
            'fighter_manager'
        )
    ) DEFAULT 'user',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_picture VARCHAR(255),
    bio TEXT,
    phone_number VARCHAR(20),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- =============================================
-- GESTION DES RÉGIONS ET VILLES
-- =============================================
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    flag_image VARCHAR(255),
    stadium_name VARCHAR(100) NOT NULL,
    stadium_image VARCHAR(255) NOT NULL,
    color VARCHAR(30),
    total_fighters INTEGER DEFAULT 0,
    total_champions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- =============================================
-- GESTION DES LUTTEURS
-- =============================================
CREATE TABLE IF NOT EXISTS fighters (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    slug TEXT GENERATED ALWAYS AS (
        lower(
            replace (nickname, ' ', '-')
        )
    ) STORED,
    birth_date DATE,
    birth_place VARCHAR(100),
    region_id INTEGER,
    height DECIMAL(4, 2),
    weight DECIMAL(5, 2),
    profile_image VARCHAR(255),
    cover_image VARCHAR(255),
    bio TEXT,
    fighting_style TEXT,
    debut_year INTEGER,
    ranking INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_champion BOOLEAN DEFAULT FALSE,
    social_links JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions (id)
);

-- =============================================
-- GESTION DES ARBITRES
-- =============================================
CREATE TABLE IF NOT EXISTS referees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    region_id INTEGER,
    birth_date DATE,
    profile_image VARCHAR(255),
    license_number VARCHAR(50) UNIQUE,
    certification_level VARCHAR(50),
    experience_years INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    social_links JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions (id)
);

-- =============================================
-- GESTION DES COACHS
-- =============================================
CREATE TABLE IF NOT EXISTS coaches (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    region_id INTEGER NOT NULL,
    birth_date DATE,
    profile_image VARCHAR(255),
    license_number VARCHAR(50) UNIQUE,
    certification_level VARCHAR(50),
    experience_years INTEGER,
    specialties TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    social_links JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions (id)
);

-- Trigger to auto-update updated_at
-- CREATE TRIGGER update_coaches_updated_at BEFORE
-- UPDATE ON coaches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_coaches_updated_at'
  ) THEN
    CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- Dans la table competitions
CREATE TABLE IF NOT EXISTS competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (
        status IN (
            'upcoming',
            'ongoing',
            'completed',
            'cancelled',
            'postponed'
        )
    ) DEFAULT 'upcoming',
    featured_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ajouter la contrainte d'unicité sur le nom
    CONSTRAINT competitions_name_unique UNIQUE (name)
);

-- Éditions des compétitions
CREATE TABLE IF NOT EXISTS competition_editions (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER NOT NULL,

    edition_number INTEGER UNIQUE NOT NULL,

    year INTEGER NOT NULL,
    theme VARCHAR(255),
    start_date DATE,
    end_date DATE,
    winner_fighter_id INTEGER,
    winner_region_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    region_id INTEGER,
    total_participants INTEGER DEFAULT 0,
    prize_pool DECIMAL(12, 2),
    registration_deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
    FOREIGN KEY (winner_fighter_id) REFERENCES fighters (id),
    -- Assure qu'une compétition ne peut avoir qu'une seule édition avec un numéro d'édition donné
    UNIQUE (
        competition_id,
        edition_number
    ),
    FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE CASCADE,
    FOREIGN KEY (winner_region_id) REFERENCES regions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fighter_achievements (
    id SERIAL PRIMARY KEY,
    fighter_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    edition_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    position VARCHAR(20) CHECK (
        position IN (
            '1st',
            '2nd',
            '3rd',
            'finalist',
            'semifinalist',
            'quarterfinalist'
        )
    ) NOT NULL,
    description TEXT,
    medal_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fighter_id) REFERENCES fighters (id) ON DELETE CASCADE,
    FOREIGN KEY (edition_id) REFERENCES competition_editions (id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE CASCADE
);
-- Lutteurs participants à une édition
CREATE TABLE IF NOT EXISTS edition_fighters (
    id SERIAL PRIMARY KEY,
    edition_id INTEGER NOT NULL,
    fighter_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,

    is_champion BOOLEAN DEFAULT FALSE,
    is_eliminated BOOLEAN DEFAULT FALSE,

    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (
        status IN (
            'registered',
            'qualified',
            'disqualified',
            'withdrawn'
        )
    ) DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (edition_id) REFERENCES competition_editions (id) ON DELETE CASCADE,
    FOREIGN KEY (fighter_id) REFERENCES fighters (id) ON DELETE CASCADE,
    UNIQUE (
        edition_id,
        fighter_id,
        region_id
    ),
    FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE CASCADE
);
-- Régions participantes à une édition
CREATE TABLE IF NOT EXISTS edition_regions (
    id SERIAL PRIMARY KEY,
    edition_id INTEGER NOT NULL,
    region_id INTEGER NOT NULL,

    is_eliminated BOOLEAN DEFAULT FALSE,
    points INTEGER DEFAULT 0,

    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (
        status IN (
            'registered',
            'approved',
            'rejected'
        )
    ) DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (edition_id) REFERENCES competition_editions (id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions (id) ON DELETE CASCADE,
    UNIQUE (edition_id, region_id)
);
-- =============================================
-- GESTION DES PHASES DE COMPÉTITION
-- =============================================
-- Phases d'une édition
CREATE TABLE IF NOT EXISTS phases (
    id SERIAL PRIMARY KEY,
    edition_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,

    phase_order INTEGER UNIQUE NOT NULL,
    
    is_active BOOLEAN DEFAULT FALSE,
    phase_type VARCHAR(20) CHECK (
        phase_type IN (
            'qualification',
            'group',
            'knockout',
            'quarterfinal',
            'semifinal',
            'final'
        )
    ) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (edition_id) REFERENCES competition_editions (id) ON DELETE CASCADE
);
-- Groupes dans une phase
CREATE TABLE IF NOT EXISTS phase_groups (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    group_order INTEGER NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,

    date DATE,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_id) REFERENCES phases (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS belt (
    id SERIAL PRIMARY KEY,
    color VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sous-groupes dans un groupe
CREATE TABLE IF NOT EXISTS sub_groups (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    sub_group_order INTEGER NOT NULL,
    description TEXT,

    period VARCHAR(10) CHECK (period IN ('matin', 'soir')) DEFAULT 'matin',
    score_region1 INTEGER,
    score_region2 INTEGER,
    nulls INTEGER,
    status VARCHAR(20) CHECK (
        status IN (
            'upcoming',
            'ongoing',
            'completed',
            'cancelled',
            'postponed'
        )
    ) DEFAULT 'upcoming',
    
    region1_id INTEGER,
    region2_id INTEGER,
    belt_region1 INTEGER,
    belt_region2 INTEGER,
    main_referee_id INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES phase_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (belt_region1) REFERENCES belt (id),
    FOREIGN KEY (belt_region2) REFERENCES belt (id),
    FOREIGN KEY (main_referee_id) REFERENCES referees (id),
    FOREIGN KEY (region1_id) REFERENCES regions (id),
    FOREIGN KEY (region2_id) REFERENCES regions (id)
);
 -- =============================================
-- GESTION DES MATCHS
-- =============================================
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    sub_group_id INTEGER NOT NULL,
    match_number INTEGER,
    match_date TIMESTAMP NOT NULL,
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    -- Participants
    fighter1_id INTEGER,
    fighter2_id INTEGER,

    fighter1_initial_state VARCHAR(50) CHECK (fighter1_initial_state IN ('eliminated', 'not_eliminated')),
    fighter2_initial_state VARCHAR(50) CHECK (fighter2_initial_state IN ('eliminated', 'not_eliminated')),
    -- Résultat
    winner_fighter_id INTEGER,
    loser_fighter_id INTEGER,
    -- Score simplifié pour la lutte traditionnelle
    match_result VARCHAR(30) CHECK (
        match_result IN (
            'fighter1_win',
            'fighter2_win',
            'draw',
            'cancelled',
            'postponed'
        )
    ),
    -- Gestion du temps
    total_duration INTERVAL,
    break_count INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (
        status IN (
            'scheduled',
            'live',
            'round_break',
            'completed',
            'cancelled',
            'postponed',
            'reclamation'
        )
    ) DEFAULT 'scheduled',
    -- Informations supplémentaires
    audience_count INTEGER,
    video_url VARCHAR(255),
    live_stream_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sub_group_id) REFERENCES sub_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (fighter1_id) REFERENCES fighters (id),
    FOREIGN KEY (fighter2_id) REFERENCES fighters (id),
    FOREIGN KEY (winner_fighter_id) REFERENCES fighters (id),
    FOREIGN KEY (loser_fighter_id) REFERENCES fighters (id)
);
-- Cartons pendant les matchs
CREATE TABLE IF NOT EXISTS fighter_cards (
    id SERIAL PRIMARY KEY,
    fighter_id INTEGER NOT NULL,
    match_id INTEGER NOT NULL,
    card_type VARCHAR(10) CHECK (card_type IN ('yellow', 'red')) NOT NULL,
    card_reason TEXT,
    minute_given TIME,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fighter_id) REFERENCES fighters (id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE
);
-- =============================================
-- TRANSFERTS DE LUTTEURS
-- =============================================
CREATE TABLE IF NOT EXISTS fighter_transfers (
    id SERIAL PRIMARY KEY,
    fighter_id INTEGER NOT NULL,
    from_region_id INTEGER NOT NULL,
    to_region_id INTEGER NOT NULL,
    transfer_date DATE NOT NULL,
    transfer_reason TEXT,
    transfer_fee DECIMAL(10, 2),
    contract_duration INTEGER,
    -- en mois
    is_permanent BOOLEAN DEFAULT TRUE,
    approved_by_user_id INTEGER,
    status VARCHAR(20) CHECK (
        status IN (
            'pending',
            'approved',
            'rejected',
            'completed'
        )
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fighter_id) REFERENCES fighters (id),
    FOREIGN KEY (from_region_id) REFERENCES regions (id),
    FOREIGN KEY (to_region_id) REFERENCES regions (id),
    FOREIGN KEY (approved_by_user_id) REFERENCES users (id)
);
-- =============================================
-- SYSTÈME DE MESSAGERIE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    message_type VARCHAR(20) CHECK (
        message_type IN (
            'comment',
            'direct_message',
            'group_message',
            'match_commentary',
            'system_notification'
        )
    ) DEFAULT 'comment',
    entity_type VARCHAR(50) CHECK (
        entity_type IN (
            'article',
            'match',
            'fighter',
            'competition',
            'user'
        )
    ),
    entity_id INTEGER,
    author_id INTEGER NOT NULL,
    recipient_id INTEGER,
    parent_message_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    images TEXT [],
    video_url VARCHAR(255),
    audio_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE
);
-- =============================================
-- MÉDIAS ET CONTENU
-- =============================================
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(255),
    author_id INTEGER NOT NULL,
    status VARCHAR(20) CHECK (
        status IN (
            'draft',
            'published',
            'archived'
        )
    ) DEFAULT 'draft',
    language VARCHAR(5) CHECK (language IN ('fr', 'ha', 'en')) DEFAULT 'fr',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) CHECK (
        file_type IN (
            'image',
            'video',
            'document',
            'audio'
        )
    ) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    alt_text VARCHAR(255),
    description TEXT,
    uploader_id INTEGER NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users (id)
);
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    video_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    duration INTEGER,
    type VARCHAR(20) CHECK (
        type IN (
            'youtube',
            'facebook',
            'tiktok',
            'rtmp',
            'upload',
            'vimeo'
        )
    ) NOT NULL,
    category VARCHAR(20) CHECK (
        category IN (
            'match',
            'interview',
            'highlights',
            'training',
            'documentary',
            'ceremony'
        )
    ) NOT NULL,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_live BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- GESTION DES PUBLICITÉS
-- =============================================
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

-- Trigger to auto-update updated_at
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

-- Index for performance
CREATE INDEX idx_advertisements_position ON advertisements (position);
CREATE INDEX idx_advertisements_active ON advertisements (is_active, start_date, end_date);
CREATE INDEX idx_advertisements_priority ON advertisements (priority DESC);

-- =============================================
-- INTERACTIONS ET AUTRES
-- =============================================
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) CHECK (
        interaction_type IN (
            'like',
            'view',
            'share',
            'bookmark',
            'follow'
        )
    ) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE (
        user_id,
        entity_type,
        entity_id,
        interaction_type
    )
);

-- =============================================
-- GESTION DES NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) CHECK (
        notification_type IN (
            'match_update',
            'fighter_update',
            'competition_update',
            'system_notification',
            'achievement',
            'message'
        )
    ) NOT NULL,
    entity_type VARCHAR(50) CHECK (
        entity_type IN (
            'article',
            'match',
            'fighter',
            'competition',
            'user',
            'message'
        )
    ),
    entity_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    priority VARCHAR(10) CHECK (
        priority IN (
            'low',
            'medium',
            'high'
        )
    ) DEFAULT 'medium',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_notifications_updated_at'
  ) THEN
    CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Index for performance
CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications (notification_type);
CREATE INDEX idx_notifications_entity ON notifications (entity_type, entity_id);

-- =============================================
-- CONFIGURATION DE L'APPLICATION
-- =============================================
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) CHECK (
        setting_type IN (
            'string',
            'number',
            'boolean',
            'json',
            'array'
        )
    ) DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pour updated_at
CREATE TRIGGER update_app_settings_updated_at 
BEFORE UPDATE ON app_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_app_settings_key ON app_settings (setting_key);
CREATE INDEX idx_app_settings_category ON app_settings (category);
CREATE INDEX idx_app_settings_public ON app_settings (is_public);

-- Données par défaut
INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, is_public, is_editable) VALUES
('app_name', 'Lutte Traditionnelle', 'string', 'general', 'Nom de l''application', TRUE, TRUE),
('app_description', 'Plateforme de gestion des compétitions de lutte traditionnelle', 'string', 'general', 'Description de l''application', TRUE, TRUE),
('app_version', '1.0.0', 'string', 'general', 'Version de l''application', TRUE, FALSE),
('maintenance_mode', 'false', 'boolean', 'system', 'Mode maintenance', TRUE, TRUE),
('registration_enabled', 'true', 'boolean', 'auth', 'Inscription des utilisateurs activée', TRUE, TRUE),
('max_file_size', '10485760', 'number', 'media', 'Taille maximale des fichiers uploadés (en bytes)', FALSE, TRUE),
('allowed_file_types', '["image/jpeg", "image/png", "image/gif", "video/mp4"]', 'json', 'media', 'Types de fichiers autorisés', FALSE, TRUE),
('default_language', 'fr', 'string', 'localization', 'Langue par défaut', TRUE, TRUE),
('supported_languages', '["fr", "ha", "en"]', 'json', 'localization', 'Langues supportées', TRUE, TRUE),
('match_duration', '300', 'number', 'matches', 'Durée par défaut d''un match (en secondes)', FALSE, TRUE),
('max_breaks_per_match', '3', 'number', 'matches', 'Nombre maximum de pauses par match', FALSE, TRUE),
('ranking_points_win', '3', 'number', 'ranking', 'Points de classement pour une victoire', FALSE, TRUE),
('ranking_points_draw', '1', 'number', 'ranking', 'Points de classement pour un match nul', FALSE, TRUE),
('social_links', '{"facebook": "", "twitter": "", "instagram": "", "youtube": ""}', 'json', 'social', 'Liens vers les réseaux sociaux', TRUE, TRUE),
('contact_email', 'contact@lutte-traditionnelle.com', 'string', 'contact', 'Email de contact', TRUE, TRUE),
('analytics_tracking_id', '', 'string', 'analytics', 'ID de suivi Google Analytics', FALSE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================
-- INDEX POUR LES PERFORMANCES
-- =============================================
-- Index pour les compétitions
CREATE INDEX idx_competitions_status ON competitions (status);
CREATE INDEX idx_competitions_region ON competitions (region_id);
-- Index pour les éditions
CREATE INDEX idx_editions_competition ON competition_editions (competition_id);
CREATE INDEX idx_editions_year ON competition_editions (year);
-- Index pour les phases et groupes
CREATE INDEX idx_phases_edition ON phases (edition_id);
CREATE INDEX idx_phase_groups_phase ON phase_groups (phase_id);
CREATE INDEX idx_sub_groups_group ON sub_groups (group_id);
-- Index pour les matchs
CREATE INDEX idx_matches_sub_group ON matches (sub_group_id);
CREATE INDEX idx_matches_date ON matches (match_date);
CREATE INDEX idx_matches_status ON matches (status);
CREATE INDEX idx_matches_fighters ON matches (fighter1_id, fighter2_id);
-- Index pour les lutteurs et régions d'édition
CREATE INDEX idx_edition_fighters_edition ON edition_fighters (edition_id);
CREATE INDEX idx_edition_fighters_fighter ON edition_fighters (fighter_id);
CREATE INDEX idx_edition_regions_edition ON edition_regions (edition_id);
CREATE INDEX idx_edition_regions_region ON edition_regions (region_id);
-- Index pour les messages
CREATE INDEX idx_messages_entity ON messages (entity_type, entity_id);
CREATE INDEX idx_messages_author ON messages (author_id, created_at);
-- =============================================
-- FONCTIONS ET DÉCLENCHEURS
-- =============================================
-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
-- Application des triggers updated_at
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fighters_updated_at BEFORE
UPDATE ON fighters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitions_updated_at BEFORE
UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE
UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE
UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Fonction pour compter les lutteurs par région
CREATE OR REPLACE FUNCTION update_region_fighter_counts() RETURNS TRIGGER AS $$ BEGIN -- Mettre à jour le compteur de lutteurs pour l'ancienne région
    IF OLD.region_id IS NOT NULL THEN
UPDATE regions
SET total_fighters = (
        SELECT COUNT(*)
        FROM fighters
        WHERE region_id = OLD.region_id
            AND is_active = true
    )
WHERE id = OLD.region_id;
END IF;
-- Mettre à jour le compteur de lutteurs pour la nouvelle région
IF NEW.region_id IS NOT NULL THEN
UPDATE regions
SET total_fighters = (
        SELECT COUNT(*)
        FROM fighters
        WHERE region_id = NEW.region_id
            AND is_active = true
    )
WHERE id = NEW.region_id;
END IF;
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_region_counts
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON fighters FOR EACH ROW EXECUTE FUNCTION update_region_fighter_counts();
-- Fonction pour mettre à jour le nombre de participants d'une édition
CREATE OR REPLACE FUNCTION update_edition_participants() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT'
    OR TG_OP = 'UPDATE' THEN
UPDATE competition_editions
SET total_participants = (
        SELECT COUNT(*)
        FROM edition_fighters
        WHERE edition_id = NEW.edition_id
            AND status = 'registered'
    ) + (
        SELECT COUNT(*)
        FROM edition_regions
        WHERE edition_id = NEW.edition_id
            AND status = 'approved'
    )
WHERE id = NEW.edition_id;
ELSIF TG_OP = 'DELETE' THEN
UPDATE competition_editions
SET total_participants = (
        SELECT COUNT(*)
        FROM edition_fighters
        WHERE edition_id = OLD.edition_id
            AND status = 'registered'
    ) + (
        SELECT COUNT(*)
        FROM edition_regions
        WHERE edition_id = OLD.edition_id
            AND status = 'approved'
    )
WHERE id = OLD.edition_id;
END IF;
RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';
CREATE TRIGGER update_edition_fighters_count
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON edition_fighters FOR EACH ROW EXECUTE FUNCTION update_edition_participants();
CREATE TRIGGER update_edition_regions_count
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON edition_regions FOR EACH ROW EXECUTE FUNCTION update_edition_participants();

    