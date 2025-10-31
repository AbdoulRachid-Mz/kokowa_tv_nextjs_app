-- =============================================
-- DONNÉES DE TEST POUR LA LUTTE TRADITIONNELLE
-- =============================================

-- Insertion des régions
INSERT INTO regions (name, code, description, color) VALUES
('Niamey', 'NIA', 'Région de Niamey, capitale du Niger', '#FF6B35'),
('Dosso', 'DOS', 'Région de Dosso, terre des Zarmas', '#004E89'),
('Tillabéri', 'TIL', 'Région de Tillabéri, zone frontalière', '#1A936F'),
('Tahoua', 'TAH', 'Région de Tahoua, carrefour commercial', '#114B5F'),
('Maradi', 'MAR', 'Région de Maradi, poumon économique', '#F45B69'),
('Zinder', 'ZIN', 'Région de Zinder, ancienne capitale', '#6B2737');

-- Insertion des villes
INSERT INTO cities (name, region_id, description) VALUES
('Niamey I', 1, 'Commune I de Niamey'),
('Niamey II', 1, 'Commune II de Niamey'),
('Niamey III', 1, 'Commune III de Niamey'),
('Dosso Ville', 2, 'Chef-lieu de la région de Dosso'),
('Gaya', 2, 'Ville frontalière avec le Nigeria'),
('Tillabéri Ville', 3, 'Chef-lieu de la région de Tillabéri'),
('Tahoua Ville', 4, 'Chef-lieu de la région de Tahoua'),
('Maradi Ville', 5, 'Chef-lieu de la région de Maradi'),
('Zinder Ville', 6, 'Chef-lieu de la région de Zinder');

-- Insertion des lutteurs
INSERT INTO fighters (
  first_name, last_name, nickname, birth_date, birth_place, region_id, city_id,
  height, weight, bio, fighting_style, debut_year, ranking, is_active, is_champion
) VALUES
('Issa', 'Dossou', 'Le Lion de Gaya', '1990-05-15', 'Gaya', 2, 5, 1.85, 98.5, 
 'Champion incontesté de la région Dosso', 'Style traditionnel Dosso', 2008, 1, true, true),

('Moussa', 'Tahirou', 'La Panthère', '1992-08-22', 'Niamey', 1, 1, 1.78, 92.0,
 'Jeune prodige de la capitale', 'Style rapide et technique', 2010, 2, true, false),

('Boubacar', 'Saidou', 'Le Rocher', '1988-12-10', 'Tillabéri', 3, 6, 1.92, 105.0,
 'Vétéran expérimenté', 'Style de force pure', 2005, 3, true, false),

('Hamidou', 'Abdou', 'L''Éclair', '1995-03-30', 'Maradi', 5, 8, 1.75, 88.0,
 'Connu pour sa vitesse exceptionnelle', 'Style rapide et imprévisible', 2013, 4, true, false),

('Kader', 'Ibrahim', 'Le Guerrier', '1993-07-18', 'Zinder', 6, 9, 1.80, 95.0,
 'Héritier d''une longue tradition', 'Style technique et stratégique', 2011, 5, true, false),

('Ali', 'Mamoudou', 'Le Sage', '1985-11-25', 'Tahoua', 4, 7, 1.82, 97.0,
 'Vétéran respecté par tous', 'Style traditionnel éprouvé', 2003, 6, true, false);

-- Insertion des palmarès
INSERT INTO fighter_achievements (fighter_id, title, competition, year, position, description) VALUES
(1, 'Champion National', 'Sabre National 2023', 2023, '1st', 'Victoire en finale contre Moussa Tahirou'),
(1, 'Vainqueur Coupe', 'Coupe des Régions 2022', 2022, '1st', 'Performance remarquable tout au long du tournoi'),
(2, 'Finaliste National', 'Sabre National 2023', 2023, '2nd', 'Belle performance en finale'),
(2, 'Meilleur Jeune', 'Tournoi de l''Espoir 2021', 2021, '1st', 'Récompense du meilleur jeune lutteur'),
(3, 'Champion Régional', 'Championnat Tillabéri 2022', 2022, '1st', 'Domination totale dans sa région'),
(4, 'Vainqueur International', 'Tournoi Sahel 2023', 2023, '1st', 'Victoire face à des lutteurs internationaux');

-- Insertion des arbitres
INSERT INTO referees (
  first_name, last_name, nickname, birth_date, region_id, license_number,
  certification_level, experience_years, is_active
) VALUES
('Mahamadou', 'Issoufou', 'Le Justicier', '1975-04-12', 1, 'ARB-NIG-001',
 'Niveau National', 15, true),

('Amina', 'Harouna', 'L''Impartiale', '1980-09-08', 1, 'ARB-NIG-002',
 'Niveau International', 12, true),

('Sani', 'Bako', 'L''Expérimenté', '1970-11-30', 2, 'ARB-NIG-003',
 'Niveau National', 25, true);

-- Insertion des compétitions
INSERT INTO competitions (
  name, slug, description, type, location, region_id,
  status, max_participants, prize_pool
) VALUES
('Sabre National', 'sabre-national', 'Championnat national de lutte traditionnelle',
 'sabre_national', 'Stade Général Seyni Kountché, Niamey', 1,
 'upcoming', 32, 5000000.00),

('Coupe des Régions', 'coupe-regions', 'Compétition inter-régionale',
 'coupe_regionale', 'Dosso', 2,
 'upcoming', 16, 2500000.00),

('Tournoi International du Sahel', 'tournoi-sahel', 'Compétition internationale',
 'aes', 'Niamey', 1,
 'upcoming', 24, 10000000.00);

-- Insertion des éditions de compétitions
INSERT INTO competition_editions (competition_id, edition_number, year, theme, start_date, end_date) VALUES
(1, 2024, 2024, 'Unité et Tradition', '2024-03-15', '2024-03-20'),
(2, 2024, 2024, 'Excellence Régionale', '2024-05-01', '2024-05-05'),
(3, 2024, 2024, 'Fraternité Sahélienne', '2024-07-10', '2024-07-15');

-- Inscription des lutteurs à l'édition 2024 du Sabre National
INSERT INTO edition_fighters (edition_id, fighter_id, status) VALUES
(1, 1, 'registered'),
(1, 2, 'registered'),
(1, 3, 'registered'),
(1, 4, 'registered'),
(1, 5, 'registered'),
(1, 6, 'registered');

-- Inscription des régions à la Coupe des Régions 2024
INSERT INTO edition_regions (edition_id, region_id, status) VALUES
(2, 1, 'approved'),
(2, 2, 'approved'),
(2, 3, 'approved'),
(2, 4, 'approved'),
(2, 5, 'approved'),
(2, 6, 'approved');

-- Insertion des phases pour l'édition 2024 du Sabre National
INSERT INTO phases (edition_id, name, phase_order, phase_type, start_date, end_date) VALUES
(1, 'Phase de qualification', 1, 'qualification', '2024-03-15', '2024-03-16'),
(1, 'Quarts de finale', 2, 'quarterfinal', '2024-03-17', '2024-03-17'),
(1, 'Demi-finales', 3, 'semifinal', '2024-03-18', '2024-03-18'),
(1, 'Finale', 4, 'final', '2024-03-20', '2024-03-20');

-- Insertion des groupes pour la phase de qualification
INSERT INTO phase_groups (phase_id, name, group_order) VALUES
(1, 'Groupe A', 1),
(1, 'Groupe B', 2);

-- Insertion des sous-groupes
INSERT INTO sub_groups (group_id, name, sub_group_order, belt1_fighter_id, belt2_fighter_id) VALUES
(1, 'Sous-groupe A1', 1, 1, 2),
(1, 'Sous-groupe A2', 2, 3, 4),
(2, 'Sous-groupe B1', 1, 5, 6);

-- Insertion des matchs
INSERT INTO matches (
  sub_group_id, match_number, match_date, fighter1_id, fighter2_id,
  score_fighter1, score_fighter2, rounds, status, main_referee_id, venue
) VALUES
(1, 1, '2024-03-15 10:00:00', 1, 2, 3, 1, 2, 'completed', 1, 'Stade Kountché - Terrain Central'),
(1, 2, '2024-03-15 14:00:00', 3, 4, 2, 2, 3, 'completed', 2, 'Stade Kountché - Terrain Central'),
(2, 1, '2024-03-16 10:00:00', 5, 6, 1, 3, 2, 'completed', 3, 'Stade Kountché - Terrain Central');

-- Insertion des assignations d'arbitres
INSERT INTO referee_assignments (referee_id, match_id, role) VALUES
(1, 1, 'main_referee'),
(2, 1, 'assistant_referee'),
(2, 2, 'main_referee'),
(3, 2, 'assistant_referee'),
(3, 3, 'main_referee'),
(1, 3, 'assistant_referee');

-- Insertion des utilisateurs (administrateurs et modérateurs)
INSERT INTO users (
  username, email, password_hash, role, first_name, last_name, is_active, is_verified
) VALUES
('admin', 'admin@lutte.ni', '$2b$10$ExampleHashForDemo', 'admin', 'System', 'Administrator', true, true),
('mod1', 'mod1@lutte.ni', '$2b$10$ExampleHashForDemo', 'moderator', 'Moderator', 'One', true, true),
('editor1', 'editor1@lutte.ni', '$2b$10$ExampleHashForDemo', 'editor', 'Editor', 'One', true, true);

-- Mise à jour des compteurs de régions
UPDATE regions SET total_fighters = (
  SELECT COUNT(*) FROM fighters WHERE region_id = regions.id AND is_active = true
);

UPDATE regions SET total_champions = (
  SELECT COUNT(*) FROM fighters WHERE region_id = regions.id AND is_champion = true
);

-- Mise à jour des participants aux éditions
UPDATE competition_editions SET total_participants = (
  SELECT COUNT(*) FROM edition_fighters WHERE edition_id = competition_editions.id AND status = 'registered'
) + (
  SELECT COUNT(*) FROM edition_regions WHERE edition_id = competition_editions.id AND status = 'approved'
);