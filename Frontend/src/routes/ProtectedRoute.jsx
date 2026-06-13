import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-slate-800 dark:text-white">
        Validating credentials session...
      </div>
    );
  }

  // Redirect to login if user session is missing
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role eligibility if restrictions apply
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasAccess) {
      return <Navigate to="/billing/invoices" replace />; // Fallback path
    }
  }

  return <Outlet />;
}
