const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('🔄 Réinitialisation de la base de données...');
    
    await connection.query('DROP DATABASE IF EXISTS lutteurs_db');
    console.log('✅ Ancienne base supprimée');
    
    await connection.query('CREATE DATABASE lutteurs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Nouvelle base créée');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetDatabase();