import { query } from './connection';

export async function testConnection() {
  try {
    const result = await query('SELECT 1 as test');
    console.log('✅ Connexion à la base de données réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
}

export async function testQueries() {
  try {
    // Test des régions
    const regions = await query('SELECT COUNT(*) as count FROM region');
    console.log(`📊 Régions dans la base: ${regions[0].count}`);

    // Test des lutteurs
    const lutteurs = await query('SELECT COUNT(*) as count FROM lutteur');
    console.log(`🤼 Lutteurs dans la base: ${lutteurs[0].count}`);

    // Test des compétitions
    const competitions = await query('SELECT COUNT(*) as count FROM competition');
    console.log(`🏆 Compétitions dans la base: ${competitions[0].count}`);

    return true;
  } catch (error) {
    console.error('❌ Erreur lors des tests de requêtes:', error);
    return false;
  }
}