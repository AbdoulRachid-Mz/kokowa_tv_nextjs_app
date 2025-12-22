import { query, queryOne } from './neon-client';

export async function testNeonConnection() {
  try {
    const result = await query('SELECT version() as version, NOW() as current_time');
    console.log('✅ Connexion Neon réussie');
    console.log('📊 Version PostgreSQL:', result[0].version);
    console.log('⏰ Heure serveur:', result[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion Neon:', error);
    return false;
  }
}

export async function testNeonQueries() {
  try {
    // Test des tables
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Tables disponibles:', tables.map(t => t.table_name));

    // Test des régions
    const regions = await query('SELECT COUNT(*) as count FROM region');
    console.log(`📍 Régions: ${regions[0].count}`);

    // Test des lutteurs
    const lutteurs = await query('SELECT COUNT(*) as count FROM lutteur');
    console.log(`🤼 Lutteurs: ${lutteurs[0].count}`);

    // Test des compétitions
    const competitions = await query('SELECT COUNT(*) as count FROM competition');
    console.log(`🏆 Compétitions: ${competitions[0].count}`);

    return true;
  } catch (error) {
    console.error('❌ Erreur tests Neon:', error);
    return false;
  }
}