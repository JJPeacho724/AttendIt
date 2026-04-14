const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { haversineDistance } = require('../utils/geo');

const router = express.Router();

const MAX_DISTANCE_METERS = 100;

// Attendee: check in to a session
router.post('/checkin', authenticate, requireRole('attendee'), (req, res) => {
  const { session_code, latitude, longitude } = req.body;

  if (!session_code || latitude == null || longitude == null) {
    return res.status(400).json({ error: 'Session code and GPS coordinates are required' });
  }

  // Find active session with this code
  const session = db.prepare(`
    SELECT s.*, e.name as event_name
    FROM sessions s
    JOIN events e ON e.id = s.event_id
    WHERE s.session_code = ? AND s.active = 1 AND s.expires_at > datetime('now')
  `).get(session_code);

  if (!session) {
    return res.status(404).json({ error: 'No active session found with this code. It may have expired.' });
  }

  // Check attendee is registered
  const registered = db.prepare(
    'SELECT id FROM registrations WHERE attendee_id = ? AND event_id = ?'
  ).get(req.user.id, session.event_id);

  if (!registered) {
    return res.status(403).json({ error: 'You are not registered for this event' });
  }

  // Check not already checked in
  const existing = db.prepare(
    'SELECT id FROM attendance WHERE session_id = ? AND attendee_id = ?'
  ).get(session.id, req.user.id);

  if (existing) {
    return res.status(409).json({ error: 'You have already checked in to this session' });
  }

  // Check 1: distance to venue
  const venueDistance = haversineDistance(latitude, longitude, session.latitude, session.longitude);

  if (venueDistance > MAX_DISTANCE_METERS) {
    return res.status(403).json({
      error: `You are too far from the venue. You are ${Math.round(venueDistance)}m away, but must be within ${MAX_DISTANCE_METERS}m.`,
      distance: Math.round(venueDistance),
      max_distance: MAX_DISTANCE_METERS
    });
  }

  // Check 2: distance to host's location at session start
  if (session.host_latitude != null && session.host_longitude != null) {
    const hostDistance = haversineDistance(latitude, longitude, session.host_latitude, session.host_longitude);

    if (hostDistance > MAX_DISTANCE_METERS) {
      return res.status(403).json({
        error: `You are too far from the host. You are ${Math.round(hostDistance)}m away, but must be within ${MAX_DISTANCE_METERS}m.`,
        distance: Math.round(hostDistance),
        max_distance: MAX_DISTANCE_METERS
      });
    }
  }

  db.prepare(
    'INSERT INTO attendance (session_id, attendee_id, distance_meters) VALUES (?, ?, ?)'
  ).run(session.id, req.user.id, Math.round(venueDistance));

  res.status(201).json({
    message: 'Checked in successfully',
    event_name: session.event_name,
    distance: Math.round(venueDistance)
  });
});

// Attendee: get their attendance history
router.get('/history', authenticate, requireRole('attendee'), (req, res) => {
  const records = db.prepare(`
    SELECT a.checked_in_at, a.distance_meters,
           s.session_code, s.created_at as session_date,
           e.name as event_name, e.location_name, e.room
    FROM attendance a
    JOIN sessions s ON s.id = a.session_id
    JOIN events e ON e.id = s.event_id
    WHERE a.attendee_id = ?
    ORDER BY a.checked_in_at DESC
  `).all(req.user.id);

  res.json(records);
});

// Host: export attendance as CSV for an event
router.get('/export/:eventId', authenticate, requireRole('host'), (req, res) => {
  const evt = db.prepare('SELECT * FROM events WHERE id = ? AND host_id = ?').get(req.params.eventId, req.user.id);
  if (!evt) return res.status(404).json({ error: 'Event not found' });

  const records = db.prepare(`
    SELECT u.name as attendee_name, u.email as attendee_email,
           s.created_at as session_date, s.session_code,
           a.checked_in_at, a.distance_meters
    FROM attendance a
    JOIN sessions s ON s.id = a.session_id
    JOIN users u ON u.id = a.attendee_id
    WHERE s.event_id = ?
    ORDER BY s.created_at DESC, u.name ASC
  `).all(req.params.eventId);

  const header = 'Name,Email,Session Date,Session Code,Check-in Time,Distance (m)\n';
  const rows = records.map(r =>
    `"${r.attendee_name}","${r.attendee_email}","${r.session_date}","${r.session_code}","${r.checked_in_at}",${r.distance_meters}`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="attendance-${evt.name}.csv"`);
  res.send(header + rows);
});

module.exports = router;
