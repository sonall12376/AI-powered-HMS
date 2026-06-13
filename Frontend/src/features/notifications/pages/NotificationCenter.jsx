import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  broadcastNotificationAlert 
} from '../services/notificationsApi';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('UNREAD'); // ALL, UNREAD, READ
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, CLINICAL, INVENTORY, EMERGENCY, SYSTEM

  // Broadcast Form State (For Admins)
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('ROLE_DOCTOR');
  const [broadcastType, setBroadcastType] = useState('SYSTEM_BROADCAST');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const role = user.roles && user.roles.length > 0 ? user.roles[0] : '';
      
      const params = {
        recipientUserId: user.username,
        recipientRole: role
      };

      if (statusFilter === 'UNREAD') params.readStatus = false;
      else if (statusFilter === 'READ') params.readStatus = true;

      const data = await fetchNotifications(params);
      setNotifications(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, statusFilter]);

  const handleMarkRead = async (notificationId) => {
    try {
      setActionLoading(true);
      await markNotificationAsRead(notificationId);
      // Update local state item readStatus flag
      setNotifications(notifications.map(n => 
        n.notificationId === notificationId ? { ...n, readStatus: true } : n
      ));
    } catch (err) {
      alert('Failed to update read status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcastSuccess('');

    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    try {
      setActionLoading(true);
      await broadcastNotificationAlert({
        targetRole: broadcastRole,
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType
      });
      setBroadcastSuccess('Broadcast alert dispatched successfully across targeted role group.');
      setBroadcastTitle('');
      setBroadcastMessage('');
      await loadNotifications();
    } catch (err) {
      alert('Broadcast delivery failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
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

  const getCategoryTheme = (type) => {
    switch (type) {
      case 'EMERGENCY_ALERT':
      case 'CRITICAL_INCIDENT':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'PRESCRIPTION_READY':
      case 'REPORT_AVAILABLE':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'INVENTORY_ALERT':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  // Filter lists based on type selected
  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'CLINICAL') return n.type === 'APPOINTMENT_REMINDER' || n.type === 'PRESCRIPTION_READY' || n.type === 'REPORT_AVAILABLE' || n.type === 'NEW_APPOINTMENT';
    if (typeFilter === 'EMERGENCY') return n.type === 'EMERGENCY_ALERT' || n.type === 'CRITICAL_INCIDENT';
    if (typeFilter === 'INVENTORY') return n.type === 'INVENTORY_ALERT';
    if (typeFilter === 'SYSTEM') return n.type === 'SYSTEM_BROADCAST';
    return true;
  });

  const isUserAdmin = user?.roles?.includes('ROLE_HOSPITAL_ADMIN') || user?.roles?.includes('ROLE_SUPER_ADMIN');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Notification Inbox
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Review clinic alerts, appointment reminders, system logs, and broadcasts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Inbox List Panel */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters controls bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              {['ALL', 'UNREAD', 'READ'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st 
                      ? 'bg-sky-500 text-white shadow-md' 
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  {st.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Filter Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1 bg-slate-800 border border-slate-750 text-slate-300 rounded-xl font-bold focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="CLINICAL">Clinical & Patients</option>
                <option value="EMERGENCY">Emergency Alerts</option>
                <option value="INVENTORY">Inventory Levels</option>
                <option value="SYSTEM">System Broadcasts</option>
              </select>
            </div>
          </div>

          {/* Inbox Feed */}
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-500">
              <svg className="animate-spin h-6 w-6 text-sky-500 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Syncing inbox logs...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10 text-slate-500 italic text-sm">
              Inbox empty. No notifications match active filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-5 rounded-2xl border bg-slate-900/40 border-slate-800 shadow-sm transition-all duration-200 flex gap-4 items-start ${
                    !n.readStatus ? 'shadow shadow-sky-950/10 border-l-4 border-l-sky-500' : 'opacity-75'
                  }`}
                >
                  <span className="text-2xl select-none">{getAlertIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getCategoryTheme(n.type)}`}>
                        {n.type.replace('_', ' ')}
                      </span>
                      {!n.readStatus && (
                        <span className="bg-sky-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-wider scale-90">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 mt-2">{n.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                    
                    <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-medium">
                      <span>Received: {new Date(n.createdAt).toLocaleString()}</span>
                      {n.recipientRole && (
                        <span>Target Role: {n.recipientRole}</span>
                      )}
                    </div>
                  </div>

                  {!n.readStatus && (
                    <button
                      onClick={() => handleMarkRead(n.notificationId)}
                      disabled={actionLoading}
                      className="px-3 py-1 border border-slate-750 text-slate-300 bg-slate-950/30 hover:bg-slate-800 text-[10px] font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Admin Broadcast Dashboard Form */}
        <div>
          {isUserAdmin ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Broadcast System Alert</h3>
                <p className="text-slate-500 text-xs mt-1">Send immediate push notifications to targeted staff roles</p>
              </div>

              {broadcastSuccess && (
                <div className="p-3 bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-xs font-semibold rounded-xl">
                  {broadcastSuccess}
                </div>
              )}

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Hospital Role</label>
                  <select
                    value={broadcastRole}
                    onChange={(e) => setBroadcastRole(e.target.value)}
                    className="px-3 py-2.5 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="ROLE_DOCTOR">Consultant Physicians (Doctors)</option>
                    <option value="ROLE_NURSE">Registered Nurses</option>
                    <option value="ROLE_BILLING_EXECUTIVE">Billing Executives</option>
                    <option value="ROLE_HOSPITAL_ADMIN">Hospital Administrators</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Broadcast Type</label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value)}
                    className="px-3 py-2.5 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="SYSTEM_BROADCAST">System Broadcast Alert</option>
                    <option value="EMERGENCY_ALERT">Emergency Case Warning</option>
                    <option value="INVENTORY_ALERT">Critical Inventory Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alert Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Critical Blood Supply Shortage"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Message Content</label>
                  <textarea
                    rows="4"
                    placeholder="Provide alert description details..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="px-4 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white text-xs font-bold rounded-xl shadow hover:shadow-lg transition-all"
                >
                  {actionLoading ? 'Dispatching Broadcast...' : 'Dispatch Broadcast Alert'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm text-center">
              <span className="text-3xl block mb-2 select-none">🛡️</span>
              <h4 className="font-bold text-xs text-slate-300">Broadcast Restriced</h4>
              <p className="text-[10px] text-slate-500 mt-1">Only users authenticated as Administrators can dispatch system wide alerts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
