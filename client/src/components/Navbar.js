import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-[#1a1a1a] h-10 flex items-center px-5">
      <div className="flex justify-between items-center w-full max-w-5xl mx-auto">
        <Link to="/" className="text-[11px] uppercase tracking-[0.3em] text-white/60 hover:text-white/90 transition-colors">
          attendit
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/30">
              {user.name} / {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-[10px] text-white/20 hover:text-white/50 transition-colors uppercase tracking-wider"
            >
              logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
