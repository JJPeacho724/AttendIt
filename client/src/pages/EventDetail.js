import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [evt, setEvt] = useState(null);
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const isHost = user?.role === 'host';

  const loadSession = useCallback(() => {
    api.getActiveSession(id).then((s) => {
      setSession(s);
      if (s) api.getSessionAttendance(s.id).then(setAttendance);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    api.getEvent(id).then(setEvt).catch(() => {});
    loadSession();
  }, [id, loadSession]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      api.getSessionAttendance(session.id).then(setAttendance).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [session]);

  const handleStartSession = async () => {
    setStarting(true); setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Cannot start session.');
      setStarting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const s = await api.startSession(
            parseInt(id),
            position.coords.latitude,
            position.coords.longitude
          );
          setSession(s);
          setAttendance([]);
        } catch (err) {
          setError(err.message);
        } finally {
          setStarting(false);
        }
      },
      (geoErr) => {
        setError(`Location required to start a session. ${geoErr.message}. Please enable location services and try again.`);
        setStarting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStopSession = async () => {
    try {
      await api.stopSession(session.id);
      setSession(null);
      setAttendance([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.exportAttendance(id);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${evt?.name || 'export'}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('export failed');
    }
  };

  if (!evt) return <div className="text-[11px] text-white/20 text-center py-16">loading...</div>;

  const timeLeft = session ? Math.max(0, Math.floor((new Date(session.expires_at) - Date.now()) / 1000 / 60)) : 0;

  return (
    <div>
      <Link to={isHost ? '/host' : '/attendee'} className="text-[10px] text-white/20 hover:text-white/40 transition-colors mb-6 inline-block">
        &larr; back
      </Link>

      {/* Event header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[14px] text-white/80">{evt.name}</h1>
          <p className="text-[11px] text-white/30 mt-0.5">{evt.location_name}, room {evt.room}</p>
          <p className="text-[10px] text-white/15 mt-0.5">{evt.host_name}</p>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wider text-white/15">event code</div>
          <div className="text-[12px] text-white/40 font-mono mt-0.5">{evt.event_code}</div>
        </div>
      </div>

      {error && <div className="text-[10px] text-red-400/60 border border-red-400/20 rounded px-3 py-2 mb-4">{error}</div>}

      {isHost && (
        <>
          <div className="border border-[#1a1a1a] rounded p-4 mb-4">
            {session ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-white/30 mb-1">session active</div>
                    <div className="text-[24px] text-white/80 font-mono tracking-[0.3em]">{session.session_code}</div>
                    <div className="text-[10px] text-white/20 mt-1">{timeLeft}m remaining</div>
                  </div>
                  <button onClick={handleStopSession}
                    className="border border-[#1a1a1a] text-white/15 hover:text-red-400/60 hover:border-red-400/30 rounded px-3 py-1 text-[10px] uppercase tracking-wider transition-colors">
                    stop
                  </button>
                </div>

                <div className="border-t border-[#1a1a1a] pt-3">
                  <div className="text-[9px] uppercase tracking-wider text-white/20 mb-2">
                    attendance ({attendance.length})
                  </div>
                  {attendance.length === 0 ? (
                    <div className="text-[10px] text-white/15 py-2">waiting for check-ins...</div>
                  ) : (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-[9px] uppercase tracking-wider text-white/20">
                          <th className="text-left px-3 py-1.5 font-normal">name</th>
                          <th className="text-left px-3 py-1.5 font-normal">time</th>
                          <th className="text-right px-3 py-1.5 font-normal">dist</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map(a => (
                          <tr key={a.id} className="border-t border-[#111]">
                            <td className="px-3 py-1.5">
                              <span className="text-white/60">{a.attendee_name}</span>
                              <span className="text-white/15 ml-2 text-[10px]">{a.attendee_email}</span>
                            </td>
                            <td className="px-3 py-1.5 text-white/30">
                              {new Date(a.checked_in_at).toLocaleTimeString()}
                            </td>
                            <td className="px-3 py-1.5 text-right text-white/30">{a.distance_meters}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-[10px] text-white/20 mb-3">no active session</div>
                <button onClick={handleStartSession} disabled={starting}
                  className="border border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 rounded px-6 py-2 text-[10px] uppercase tracking-widest transition-colors disabled:opacity-30">
                  {starting ? 'locating...' : 'start session'}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link to={`/event/${id}/history`}
              className="border border-[#1a1a1a] text-white/20 hover:text-white/40 hover:border-[#333] rounded px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors">
              history
            </Link>
            <button onClick={handleExport}
              className="border border-[#1a1a1a] text-white/20 hover:text-white/40 hover:border-[#333] rounded px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors">
              export csv
            </button>
          </div>
        </>
      )}
    </div>
  );
}
