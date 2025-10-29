const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function resetDatabase() {
  // Utiliser DATABASE_URL_UNPOOLED pour les opérations DDL
  const client = new Client({
    connectionString: process.env.DATABASE_URL_UNPOOLED,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🔄 Connexion à Neon pour réinitialisation...');

    // Lecture du schéma
    const schemaPath = path.join(__dirname, '../database/schema-postgres.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Supprimer et recréer toutes les tables
    console.log('🗑️  Nettoyage des tables existantes...');
    
    // Désactiver les contraintes temporairement
    await client.query('DROP TABLE IF EXISTS palmares CASCADE');
    await client.query('DROP TABLE IF EXISTS transfert CASCADE');
    await client.query('DROP TABLE IF EXISTS matchs CASCADE');
    await client.query('DROP TABLE IF EXISTS phase CASCADE');
    await client.query('DROP TABLE IF EXISTS competition CASCADE');
    await client.query('DROP TABLE IF EXISTS lutteur CASCADE');
    await client.query('DROP TABLE IF EXISTS region CASCADE');
    await client.query('DROP TABLE IF EXISTS "user" CASCADE');

    console.log('✅ Anciennes tables supprimées');

    // Recréer le schéma
    console.log('📝 Recréation du schéma...');
    await client.query(schemaSQL);
    console.log('✅ Schéma recréé');

    // Insérer les données
    const seedPath = path.join(__dirname, '../database/seed-postgres.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Insertion des données...');
    await client.query(seedSQL);
    console.log('✅ Données insérées');

    console.log('🎉 Base Neon réinitialisée avec succès !');

  } catch (error) {
    console.error('❌ Erreur réinitialisation Neon:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();