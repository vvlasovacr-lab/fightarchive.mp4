import pg from 'pg';
import { config } from './config.js';
const { Pool } = pg;
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 5,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export async function q(text, params = []) {
  return pool.query(text, params);
}

export async function initDb() {
  const fs = await import('node:fs/promises');
  const schema = await fs.readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
}
