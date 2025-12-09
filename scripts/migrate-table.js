const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const tableName = process.argv[2];
if (!tableName) {
  console.error("❌ Veuillez fournir le nom de la table à migrer : npm run migrate-table <tableName>");
  process.exit(1);
}

async function runSingleTableMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log(`🚀 Connexion à Neon établie`);

    // Lire le schéma complet
    const schemaPath = path.join(__dirname, "../database/database.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    // Extraire la définition de la table demandée (CREATE TABLE IF NOT EXISTS <tableName> ... ;)
    const tableRegex = new RegExp(
      `CREATE TABLE IF NOT EXISTS\\s+${tableName}\\s*\\([^;]+\\);`,
      "is"
    );
    const match = schemaSQL.match(tableRegex);
    if (!match) {
      console.error(`❌ Table "${tableName}" non trouvée dans le schéma.`);
      process.exit(1);
    }
    const tableDefinition = match[0];

    // Extraire les triggers liés à cette table
    const triggerRegex = new RegExp(
      `CREATE TRIGGER\\s+\\w*${tableName}\\w*\\s+[^;]+;`,
      "gis"
    );
    const triggers = schemaSQL.match(triggerRegex) || [];

    // Extraire les index liés à cette table
    const indexRegex = new RegExp(
      `CREATE INDEX\\s+\\w*${tableName}\\w*\\s+ON\\s+${tableName}\\s+[^;]+;`,
      "gis"
    );
    const indexes = schemaSQL.match(indexRegex) || [];

    console.log(`📝 Migration de la table "${tableName}"...`);

    // Exécuter la création de la table
    try {
      await client.query(tableDefinition);
      console.log(`✅ Table "${tableName}" créée avec succès`);
    } catch (err) {
      if (err.code === "42P07") {
        console.log(`⚠️  Table "${tableName}" déjà existante — ignoré.`);
      } else {
        throw err;
      }
    }

    // Créer les triggers
    for (const trigger of triggers) {
      try {
        await client.query(trigger);
        console.log(`✅ Trigger créé pour "${tableName}"`);
      } catch (err) {
        if (err.code === "42710") {
          console.log(`⚠️  Trigger déjà existant pour "${tableName}" — ignoré.`);
        } else {
          throw err;
        }
      }
    }

    // Créer les indexes
    for (const index of indexes) {
      try {
        await client.query(index);
        console.log(`✅ Index créé pour "${tableName}"`);
      } catch (err) {
        if (err.code === "42P07") {
          console.log(`⚠️  Index déjà existant pour "${tableName}" — ignoré.`);
        } else {
          throw err;
        }
      }
    }

    console.log(`🎉 Migration de la table "${tableName}" terminée !`);
  } catch (error) {
    console.error(`❌ Erreur migration table "${tableName}":`, error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSingleTableMigration();
