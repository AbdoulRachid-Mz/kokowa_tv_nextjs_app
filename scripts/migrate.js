const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("🚀 Connexion à Neon établie");

    // Lecture du schéma principal
    const schemaPath = path.join(__dirname, "../database/database.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    console.log("📝 Exécution du schéma...");
    try {
      await client.query(schemaSQL);
      console.log("✅ Schéma créé avec succès");
    } catch (err) {
      // Erreurs non bloquantes : index ou table déjà existants
      if (["42P07", "42P16"].includes(err.code)) {
        console.log("⚠️  Élément déjà existant (index ou table) — ignoré.");
      } else {
        throw err;
      }
    }

    // Lecture des données de test (seed)
    const seedPath = path.join(__dirname, "../database/seed.sql");
    const seedSQL = fs.readFileSync(seedPath, "utf8");

    console.log("🌱 Insertion des données...");
    try {
      await client.query(seedSQL);
      console.log("✅ Données insérées avec succès");
    } catch (err) {
      if (err.code === "23505") {
        // Conflit d’unicité — déjà inséré
        console.log("⚠️  Données déjà insérées — aucune duplication.");
      } else {
        throw err;
      }
    }

    console.log("🎉 Migration Neon terminée !");
  } catch (error) {
    console.error("❌ Erreur migration Neon:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
