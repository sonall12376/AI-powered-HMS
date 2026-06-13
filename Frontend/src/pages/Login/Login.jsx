import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('john.doe');
  const [role, setRole] = useState('HOSPITAL_ADMIN'); // Demo role selector
  const [error, setError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    // Mock successful authentication response
    const mockUser = {
      username,
      email: `${username.toLowerCase().replace(' ', '.')}@hospital.com`,
      roles: [`ROLE_${role}`],
    };
    
    login(mockUser, 'mock-jwt-auth-token-12345');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900/95 px-4 relative overflow-hidden">
      {/* Background radial overlays for premium aesthetics */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/10 dark:bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md shadow-sky-500/20">
            CF
          </div>
          <h2 className="text-2xl font-bold text-white mt-4">CareFlow AI Portal</h2>
          <p className="text-slate-400 text-sm mt-1">Select a role to verify common foundations layouts</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-900/30 border border-rose-800 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-2.5 w-full rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Mock Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-4 py-2.5 w-full rounded-xl border border-slate-700 bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm font-semibold"
            >
              <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
              <option value="DOCTOR">Consultant Physician</option>
              <option value="NURSE">Registered Nurse</option>
              <option value="BILLING_EXECUTIVE">Billing Executive</option>
              <option value="RECEPTIONIST">Front Desk Receptionist</option>
              <option value="PATIENT">Patient Profile</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 hover:shadow-lg transition-all duration-200"
          >
            Authenticate Session
          </button>
        </form>
      </div>
    </div>
  );
}
