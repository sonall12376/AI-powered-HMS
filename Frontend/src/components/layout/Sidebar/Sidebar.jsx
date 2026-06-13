import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

export default function Sidebar({ isOpen }) {
  const { user } = useAuth();

  // Define navigation config matching role filters
  const allNavItems = [
    { label: 'Staff Configuration', path: '/admin/staff', roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Outpatient Schedule', path: '/doctor/schedule', roles: ['DOCTOR'] },
    { label: 'Ward Monitoring', path: '/nurse/wards', roles: ['NURSE', 'DOCTOR'] },
    { label: 'Register Patient', path: '/patients/register', roles: ['RECEPTIONIST', 'HOSPITAL_ADMIN'] },
    { label: 'Lab Test Queue', path: '/lab/queue', roles: ['LAB_TECHNICIAN', 'DOCTOR'] },
    { label: 'Pharmacy Catalog', path: '/pharmacy/inventory', roles: ['PHARMACIST'] },
    { label: 'Billing Invoices', path: '/billing/invoices', roles: ['BILLING_EXECUTIVE', 'HOSPITAL_ADMIN'] },
    { label: 'Emergency Triages', path: '/emergency/triage', roles: ['NURSE', 'DOCTOR', 'HOSPITAL_ADMIN'] },
    { label: 'Notification Center', path: '/notifications', roles: ['DOCTOR', 'NURSE', 'PATIENT', 'BILLING_EXECUTIVE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'HOSPITAL_ADMIN'] },
    { label: 'Reports & BI', path: '/reports', roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] },
    { label: 'Prescription Chatbot', path: '/patient/prescriptions/explain', roles: ['PATIENT'] },
  ];

  // Filter items matching user role
  const visibleItems = allNavItems.filter((item) => {
    if (!user || !user.roles) return false;
    return item.roles.some((role) => user.roles.includes(role));
  });

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-300 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white text-lg">
          CF
        </div>
        <span className="font-bold text-white text-lg tracking-wider">CareFlow AI</span>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-sky-400 font-bold">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <h5 className="font-semibold text-white truncate w-40">{user?.username || 'System User'}</h5>
            <span className="text-xs font-semibold text-sky-500 uppercase tracking-wide">
              {user?.roles?.[0] ? user.roles[0].replace('ROLE_', '') : 'GUEST'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
        {visibleItems.length === 0 ? (
          <p className="text-xs text-slate-500 p-2 italic">No options visible for current role.</p>
        ) : (
          visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))
        )}
      </nav>
    </aside>
  );
}
