const { query } = require('../lib/db/neon-client');

async function showStats() {
  try {
    console.log('📊 Statistiques de la base Neon');
    console.log('================================');

    // Stats générales
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM regions) as regions,
        (SELECT COUNT(*) FROM fighters) as fighters,
        (SELECT COUNT(*) FROM fighters WHERE is_active = true) as fighters_actifs,
        (SELECT COUNT(*) FROM competitions) as competitions,
        (SELECT COUNT(*) FROM phases) as phases,
        (SELECT COUNT(*) FROM matches) as matches,
        (SELECT COUNT(*) FROM fighter_transfers) as transfers,
        (SELECT COUNT(*) FROM fighter_achievements) as achievements
    `);

    console.log(`📍 Régions: ${stats[0].regions}`);
    console.log(`🤼 Lutteurs: ${stats[0].fighters} (${stats[0].fighters_actifs} actifs)`);
    console.log(`🏆 Compétitions: ${stats[0].competitions}`);
    console.log(`📋 Phases: ${stats[0].phases}`);
    console.log(`⚔️ Matchs: ${stats[0].matches}`);
    console.log(`🔄 Transferts: ${stats[0].transfers}`);
    console.log(`🎖️ Palmarès: ${stats[0].achievements}`);

    // Derniers lutteurs ajoutés
    const derniersLutteurs = await query(`
      SELECT first_name, last_name, nickname, created_at 
      FROM fighters 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    console.log('\n🆕 Derniers lutteurs:');
    derniersLutteurs.forEach(l => {
      const fullName = `${l.first_name} ${l.last_name}`;
      console.log(`   • ${fullName} ${l.nickname ? `"${l.nickname}"` : ''} - ${new Date(l.created_at).toLocaleDateString('fr-FR')}`);
    });

    // Prochaines compétitions
    const prochainesCompetitions = await query(`
      SELECT name, start_date 
      FROM competition_editions ce
      JOIN competitions c ON ce.competition_id = c.id
      WHERE ce.start_date >= CURRENT_DATE 
      ORDER BY ce.start_date ASC 
      LIMIT 3
    `);

    console.log('\n📅 Prochaines compétitions:');
    prochainesCompetitions.forEach(c => {
      console.log(`   • ${c.name} - ${new Date(c.start_date).toLocaleDateString('fr-FR')}`);
    });

  } catch (error) {
    console.error('❌ Erreur stats:', error);
  }
}

showStats();