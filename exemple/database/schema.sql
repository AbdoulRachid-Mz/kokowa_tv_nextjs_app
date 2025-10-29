-- Création de la base de données
CREATE DATABASE IF NOT EXISTS kokowa_tv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kokowa_tv;

-- USER
CREATE TABLE user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','MODERATOR','USER') DEFAULT 'USER',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_role (role)
);

-- REGION
CREATE TABLE region (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LUTTEUR
CREATE TABLE lutteur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  surnom VARCHAR(100),
  date_naissance DATE,
  region_id INT,
  poids INT,
  actif BOOLEAN DEFAULT TRUE,
  photo_url VARCHAR(512),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE SET NULL,
  INDEX idx_region (region_id),
  INDEX idx_actif (actif)
);

-- COMPETITION
CREATE TABLE competition (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  lieu VARCHAR(255),
  date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date (date)
);

-- PHASE (quart, demi, finale...)
CREATE TABLE phase (
  id INT AUTO_INCREMENT PRIMARY KEY,
  competition_id INT,
  name VARCHAR(100),
  position INT,
  FOREIGN KEY (competition_id) REFERENCES competition(id) ON DELETE CASCADE,
  INDEX idx_competition (competition_id),
  INDEX idx_position (position)
);

-- MATCH (face-à-face)
CREATE TABLE `match` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phase_id INT,
  lutteur_a INT,
  lutteur_b INT,
  score_a INT DEFAULT 0,
  score_b INT DEFAULT 0,
  statut ENUM('SCHEDULED','FINISHED','CANCELLED') DEFAULT 'SCHEDULED',
  scheduled_at DATETIME,
  FOREIGN KEY (phase_id) REFERENCES phase(id) ON DELETE CASCADE,
  FOREIGN KEY (lutteur_a) REFERENCES lutteur(id),
  FOREIGN KEY (lutteur_b) REFERENCES lutteur(id),
  INDEX idx_phase (phase_id),
  INDEX idx_statut (statut),
  INDEX idx_scheduled (scheduled_at),
  INDEX idx_lutteurs (lutteur_a, lutteur_b)
);

-- TRANSFERT
CREATE TABLE transfert (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lutteur_id INT,
  from_region INT,
  to_region INT,
  date_transfert DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lutteur_id) REFERENCES lutteur(id),
  INDEX idx_lutteur (lutteur_id),
  INDEX idx_date (date_transfert)
);

-- PALMARES (titres)
CREATE TABLE palmares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lutteur_id INT,
  competition_id INT,
  year INT,
  position VARCHAR(50), -- champion, second, etc
  FOREIGN KEY (lutteur_id) REFERENCES lutteur(id),
  FOREIGN KEY (competition_id) REFERENCES competition(id),
  INDEX idx_lutteur (lutteur_id),
  INDEX idx_competition (competition_id),
  UNIQUE KEY unique_palmares (lutteur_id, competition_id, year)
);