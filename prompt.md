Tu es un expert PostgreSQL spécialisé dans les migrations de bases de données en production.

J'ai une application Node.js utilisant PostgreSQL (Neon) avec un système de migrations versionnées.

Le schéma actuel de référence est fourni (database.sql).

La dernière migration déjà exécutée en production est :

006-add-type-to-achievements.sql

et son rollback.

Je veux maintenant créer la migration suivante :

007-sync-production-schema.sql
007-sync-production-schema-rollback.sql
Objectif

Comparer le schéma actuel de production (qui correspond aux migrations 001 → 006) avec le nouveau fichier database.sql que je fournis.

Tu dois générer uniquement les différences.

NE PAS recréer les tables.

NE PAS recréer les colonnes existantes.

NE PAS supprimer de données.

NE PAS faire de DROP TABLE.

NE PAS faire de ALTER COLUMN destructif.

La migration doit être 100% compatible avec une base déjà en production contenant des données.

Contraintes

Chaque modification doit être idempotente.

Par exemple :

ADD COLUMN IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
DROP CONSTRAINT IF EXISTS

Pour les contraintes PostgreSQL qui ne supportent pas IF NOT EXISTS, utiliser :

DO $$
BEGIN
    IF NOT EXISTS (...) THEN
        ALTER TABLE ...
    END IF;
END $$;

Même principe pour :

trigger
function
enum
index
foreign key
unique constraint
Colonnes

Si une colonne existe déjà :

ne rien faire.

Si elle n'existe pas :

l'ajouter.

Ne jamais supprimer une colonne.

Ne jamais renommer une colonne.

Tables

Créer uniquement les nouvelles tables.

Toujours utiliser

CREATE TABLE IF NOT EXISTS
Index

Créer uniquement les nouveaux index.

Toujours utiliser

CREATE INDEX IF NOT EXISTS
Trigger

Toujours vérifier :

pg_trigger

avant de créer un trigger.

Fonctions

Toujours utiliser

CREATE OR REPLACE FUNCTION
Contraintes

Pour les UNIQUE :

vérifier dans

pg_constraint

avant création.

Même chose pour les FOREIGN KEY.

Enum

Avant un

CREATE TYPE

vérifier dans

pg_type

Sinon utiliser

ALTER TYPE ... ADD VALUE

si une nouvelle valeur est nécessaire.

Ne jamais supprimer une valeur d'un enum.

Rollback

Créer également

007-sync-production-schema-rollback.sql

Le rollback doit :

supprimer uniquement ce qui a été ajouté dans cette migration
ne jamais supprimer des données utilisateurs
utiliser IF EXISTS
supprimer les index créés
supprimer les contraintes créées
supprimer les triggers créés
supprimer les fonctions créées uniquement si elles sont nouvelles
supprimer les colonnes ajoutées uniquement si cela ne casse pas les données

Ne jamais supprimer une table existante de production.

IMPORTANT

Avant de produire le SQL :

analyser entièrement le fichier database.sql
détecter les différences avec les migrations déjà effectuées
produire uniquement les changements
vérifier que chaque instruction peut être exécutée plusieurs fois sans erreur
privilégier la sécurité plutôt que la simplicité
aucune perte de données n'est autorisée
aucune interruption de service
éviter les verrouillages inutiles
si une modification est dangereuse, proposer une alternative non destructive.
Format attendu

Répondre avec deux blocs :

007-sync-production-schema.sql

puis

007-sync-production-schema-rollback.sql

Chaque fichier doit être complet, commenté et prêt à être placé dans le dossier database/migrations/.