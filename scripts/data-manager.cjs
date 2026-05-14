const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runAction() {
  const action = process.argv[2]; // 'dump' or 'restore'
  const targetTable = process.argv[3]; // optional table name

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("🚀 Connexion à la base de données établie");

    const dataDir = path.join(__dirname, "../database/data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (action === "dump") {
      await dumpData(client, dataDir, targetTable);
    } else if (action === "restore") {
      await restoreData(client, dataDir, targetTable);
    } else {
      console.log("Usage: node scripts/data-manager.cjs [dump|restore] [table_name]");
    }

  } catch (error) {
    console.error("❌ Erreur Data Manager:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function dumpData(client, dataDir, targetTable) {
  let tables = [];
  if (targetTable) {
    tables = [targetTable];
  } else {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('migrations', '_prisma_migrations')
      ORDER BY table_name;
    `);
    tables = res.rows.map(r => r.table_name);
  }

  console.log(`📦 Début du dump de ${tables.length} table(s)...`);

  for (const table of tables) {
    console.log(`⏳ Extraction de la table: ${table}...`);
    const res = await client.query(`SELECT * FROM ${table}`);
    const filePath = path.join(dataDir, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(res.rows, null, 2));
    console.log(`✅ Table ${table} sauvegardée (${res.rows.length} lignes)`);
  }

  console.log("🎉 Dump terminé !");
}

async function restoreData(client, dataDir, targetTable) {
  let files = [];
  if (targetTable) {
    files = [`${targetTable}.json`];
  } else {
    files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
  }

  console.log(`📥 Début de la restauration de ${files.length} fichier(s)...`);

  for (const file of files) {
    const table = file.replace(".json", "");
    const filePath = path.join(dataDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (data.length === 0) {
      console.log(`⚠️  Fichier ${file} vide, ignoré.`);
      continue;
    }

    console.log(`⏳ Restauration de la table: ${table} (${data.length} lignes)...`);

    // Désactiver les triggers pour éviter les effets de bord pendant la restauration
    await client.query(`ALTER TABLE ${table} DISABLE TRIGGER ALL`);

    for (const row of data) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const columns = keys.join(", ");
      
      const onConflict = keys.includes('id') 
        ? `ON CONFLICT (id) DO UPDATE SET ${keys.map(k => `${k} = EXCLUDED.${k}`).join(", ")}`
        : "";

      const queryText = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ${onConflict}`;
      
      try {
        await client.query(queryText, values);
      } catch (err) {
        console.error(`❌ Erreur ligne dans ${table}:`, err.message);
      }
    }

    await client.query(`ALTER TABLE ${table} ENABLE TRIGGER ALL`);
    console.log(`✅ Table ${table} restaurée`);
  }

  console.log("🎉 Restauration terminée !");
}

runAction();
