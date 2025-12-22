-- Création de la base de données (à exécuter séparément)
-- CREATE DATABASE kokowa_tv;

-- Extension pour les UUID si besoin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USER
CREATE TABLE "user" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'MODERATOR', 'USER')) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REGION
CREATE TABLE region (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LUTTEUR
CREATE TABLE lutteur (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  surnom VARCHAR(100),
  date_naissance DATE,
  region_id INTEGER REFERENCES region(id) ON DELETE SET NULL,
  poids INTEGER,
  actif BOOLEAN DEFAULT TRUE,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMPETITION
CREATE TABLE competition (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  lieu VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PHASE (quart, demi, finale...)
CREATE TABLE phase (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER REFERENCES competition(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL
);

-- MATCH (face-à-face) - on utilise matchs pour éviter le mot réservé
CREATE TABLE matchs (
  id SERIAL PRIMARY KEY,
  phase_id INTEGER REFERENCES phase(id) ON DELETE CASCADE,
  lutteur_a INTEGER REFERENCES lutteur(id),
  lutteur_b INTEGER REFERENCES lutteur(id),
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  statut VARCHAR(20) CHECK (statut IN ('SCHEDULED', 'FINISHED', 'CANCELLED')) DEFAULT 'SCHEDULED',
  scheduled_at TIMESTAMP
);

-- TRANSFERT
CREATE TABLE transfert (
  id SERIAL PRIMARY KEY,
  lutteur_id INTEGER REFERENCES lutteur(id),
  from_region INTEGER REFERENCES region(id),
  to_region INTEGER REFERENCES region(id),
  date_transfert DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PALMARES (titres)
CREATE TABLE palmares (
  id SERIAL PRIMARY KEY,
  lutteur_id INTEGER REFERENCES lutteur(id),
  competition_id INTEGER REFERENCES competition(id),
  year INTEGER NOT NULL,
  position VARCHAR(50) NOT NULL,
  UNIQUE(lutteur_id, competition_id, year)
);

-- Index pour les performances
CREATE INDEX idx_lutteur_region ON lutteur(region_id);
CREATE INDEX idx_lutteur_actif ON lutteur(actif);
CREATE INDEX idx_competition_date ON competition(date);
CREATE INDEX idx_matchs_phase ON matchs(phase_id);
CREATE INDEX idx_matchs_statut ON matchs(statut);
CREATE INDEX idx_phase_competition ON phase(competition_id);
CREATE INDEX idx_transfert_lutteur ON transfert(lutteur_id);
CREATE INDEX idx_palmares_lutteur ON palmares(lutteur_id);
CREATE INDEX idx_palmares_competition ON palmares(competition_id);