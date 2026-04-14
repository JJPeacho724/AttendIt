const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'attendit.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('host', 'attendee')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    room TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    event_code TEXT UNIQUE NOT NULL,
    host_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attendee_id INTEGER NOT NULL REFERENCES users(id),
    event_id INTEGER NOT NULL REFERENCES events(id),
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attendee_id, event_id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id),
    session_code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    attendee_id INTEGER NOT NULL REFERENCES users(id),
    distance_meters REAL NOT NULL,
    checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, attendee_id)
  );
`);

// Migration: add host location columns for dual proximity check-in
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN host_latitude REAL`);
  db.exec(`ALTER TABLE sessions ADD COLUMN host_longitude REAL`);
} catch (_) {
  // Columns already exist
}

module.exports = db;
