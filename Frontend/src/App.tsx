import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RouteGuard } from './components/RouteGuard';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PatientProfile } from './pages/PatientProfile';
import { Scheduler } from './pages/Scheduler';
import { MedicalRecords } from './pages/MedicalRecords';
import { Laboratory } from './pages/Laboratory';
import { Pharmacy } from './pages/Pharmacy';
import { AiAssistant } from './components/AiAssistant';
import { AlertCircle } from 'lucide-react';

const Unauthorized: React.FC = () => (
  <div className="flex h-screen flex-col items-center justify-center bg-[#070a13] px-4 text-center text-slate-300">
    <AlertCircle className="h-14 w-14 text-red-500 mb-4 animate-bounce" />
    <h2 className="font-heading text-xl font-black text-red-500 tracking-wider">SECURE AUDIT BARRIER: 403</h2>
    <p className="mt-2 text-sm text-slate-400 max-w-md">
      Access prohibited. Your credentials lack the mandatory clearance. This attempt has been logged in the audit ledger.
    </p>
    <a 
      href="/" 
      className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/10"
    >
      Return to Dashboard
    </a>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/" element={
            <RouteGuard>
              <Dashboard />
            </RouteGuard>
          } />
          
          <Route path="/patient/:id" element={
            <RouteGuard>
              <PatientProfile />
            </RouteGuard>
          } />

          <Route path="/patient/:id/records" element={
            <RouteGuard>
              <MedicalRecords />
            </RouteGuard>
          } />

          <Route path="/laboratory" element={
            <RouteGuard>
              <Laboratory />
            </RouteGuard>
          } />

          <Route path="/pharmacy" element={
            <RouteGuard>
              <Pharmacy />
            </RouteGuard>
          } />

          <Route path="/scheduler" element={
            <RouteGuard>
              <Scheduler />
            </RouteGuard>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Global Floating AI assistant chatbot panel */}
        <AiAssistant />
      </Router>
    </AuthProvider>
  );
}

export default App;
