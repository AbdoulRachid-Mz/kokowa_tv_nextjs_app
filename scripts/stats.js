const { query } = require('../lib/db/neon-client');

async function showStats() {
  try {
    console.log('📊 Statistiques de la base Neon');
    console.log('================================');

    // Stats générales
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM region) as regions,
        (SELECT COUNT(*) FROM lutteur) as lutteurs,
        (SELECT COUNT(*) FROM lutteur WHERE actif = true) as lutteurs_actifs,
        (SELECT COUNT(*) FROM competition) as competitions,
        (SELECT COUNT(*) FROM phase) as phases,
        (SELECT COUNT(*) FROM matchs) as matchs,
        (SELECT COUNT(*) FROM transfert) as transferts,
        (SELECT COUNT(*) FROM palmares) as palmares
    `);

    console.log(`📍 Régions: ${stats[0].regions}`);
    console.log(`🤼 Lutteurs: ${stats[0].lutteurs} (${stats[0].lutteurs_actifs} actifs)`);
    console.log(`🏆 Compétitions: ${stats[0].competitions}`);
    console.log(`📋 Phases: ${stats[0].phases}`);
    console.log(`⚔️ Matchs: ${stats[0].matchs}`);
    console.log(`🔄 Transferts: ${stats[0].transferts}`);
    console.log(`🎖️ Palmarès: ${stats[0].palmares}`);

    // Derniers lutteurs ajoutés
    const derniersLutteurs = await query(`
      SELECT nom, surnom, created_at 
      FROM lutteur 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    console.log('\n🆕 Derniers lutteurs:');
    derniersLutteurs.forEach(l => {
      console.log(`   • ${l.nom} ${l.surnom ? `"${l.surnom}"` : ''} - ${new Date(l.created_at).toLocaleDateString('fr-FR')}`);
    });

    // Prochaines compétitions
    const prochainesCompetitions = await query(`
      SELECT title, date 
      FROM competition 
      WHERE date >= CURRENT_DATE 
      ORDER BY date ASC 
      LIMIT 3
    `);

    console.log('\n📅 Prochaines compétitions:');
    prochainesCompetitions.forEach(c => {
      console.log(`   • ${c.title} - ${new Date(c.date).toLocaleDateString('fr-FR')}`);
    });

  } catch (error) {
    console.error('❌ Erreur stats:', error);
  }
}

showStats();