-- Insertion des régions
INSERT INTO region (name, code) VALUES
('Dakar', 'DK'),
('Niger', 'Ny'),
('Thiès', 'TH'),
('Saint-Louis', 'SL'),
('Kaolack', 'KL'),
('Ziguinchor', 'ZG'),
('Diourbel', 'DB'),
('Louga', 'LG'),
('Tambacounda', 'TB'),
('Kolda', 'KD'),
('Fatick', 'FK'),
('Kaffrine', 'KF'),
('Kédougou', 'KG'),
('Sédhiou', 'SD'),
('Matam', 'MT');

-- Insertion des utilisateurs
INSERT INTO "user" (username, email, password_hash, role) VALUES
('admin_kokowa', 'admin@kokowa.tv', '$2b$10$ExampleHashForAdmin', 'ADMIN'),
('modo_sports', 'modo@kokowa.tv', '$2b$10$ExampleHashForModo', 'MODERATOR'),
('user_lambda', 'user@example.com', '$2b$10$ExampleHashForUser', 'USER');

-- Insertion des lutteurs
INSERT INTO lutteur (nom, surnom, date_naissance, region_id, poids, photo_url) VALUES
('Modou Lo', 'Bombardier', '1990-05-15', 1, 85, '/images/lutteurs/modou_lo.jpg'),
('Pape Diouf', 'Taureau', '1988-08-22', 2, 92, '/images/lutteurs/pape_diouf.jpg'),
('Ibrahima Ndiaye', 'Faucon', '1992-03-10', 3, 78, '/images/lutteurs/ibrahima_ndiaye.jpg'),
('Moussa Fall', 'Éléphant', '1985-11-30', 1, 105, '/images/lutteurs/moussa_fall.jpg'),
('Cheikh Tidiane', 'Panthère', '1991-07-18', 4, 88, '/images/lutteurs/cheikh_tidiane.jpg'),
('Oumar Ba', 'Lion', '1989-12-05', 2, 95, '/images/lutteurs/oumar_ba.jpg'),
('Alioune Badara', 'Requin', '1993-09-25', 5, 82, '/images/lutteurs/alioune_badara.jpg'),
('Mamadou Kane', 'Buffle', '1987-04-12', 1, 98, '/images/lutteurs/mamadou_kane.jpg');

-- Insertion des compétitions
INSERT INTO competition (title, description, lieu, date) VALUES
('Championnat National 2024', 'Finale du championnat national de lutte sénégalaise', 'Stade Demba Diop, Dakar', '2024-12-15'),
('Tournoi de l''Indépendance', 'Tournoi international de lutte traditionnelle', 'Arena Sportive, Thiès', '2024-04-04'),
('Coupe du Président', 'Compétition annuelle sous le haut patronage du Président', 'Stade Lat-Dior, Saint-Louis', '2024-07-20'),
('Challenge des Étoiles', 'Tournoi réunissant les meilleurs lutteurs du pays', 'Complexe Sportif, Kaolack', '2024-09-08');

-- Insertion des phases pour la compétition 1
INSERT INTO phase (competition_id, name, position) VALUES
(1, 'Quarts de finale', 1),
(1, 'Demi-finales', 2),
(1, 'Finale', 3);

-- Insertion des matchs (table matchs au lieu de match)
INSERT INTO matchs (phase_id, lutteur_a, lutteur_b, scheduled_at, statut) VALUES
-- Quarts de finale
(1, 1, 2, '2024-12-15 14:00:00', 'SCHEDULED'),
(1, 3, 4, '2024-12-15 15:30:00', 'SCHEDULED'),
(1, 5, 6, '2024-12-15 17:00:00', 'SCHEDULED'),
(1, 7, 8, '2024-12-15 18:30:00', 'SCHEDULED');

-- Insertion des transferts
INSERT INTO transfert (lutteur_id, from_region, to_region, date_transfert, notes) VALUES
(1, 2, 1, '2023-11-10', 'Transfert record vers Dakar'),
(4, 3, 1, '2023-08-15', 'Signature avec nouveau promoteur'),
(6, 4, 2, '2024-01-20', 'Retour dans sa région natale');

-- Insertion du palmarès
INSERT INTO palmares (lutteur_id, competition_id, year, position) VALUES
(2, 1, 2023, 'Champion'),
(4, 1, 2023, 'Finaliste'),
(1, 2, 2023, 'Champion'),
(3, 3, 2023, 'Champion'),
(5, 4, 2023, 'Champion');