const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function generateEventCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Host: create an event
router.post('/', authenticate, requireRole('host'), (req, res) => {
  const { name, location_name, room, latitude, longitude } = req.body;

  if (!name || !location_name || !room || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  let event_code;
  let attempts = 0;
  while (attempts < 10) {
    event_code = generateEventCode();
    const existing = db.prepare('SELECT id FROM events WHERE event_code = ?').get(event_code);
    if (!existing) break;
    attempts++;
  }

  const result = db.prepare(
    'INSERT INTO events (name, location_name, room, latitude, longitude, event_code, host_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, location_name, room, latitude, longitude, event_code, req.user.id);

  res.status(201).json({
    id: result.lastInsertRowid,
    name, location_name, room, latitude, longitude, event_code,
    host_id: req.user.id
  });
});

// Host: get their events
router.get('/hosting', authenticate, requireRole('host'), (req, res) => {
  const events = db.prepare(
    'SELECT * FROM events WHERE host_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json(events);
});

// Attendee: join an event by event_code
router.post('/join', authenticate, requireRole('attendee'), (req, res) => {
  const { event_code } = req.body;
  if (!event_code) return res.status(400).json({ error: 'Event code is required' });

  const evt = db.prepare('SELECT * FROM events WHERE event_code = ?').get(event_code);
  if (!evt) return res.status(404).json({ error: 'Event not found' });

  const existing = db.prepare(
    'SELECT id FROM registrations WHERE attendee_id = ? AND event_id = ?'
  ).get(req.user.id, evt.id);
  if (existing) return res.status(409).json({ error: 'Already registered for this event' });

  db.prepare('INSERT INTO registrations (attendee_id, event_id) VALUES (?, ?)').run(req.user.id, evt.id);

  res.status(201).json({ message: 'Registered successfully', event: evt });
});

// Attendee: get registered events
router.get('/registered', authenticate, requireRole('attendee'), (req, res) => {
  const events = db.prepare(`
    SELECT e.*, u.name as host_name,
      (SELECT COUNT(*) FROM sessions s WHERE s.event_id = e.id AND s.active = 1 AND s.expires_at > datetime('now')) as has_active_session
    FROM events e
    JOIN registrations r ON r.event_id = e.id
    JOIN users u ON u.id = e.host_id
    WHERE r.attendee_id = ?
    ORDER BY e.created_at DESC
  `).all(req.user.id);
  res.json(events);
});

// Get a single event
router.get('/:id', authenticate, (req, res) => {
  const evt = db.prepare(`
    SELECT e.*, u.name as host_name
    FROM events e
    JOIN users u ON u.id = e.host_id
    WHERE e.id = ?
  `).get(req.params.id);
  if (!evt) return res.status(404).json({ error: 'Event not found' });
  res.json(evt);
});

module.exports = router;
