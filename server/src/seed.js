const bcrypt = require('bcryptjs');
const db = require('./db');

console.log('Seeding database...');

const hostHash = bcrypt.hashSync('password123', 10);
const attendeeHash = bcrypt.hashSync('password123', 10);

const upsertUser = db.prepare(`
  INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)
  ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
`);

upsertUser.run('host@test.com', hostHash, 'Alex Host', 'host');
upsertUser.run('attendee@test.com', attendeeHash, 'Jane Attendee', 'attendee');

console.log('Seed data created:');
console.log('  Host:     host@test.com / password123');
console.log('  Attendee: attendee@test.com / password123');
console.log('Done.');
