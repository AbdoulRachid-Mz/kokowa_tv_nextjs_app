const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

class MigrationManager {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    this.migrationsPath = path.join(__dirname, "../database/migrations");
    this.historyPath = path.join(__dirname, "migrations-history.json");
  }

  async connect() {
    await this.client.connect();
    console.log("🚀 Connexion à Neon établie");
  }

  async disconnect() {
    await this.client.end();
  }

  async ensureMigrationsTable() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS migrations_history (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        applied_by VARCHAR(100) DEFAULT CURRENT_USER
      )
    `);
  }

  async getAppliedMigrations() {
    const result = await this.client.query(`
      SELECT migration_name FROM migrations_history 
      ORDER BY applied_at DESC
    `);
    return result.rows.map(row => row.migration_name);
  }

  async getAvailableMigrations() {
    const files = fs.readdirSync(this.migrationsPath);
    return files
      .filter(file => file.endsWith('.sql') && !file.includes('-rollback'))
      .sort();
  }

  async getMigrationFiles(migrationName) {
    const migrationFile = path.join(this.migrationsPath, migrationName);
    const rollbackFile = migrationName.replace('.sql', '-rollback.sql');
    const rollbackPath = path.join(this.migrationsPath, rollbackFile);

    return {
      migration: migrationFile,
      rollback: fs.existsSync(rollbackPath) ? rollbackPath : null
    };
  }

  async runMigration(migrationName) {
    const files = await this.getMigrationFiles(migrationName);
    
    if (!fs.existsSync(files.migration)) {
      throw new Error(`Fichier de migration non trouvé: ${migrationName}`);
    }

    const sql = fs.readFileSync(files.migration, "utf8");
    console.log(`📝 Application de la migration: ${migrationName}`);
    
    await this.client.query('BEGIN');
    try {
      await this.client.query(sql);
      
      await this.client.query(
        'INSERT INTO migrations_history (migration_name) VALUES ($1)',
        [migrationName]
      );
      
      await this.client.query('COMMIT');
      console.log(`✅ Migration ${migrationName} appliquée avec succès`);
      
    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error(`❌ Erreur lors de l'application de ${migrationName}:`, error.message);
      throw error;
    }
  }

  async runRollback(migrationName = null) {
    const appliedMigrations = await this.getAppliedMigrations();
    
    if (!migrationName) {
      // Rollback de la dernière migration
      migrationName = appliedMigrations[0];
      if (!migrationName) {
        console.log("⚠️  Aucune migration à rollback");
        return;
      }
    }

    if (!appliedMigrations.includes(migrationName)) {
      throw new Error(`Migration ${migrationName} non appliquée`);
    }

    const files = await this.getMigrationFiles(migrationName);
    
    if (!files.rollback) {
      throw new Error(`Fichier de rollback non trouvé pour ${migrationName}`);
    }

    const sql = fs.readFileSync(files.rollback, "utf8");
    console.log(`🔄 Rollback de la migration: ${migrationName}`);
    
    await this.client.query('BEGIN');
    try {
      await this.client.query(sql);
      
      await this.client.query(
        'DELETE FROM migrations_history WHERE migration_name = $1',
        [migrationName]
      );
      
      await this.client.query('COMMIT');
      console.log(`✅ Rollback de ${migrationName} terminé avec succès`);
      
    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error(`❌ Erreur lors du rollback de ${migrationName}:`, error.message);
      throw error;
    }
  }

  async migrateTo(version = null) {
    await this.connect();
    await this.ensureMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = await this.getAvailableMigrations();
    
    console.log("📊 État des migrations:");
    console.log(`   Appliquées: ${appliedMigrations.length}`);
    console.log(`   Disponibles: ${availableMigrations.length}`);
    
    // Si une version spécifique est demandée
    if (version) {
      const targetMigration = availableMigrations.find(m => m.startsWith(version));
      if (!targetMigration) {
        throw new Error(`Migration version ${version} non trouvée`);
      }
      
      const targetIndex = availableMigrations.indexOf(targetMigration);
      const appliedIndex = availableMigrations.findIndex(m => appliedMigrations.includes(m));
      
      if (targetIndex > appliedIndex) {
        // Appliquer les migrations manquantes
        const toApply = availableMigrations.slice(appliedIndex + 1, targetIndex + 1);
        for (const migration of toApply) {
          await this.runMigration(migration);
        }
      } else if (targetIndex < appliedIndex) {
        // Rollback des migrations
        const toRollback = availableMigrations.slice(targetIndex + 1, appliedIndex + 1).reverse();
        for (const migration of toRollback) {
          await this.runRollback(migration);
        }
      }
    } else {
      // Appliquer toutes les migrations non appliquées
      const toApply = availableMigrations.filter(m => !appliedMigrations.includes(m));
      
      if (toApply.length === 0) {
        console.log("✅ Toutes les migrations sont déjà appliquées");
        return;
      }
      
      console.log(`📋 Migrations à appliquer: ${toApply.length}`);
      for (const migration of toApply) {
        await this.runMigration(migration);
      }
    }
    
    await this.disconnect();
  }

  async status() {
    await this.connect();
    await this.ensureMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = await this.getAvailableMigrations();
    
    console.log("\n📊 ÉTAT DES MIGRATIONS");
    console.log("=" .repeat(50));
    
    console.log("\n📋 Migrations disponibles:");
    availableMigrations.forEach(migration => {
      const isApplied = appliedMigrations.includes(migration);
      console.log(`   ${isApplied ? '✅' : '⏳'} ${migration}`);
    });
    
    console.log(`\n📈 Résumé:`);
    console.log(`   Total disponibles: ${availableMigrations.length}`);
    console.log(`   Appliquées: ${appliedMigrations.length}`);
    console.log(`   En attente: ${availableMigrations.length - appliedMigrations.length}`);
    
    if (appliedMigrations.length > 0) {
      console.log(`\n📅 Dernière migration appliquée: ${appliedMigrations[0]}`);
    }
    
    await this.disconnect();
  }

  async createMigration(name, description) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '');
    const migrationNumber = (await this.getAvailableMigrations()).length + 1;
    const paddedNumber = migrationNumber.toString().padStart(3, '0');
    const fileName = `${paddedNumber}-${name.replace(/\s+/g, '-').toLowerCase()}.sql`;
    const rollbackFileName = fileName.replace('.sql', '-rollback.sql');
    
    const migrationPath = path.join(this.migrationsPath, fileName);
    const rollbackPath = path.join(this.migrationsPath, rollbackFileName);
    
    const migrationTemplate = `-- Migration: ${paddedNumber}-${name}
-- Description: ${description}
-- Date: ${new Date().toISOString()}
-- Auteur: ${process.env.USER || 'system'}

-- =============================================
-- MIGRATION: ${name.toUpperCase()}
-- =============================================

-- Écrivez vos commandes SQL de migration ici
-- Exemple: ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255);

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

DO \$\$
BEGIN
    RAISE NOTICE '✅ Migration ${paddedNumber}-${name} appliquée avec succès';
END \$\$;
`;

    const rollbackTemplate = `-- Rollback: ${paddedNumber}-${name}
-- Description: ${description}
-- Date: ${new Date().toISOString()}

-- =============================================
-- ROLLBACK: ${name.toUpperCase()}
-- =============================================

-- Écrivez vos commandes SQL de rollback ici
-- Doit inverser les changements de la migration correspondante
-- Exemple: ALTER TABLE table_name DROP COLUMN new_column;

-- =============================================
-- FIN DU ROLLBACK
-- =============================================

DO \$\$
BEGIN
    RAISE NOTICE '🔄 Rollback de ${paddedNumber}-${name} terminé avec succès';
END \$\$;
`;

    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
    }

    fs.writeFileSync(migrationPath, migrationTemplate);
    fs.writeFileSync(rollbackPath, rollbackTemplate);
    
    console.log(`✨ Migration créée: ${fileName}`);
    console.log(`✨ Rollback créé: ${rollbackFileName}`);
    console.log(`📁 Chemin: ${this.migrationsPath}/`);
  }
}

// Gestion des arguments de ligne de commande
async function main() {
  const manager = new MigrationManager();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'migrate':
        await manager.migrateTo(process.argv[3]);
        break;
      
      case 'rollback':
        await manager.connect();
        await manager.ensureMigrationsTable();
        await manager.runRollback(process.argv[3]);
        await manager.disconnect();
        break;
      
      case 'status':
        await manager.status();
        break;
      
      case 'create':
        if (!process.argv[3]) {
          console.error('❌ Usage: node scripts/migrations-manager.js create <nom-de-la-migration> "<description>"');
          process.exit(1);
        }
        await manager.createMigration(process.argv[3], process.argv[4] || '');
        break;
      
      case 'list':
        await manager.connect();
        await manager.ensureMigrationsTable();
        const applied = await manager.getAppliedMigrations();
        const available = await manager.getAvailableMigrations();
        console.log('\n📋 Migrations appliquées:', applied);
        console.log('\n📋 Migrations disponibles:', available);
        await manager.disconnect();
        break;
      
      default:
        console.log(`
🎯 GESTIONNAIRE DE MIGRATIONS

Commandes disponibles:
  migrate [version]    Appliquer les migrations (version optionnelle)
  rollback [name]     Rollback d'une migration spécifique
  status              Afficher l'état des migrations
  create <name>       Créer une nouvelle migration
  list                Lister toutes les migrations

Exemples:
  node scripts/migrations-manager.js migrate
  node scripts/migrations-manager.js migrate 002
  node scripts/migrations-manager.js rollback
  node scripts/migrations-manager.js rollback 001-add-new-fields.sql
  node scripts/migrations-manager.js status
  node scripts/migrations-manager.js create "ajouter-champ-email" "Ajouter un champ email à la table users"
        `);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();