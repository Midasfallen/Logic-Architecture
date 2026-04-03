const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'publications.db');
const db = new Database(dbPath);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS likes (
  slug TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug);
`);

// Likes
const getLikesStmt = db.prepare('SELECT count FROM likes WHERE slug = ?');
const upsertLikeStmt = db.prepare(`
  INSERT INTO likes (slug, count) VALUES (?, 1)
  ON CONFLICT(slug) DO UPDATE SET count = count + 1
`);

function getLikes(slug) {
    const row = getLikesStmt.get(slug);
    return row ? row.count : 0;
}

function addLike(slug) {
    upsertLikeStmt.run(slug);
    return getLikes(slug);
}

// Comments
const getCommentsStmt = db.prepare(
    'SELECT id, name, body, created_at FROM comments WHERE slug = ? ORDER BY created_at DESC LIMIT 100'
);
const addCommentStmt = db.prepare(
    'INSERT INTO comments (slug, name, body, ip) VALUES (?, ?, ?, ?)'
);
const deleteCommentStmt = db.prepare('DELETE FROM comments WHERE id = ?');

function getComments(slug) {
    return getCommentsStmt.all(slug);
}

function addComment(slug, name, body, ip) {
    const info = addCommentStmt.run(slug, name, body, ip);
    return info.lastInsertRowid;
}

function deleteComment(id) {
    const info = deleteCommentStmt.run(id);
    return info.changes > 0;
}

module.exports = { getLikes, addLike, getComments, addComment, deleteComment };
