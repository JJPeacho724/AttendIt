import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'host' ? '/host' : '/attendee');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-32">
      <h1 className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-8 text-center">sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-[10px] text-red-400/60 border border-red-400/20 rounded px-3 py-2">{error}</div>
        )}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/15"
            placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/15" />
        </div>
        <button type="submit"
          className="w-full border border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 rounded py-1.5 text-[10px] uppercase tracking-widest transition-colors">
          sign in
        </button>
        <p className="text-center text-[10px] text-white/20">
          no account?{' '}
          <Link to="/signup" className="text-white/40 hover:text-white/60 transition-colors">sign up</Link>
        </p>
      </form>
    </div>
  );
}
