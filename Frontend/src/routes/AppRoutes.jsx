import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout/DashboardLayout';

// Core Pages (Foundation)
const Login = lazy(() => import('../pages/Login/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));

// Module Features (Stubs / Implementations)
const InvoiceDashboard = lazy(() => import('../features/billing/pages/InvoiceDashboard'));
const InvoiceDetail = lazy(() => import('../features/billing/pages/InvoiceDetail'));
const WardMonitor = lazy(() => import('../features/admission/pages/WardMonitor'));
const AdmissionFile = lazy(() => import('../features/admission/pages/AdmissionFile'));
const ERTriageBoard = lazy(() => import('../features/emergency/pages/ERTriageBoard'));
const NotificationCenter = lazy(() => import('../features/notifications/pages/NotificationCenter'));
const ReportsDashboard = lazy(() => import('../features/reports/pages/ReportsDashboard'));
const ExplainerChatPage = lazy(() => import('../features/ai-explainer/pages/ExplainerChatPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-800 dark:text-white">Loading HMS Viewport...</div>}>
      <Routes>
        {/* Public Login Routing */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Layout Routing */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Landing page */}
            <Route path="/" element={<Dashboard />} />

            {/* Billing Module */}
            <Route path="/billing/invoices" element={<InvoiceDashboard />} />
            <Route path="/billing/invoices/:id" element={<InvoiceDetail />} />

            {/* Admission Module */}
            <Route path="/admissions" element={<WardMonitor />} />
            <Route path="/admissions/:id" element={<AdmissionFile />} />

            {/* Emergency Module */}
            <Route path="/emergency/triage" element={<ERTriageBoard />} />

            {/* Notifications Module */}
            <Route path="/notifications" element={<NotificationCenter />} />

            {/* Reports Module */}
            <Route path="/reports" element={<ReportsDashboard />} />

            {/* AI Patient Chatbot Module */}
            <Route path="/patient/prescriptions/explain" element={<ExplainerChatPage />} />
          </Route>
        </Route>

        {/* General Redirect Fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load billing pages (Fully implemented)
const InvoiceDashboard = lazy(() => import('../features/billing/pages/InvoiceDashboard'));
const InvoiceDetail = lazy(() => import('../features/billing/pages/InvoiceDetail'));

// Lazy load placeholder pages for other Developer 4 features
const WardMonitor = lazy(() => import('../features/admission/pages/WardMonitor'));
const AdmissionFile = lazy(() => import('../features/admission/pages/AdmissionFile'));
const ERTriageBoard = lazy(() => import('../features/emergency/pages/ERTriageBoard'));
const NotificationCenter = lazy(() => import('../features/notifications/pages/NotificationCenter'));
const ReportsDashboard = lazy(() => import('../features/reports/pages/ReportsDashboard'));
const ExplainerChatPage = lazy(() => import('../features/ai-explainer/pages/ExplainerChatPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-800 dark:text-white">Loading Route...</div>}>
      <Routes>
        {/* Billing & Payments Module Routes */}
        <Route path="/billing/invoices" element={<InvoiceDashboard />} />
        <Route path="/billing/invoices/:id" element={<InvoiceDetail />} />

        {/* Admission Management Module Routes */}
        <Route path="/admissions" element={<WardMonitor />} />
        <Route path="/admissions/:id" element={<AdmissionFile />} />

        {/* Emergency Management Module Routes */}
        <Route path="/emergency/triage" element={<ERTriageBoard />} />

        {/* Notifications System Module Routes */}
        <Route path="/notifications" element={<NotificationCenter />} />

        {/* Reports & Analytics Module Routes */}
        <Route path="/reports" element={<ReportsDashboard />} />

        {/* AI Prescription Explanation Bot Routes */}
        <Route path="/patient/prescriptions/explain" element={<ExplainerChatPage />} />

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/billing/invoices" replace />} />
      </Routes>
    </Suspense>
  );
}
