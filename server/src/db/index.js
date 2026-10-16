import Database from 'better-sqlite3';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sqliteDb = null;
let pgPool = null;
const usePostgres = Boolean(process.env.DATABASE_URL);

if (usePostgres) {
  console.log('[DB] Connecting to PostgreSQL using DATABASE_URL...');
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
} else {
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'helpdesk.db');
  console.log(`[DB] Initializing embedded SQLite database at: ${dbPath}`);
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
}

/**
 * Universal Query Adapter
 */
export async function query(sql, params = []) {
  if (usePostgres) {
    // Transform SQLite ? placeholders to $1, $2, etc for Postgres
    let pIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${pIndex++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  } else {
    // SQLite query
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      const stmt = sqliteDb.prepare(sql);
      return stmt.all(...params);
    } else {
      const stmt = sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return [{ id: info.lastInsertRowid, changes: info.changes }];
    }
  }
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function executeRaw(sql) {
  if (usePostgres) {
    await pgPool.query(sql);
  } else {
    sqliteDb.exec(sql);
  }
}

export function isUsingPostgres() {
  return usePostgres;
}

export default {
  query,
  queryOne,
  executeRaw,
  isUsingPostgres
};
