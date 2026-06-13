import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import NotificationBell from '../../../features/notifications/components/NotificationBell';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center transition-colors duration-300">
      {/* Sidebar Toggle & Quick Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {/* Hamburger Icon */}
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Global Search Bar */}
        <div className="hidden md:flex relative max-w-xs w-64">
          <input
            type="text"
            placeholder="Search details (Ctrl + K)..."
            className="w-full pl-10 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            disabled
          />
          <span className="absolute left-3 top-2.5 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Notifications & Profile dropdown */}
      <div className="flex items-center gap-4">
        <NotificationBell />

        {/* User profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline text-sm font-semibold text-slate-700 dark:text-slate-200">
              {user?.username || 'Guest'}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.email || 'guest@hospital.com'}</p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
