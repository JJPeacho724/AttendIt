const API_BASE = process.env.REACT_APP_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.headers.get('content-type')?.includes('text/csv')) {
    return res;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email, password, name, role) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name, role }) }),
  me: () => request('/auth/me'),

  // Events
  createEvent: (data) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  getHostingEvents: () => request('/events/hosting'),
  getRegisteredEvents: () => request('/events/registered'),
  joinEvent: (event_code) => request('/events/join', { method: 'POST', body: JSON.stringify({ event_code }) }),
  getEvent: (id) => request(`/events/${id}`),

  // Sessions
  startSession: (event_id, host_latitude, host_longitude) => request('/sessions', { method: 'POST', body: JSON.stringify({ event_id, host_latitude, host_longitude }) }),
  getActiveSession: (eventId) => request(`/sessions/active/${eventId}`),
  getSessionAttendance: (sessionId) => request(`/sessions/${sessionId}/attendance`),
  stopSession: (sessionId) => request(`/sessions/${sessionId}/stop`, { method: 'POST' }),
  getEventSessions: (eventId) => request(`/sessions/event/${eventId}`),

  // Attendance
  checkIn: (session_code, latitude, longitude) => request('/attendance/checkin', { method: 'POST', body: JSON.stringify({ session_code, latitude, longitude }) }),
  getAttendanceHistory: () => request('/attendance/history'),
  exportAttendance: (eventId) => request(`/attendance/export/${eventId}`),
};
