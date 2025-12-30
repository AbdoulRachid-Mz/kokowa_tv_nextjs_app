// scripts/update-migration.js
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runUpdateMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("🚀 Connexion à Neon établie pour la mise à jour");

    // Lire le script de migration
    const migrationPath = path.join(__dirname, "../database/migration-update-tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📝 Exécution de la migration de mise à jour...");

    // Exécuter le script SQL
    await client.query(migrationSQL);
    
    console.log("✅ Migration de mise à jour terminée avec succès");
    
    // Vérifier les nouvelles colonnes
    console.log("🔍 Vérification des nouvelles colonnes...");
    
    const checkQueries = [
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'edition_fighters' AND column_name IN ('is_champion', 'is_eliminated')",
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'edition_regions' AND column_name IN ('is_eliminated', 'points')",
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'sub_groups' AND column_name IN ('period', 'score_region1', 'score_region2', 'nulls', 'status')",
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'phase_groups' AND column_name = 'date'"
    ];

    for (const query of checkQueries) {
      const result = await client.query(query);
      if (result.rows.length > 0) {
        const columns = result.rows.map(row => row.column_name);
        console.log(`   ✅ Colonnes ajoutées: ${columns.join(', ')}`);
      }
    }

    // Vérifier les nouvelles contraintes
    console.log("🔍 Vérification des nouvelles contraintes...");
    const constraintCheck = await client.query(`
      SELECT conname FROM pg_constraint 
      WHERE conname IN (
        'competition_editions_edition_number_unique',
        'phases_phase_order_unique'
      )
    `);
    
    if (constraintCheck.rows.length > 0) {
      const constraints = constraintCheck.rows.map(row => row.conname);
      console.log(`   ✅ Contraintes ajoutées: ${constraints.join(', ')}`);
    }

    console.log("🎉 Migration de mise à jour complétée avec succès !");
    
  } catch (error) {
    console.error("❌ Erreur lors de la migration de mise à jour:", error.message);
    console.error("Détails:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Fonction pour afficher un rapport des changements
async function showMigrationReport() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    console.log("\n📊 RAPPORT DE MIGRATION");
    console.log("======================");
    
    // Liste des tables modifiées
    const tables = await client.query(`
      SELECT 
        table_name,
        COUNT(*) as column_count,
        STRING_AGG(column_name, ', ') as columns
      FROM information_schema.columns 
      WHERE table_name IN (
        'edition_fighters', 
        'edition_regions', 
        'sub_groups', 
        'phase_groups',
        'competition_editions',
        'phases'
      )
      GROUP BY table_name
      ORDER BY table_name
    `);
    
    console.log("\n📋 Tables modifiées:");
    for (const table of tables.rows) {
      console.log(`   ${table.table_name}: ${table.column_count} colonnes`);
    }
    
    // Statistiques des nouveaux index
    const indexes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexname LIKE 'idx_%'
        AND schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log("\n🔗 Index créés:");
    for (const index of indexes.rows) {
      console.log(`   ${index.indexname} sur ${index.tablename}`);
    }
    
    // Vérification des fonctions
    const functions = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('calculate_region_points', 'update_sub_group_scores')
    `);
    
    if (functions.rows.length > 0) {
      console.log("\n⚙️  Fonctions créées:");
      for (const func of functions.rows) {
        console.log(`   ✅ ${func.proname}`);
      }
    }
    
    console.log("\n✅ Rapport terminé");
    
  } catch (error) {
    console.error("❌ Erreur lors du rapport:", error);
  } finally {
    await client.end();
  }
}

// Gestion des arguments de ligne de commande
const command = process.argv[2];

if (command === '--report' || command === '-r') {
  showMigrationReport();
} else {
  runUpdateMigration();
}