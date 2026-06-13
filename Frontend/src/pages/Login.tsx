import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Lock, Mail, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { accessToken, user } = response.data;
      login(accessToken, user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#070a13] px-4 overflow-hidden">
      {/* Premium Neon Glow Background Details */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-indigo-600/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="glass-premium w-full max-w-md rounded-2xl p-8 shadow-[0_15px_50px_rgba(0,0,0,0.5)] border border-indigo-500/20 relative z-10">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-2xl font-black text-white tracking-wide">
            HMS SECURE GATEWAY
          </h2>
          <p className="mt-1.5 text-xs text-indigo-300 font-medium flex items-center justify-center">
            <Sparkles className="h-3 w-3 mr-1 text-indigo-400 animate-pulse" />
            Enterprise Health Portal
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 flex items-start space-x-2.5 rounded-lg border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-300">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Security Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="receptionist@hms.com"
                className="w-full rounded-lg bg-[#070a13] border border-slate-800 pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              System Access Key
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg bg-[#070a13] border border-slate-800 pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-700 py-3.5 text-sm font-semibold tracking-wider text-white shadow-lg shadow-indigo-600/20 hover:from-indigo-600 hover:to-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                AUTHORIZING ENCRYPTED HANDSHAKE...
              </>
            ) : (
              'ESTABLISH ENCRYPTED HANDSHAKE'
            )}
          </button>
        </form>

        {/* Development Helper Box */}
        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          <p>This session is secured with AES-256 and strict Audit Logging.</p>
          <div className="mt-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 text-left">
            <span className="text-[10px] text-indigo-400 font-bold block mb-1">DEVELOPER ASSIST CREDENTIALS:</span>
            <span className="block">Admin: <code className="text-slate-300">admin@hms.com / admin123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
