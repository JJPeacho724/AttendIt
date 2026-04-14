import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import MapPicker from '../components/MapPicker';

export default function HostDashboard() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', location_name: '', room: '', latitude: null, longitude: null });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const loadEvents = () => api.getHostingEvents().then(setEvents).catch(() => {});
  useEffect(() => { loadEvents(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (form.latitude == null || form.longitude == null) {
      setError('click the map to set the location');
      return;
    }
    setCreating(true);
    try {
      await api.createEvent(form);
      setForm({ name: '', location_name: '', room: '', latitude: null, longitude: null });
      setShowForm(false);
      loadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[11px] uppercase tracking-[0.3em] text-white/40">events</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="text-[10px] uppercase tracking-wider border border-[#222] text-white/30 hover:text-white/60 hover:border-[#333] px-3 py-1 rounded transition-colors">
          {showForm ? 'cancel' : '+ new'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-[#1a1a1a] rounded p-4 mb-6 space-y-3">
          {error && (
            <div className="text-[10px] text-red-400/60 border border-red-400/20 rounded px-3 py-2">{error}</div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">event name</label>
              <input type="text" value={form.name} onChange={update('name')} required placeholder="Team standup"
                className="w-full bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/15" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">location</label>
              <input type="text" value={form.location_name} onChange={update('location_name')} required placeholder="Main office"
                className="w-full bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/15" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">room</label>
              <input type="text" value={form.room} onChange={update('room')} required placeholder="301"
                className="w-full bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/15" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">coordinates</label>
            <MapPicker latitude={form.latitude} longitude={form.longitude}
              onChange={({ latitude, longitude }) => setForm({ ...form, latitude, longitude })} />
          </div>
          <button type="submit" disabled={creating}
            className="border border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 rounded px-4 py-1.5 text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30">
            {creating ? 'creating...' : 'create'}
          </button>
        </form>
      )}

      {events.length === 0 && !showForm ? (
        <div className="border border-[#1a1a1a] rounded p-8 text-center text-[11px] text-white/20">
          no events yet
        </div>
      ) : (
        <div className="space-y-px">
          {events.map(evt => (
            <Link to={`/event/${evt.id}`} key={evt.id}
              className="flex justify-between items-center px-3 py-2.5 rounded hover:bg-white/[0.04] transition-colors block group">
              <div>
                <span className="text-[12px] text-white/60 group-hover:text-white/80 transition-colors">{evt.name}</span>
                <span className="text-[10px] text-white/20 ml-3">{evt.location_name} {evt.room}</span>
              </div>
              <span className="text-[10px] text-white/20 font-mono">{evt.event_code}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
