// lib/db/connection.ts - Redirection vers neon-client.ts pour unification
export { pool, query, queryOne, testDatabaseConnection, closePool, type QueryValue } from "./neon-client";
