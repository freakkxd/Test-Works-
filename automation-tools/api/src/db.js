import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'notifications.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT,
    amount REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

export default db;

export const events = {
  log(type, payload, amount = 0) {
    return db.prepare('INSERT INTO events (type, payload, amount) VALUES (?, ?, ?)')
      .run(type, JSON.stringify({ ...payload, isDemo: payload.isDemo ?? false }), amount);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as c FROM events').get().c;
  },

  getStats(period = 'today') {
    let since;
    const now = new Date();

    if (period === 'today') {
      since = now.toISOString().slice(0, 10);
    } else if (period === 'week') {
      since = new Date(now.getTime() - 7 * 86400000).toISOString();
    } else if (period === 'month') {
      since = new Date(now.getTime() - 30 * 86400000).toISOString();
    } else if (period === '14days') {
      since = new Date(now.getTime() - 14 * 86400000).toISOString();
    } else {
      since = '1970-01-01';
    }

    const rows = db.prepare(`
      SELECT type, COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue
      FROM events WHERE created_at >= ?
      GROUP BY type
    `).all(since);

    const stats = { orders: 0, students: 0, payments: 0, webhooks: 0, revenue: 0, period };

    for (const row of rows) {
      if (row.type === 'order') { stats.orders = row.count; stats.revenue += row.revenue; }
      else if (row.type === 'student') stats.students = row.count;
      else if (row.type === 'payment') { stats.payments = row.count; stats.revenue += row.revenue; }
      else if (row.type === 'webhook' || row.type === 'webhook_error') stats.webhooks += row.count;
    }

    return stats;
  },

  getDailyStats(days = 14) {
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    return db.prepare(`
      SELECT DATE(created_at) as date, type, COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue
      FROM events WHERE created_at >= ?
      GROUP BY DATE(created_at), type
      ORDER BY date
    `).all(since);
  },

  getRecent(limit = 20) {
    return db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT ?').all(limit);
  },
};

export const meta = {
  get(key) {
    return db.prepare('SELECT value FROM meta WHERE key = ?').get(key)?.value ?? null;
  },
  set(key, value) {
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
      .run(key, value);
  },
};
