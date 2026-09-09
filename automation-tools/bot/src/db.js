import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/notifications.db');

const db = new Database(dbPath);

// Инициализация таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL UNIQUE,
    username TEXT,
    subscribed INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;

export const subscribers = {
  register(chatId, username) {
    return db.prepare(`
      INSERT INTO subscribers (chat_id, username) VALUES (?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET username = excluded.username
    `).run(String(chatId), username);
  },

  subscribe(chatId) {
    return db.prepare('UPDATE subscribers SET subscribed = 1 WHERE chat_id = ?').run(String(chatId));
  },

  unsubscribe(chatId) {
    return db.prepare('UPDATE subscribers SET subscribed = 0 WHERE chat_id = ?').run(String(chatId));
  },

  getAll() {
    return db.prepare('SELECT * FROM subscribers WHERE subscribed = 1').all();
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM subscribers WHERE subscribed = 1').get().count;
  },
};

export const events = {
  log(type, payload) {
    return db.prepare('INSERT INTO events (type, payload) VALUES (?, ?)').run(type, JSON.stringify(payload));
  },

  getStats(since) {
    const rows = db.prepare(`
      SELECT type, COUNT(*) as count FROM events
      WHERE created_at >= ?
      GROUP BY type
    `).all(since);

    const stats = { orders: 0, students: 0, payments: 0, total: 0 };
    for (const row of rows) {
      if (row.type === 'order') stats.orders = row.count;
      if (row.type === 'student') stats.students = row.count;
      if (row.type === 'payment') stats.payments = row.count;
      stats.total += row.count;
    }
    return stats;
  },

  getRecent(limit = 10) {
    return db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT ?').all(limit);
  },
};
