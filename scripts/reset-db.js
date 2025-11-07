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
    const schemaPath = path.join(__dirname, '../database/database.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    // Supprimer et recréer toutes les tables
    console.log('🗑️  Nettoyage des tables existantes...');
    
    // Drop tables in reverse dependency order to avoid constraint errors
    await client.query('DROP TABLE IF EXISTS fighter_cards CASCADE');
    await client.query('DROP TABLE IF EXISTS matches CASCADE');
    await client.query('DROP TABLE IF EXISTS sub_groups CASCADE');
    await client.query('DROP TABLE IF EXISTS phase_groups CASCADE');
    await client.query('DROP TABLE IF EXISTS phases CASCADE');
    await client.query('DROP TABLE IF EXISTS edition_fighters CASCADE');
    await client.query('DROP TABLE IF EXISTS edition_regions CASCADE');
    await client.query('DROP TABLE IF EXISTS competition_editions CASCADE');
    await client.query('DROP TABLE IF EXISTS fighter_achievements CASCADE');
    await client.query('DROP TABLE IF EXISTS fighter_transfers CASCADE');
    await client.query('DROP TABLE IF EXISTS belt CASCADE');
    await client.query('DROP TABLE IF EXISTS competitions CASCADE');
    await client.query('DROP TABLE IF EXISTS referees CASCADE');
    await client.query('DROP TABLE IF EXISTS fighters CASCADE');
    await client.query('DROP TABLE IF EXISTS interactions CASCADE');
    await client.query('DROP TABLE IF EXISTS videos CASCADE');
    await client.query('DROP TABLE IF EXISTS media CASCADE');
    await client.query('DROP TABLE IF EXISTS articles CASCADE');
    await client.query('DROP TABLE IF EXISTS messages CASCADE');
    await client.query('DROP TABLE IF EXISTS regions CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('✅ Anciennes tables supprimées');

    // Recréer le schéma
    console.log('📝 Recréation du schéma...');
    await client.query(schemaSQL);
    console.log('✅ Schéma recréé');

    // Insérer les données
    const seedPath = path.join(__dirname, '../database/seed.sql');
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