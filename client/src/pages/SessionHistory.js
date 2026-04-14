import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function SessionHistory() {
  const { id } = useParams();
  const [evt, setEvt] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    api.getEvent(id).then(setEvt).catch(() => {});
    api.getEventSessions(id).then(setSessions).catch(() => {});
  }, [id]);

  const viewAttendance = async (session) => {
    if (selectedSession?.id === session.id) {
      setSelectedSession(null);
      setAttendance([]);
      return;
    }
    setSelectedSession(session);
    const records = await api.getSessionAttendance(session.id);
    setAttendance(records);
  };

  if (!evt) return <div className="text-[11px] text-white/20 text-center py-16">loading...</div>;

  return (
    <div>
      <Link to={`/event/${id}`} className="text-[10px] text-white/20 hover:text-white/40 transition-colors mb-6 inline-block">
        &larr; back to {evt.name}
      </Link>

      <h1 className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-6">session history</h1>

      {sessions.length === 0 ? (
        <div className="text-[11px] text-white/20 py-6 text-center">no sessions yet</div>
      ) : (
        <div className="space-y-px">
          {sessions.map(s => (
            <div key={s.id}>
              <button onClick={() => viewAttendance(s)}
                className="w-full flex justify-between items-center px-3 py-2.5 rounded hover:bg-white/[0.04] transition-colors text-left">
                <div>
                  <span className="text-[11px] text-white/60">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-white/20 ml-3">
                    {new Date(s.created_at).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] text-white/15 ml-3">
                    code {s.session_code}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/30">{s.attendance_count} attendee{s.attendance_count !== 1 ? 's' : ''}</span>
                  {s.active ? (
                    <span className="text-[9px] uppercase tracking-wider text-white/40">active</span>
                  ) : null}
                </div>
              </button>

              {selectedSession?.id === s.id && (
                <div className="border border-[#1a1a1a] rounded mx-3 mb-2 overflow-hidden">
                  {attendance.length === 0 ? (
                    <div className="text-[10px] text-white/15 px-3 py-3 text-center">no attendance</div>
                  ) : (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-[9px] uppercase tracking-wider text-white/20">
                          <th className="text-left px-3 py-1.5 font-normal">name</th>
                          <th className="text-left px-3 py-1.5 font-normal">time</th>
                          <th className="text-right px-3 py-1.5 font-normal">distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map(a => (
                          <tr key={a.id} className="border-t border-[#111]">
                            <td className="px-3 py-1.5 text-white/60">{a.attendee_name}</td>
                            <td className="px-3 py-1.5 text-white/30">{new Date(a.checked_in_at).toLocaleTimeString()}</td>
                            <td className="px-3 py-1.5 text-right text-white/30">{a.distance_meters}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
