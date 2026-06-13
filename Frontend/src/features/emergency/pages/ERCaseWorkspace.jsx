import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchEmergencyCaseById, 
  logTreatment, 
  assignStaff, 
  escalateCaseToInpatient, 
  closeEmergencyCase 
} from '../services/emergencyApi';
import BedGridSelector from '../../admission/components/BedGridSelector';

// Mock staff catalog for easy assignment and selection
const MOCK_STAFF = [
  { id: '60b8d29a1f28b4382c8f8e02', name: 'Dr. Sarah Jenkins', role: 'Trauma Lead (Physician)' },
  { id: '60b8d29a1f28b4382c8f8e09', name: 'Nurse Mark Ramirez', role: 'Emergency Nurse' },
  { id: '60b8d29a1f28b4382c8f8e05', name: 'Dr. James Carter', role: 'Neurosurgeon' },
  { id: '60b8d29a1f28b4382c8f8e06', name: 'Dr. Lisa Wang', role: 'Cardiologist' }
];

export default function ERCaseWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [erCase, setErCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Treatment form state
  const [newTreatment, setNewTreatment] = useState('');
  const [administeringStaffId, setAdministeringStaffId] = useState(MOCK_STAFF[0].id);

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  // Staff assignment checkbox states
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  // Escalation form state
  const [resolvedPatientId, setResolvedPatientId] = useState('');
  const [selectedBed, setSelectedBed] = useState(null);
  const [escalateWardType, setEscalateWardType] = useState('GENERAL');
  const [escalateDoctorId, setEscalateDoctorId] = useState(MOCK_STAFF[0].id);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateError, setEscalateError] = useState('');

  const loadCaseDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchEmergencyCaseById(id);
      setErCase(data);
      // Pre-fill fields
      if (data) {
        setResolvedPatientId(data.patientId || '');
        setSelectedStaffIds(data.assignedStaff || []);
        setEscalateReason(data.incidentDetails || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseDetails();
  }, [id]);

  const handleTreatmentSubmit = async (e) => {
    e.preventDefault();
    if (!newTreatment.trim()) return;

    try {
      setActionLoading(true);
      const updated = await logTreatment(id, {
        treatment: newTreatment,
        administeredBy: administeringStaffId
      });
      setErCase(updated);
      setNewTreatment('');
    } catch (err) {
      alert('Failed to log treatment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const updated = await assignStaff(id, selectedStaffIds);
      setErCase(updated);
      setShowAssignModal(false);
    } catch (err) {
      alert('Failed to assign staff: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    setEscalateError('');

    if (!resolvedPatientId.trim()) {
      setEscalateError('Patient ID is required (resolve anonymous identity if previously unknown).');
      return;
    }
    if (!selectedBed) {
      setEscalateError('Please select a target ward bed from the selector layout.');
      return;
    }
    if (!escalateReason.trim()) {
      setEscalateError('Reason for inpatient admission is required.');
      return;
    }

    try {
      setActionLoading(true);
      await escalateCaseToInpatient(id, {
        patientId: resolvedPatientId,
        bedId: selectedBed.id || selectedBed._id,
        wardType: escalateWardType,
        reasonForAdmission: escalateReason,
        admittingDoctorId: escalateDoctorId
      });
      setShowEscalateModal(false);
      alert('Patient escalated successfully. ER case closed as TRANSFERRED, bed reserved, and Inpatient stay recorded.');
      navigate('/emergency/triage');
    } catch (err) {
      setEscalateError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseCase = async () => {
    if (!window.confirm('Are you sure the patient is stabilized and ready for ER discharge?')) return;
    try {
      setActionLoading(true);
      await closeEmergencyCase(id, 'Stabilized and discharged from ER triage.');
      alert('Case closed successfully.');
      navigate('/emergency/triage');
    } catch (err) {
      alert('Failed to close emergency case: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStaffName = (staffId) => {
    const s = MOCK_STAFF.find(st => st.id === staffId);
    return s ? `${s.name} (${s.role.split(' ')[0]})` : staffId;
  };

  const getTriageTheme = (level) => {
    switch (level) {
      case 'RED': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'ORANGE': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'YELLOW': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default: return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <svg className="animate-spin h-8 w-8 text-rose-500 mr-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading trauma file...</span>
      </div>
    );
  }

  if (error || !erCase) {
    return (
      <div className="p-6">
        <div className="p-4 bg-rose-900/30 text-rose-400 border border-rose-800 rounded-2xl text-sm mb-4">
          Error loading case: {error || 'Case record not found.'}
        </div>
        <button onClick={() => navigate('/emergency/triage')} className="text-xs text-sky-500 underline">
          Back to Triage Board
        </button>
      </div>
    );
  }

  const isCaseClosed = erCase.status === 'STABILIZED' || erCase.status === 'TRANSFERRED';

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Back Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/emergency/triage')}
          className="flex items-center text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Triage Board
        </button>
        <span className="text-xs text-slate-500">ER Admission: {erCase.emergencyId}</span>
      </div>

      {/* Case Overview Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Vitals, Staff & Incident Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTriageTheme(erCase.triageLevel)}`}>
                  {erCase.triageLevel} Priority (Score {erCase.triageScore})
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">
                  {erCase.patientId ? `Patient Ref: ${erCase.patientId}` : `Anonymous: ${erCase.temporaryName}`}
                </h2>
                <span className="text-xs text-slate-500">
                  Arrived At: {new Date(erCase.arrivedAt).toLocaleString()}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                erCase.status === 'STABILIZED' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                erCase.status === 'TRANSFERRED' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' :
                erCase.status === 'ACTIVE_TREATMENT' ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' :
                'bg-slate-800 text-slate-300'
              }`}>
                {erCase.status.replace('_', ' ')}
              </span>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
              <div className="text-center py-2">
                <span className="text-[10px] text-slate-500 block uppercase">Blood Pressure</span>
                <span className="text-lg font-bold text-slate-200 mt-1 block">
                  {erCase.vitalSignsAtArrival?.bloodPressure || 'N/A'}
                </span>
              </div>
              <div className="text-center py-2 border-l border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Heart Rate</span>
                <span className="text-lg font-bold text-slate-200 mt-1 block">
                  {erCase.vitalSignsAtArrival?.heartRate ? `${erCase.vitalSignsAtArrival.heartRate} bpm` : 'N/A'}
                </span>
              </div>
              <div className="text-center py-2 border-l border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">Temperature</span>
                <span className="text-lg font-bold text-slate-200 mt-1 block">
                  {erCase.vitalSignsAtArrival?.temperature ? `${erCase.vitalSignsAtArrival.temperature}°C` : 'N/A'}
                </span>
              </div>
              <div className="text-center py-2 border-l border-slate-800/60">
                <span className="text-[10px] text-slate-500 block uppercase">SpO2 (Oxygen)</span>
                <span className={`text-lg font-bold mt-1 block ${erCase.vitalSignsAtArrival?.spo2 < 92 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                  {erCase.vitalSignsAtArrival?.spo2 ? `${erCase.vitalSignsAtArrival.spo2}%` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Incident & EMS comments */}
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incident Details</h4>
                <p className="text-xs text-slate-300 mt-1 bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                  {erCase.incidentDetails}
                </p>
              </div>
              {erCase.incomingEMSDetails && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EMS Crew Notes</h4>
                  <p className="text-xs text-slate-300 mt-1 bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                    {erCase.incomingEMSDetails}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Staff Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-350">Assigned Medical Duty Staff</h3>
              {!isCaseClosed && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-xs text-sky-500 font-bold hover:underline"
                >
                  Assign Staff
                </button>
              )}
            </div>
            {erCase.assignedStaff?.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No medical staff assigned to this trauma case yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {erCase.assignedStaff.map((staffId) => (
                  <div key={staffId} className="flex items-center gap-2 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                    <span className="h-6 w-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                      MD
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{getStaffName(staffId)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: AI Support, Treatments Timeline & Actions */}
        <div className="space-y-6">
          
          {/* AI Clinical Feed */}
          {erCase.aiTriageSupport && (
            <div className={`border rounded-3xl p-6 ${getTriageTheme(erCase.triageLevel)}`}>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                AI Priority Checklist
              </h3>
              <div className="flex justify-between text-xs mb-3 border-b border-white/10 pb-2">
                <span>Severity Index</span>
                <span className="font-bold font-mono">{Math.round(erCase.aiTriageSupport.severityIndex * 100)}%</span>
              </div>
              <ul className="text-xs space-y-1.5 opacity-80">
                {erCase.aiTriageSupport.recommendedActions?.map((act, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-sky-500 select-none">✓</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ER Action Panel */}
          {!isCaseClosed && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-350">ER Operations Controls</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setShowEscalateModal(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  Escalate to Inpatient Admission
                </button>
                <button
                  onClick={handleCloseCase}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-colors"
                >
                  Stabilize & Discharge (ER Close)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Treatment timeline & Entry form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-base text-white mb-6">Trauma Treatments Timeline</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Treatment Timeline Display */}
          <div className="lg:col-span-2 space-y-4">
            {erCase.treatmentsAdministered?.length === 0 ? (
              <div className="text-center py-10 text-slate-500 italic text-xs border border-dashed border-slate-850 rounded-2xl bg-slate-950/20">
                No immediate ER treatments or medications logged yet.
              </div>
            ) : (
              <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-6">
                {erCase.treatmentsAdministered.map((treat, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline dot */}
                    <span className="absolute -left-[30px] top-1.5 h-3.5 w-3.5 bg-rose-500 rounded-full border-4 border-slate-900 shadow shadow-rose-950" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">{treat.treatment}</p>
                      <span className="block text-[10px] text-slate-500 mt-1">
                        Administered by {getStaffName(treat.administeredBy)} at {new Date(treat.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Treatment entry logger form */}
          {!isCaseClosed && (
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 h-fit">
              <h4 className="font-bold text-xs text-slate-300 mb-4">Log New ER Intervention</h4>
              <form onSubmit={handleTreatmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Treatment / Medicine Details</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. IV Saline 500ml + Morphine 5mg administered"
                    value={newTreatment}
                    onChange={(e) => setNewTreatment(e.target.value)}
                    className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Administered By</label>
                  <select
                    value={administeringStaffId}
                    onChange={(e) => setAdministeringStaffId(e.target.value)}
                    className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:outline-none"
                  >
                    {MOCK_STAFF.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.role.split(' ')[0]})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl hover:shadow transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Logging...' : 'Log Trauma Treatment'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Staff Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Assign Medical Duty Staff</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-2">
                {MOCK_STAFF.map(st => {
                  const isChecked = selectedStaffIds.includes(st.id);
                  return (
                    <label key={st.id} className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-850 hover:bg-slate-850/30 transition-colors cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaffIds([...selectedStaffIds, st.id]);
                          } else {
                            setSelectedStaffIds(selectedStaffIds.filter(id => id !== st.id));
                          }
                        }}
                        className="rounded border-slate-750 text-sky-500 focus:ring-0"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-slate-200">{st.name}</p>
                        <p className="text-slate-500 text-[10px]">{st.role}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalation to Inpatient Admission Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-4xl shadow-2xl my-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Escalate Case to Inpatient Ward Stay</h3>
                <p className="text-slate-500 text-xs mt-1">Confirm identification and book an inpatient bed</p>
              </div>
              <button onClick={() => setShowEscalateModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {escalateError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-900/30 border border-rose-800 text-rose-400 text-xs font-semibold">
                {escalateError}
              </div>
            )}

            <form onSubmit={handleEscalateSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resolved Patient ID</label>
                  <input
                    type="text"
                    placeholder="Enter patient ID"
                    value={resolvedPatientId}
                    onChange={(e) => setResolvedPatientId(e.target.value)}
                    className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Patient ID is required to map records.</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Admitting Physician</label>
                  <select
                    value={escalateDoctorId}
                    onChange={(e) => setEscalateDoctorId(e.target.value)}
                    className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:outline-none"
                  >
                    {MOCK_STAFF.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.role.split(' ')[0]})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Inpatient Ward Type</label>
                  <select
                    value={escalateWardType}
                    onChange={(e) => setEscalateWardType(e.target.value)}
                    className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="GENERAL">General Ward (Standard rate)</option>
                    <option value="ICU">Intensive Care Unit (Critical care)</option>
                    <option value="PEDIATRIC">Pediatric Ward</option>
                    <option value="PRIVATE">Private Room (Premium rate)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Admission Reason Notes</label>
                  <input
                    type="text"
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Bed Selection Grid layout */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Bed Location (Selected: {selectedBed ? `Room ${selectedBed.roomNumber} - Bed ${selectedBed.bedNumber}` : 'None'})
                </label>
                <div className="max-h-[300px] overflow-y-auto border border-slate-800 rounded-2xl p-4 bg-slate-950/20">
                  <BedGridSelector
                    onSelectBed={(bed) => setSelectedBed(bed)}
                    selectedBedId={selectedBed?.id || selectedBed?._id}
                    wardTypeFilter={escalateWardType}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Authorize Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
