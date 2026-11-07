'use strict';
// طبقة قاعدة البيانات: Postgres على Vercel (DATABASE_URL)، وSQLite محلياً للتجربة.
// كل الاستعلامات مكتوبة بصيغة تشتغل على الاثنين ($1, $2 ...).
const path = require('node:path');
const fs = require('node:fs');

const URL_ = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const isPg = !!URL_;

const TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id @ID,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pass TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','servant','viewer','kid')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  expires BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  key TEXT NOT NULL,
  ts BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  mother_phone TEXT NOT NULL DEFAULT '',
  father_phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  confessor TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  siblings TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS photos (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contests (
  id @ID,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  questions TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quiz_answers (
  contest_id INTEGER NOT NULL REFERENCES contests(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  answers TEXT NOT NULL,
  scores TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  PRIMARY KEY (contest_id, user_id)
);
CREATE TABLE IF NOT EXISTS daily (
  user_id INTEGER NOT NULL REFERENCES users(id),
  day TEXT NOT NULL,
  prayed INTEGER NOT NULL DEFAULT 0,
  gospel INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS mass (
  user_id INTEGER NOT NULL REFERENCES users(id),
  week_start TEXT NOT NULL,
  attended INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, week_start)
);
CREATE TABLE IF NOT EXISTS confession (
  user_id INTEGER NOT NULL REFERENCES users(id),
  month TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);
CREATE TABLE IF NOT EXISTS attendance (
  user_id INTEGER NOT NULL REFERENCES users(id),
  day TEXT NOT NULL,
  by_user INTEGER REFERENCES users(id),
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS notes (
  id @ID,
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  delta INTEGER NOT NULL DEFAULT 0,
  by_user INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
`;

function makeSqlite() {
  const { DatabaseSync } = require('node:sqlite');
  const dir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });
  const d = new DatabaseSync(path.join(dir, 'school.db'));
  d.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const q = async (sql, params = []) => {
    const st = d.prepare(sql.replace(/\$(\d+)/g, '?$1'));
    if (/^\s*select/i.test(sql) || /\sreturning\s/i.test(sql)) return { rows: st.all(...params) };
    st.run(...params);
    return { rows: [] };
  };
  return {
    q,
    async tx(fn) { d.exec('BEGIN'); try { const r = await fn(q); d.exec('COMMIT'); return r; } catch (e) { d.exec('ROLLBACK'); throw e; } },
    async init() { d.exec(TABLES.replace(/@ID/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')); },
  };
}

function makePg() {
  const { Pool } = require('pg'); // يتثبت تلقائياً على Vercel من package.json
  const pool = new Pool({ connectionString: URL_, max: 1, idleTimeoutMillis: 10000 });
  const q = (sql, params = []) => pool.query(sql, params);
  return {
    q,
    async tx(fn) {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const r = await fn((sql, params = []) => c.query(sql, params));
        await c.query('COMMIT');
        return r;
      } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
    },
    async init() { await pool.query(TABLES.replace(/@ID/g, 'SERIAL PRIMARY KEY')); },
  };
}

module.exports = { db: isPg ? makePg() : makeSqlite(), isPg };
