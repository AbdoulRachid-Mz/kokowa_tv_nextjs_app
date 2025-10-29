const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Connexion sans base spécifique pour créer la DB si elle n'existe pas
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('🚀 Début de la migration...');

    // Lecture du schéma SQL
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Exécution du schéma
    await connection.query(schemaSQL);
    console.log('✅ Schéma de base de données créé avec succès');

    // Lecture des données de test
    const seedPath = path.join(__dirname, '../database/seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    // Exécution des données de test
    await connection.query(seedSQL);
    console.log('✅ Données de test insérées avec succès');

    console.log('🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();