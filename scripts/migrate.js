const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  // Utiliser DATABASE_URL pour Neon
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🚀 Connexion à Neon établie');

    // Lecture du schéma PostgreSQL
    const schemaPath = path.join(__dirname, '../database/schema-postgres.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Exécution du schéma...');
    await client.query(schemaSQL);
    console.log('✅ Schéma créé avec succès');

    // Lecture des données de test
    const seedPath = path.join(__dirname, '../database/seed-postgres.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Insertion des données...');
    await client.query(seedSQL);
    console.log('✅ Données insérées avec succès');

    console.log('🎉 Migration Neon terminée !');

  } catch (error) {
    console.error('❌ Erreur migration Neon:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();