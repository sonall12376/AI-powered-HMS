import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchAdmissionById, 
  recordRound, 
  transferPatient, 
  dischargePatient, 
  fetchBeds 
} from '../services/admissionApi';
import RoundsLoggerForm from '../components/RoundsLoggerForm';
import DischargeModal from '../components/DischargeModal';
import BedGridSelector from '../components/BedGridSelector';

export default function AdmissionFile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [showRoundsModal, setShowRoundsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  // Transfer state
  const [selectedTransferBed, setSelectedTransferBed] = useState(null);
  const [transferError, setTransferError] = useState('');

  const loadAdmission = async () => {
    try {
      setLoading(true);
      const data = await fetchAdmissionById(id);
      setAdmission(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmission();
  }, [id]);

  const handleRoundsSubmit = async (roundData) => {
    try {
      setActionLoading(true);
      const updated = await recordRound(id, roundData);
      setAdmission(updated);
      setShowRoundsModal(false);
    } catch (err) {
      alert('Failed to log round observations: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError('');

    if (!selectedTransferBed) {
      setTransferError('Please select a target bed from the grid.');
      return;
    }

    try {
      setActionLoading(true);
      const updated = await transferPatient(id, {
        newBedId: selectedTransferBed.id || selectedTransferBed._id
      });
      setAdmission(updated);
      setShowTransferModal(false);
      setSelectedTransferBed(null);
    } catch (err) {
      setTransferError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDischargeSubmit = async (dischargeData) => {
    try {
      setActionLoading(true);
      const updated = await dischargePatient(id, dischargeData);
      setAdmission(updated);
      setShowDischargeModal(false);
      
      // Let user know discharge completed
      alert('Patient discharged successfully. Billing invoice has been compiled.');
    } catch (err) {
      alert('Failed to process discharge: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <svg className="animate-spin h-8 w-8 text-sky-500 mr-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading clinical file...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-sm">
        Failed to fetch admission file details: {error}
        <button onClick={() => navigate('/admissions')} className="block mt-2 underline text-xs">
          Return to monitor ledger
        </button>
      </div>
    );
  }

  const isDischarged = admission.status === 'DISCHARGED';

  return (
    <div className="space-y-6">
      {/* Navigation and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <button 
            onClick={() => navigate('/admissions')}
            className="text-xs font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 mb-2 hover:underline"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Ward Monitor
          </button>
          
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            Clinical File: {admission.admissionId}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              admission.status === 'ADMITTED'
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                : admission.status === 'TRANSFERRED'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {admission.status}
            </span>
          </h1>
        </div>

        {!isDischarged && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowRoundsModal(true)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl text-xs font-bold transition-all"
            >
              Record Daily Round
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl text-xs font-bold transition-all"
            >
              Transfer Room/Bed
            </button>
            <button
              onClick={() => setShowDischargeModal(true)}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/10 transition-all"
            >
              Discharge Patient
            </button>
          </div>
        )}
      </div>

      {/* Main File Layout split-pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3: General file Details and Daily Rounds Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Demographics & Metadata card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Admission Metadata</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="block text-xs text-slate-400">Patient ID</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-xs">{admission.patientId}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Admitting Doctor ID</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-xs">{admission.admittingDoctorId}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Admission Date</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(admission.admissionDate).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Ward Category Requirement</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{admission.wardType}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400">Reason for Admission</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{admission.reasonForAdmission}</span>
              </div>
              {admission.dischargeDate && (
                <div>
                  <span className="block text-xs text-slate-400">Discharge Date</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(admission.dischargeDate).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Clinical Rounds timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Daily Clinical Rounds Logs</h3>
            
            {!admission.dailyRounds || admission.dailyRounds.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic text-sm">
                No clinical rounds observations logged yet.
              </div>
            ) : (
              <div className="relative border-l border-slate-100 dark:border-slate-800 pl-4 space-y-6">
                {admission.dailyRounds.map((round, index) => (
                  <div key={index} className="relative">
                    {/* Circle bullet indicator */}
                    <span className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full bg-sky-500 border-2 border-white dark:border-slate-900" />
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          Round #{index + 1} - Doctor ID: <span className="font-mono">{round.visitingDoctorId}</span>
                        </span>
                        <span className="text-slate-400">
                          {new Date(round.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {/* Vitals row */}
                      {round.vitals && (
                        <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          <div>BP: <span className="text-slate-700 dark:text-slate-200 block text-xs">{round.vitals.bloodPressure}</span></div>
                          <div>HR: <span className="text-slate-700 dark:text-slate-200 block text-xs">{round.vitals.heartRate} bpm</span></div>
                          <div>Temp: <span className="text-slate-700 dark:text-slate-200 block text-xs">{round.vitals.temperature}°C</span></div>
                          <div>SpO2: <span className="text-slate-700 dark:text-slate-200 block text-xs">{round.vitals.spo2}%</span></div>
                        </div>
                      )}

                      <div className="text-sm bg-slate-50/50 dark:bg-slate-850/10 p-3 rounded-xl border border-slate-100/50 dark:border-slate-850 text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-slate-700 dark:text-slate-200">Observations Notes:</p>
                        <p className="mt-1">{round.notes}</p>

                        {round.prescribedChanges && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/50 text-xs">
                            <span className="font-bold text-sky-500">Prescribed Changes:</span> {round.prescribedChanges}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1/3 Sidebar: Room Details & Discharge Summary details */}
        <div className="space-y-4">
          
          {/* Bed Allocation summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Active Bed Allocation</h3>
            
            {admission.bedDetails ? (
              <div className="space-y-3">
                <div className="bg-sky-50/50 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-900/40 p-4 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-sky-500 rounded-xl text-white flex items-center justify-center">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10V3a1 1 0 011-1h1v8h12V3a1 1 0 011-1h1v7a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2v-5a2 2 0 012-2zm0 0h18" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs text-sky-600 dark:text-sky-400 font-bold block">{admission.bedDetails.wardName}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      Room {admission.bedDetails.roomNumber} - Bed {admission.bedDetails.bedNumber}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs italic">No bed details assigned.</div>
            )}
          </div>

          {/* Discharge summary card */}
          {isDischarged && admission.dischargeSummary && (
            <div className="bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5 text-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Discharge Clearance Summary
              </h3>

              <div className="text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="font-bold block text-slate-500">Diagnosis at Discharge:</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{admission.dischargeSummary.diagnosisAtDischarge}</p>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">Treatment Summary:</span>
                  <p className="mt-0.5">{admission.dischargeSummary.treatmentSummary}</p>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">Discharge Notes & Home Instructions:</span>
                  <p className="mt-0.5">{admission.dischargeSummary.dischargeNotes}</p>
                </div>
                <div className="pt-2 border-t border-rose-100 dark:border-rose-900/20">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block tracking-wider">
                    Billing Completed
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Discharge release triggered invoice creation successfully.</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Rounds Modal */}
      {showRoundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            <RoundsLoggerForm 
              onSubmit={handleRoundsSubmit} 
              onClose={() => setShowRoundsModal(false)} 
              isSubmitting={actionLoading} 
            />
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowTransferModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transfer Patient Room/Bed</h3>
              <p className="text-xs text-slate-500">
                Choose an available vacant room/bed. The old bed will automatically be marked vacant.
              </p>

              {transferError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs">
                  {transferError}
                </div>
              )}

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-[300px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
                <BedGridSelector 
                  onSelectBed={setSelectedTransferBed} 
                  selectedBedId={selectedTransferBed?.id || selectedTransferBed?._id}
                  wardTypeFilter={admission.wardType}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {actionLoading && (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            <DischargeModal 
              onSubmit={handleDischargeSubmit} 
              onClose={() => setShowDischargeModal(false)} 
              isSubmitting={actionLoading} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
