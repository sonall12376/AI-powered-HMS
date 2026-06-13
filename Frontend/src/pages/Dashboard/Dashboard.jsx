import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.username || 'HMS Member'}</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-lg">
            This dashboard serves as the landing viewport. Use the collapsible sidebar to navigate through modules permitted by your security profile.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
              Active Session Verified
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
              Role: {user?.roles?.[0] ? user.roles[0].replace('ROLE_', '') : 'NONE'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h4 className="font-semibold text-slate-800 dark:text-white">API Services</h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configured Axios interceptors automatically fetch security tokens from client storage.</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h4 className="font-semibold text-slate-800 dark:text-white">Spring Boot Backend</h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Spring Security permits testing endpoints. Standard controller mappings use exception advices.</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h4 className="font-semibold text-slate-800 dark:text-white">Responsive Theme</h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Custom CSS definitions adapt grid alignments and touch thresholds from desktop to mobile screens.</p>
        </div>
      </div>
    </div>
  );
}
