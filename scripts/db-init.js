import fs from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: url, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
const sql = await fs.readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
await pool.query(sql);
await pool.end();
console.log('Database initialized');
