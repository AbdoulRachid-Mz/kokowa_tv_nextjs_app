-- =============================================
-- DÉBUT DU SCRIPT DE SEED
-- =============================================

-- =============================================
-- NETTOYAGE DES DONNÉES EXISTANTES
-- =============================================
TRUNCATE TABLE 
    fighter_cards, 
    matches, 
    sub_groups, 
    phase_groups, 
    phases, 
    edition_fighters, 
    edition_regions, 
    competition_editions, 
    fighter_achievements, 
    fighter_transfers, 
    fighters, 
    referees, 
    coaches,  -- AJOUT DE LA TABLE COACHS
    competitions, 
    regions, 
    messages, 
    articles, 
    media, 
    videos, 
    interactions, 
    users,
    belt, -- Ajout de la nouvelle table belt
    team_achievements,
    team_members
RESTART IDENTITY CASCADE;

-- =============================================
-- INSERTION DES CEINTURES (BELT)
-- (NOUVELLE TABLE)
-- =============================================
-- Supprimer la création de table si elle existe déjà (déjà dans database.sql)
-- CREATE TABLE IF NOT EXISTS belt (
--     id SERIAL PRIMARY KEY,
--     color VARCHAR(20) NOT NULL,
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

INSERT INTO belt (color, is_active) VALUES
('Rouge', true),
('Vert', true),
('Jaune', true),
('Bleu', true),
('Noir', true);

-- =============================================
-- INSERTION DES UTILISATEURS
-- Suppression de la colonne obsolète 'city'
-- =============================================
INSERT INTO users (username, email, password_hash, role, first_name, last_name, profile_picture, bio, phone_number, country, is_active, is_verified, last_login) VALUES
-- Admin
('admin', 'admin@kokowa.com', '$2b$10$xyz123', 'admin', 'Admin', 'System', 'admin.jpg', 'Administrateur principal', '+22712345678', 'Niger', true, true, NOW()),
-- Éditeurs
('editor1', 'editor1@kokowa.com', '$2b$10$xyz124', 'editor', 'Editor', 'One', 'editor1.jpg', 'Éditeur sportif', '+22712345679', 'Niger', true, true, NOW()),
('editor2', 'editor2@kokowa.com', '$2b$10$xyz125', 'editor', 'Editor', 'Two', 'editor2.jpg', 'Éditeur contenu', '+22712345680', 'Niger', true, true, NOW()),
-- Modérateurs
('moderator1', 'moderator1@kokowa.com', '$2b$10$xyz126', 'moderator', 'Moderator', 'One', 'moderator1.jpg', 'Modérateur communauté', '+22712345681', 'Niger', true, true, NOW()),
-- Gestionnaires de lutteurs
('manager1', 'manager1@kokowa.com', '$2b$10$xyz127', 'fighter_manager', 'Manager', 'One', 'manager1.jpg', 'Gestionnaire de lutteurs', '+22712345682', 'Niger', true, true, NOW()),
-- Utilisateurs normaux
('user1', 'user1@kokowa.com', '$2b$10$xyz128', 'user', 'User', 'One', 'user1.jpg', 'Fan de lutte', '+22712345683', 'Niger', true, true, NOW()),
('user2', 'user2@kokowa.com', '$2b$10$xyz129', 'user', 'User', 'Two', 'user2.jpg', 'Passionné de sport', '+22712345684', 'Niger', true, false, NULL),
-- Utilisateurs inactifs
('inactive_user', 'inactive@kokowa.com', '$2b$10$xyz130', 'user', 'Inactive', 'User', NULL, 'Compte inactif', '+22712345685', 'Niger', false, true, '2023-01-01 10:00:00');

-- =============================================
-- INSERTION DES RÉGIONS
-- =============================================
INSERT INTO regions (name, code, description, flag_image, color, total_fighters, total_champions, stadium_name, stadium_image) VALUES
('Niamey', 'NIM', 'Région de la capitale', 'niamey-flag.png', '#FF0000', 8, 2, 'Stade Général Seyni Kountché', 'niamey-stadium.jpg'),
('Dosso', 'DOS', 'Région de Dosso', 'dosso-flag.png', '#00FF00', 6, 1, 'Stade de Dosso', 'dosso-stadium.jpg'),
('Tahoua', 'TAH', 'Région de Tahoua', 'tahoua-flag.png', '#0000FF', 7, 1, 'Stade de Tahoua', 'tahoua-stadium.jpg'),
('Tillabéri', 'TIL', 'Région de Tillabéri', 'tillaberi-flag.png', '#FFFF00', 5, 0, 'Stade de Tillabéri', 'tillaberi-stadium.jpg'),
('Maradi', 'MAR', 'Région de Maradi', 'maradi-flag.png', '#FF00FF', 6, 1, 'Stade de Maradi', 'maradi-stadium.jpg'),
('Zinder', 'ZIN', 'Région de Zinder', 'zinder-flag.png', '#00FFFF', 7, 2, 'Stade de Zinder', 'zinder-stadium.jpg'),
('Agadez', 'AGA', 'Région d''Agadez', 'agadez-flag.png', '#FFA500', 4, 0, 'Stade d''Agadez', 'agadez-stadium.jpg'),
('Diffa', 'DIF', 'Région de Diffa', 'diffa-flag.png', '#800080', 3, 0, 'Stade de Diffa', 'diffa-stadium.jpg');

-- =============================================
-- INSERTION DES COACHS
-- =============================================
INSERT INTO coaches (first_name, last_name, nickname, region_id, birth_date, profile_image, license_number, certification_level, experience_years, specialties, is_active, social_links) VALUES
('Harouna', 'Mamane', 'Le Stratège', 1, '1975-04-12', 'harouna-mamane.jpg', 'COACH001', 'National', 20, 'Technique, Préparation physique', true, '{}'),
('Amina', 'Souley', 'La Mentore', 2, '1980-08-25', 'amina-souley.jpg', 'COACH002', 'Régional', 15, 'Stratégie, Psychologie sportive', true, '{}'),
('Boubacar', 'Diallo', 'L''Expérimenté', 3, '1970-11-30', 'boubacar-diallo.jpg', 'COACH003', 'International', 25, 'Tactique, Gestion du stress', true, '{}'),
('Fatima', 'Issa', 'La Passionnée', 4, '1985-03-18', 'fatima-issa.jpg', 'COACH004', 'Régional', 10, 'Jeunes talents, Développement', true, '{}');

-- =============================================
-- INSERTION DES LUTTEURS
-- =============================================
INSERT INTO fighters (first_name, last_name, nickname, birth_date, birth_place, region_id, height, weight, profile_image, cover_image, bio, fighting_style, debut_year, ranking, is_active, is_champion, social_links) VALUES
-- Champions actifs
('Issa', 'Djibrilla', 'Le Lion du Désert', '1990-05-15', 'Niamey', 1, 1.85, 95.5, 'issa-djibrilla.jpg', 'issa-cover.jpg', 'Champion national en titre', 'Force brute', 2008, 1, true, true, '{"facebook": "issa.djibrilla", "instagram": "issa_lion"}'),
('Moussa', 'Alzouma', 'Le Faucon de Maradi', '1992-08-20', 'Maradi', 5, 1.78, 88.0, 'moussa-alzouma.jpg', 'moussa-cover.jpg', 'Spécialiste des prises techniques', 'Technique', 2010, 2, true, true, '{"facebook": "moussa.alzouma"}'),
('Hassane', 'Seydou', 'Le Guépard de Zinder', '1991-03-10', 'Zinder', 6, 1.82, 92.0, 'hassane-seydou.jpg', 'hassane-cover.jpg', 'Ancien champion national', 'Polyvalent', 2009, 3, true, true, '{"instagram": "hassane_guépard"}'),

-- Lutteurs classés
('Boubacar', 'Tahirou', 'Le Rocher de Tahoua', '1993-11-25', 'Tahoua', 3, 1.88, 98.5, 'boubacar-tahirou.jpg', NULL, 'Connu pour sa résistance', 'Défensif', 2011, 4, true, false, '{}'),
('Abdou', 'Harouna', 'L''Aigle de Dosso', '1994-02-14', 'Dosso', 2, 1.76, 85.0, 'abdou-harouna.jpg', NULL, 'Jeune espoir du sabre', 'Rapide', 2012, 5, true, false, '{"facebook": "abdou.aigle"}'),
('Mahamane', 'Sani', 'Le Scorpion d''Agadez', '1995-07-30', 'Agadez', 7, 1.80, 90.0, 'mahamane-sani.jpg', NULL, 'Style agressif et imprévisible', 'Agressif', 2013, 6, true, false, '{}'),

-- Lutteurs non classés
('Ibrahim', 'Mamane', 'La Panthère de Tillabéri', '1996-04-18', 'Tillabéri', 4, 1.83, 94.0, NULL, NULL, 'En progression constante', 'Équilibré', 2014, 0, true, false, '{}'),
('Souleymane', 'Bachir', 'Le Buffle de Diffa', '1997-09-05', 'Diffa', 8, 1.87, 96.0, NULL, NULL, 'Force physique impressionnante', 'Puissant', 2015, 0, true, false, '{}'),

-- Anciens champions (inactifs)
('Kader', 'Ali', 'Le Vétéran', '1985-12-10', 'Niamey', 1, 1.84, 93.0, 'kader-ali.jpg', NULL, 'Ancien légende du sabre', 'Expérimenté', 2000, 0, false, false, '{}'),
('Hamidou', 'Yacouba', 'Le Sage', '1988-06-22', 'Zinder', 6, 1.79, 89.0, 'hamidou-yacouba.jpg', NULL, 'Carrière exemplaire', 'Stratégique', 2005, 0, false, false, '{}'),

-- Jeunes espoirs
('Yahaya', 'Oumarou', 'La Flèche', '1998-01-15', 'Maradi', 5, 1.77, 86.0, NULL, NULL, 'Nouveau talent prometteur', 'Rapide', 2016, 0, true, false, '{}'),
('Mansour', 'Idriss', 'Le Jeune Lion', '1999-03-20', 'Tahoua', 3, 1.81, 91.0, NULL, NULL, 'Future star du sabre', 'Technique', 2017, 0, true, false, '{}');

-- =============================================
-- INSERTION DES ARBITRES
-- =============================================
INSERT INTO referees (first_name, last_name, nickname, birth_date, region_id, profile_image, license_number, certification_level, experience_years, is_active, social_links) VALUES
('Amadou', 'Souley', 'L''Œil Aiguisé', '1980-03-15', 1, 'amadou-souley.jpg', 'REF001', 'International', 15, true, '{}'),
('Fatouma', 'Moussa', 'La Justicière', '1985-07-22', 2, 'fatouma-moussa.jpg', 'REF002', 'National', 12, true, '{}'),
('Boubacar', 'Harouna', 'Le Sage', '1975-11-30', 3, 'boubacar-harouna.jpg', 'REF003', 'International', 20, true, '{}'),
('Aïcha', 'Yahaya', 'L''Impartiale', '1988-04-18', 4, 'aicha-yahaya.jpg', 'REF004', 'Régional', 8, true, '{}'),
('Moussa', 'Almoustapha', 'Le Vétéran', '1970-09-10', 5, 'moussa-almoustapha.jpg', 'REF005', 'International', 25, false, '{}');

-- =============================================
-- INSERTION DES COMPÉTITIONS
-- Suppression des colonnes obsolètes ('type', 'location', 'registration_deadline', 'max_participants', 'prize_pool')
-- et ajustement de l'INSERT
-- =============================================
INSERT INTO competitions (name, slug, description, region_id, status, featured_image, is_active) VALUES
-- Compétitions actives
('Sabre National 2024', 'sabre-national-2024', 'Championnat national de lutte traditionnelle', 1, 'upcoming', 'sabre-national-2024.jpg', true),
('Coupe Régionale de Dosso', 'coupe-regionale-dosso-2024', 'Tournoi régional de qualification', 2, 'ongoing', 'coupe-dosso-2024.jpg', true),
('Halarou Bakwai 2024', 'halarou-bakwai-2024', 'Compétition traditionnelle ancestrale', 1, 'upcoming', 'halarou-bakwai-2024.jpg', true),

-- Compétitions terminées
('Sabre National 2023', 'sabre-national-2023', 'Championnat national 2023', 1, 'completed', 'sabre-national-2023.jpg', true),
('Coupe Airtel 2023', 'coupe-airtel-2023', 'Sponsorisé par Airtel Niger', 1, 'completed', 'coupe-airtel-2023.jpg', true),

-- Compétitions annulées
('Tournoi Ministériel 2024', 'tournoi-ministriel-2024', 'Compétition ministérielle annulée', 1, 'cancelled', NULL, false),

-- Compétitions reportées
('Tournoi Amical International', 'tournoi-amical-international', 'Rencontre amicale reportée', 1, 'postponed', 'amical-international.jpg', true);

-- =============================================
-- INSERTION DES ÉDITIONS DE COMPÉTITION (ID explicite)
-- =============================================
INSERT INTO competition_editions (
    competition_id, edition_number, year, theme, start_date, end_date,
    winner_fighter_id, is_active, region_id, total_participants, prize_pool, registration_deadline
) VALUES
(1, 44, 2024, 'Édition de la Cohésion', '2024-06-15', '2024-06-25', NULL, true, 1, 0, 5000000.00, '2024-06-01'),
(2, 1, 2024, 'Première Édition Régionale', '2024-03-01', '2024-03-05', NULL, true, 2, 0, 1000000.00, '2024-02-15'),
(3, 15, 2024, 'Retour aux Sources', '2024-07-15', '2024-07-20', NULL, true, 5, 0, 3000000.00, '2024-07-01'),
(4, 43, 2023, 'Édition Historique', '2023-12-10', '2023-12-20', 1, true, 6, 64, 4500000.00, '2023-11-15'),
(5, 5, 2023, 'Coupe des Sponsors', '2023-09-01', '2023-09-05', 1, true, 1, 32, 2000000.00, '2023-08-01');

-- =============================================
-- INSERTION DES PALMARÈS DES LUTTEURS
-- =============================================
INSERT INTO fighter_achievements (
    fighter_id, region_id, title, edition_id, year, position, description, medal_image
) VALUES
(1, 1, 'Champion National', 4, 2023, '1st', 'Victoire en finale contre Moussa Alzouma', 'gold-2023.jpg'),
(1, 1, 'Vainqueur', 5, 2022, '1st', 'Performance exceptionnelle', 'gold-2022.jpg'),
(2, 5, 'Finaliste', 4, 2023, '2nd', 'Finale serrée contre Issa Djibrilla', 'silver-2023.jpg'),
(2, 5, 'Champion', 3, 2022, '1st', 'Victoire en terre ancestrale', 'gold-halarou.jpg'),
(3, 6, 'Champion National', 4, 2021, '1st', 'Règne d''une année', 'gold-2021.jpg'),
(3, 6, 'Troisième', 4, 2023, '3rd', 'Belle performance', 'bronze-2023.jpg'),
(4, 3, 'Vainqueur Régional', 2, 2023, '1st', 'Champion régional', 'gold-tahoua.jpg'),
(5, 2, 'Finaliste Jeune', 4, 2023, '2nd', 'Excellent parcours jeune', 'silver-aes.jpg');

-- =============================================
-- INSCRIPTION DES RÉGIONS AUX ÉDITIONS
-- Suppression de la colonne obsolète 'notes'
-- =============================================
INSERT INTO edition_regions (edition_id, region_id, registration_date, status) VALUES
-- Pour l'édition en cours (ID 2 - Coupe Régionale de Dosso)
(2, 1, '2024-02-01', 'approved'),
(2, 2, '2024-02-01', 'approved'),
(2, 3, '2024-02-02', 'approved'),
(2, 4, '2024-02-02', 'approved'),
(2, 5, '2024-02-03', 'registered'),
(2, 6, '2024-02-03', 'rejected'),

-- Pour l'édition à venir (ID 1 - Sabre National 2024)
(1, 1, '2024-05-01', 'approved'),
(1, 2, '2024-05-01', 'approved'),
(1, 3, '2024-05-02', 'approved'),
(1, 4, '2024-05-02', 'registered');

-- =============================================
-- INSCRIPTION DES LUTTEURS AUX ÉDITIONS
-- Ajout de la colonne 'region_id' et suppression de 'notes'
-- =============================================
INSERT INTO edition_fighters (edition_id, fighter_id, region_id, registration_date, status) VALUES
-- Pour l'édition en cours (ID 2 - Coupe Régionale de Dosso)
(2, 1, 1, '2024-02-10', 'qualified'),
(2, 2, 5, '2024-02-10', 'qualified'),
(2, 3, 6, '2024-02-11', 'qualified'),
(2, 4, 3, '2024-02-11', 'registered'),
(2, 5, 2, '2024-02-12', 'registered'),
(2, 6, 7, '2024-02-12', 'disqualified'),
(2, 7, 4, '2024-02-13', 'withdrawn'),

-- Pour l'édition à venir (ID 1 - Sabre National 2024)
(1, 1, 1, '2024-05-10', 'registered'),
(1, 2, 5, '2024-05-10', 'qualified'),
(1, 3, 6, '2024-05-11', 'registered');

-- =============================================
-- INSERTION DES PHASES
-- =============================================
INSERT INTO phases (edition_id, name, phase_order, is_active, phase_type, description, start_date, end_date, is_completed) VALUES
(2, 'Phase de Groupes', 1, true, 'group', 'Première phase de la compétition', '2024-03-01', '2024-03-03', false),
(2, 'Phase Éliminatoire', 2, false, 'knockout', 'Quarts de finale, demi-finales et finale', '2024-03-04', '2024-03-05', false),
(1, 'Qualifications Régionales', 1, true, 'qualification', 'Tournoi de sélection dans chaque région', '2024-06-05', '2024-06-10', false);

-- =============================================
-- INSERTION DES GROUPES DE PHASES
-- =============================================
INSERT INTO phase_groups (phase_id, name, group_order, description, is_completed, is_active) VALUES
(1, 'Groupe A', 1, 'Régions 1 et 2', false, true),
(1, 'Groupe B', 2, 'Régions 3 et 4', false, true);

-- =============================================
-- INSERTION DES SOUS-GROUPES
-- Remplacement de 'beltX_fighter_id' par 'belt_regionX' (FK à la table 'belt')
-- =============================================
INSERT INTO sub_groups (group_id, name, sub_group_order, description, region1_id, region2_id, belt_region1, belt_region2, main_referee_id, is_completed, is_active) VALUES
-- Sous-groupes avec différents cas (ID 1 est la ceinture 'Rouge' par défaut)
(1, 'Sous-groupe A1', 1, 'Affrontement de champions', 1, 2, 1, 1, 1, false, true),
(1, 'Sous-groupe A2', 2, 'Jeunes contre expérimentés', 3, 4, 1, 1, 2, false, true),
(2, 'Sous-groupe B1', 1, 'Régions du nord', 7, 8, 1, 1, 3, false, true),
(2, 'Sous-groupe B2', 2, 'Régions centrales', 5, 6, 1, 1, 4, false, true);

-- =============================================
-- INSERTION DES MATCHS
-- =============================================
INSERT INTO matches (sub_group_id, match_number, match_date, start_time, end_time, is_active, fighter1_id, fighter2_id, winner_fighter_id, loser_fighter_id, match_result, total_duration, break_count, status, audience_count, video_url, live_stream_url, notes) VALUES
-- Matchs programmés
(1, 1, '2024-03-20 15:00:00', '15:00:00', NULL, true, 1, 2, NULL, NULL, NULL, NULL, 0, 'scheduled', NULL, NULL, 'rtmp://live.kokowa.com/match1', 'Match d''ouverture'),

-- Matchs en direct
(1, 2, '2024-03-20 17:00:00', '17:00:00', NULL, true, 3, 4, NULL, NULL, NULL, '00:15:00', 1, 'live', 5000, NULL, 'rtmp://live.kokowa.com/match2', 'Match de la Panthère'),

-- Matchs terminés
(2, 3, '2024-03-19 19:00:00', '19:00:00', '19:25:00', false, 5, 6, 5, 6, 'fighter1_win', '00:25:00', 2, 'completed', 3000, 'https://youtube.com/match3', NULL, 'Victoire technique');

-- =============================================
-- INSERTION DES CARTONS
-- =============================================
INSERT INTO fighter_cards (fighter_id, match_id, card_type, card_reason, minute_given, is_cancelled) VALUES
(6, 3, 'yellow', 'Comportement antisportif', '00:05:00', false),
(4, 2, 'yellow', 'Refus de se rendre au combat', '00:07:00', false),
(2, 1, 'red', 'Blessure grave', '00:10:00', false);

-- =============================================
-- INSERTION DES TRANSFERTS DE LUTTEURS
-- =============================================
INSERT INTO fighter_transfers (fighter_id, from_region_id, to_region_id, transfer_date, transfer_reason, transfer_fee, contract_duration, is_permanent, approved_by_user_id, status) VALUES
-- Transfert approuvé
(4, 4, 1, '2024-01-15', 'Meilleures conditions d''entraînement', 500000.00, 24, true, 1, 'completed'),

-- Transfert en attente
(5, 2, 3, '2024-02-01', 'Projet sportif ambitieux', 300000.00, 12, false, NULL, 'pending'),

-- Transfert rejeté
(6, 7, 5, '2024-01-20', 'Raison personnelle', 400000.00, 18, true, 1, 'rejected'),

-- Transfert permanent
(8, 8, 6, '2024-02-10', 'Intégration famille', 200000.00, NULL, true, 1, 'approved');

-- =============================================
-- INSERTION DES ARTICLES
-- =============================================
INSERT INTO articles (title, slug, excerpt, content, featured_image, author_id, status, language, view_count, like_count, share_count, meta_title, meta_description, published_at) VALUES
('Le Sabre National 2024 : Ce Qu''il Faut Savoir', 'sabre-national-2024-infos', 'Tout sur le championnat national de lutte traditionnelle', 'Contenu complet de l''article...', 'sabre-2024-article.jpg', 2, 'published', 'fr', 1500, 45, 23, 'Sabre National 2024', 'Informations complètes sur le championnat', '2024-02-15 10:00:00'),
('Interview Exclusive : Issa Djibrilla, le Lion du Désert', 'interview-issa-djibrilla', 'Rencontre avec le champion national en titre', 'Contenu complet de l''interview...', 'issa-interview.jpg', 2, 'published', 'fr', 800, 30, 15, 'Interview Issa Djibrilla', 'Le champion nous parle de ses projets', '2024-02-20 12:00:00');

-- =============================================
-- INSERTION DES MEDIA
-- =============================================
INSERT INTO media (title, file_path, file_type, mime_type, file_size, alt_text, description, uploader_id, is_featured, entity_type, entity_id) VALUES
('Photo Sabre National', 'media/sabre-2024-main.jpg', 'image', 'image/jpeg', 512000, 'Image du Sabre National', 'Photo de l''arène principale', 1, true, 'competition', 1),
('Vidéo Entraînement', 'media/training-video.mp4', 'video', 'video/mp4', 10240000, 'Vidéo d''entraînement', 'Séance d''entraînement des lutteurs', 1, false, 'fighter', 1);

-- =============================================
-- INSERTION DES VIDEOS
-- =============================================
INSERT INTO videos (title, slug, description, video_url, thumbnail_url, duration, type, category, view_count, like_count, is_live, is_featured, published_at) VALUES
('Finale Sabre National 2023', 'finale-sabre-2023', 'Finale du championnat national 2023', 'https://youtube.com/finale2023', 'finale2023-thumb.jpg', 1200, 'youtube', 'match', 15000, 1200, false, false, '2024-02-10 15:00:00'),
('Live : Coupe de Dosso', 'live-coupe-dosso', 'Match en direct de la coupe', 'rtmp://live.kokowa.com/main', 'live-dosso-thumb.jpg', NULL, 'rtmp', 'match', 0, 0, true, true, '2024-03-20 14:00:00');

-- =============================================
-- INSERTION DES MESSAGES
-- =============================================
INSERT INTO messages (content, message_type, entity_type, entity_id, author_id, recipient_id, parent_message_id, is_read, is_active, is_deleted, like_count, images, video_url, audio_url) VALUES
('Super match ! Issa est en pleine forme cette année.', 'comment', 'match', 1, 6, NULL, NULL, true, true, false, 5, NULL, NULL, NULL),
('Félicitations au champion !', 'comment', 'fighter', 1, 7, NULL, 1, false, true, false, 2, NULL, NULL, NULL),
('Bonjour, je voudrais parler des résultats.', 'direct_message', 'user', 1, 6, 1, NULL, true, true, false, 0, NULL, NULL, NULL);

-- =============================================
-- INSERTION DES INTERACTIONS
-- =============================================
INSERT INTO interactions (user_id, entity_type, entity_id, interaction_type) VALUES
(6, 'article', 1, 'like'),
(7, 'article', 1, 'like'),
(6, 'video', 1, 'view'),
(7, 'video', 1, 'like'),
(6, 'fighter', 1, 'follow'),
(7, 'fighter', 2, 'follow');

-- =============================================
-- MISE À JOUR DES COMPTEURS AUTOMATIQUES
-- =============================================
-- Mise à jour manuelle des totaux pour les régions
UPDATE regions SET total_fighters = (
    SELECT COUNT(*) FROM fighters 
    WHERE region_id = regions.id AND is_active = true
);

-- Mise à jour des champions par région
UPDATE regions SET total_champions = (
    SELECT COUNT(*) FROM fighters 
    WHERE region_id = regions.id AND is_champion = true AND is_active = true
);

-- Mise à jour des participants aux éditions
UPDATE competition_editions SET total_participants = (
    SELECT COUNT(*) FROM edition_fighters 
    WHERE edition_id = competition_editions.id AND status IN ('registered', 'qualified')
) + (
    SELECT COUNT(*) FROM edition_regions 
    WHERE edition_id = competition_editions.id AND status = 'approved'
);

-- =============================================
-- INSERTION DES MEMBRES DE L'ÉQUIPE (TEAM)
-- =============================================
INSERT INTO team_members (full_name, role, avatar_url, bio, social_links, badges, expertise, languages, is_lead, is_active, years_experience, projects_count, contributions_count, position_order, joined_date) VALUES
('Abdoulaye Mamane', 'Lead Developer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop', 'Expert en développement web avec plus de 10 ans d''expérience.', '[{"platform": "GitHub", "url": "https://github.com"}, {"platform": "LinkedIn", "url": "https://linkedin.com"}]', '["MVP 2023", "Lead"]', '["Next.js", "PostgreSQL", "Node.js"]', '["Français", "Anglais", "Haoussa"]', true, true, 10, 25, 1500, 1, '2022-01-10'),
('Fatima Soumana', 'UI/UX Designer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop', 'Passionnée par le design centré utilisateur et les interfaces modernes.', '[{"platform": "Behance", "url": "https://behance.net"}, {"platform": "Dribbble", "url": "https://dribbble.com"}]', '["Top Designer"]', '["Figma", "Adobe XD", "Tailwind CSS"]', '["Français", "Zarma"]', false, true, 5, 15, 800, 2, '2022-03-15'),
('Idrissa Oumarou', 'Backend Engineer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop', 'Spécialiste en architectures distribuées et bases de données.', '[{"platform": "GitHub", "url": "https://github.com"}]', '["Cloud Expert"]', '["Go", "Python", "Docker"]', '["Français", "Anglais"]', false, true, 7, 20, 1200, 3, '2022-06-01'),
('Zainab Moussa', 'Project Manager', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&auto=format&fit=crop', 'Garantit le respect des délais et la qualité des livrables.', '[{"platform": "LinkedIn", "url": "https://linkedin.com"}]', '["PMP Certified"]', '["Agile", "Scrum", "Jira"]', '["Français", "Anglais"]', false, true, 8, 30, 500, 4, '2022-09-20');

-- achievements
INSERT INTO team_achievements (team_member_id, title, description, achievement_date, category, icon, color) VALUES
(1, 'Lancement Kokowa TV', 'Développement de l''architecture principale de la plateforme.', '2023-10-01', 'Projet', 'code', '#3B82F6'),
(1, 'Optimisation SQL', 'Réduction du temps de réponse des requêtes de 50%.', '2023-12-15', 'Performance', 'database', '#10B981'),
(2, 'Refonte Design 2.0', 'Nouvelle charte graphique premium pour l''application mobile.', '2024-01-20', 'Design', 'palette', '#EC4899'),
(4, 'Certification PMP', 'Obtention de la certification Project Management Professional.', '2023-05-10', 'Certification', 'award', '#F59E0B');