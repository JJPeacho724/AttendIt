import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'attendee' });
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await signup(form.email, form.password, form.name, form.role);
      navigate(user.role === 'host' ? '/host' : '/attendee');
    } catch (err) {
      setError(err.message);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-8 text-center">create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-[10px] text-red-400/60 border border-red-400/20 rounded px-3 py-2">{error}</div>
        )}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">full name</label>
          <input type="text" value={form.name} onChange={update('name')} required
            className="w-full bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/15" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">email</label>
          <input type="email" value={form.email} onChange={update('email')} required
            className="w-full bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/15" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-1.5">password</label>
          <input type="password" value={form.password} onChange={update('password')} required minLength={6}
            className="w-full bg-transparent border border-[#222] rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/15" />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-white/20 mb-2">role</label>
          <div className="flex gap-3">
            {['attendee', 'host'].map(role => (
              <label key={role}
                className={`flex-1 text-center cursor-pointer border rounded py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                  form.role === role
                    ? 'border-white/20 text-white/60 bg-white/[0.05]'
                    : 'border-[#222] text-white/20 hover:text-white/40 hover:border-[#333]'
                }`}>
                <input type="radio" name="role" value={role} checked={form.role === role}
                  onChange={update('role')} className="sr-only" />
                {role}
              </label>
            ))}
          </div>
        </div>
        <button type="submit"
          className="w-full border border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 rounded py-1.5 text-[10px] uppercase tracking-widest transition-colors">
          create account
        </button>
        <p className="text-center text-[10px] text-white/20">
          have an account?{' '}
          <Link to="/login" className="text-white/40 hover:text-white/60 transition-colors">sign in</Link>
        </p>
      </form>
    </div>
  );
}
