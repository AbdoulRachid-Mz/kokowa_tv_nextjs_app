// scripts/migrate-rtdb.js
const admin = require('firebase-admin');
const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

// Initialisation Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}
const db = admin.database();

// Client PostgreSQL
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.POSTGRES_URL_NO_SSL === 'true' ? false : { rejectUnauthorized: false },
});

async function getEditionIdFromSubGroupId(subGroupId) {
  // S'assurer que subGroupId est un nombre valide
  const id = Number(subGroupId);
  if (isNaN(id)) {
    console.warn(`⚠️ subGroupId invalide (non numérique) : ${subGroupId}, ignoré.`);
    return null;
  }
  const res = await pgClient.query(
    `SELECT ce.id AS edition_id
     FROM sub_groups sg
     JOIN phase_groups pg ON pg.id = sg.group_id
     JOIN phases p ON p.id = pg.phase_id
     JOIN competition_editions ce ON ce.id = p.edition_id
     WHERE sg.id = $1`,
    [id]
  );
  return res.rows[0]?.edition_id || null;
}

async function migrate() {
  console.log('🚀 Début de la migration RTDB...');

  await pgClient.connect();
  console.log('✅ Connecté à PostgreSQL');

  const oldSubGroupsRef = db.ref('subGroups');
  const snapshot = await oldSubGroupsRef.once('value');
  if (!snapshot.exists()) {
    console.log('✅ Aucune donnée à migrer (pas de nœud "subGroups").');
    await pgClient.end();
    return;
  }

  const updates = {};
  const deletes = [];

  const subGroups = snapshot.val();
  for (const [subGroupKey, data] of Object.entries(subGroups)) {
    // Vérifier que la clé est un nombre valide
    const numericId = Number(subGroupKey);
    if (isNaN(numericId)) {
      console.warn(`⚠️ Ignoré : clé "${subGroupKey}" n’est pas un nombre valide.`);
      continue;
    }
    const editionId = await getEditionIdFromSubGroupId(numericId);
    if (!editionId) {
      console.warn(`⚠️ subGroup ${subGroupKey} : editionId introuvable, ignoré.`);
      continue;
    }
    const newPath = `editions/${editionId}/subGroups/${subGroupKey}`;
    updates[newPath] = data;
    deletes.push(`subGroups/${subGroupKey}`);
  }

  if (Object.keys(updates).length === 0) {
    console.log('Aucune donnée à migrer.');
    await pgClient.end();
    return;
  }

  // Écrire les nouvelles données
  await db.ref().update(updates);
  console.log(`✅ ${Object.keys(updates).length} sous‑groupes écrits.`);

  // Supprimer les anciens nœuds
  for (const path of deletes) {
    await db.ref(path).remove();
  }
  console.log(`🗑️ ${deletes.length} anciens nœuds supprimés.`);

  console.log('🎉 Migration terminée.');
  await pgClient.end();
}

migrate().catch((err) => {
  console.error('❌ Erreur lors de la migration :', err);
  process.exit(1);
});