const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function generateSessionCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Host: start a session for an event
router.post('/', authenticate, requireRole('host'), (req, res) => {
  const { event_id, host_latitude, host_longitude } = req.body;
  if (!event_id) return res.status(400).json({ error: 'event_id is required' });

  if (host_latitude == null || host_longitude == null ||
      typeof host_latitude !== 'number' || typeof host_longitude !== 'number') {
    return res.status(400).json({ error: 'Host GPS coordinates are required to start a session' });
  }

  const evt = db.prepare('SELECT * FROM events WHERE id = ? AND host_id = ?').get(event_id, req.user.id);
  if (!evt) return res.status(404).json({ error: 'Event not found or not yours' });

  // Deactivate any existing active sessions for this event
  db.prepare('UPDATE sessions SET active = 0 WHERE event_id = ? AND active = 1').run(event_id);

  const session_code = generateSessionCode();
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const result = db.prepare(
    'INSERT INTO sessions (event_id, session_code, expires_at, latitude, longitude, host_latitude, host_longitude) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(event_id, session_code, expires_at, evt.latitude, evt.longitude, host_latitude, host_longitude);

  res.status(201).json({
    id: result.lastInsertRowid,
    event_id,
    session_code,
    expires_at,
    latitude: evt.latitude,
    longitude: evt.longitude,
    host_latitude,
    host_longitude,
    active: 1
  });
});

// Get active session for an event
router.get('/active/:eventId', authenticate, (req, res) => {
  const session = db.prepare(`
    SELECT s.*, e.name as event_name
    FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.event_id = ? AND s.active = 1 AND s.expires_at > datetime('now')
    ORDER BY s.created_at DESC LIMIT 1
  `).get(req.params.eventId);

  if (!session) return res.json(null);
  res.json(session);
});

// Get attendance for a session
router.get('/:sessionId/attendance', authenticate, (req, res) => {
  const records = db.prepare(`
    SELECT a.*, u.name as attendee_name, u.email as attendee_email
    FROM attendance a
    JOIN users u ON u.id = a.attendee_id
    WHERE a.session_id = ?
    ORDER BY a.checked_in_at ASC
  `).all(req.params.sessionId);

  res.json(records);
});

// Host: stop a session
router.post('/:sessionId/stop', authenticate, requireRole('host'), (req, res) => {
  const session = db.prepare('SELECT s.* FROM sessions s JOIN events e ON e.id = s.event_id WHERE s.id = ? AND e.host_id = ?').get(req.params.sessionId, req.user.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  db.prepare('UPDATE sessions SET active = 0 WHERE id = ?').run(req.params.sessionId);
  res.json({ message: 'Session stopped' });
});

// Get all sessions for an event (historical)
router.get('/event/:eventId', authenticate, (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id) as attendance_count
    FROM sessions s
    WHERE s.event_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.eventId);

  res.json(sessions);
});

module.exports = router;
