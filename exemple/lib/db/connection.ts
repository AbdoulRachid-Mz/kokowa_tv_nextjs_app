import mysql, { Pool, PoolOptions } from 'mysql2/promise';

type QueryValue = string | number | boolean | Date | null | Buffer;

const dbConfig: PoolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
};

const pool: Pool = mysql.createPool(dbConfig);

// Fonction query utilisant pool.query() au lieu de pool.execute()
export async function query<T = any>(sql: string, params?: QueryValue[]): Promise<T[]> {
  try {
    console.log('SQL Query:', sql);
    console.log('Params:', params);
    
    // Utiliser query() au lieu de execute() pour mieux gérer LIMIT/OFFSET
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

export async function queryOne<T = any>(sql: string, params?: QueryValue[]): Promise<T | null> {
  const [rows] = await pool.query(sql, params);
  return (rows as T[])[0] || null;
}

export { pool };