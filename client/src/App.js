import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HostDashboard from './pages/HostDashboard';
import AttendeeDashboard from './pages/AttendeeDashboard';
import EventDetail from './pages/EventDetail';
import SessionHistory from './pages/SessionHistory';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="text-[11px] text-white/20">loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'host' ? <Navigate to="/host" /> : <Navigate to="/attendee" />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/host" element={<ProtectedRoute role="host"><HostDashboard /></ProtectedRoute>} />
          <Route path="/attendee" element={<ProtectedRoute role="attendee"><AttendeeDashboard /></ProtectedRoute>} />
          <Route path="/event/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          <Route path="/event/:id/history" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
