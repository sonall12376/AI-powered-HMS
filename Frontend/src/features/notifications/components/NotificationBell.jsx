import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { fetchNotifications, markNotificationAsRead } from '../services/notificationsApi';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const loadUnreadAlerts = async () => {
    if (!user) return;
    try {
      const role = user.roles && user.roles.length > 0 ? user.roles[0] : '';
      const data = await fetchNotifications({
        recipientUserId: user.username,
        recipientRole: role,
        readStatus: false
      });
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load unread alerts for bell:', err);
    }
  };

  useEffect(() => {
    loadUnreadAlerts();
    // Poll every 15 seconds to simulate push notifications / WebSocket updates
    const interval = setInterval(loadUnreadAlerts, 15000);

    // Click outside dropdown closer
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [user]);

  const handleAlertDismiss = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(notificationId);
      // Remove from bell preview state
      setNotifications(notifications.filter(n => n.notificationId !== notificationId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const handleAlertClick = async (n) => {
    setIsOpen(false);
    try {
      await markNotificationAsRead(n.notificationId);
      // Remove from list
      setNotifications(notifications.filter(item => item.notificationId !== n.notificationId));
    } catch (err) {
      console.error(err);
    }
    navigate('/notifications');
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'EMERGENCY_ALERT':
      case 'CRITICAL_INCIDENT':
        return '🚨';
      case 'PRESCRIPTION_READY':
        return '💊';
      case 'REPORT_AVAILABLE':
        return '📄';
      case 'INVENTORY_ALERT':
        return '📦';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-850 dark:hover:text-white rounded-lg transition-colors outline-none"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
            <span className="text-xs font-bold text-slate-350">
              Notifications ({notifications.length} Unread)
            </span>
            <button
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="text-[10px] text-sky-500 font-bold hover:underline"
            >
              View All
            </button>
          </div>

          {/* Alert list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-850 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-xs italic">
                No new unread notification alerts.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleAlertClick(n)}
                  className="px-4 py-3 hover:bg-slate-850/50 transition-colors cursor-pointer flex gap-3 items-start relative group text-left"
                >
                  <span className="text-lg select-none">{getAlertIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{n.title}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-normal">{n.message}</p>
                    <span className="text-[8px] text-slate-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleAlertDismiss(e, n.notificationId)}
                    className="text-[9px] text-slate-500 hover:text-slate-200 bg-slate-950/20 hover:bg-slate-800 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Mark as Read"
                  >
                    Dismiss
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
