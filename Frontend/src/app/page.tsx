'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/hms/GlassCard';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Verify backend connectivity
  useEffect(() => {
    fetch('http://localhost:8080/api/v1/public/health', { signal: AbortSignal.timeout(2000) })
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const handleLogin = async (e: React.FormEvent, customCredentials?: { u: string; p: string }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const u = customCredentials ? customCredentials.u : username;
    const p = customCredentials ? customCredentials.p : password;

    if (!u || !p) {
      setError('Please enter both username and password.');
      setLoading(false);
      return;
    }

    try {
      if (apiStatus === 'online') {
        const res = await fetch('http://localhost:8080/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p }),
        });

        if (!res.ok) {
          throw new Error('Invalid username or password.');
        }

        const data = await res.json();
        
        // Save to localStorage
        localStorage.setItem('hms_token', data.accessToken);
        localStorage.setItem('hms_user', JSON.stringify({
          username: data.username,
          role: data.role,
          linkedEntityId: data.linkedEntityId
        }));

        // Redirect based on role
        redirectByRole(data.role);
      } else {
        // Fallback for offline mode (static client login)
        console.warn('Backend is offline. Performing client-side mock authentication.');
        let role = 'ADMIN';
        let entityId = '';

        if (u === 'patient') {
          role = 'PATIENT';
          entityId = 'PAT-201';
        } else if (u === 'doctor') {
          role = 'DOCTOR';
          entityId = 'DOC-101';
        }

        localStorage.setItem('hms_token', 'mock-jwt-token-for-' + role);
        localStorage.setItem('hms_user', JSON.stringify({
          username: u,
          role: role,
          linkedEntityId: entityId
        }));

        redirectByRole(role);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role: string) => {
    if (role === 'PATIENT') {
      router.push('/dashboard/patient');
    } else if (role === 'DOCTOR') {
      router.push('/dashboard/doctor');
    } else {
      setError('Admin portal is under construction. Please log in as a Patient or Doctor.');
    }
  };

  const fillCredentials = (role: 'patient' | 'doctor' | 'admin') => {
    if (role === 'patient') {
      setUsername('patient');
      setPassword('pat123');
    } else if (role === 'doctor') {
      setUsername('doctor');
      setPassword('doc123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background Animated Glows */}
      <div className="bg-glow-container">
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-200 to-cyan-300">
          AETHERIA HMS
        </h1>
        <p className="text-sm text-gray-400 mt-2">AI-Powered Hospital Operations Platform</p>
      </header>

      <GlassCard className="w-full max-w-md" glowIntensity="medium">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">System Access Portal</h2>
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 glass-input text-sm text-white focus:outline-none"
              placeholder="e.g. doctor"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 glass-input text-sm text-white focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-950/50 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 text-sm"
          >
            {loading ? 'Authenticating...' : 'Secure Authorization'}
          </button>
        </form>

        <div className="mt-8 border-t border-white/5 pt-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
            Reviewer Quick-Connect Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { fillCredentials('patient'); }}
              className="px-2 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-indigo-300 transition-colors"
            >
              Patient Portal
            </button>
            <button
              onClick={() => { fillCredentials('doctor'); }}
              className="px-2 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-indigo-300 transition-colors"
            >
              Doctor Portal
            </button>
            <button
              onClick={() => { fillCredentials('admin'); }}
              className="px-2 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-400 transition-colors"
            >
              Admin (Seed)
            </button>
          </div>
        </div>
      </GlassCard>

      <footer className="mt-8 text-xs text-gray-500 flex items-center space-x-2">
        <span>Backend Status:</span>
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
          apiStatus === 'online' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 
          apiStatus === 'offline' ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-gray-600'
        }`}></span>
        <span className="capitalize">{apiStatus === 'checking' ? 'checking connection...' : apiStatus}</span>
      </footer>
    </div>
  );
}
