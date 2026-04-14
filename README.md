# AttendIt - Event Attendance Tracker

GPS-verified attendance tracking for events with host and attendee roles.

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Seed the database with test accounts
npm run seed

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Test Accounts

| Role     | Email              | Password    |
|----------|--------------------|-------------|
| Host     | host@test.com      | password123 |
| Attendee | attendee@test.com  | password123 |

## How It Works

### Host Flow
1. Log in and create an event (set name, location, room, and click the map to set GPS coordinates)
2. Share the **event code** with attendees so they can register
3. Start an attendance session — your browser will request GPS permission so your live location is captured
4. A 6-digit code is generated, valid for 15 minutes. Share it (display on screen, message, etc.)
5. Watch live check-ins, view history, export CSV

### Attendee Flow
1. Log in and join an event using the event code from the host
2. When a session is active, enter the 6-digit session code and click Check In
3. Your browser will request GPS permission — you must be within **100m of both the venue and the host's location** when the session was started
4. View your attendance history in the dashboard

## Tech Stack

- **Frontend:** React, Tailwind CSS, React Router, Leaflet maps
- **Backend:** Node.js, Express, better-sqlite3, JWT auth, bcryptjs
- **GPS:** Browser Geolocation API + Haversine formula for dual proximity verification (venue + host)

## Project Structure

```
├── client/          # React frontend (port 3000)
│   └── src/
│       ├── pages/       # Login, Signup, Host/Attendee dashboards
│       ├── components/  # Navbar, MapPicker
│       ├── api.js       # API client
│       └── AuthContext.js
├── server/          # Express backend (port 3001)
│   └── src/
│       ├── routes/      # auth, events, sessions, attendance
│       ├── middleware/   # JWT auth
│       ├── utils/       # Haversine formula
│       ├── db.js        # SQLite setup + schema
│       └── seed.js      # Test data
└── package.json     # Root with concurrent dev script
```
