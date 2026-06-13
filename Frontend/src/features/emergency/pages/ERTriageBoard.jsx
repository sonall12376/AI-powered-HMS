import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEmergencyCases, registerEmergencyCase } from '../services/emergencyApi';
import TriageBoard from '../components/TriageBoard';
import TraumaIntakeForm from '../components/TraumaIntakeForm';

export default function ERTriageBoard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await fetchEmergencyCases();
      setCases(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
    // Poll every 10 seconds for real-time queue synchronization
    const timer = setInterval(() => {
      fetchEmergencyCases()
        .then(data => setCases(data || []))
        .catch(err => console.error('Triage board auto-sync failure', err));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRegisterSubmit = async (payload) => {
    try {
      setActionLoading(true);
      const newCase = await registerEmergencyCase(payload);
      setShowIntakeModal(false);
      await loadCases();
    } catch (err) {
      alert('Failed to register emergency arrival: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCardClick = (identifier) => {
    navigate(`/emergency/case/${identifier}`);
  };

  // Metric summaries
  const activeCases = cases.filter(c => c.status !== 'STABILIZED' && c.status !== 'TRANSFERRED');
  const redAlerts = activeCases.filter(c => c.triageLevel === 'RED').length;
  const criticalDelays = activeCases.filter(c => {
    if (c.triageLevel !== 'ORANGE') return false;
    const elapsed = Date.now() - new Date(c.arrivedAt).getTime();
    return elapsed > 900000; // 15 minutes in ms
  }).length;
  const inTreatment = activeCases.filter(c => c.status === 'ACTIVE_TREATMENT').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Emergency Triage Workspace
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time trauma intakes, priority queueing columns, and clinical duty staff tracking.
          </p>
        </div>

        <button
          onClick={() => setShowIntakeModal(true)}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/10 flex items-center gap-1.5 transition-all"
        >
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Register Trauma Intake
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500">
          <svg className="animate-spin h-8 w-8 text-rose-500 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-bold">Syncing telemetry logs...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-900/30 text-rose-400 border border-rose-800 rounded-2xl text-sm font-semibold">
          Failed to synchronize clinical records: {error}
        </div>
      ) : (
        <>
          {/* Real-time KPI Metric Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Cases in ER</span>
              <span className="text-3xl font-extrabold text-white mt-1 block">{activeCases.length}</span>
              <span className="text-[10px] text-slate-500 mt-2 block">Patients currently being triaged</span>
            </div>

            <div className="bg-slate-900/60 border border-rose-500/20 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-rose-500/10 px-2.5 py-1 text-[8px] font-bold text-rose-400 uppercase rounded-bl-xl tracking-wider">
                Critical Alert
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RED Alert Level</span>
              <span className="text-3xl font-extrabold text-rose-500 mt-1 block">{redAlerts}</span>
              <span className="text-[10px] text-rose-400/80 font-bold mt-2 block flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                Requires immediate assessment
              </span>
            </div>

            <div className="bg-slate-900/60 border border-orange-500/20 p-5 rounded-2xl relative overflow-hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Queue Delays</span>
              <span className="text-3xl font-extrabold text-orange-500 mt-1 block">{criticalDelays}</span>
              <span className="text-[10px] text-orange-400/80 font-bold mt-2 block">
                {criticalDelays > 0 ? '⚠️ Orange cases delayed > 15m' : '✅ Operational queue within target'}
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Treatment</span>
              <span className="text-3xl font-extrabold text-sky-400 mt-1 block">{inTreatment}</span>
              <span className="text-[10px] text-slate-500 mt-2 block">Receiving trauma interventions</span>
            </div>
          </div>

          {/* Kanban Board Container */}
          <div className="bg-slate-900/20 border border-slate-800/80 p-5 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                Live Trauma Priority Ledger
              </h2>
              <span className="text-[10px] text-slate-500 font-semibold italic">Sorted by triage urgency levels</span>
            </div>
            
            <TriageBoard cases={cases} onCardClick={handleCardClick} />
          </div>
        </>
      )}

      {/* Intake Drawer Modal */}
      {showIntakeModal && (
        <TraumaIntakeForm
          onSubmit={handleRegisterSubmit}
          onClose={() => setShowIntakeModal(false)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}
