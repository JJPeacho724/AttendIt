import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AttendeeDashboard() {
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [checkInError, setCheckInError] = useState('');
  const [checkInSuccess, setCheckInSuccess] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [tab, setTab] = useState('events');

  const loadData = () => {
    api.getRegisteredEvents().then(setEvents).catch(() => {});
    api.getAttendanceHistory().then(setHistory).catch(() => {});
  };
  useEffect(() => { loadData(); }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError(''); setJoinSuccess('');
    try {
      const data = await api.joinEvent(joinCode.trim().toUpperCase());
      setJoinSuccess(`joined ${data.event.name}`);
      setJoinCode('');
      loadData();
    } catch (err) {
      setJoinError(err.message);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setCheckInError(''); setCheckInSuccess(''); setCheckingIn(true);

    if (!navigator.geolocation) {
      setCheckInError('geolocation not supported');
      setCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await api.checkIn(
            sessionCode.trim(),
            position.coords.latitude,
            position.coords.longitude
          );
          setCheckInSuccess(`checked in — ${data.event_name} (${data.distance}m)`);
          setSessionCode('');
          loadData();
        } catch (err) {
          setCheckInError(err.message);
        } finally {
          setCheckingIn(false);
        }
      },
      (err) => {
        setCheckInError(`gps error: ${err.message}`);
        setCheckingIn(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      <h1 className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-6">dashboard</h1>

      {/* Check-in */}
      <div className="border border-[#1a1a1a] rounded p-4 mb-4">
        <div className="text-[9px] uppercase tracking-wider text-white/20 mb-2.5">check in</div>
        <form onSubmit={handleCheckIn} className="flex gap-2">
          <input type="text" value={sessionCode} onChange={e => setSessionCode(e.target.value)}
            placeholder="6-digit code" maxLength={6} required
            className="flex-1 bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[14px] text-white/80 tracking-[0.3em] text-center focus:outline-none focus:border-white/30 placeholder-white/15" />
          <button type="submit" disabled={checkingIn}
            className="border border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 rounded px-4 py-1.5 text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30 whitespace-nowrap">
            {checkingIn ? 'locating...' : 'check in'}
          </button>
        </form>
        {checkInError && <div className="text-[10px] text-red-400/60 mt-2">{checkInError}</div>}
        {checkInSuccess && <div className="text-[10px] text-white/40 mt-2">{checkInSuccess}</div>}
      </div>

      {/* Join event */}
      <div className="border border-[#1a1a1a] rounded p-4 mb-6">
        <div className="text-[9px] uppercase tracking-wider text-white/20 mb-2.5">join event</div>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)}
            placeholder="event code" required
            className="flex-1 bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 uppercase tracking-wider focus:outline-none focus:border-white/30 placeholder-white/15" />
          <button type="submit"
            className="border border-[#222] text-white/30 hover:text-white/60 hover:border-[#333] rounded px-4 py-1.5 text-[10px] uppercase tracking-widest transition-colors">
            join
          </button>
        </form>
        {joinError && <div className="text-[10px] text-red-400/60 mt-2">{joinError}</div>}
        {joinSuccess && <div className="text-[10px] text-white/40 mt-2">{joinSuccess}</div>}
      </div>

      {/* Tabs */}
      <div className="flex gap-px mb-4 border-b border-[#1a1a1a]">
        {[
          { key: 'events', label: `events (${events.length})` },
          { key: 'history', label: `history (${history.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-[10px] uppercase tracking-wider px-3 py-2 transition-colors ${
              tab === t.key ? 'text-white/60 border-b border-white/30 -mb-px' : 'text-white/20 hover:text-white/40'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'events' && (
        <div className="space-y-px">
          {events.length === 0 ? (
            <div className="text-[11px] text-white/20 py-6 text-center">no events yet</div>
          ) : events.map(evt => (
            <div key={evt.id} className="flex justify-between items-center px-3 py-2.5 rounded hover:bg-white/[0.04] transition-colors">
              <div>
                <span className="text-[12px] text-white/60">{evt.name}</span>
                <span className="text-[10px] text-white/20 ml-3">{evt.location_name} {evt.room}</span>
                <span className="text-[10px] text-white/15 ml-2">— {evt.host_name}</span>
              </div>
              {evt.has_active_session > 0 && (
                <span className="text-[9px] uppercase tracking-wider text-white/40">active</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="text-[11px] text-white/20 py-6 text-center">no records</div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-white/20">
                  <th className="text-left px-3 py-2 font-normal">event</th>
                  <th className="text-left px-3 py-2 font-normal">date</th>
                  <th className="text-right px-3 py-2 font-normal">distance</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={i} className="border-t border-[#1a1a1a] hover:bg-white/[0.02]">
                    <td className="px-3 py-2">
                      <span className="text-white/60">{r.event_name}</span>
                      <span className="text-white/15 ml-2">{r.location_name} {r.room}</span>
                    </td>
                    <td className="px-3 py-2 text-white/30">
                      {new Date(r.checked_in_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-white/30">
                      {r.distance_meters}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
