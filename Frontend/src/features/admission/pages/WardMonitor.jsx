import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchAdmissions, 
  fetchBeds, 
  admitPatient, 
  seedBeds 
} from '../services/admissionApi';
import BedGridSelector from '../components/BedGridSelector';

export default function WardMonitor() {
  const navigate = useNavigate();

  const [admissions, setAdmissions] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Admit patient wizard state
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [admittingDoctorId, setAdmittingDoctorId] = useState('60b8d29a1f28b4382c8f8e02'); // Mock doctor ID
  const [reasonForAdmission, setReasonForAdmission] = useState('');
  const [wardType, setWardType] = useState('GENERAL'); // GENERAL, ICU, PEDIATRIC, PRIVATE
  const [admitError, setAdmitError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [admissionsData, bedsData] = await Promise.all([
        fetchAdmissions(),
        fetchBeds()
      ]);
      setAdmissions(admissionsData || []);
      setBeds(bedsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedBeds = async () => {
    try {
      setActionLoading(true);
      await seedBeds();
      await loadData();
    } catch (err) {
      alert('Failed to seed beds: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setAdmitError('');

    if (!selectedBed) {
      setAdmitError('Please select a bed from the grid layout.');
      return;
    }
    if (!patientId.trim()) {
      setAdmitError('Patient ID is mandatory.');
      return;
    }
    if (!reasonForAdmission.trim()) {
      setAdmitError('Reason for admission is mandatory.');
      return;
    }

    try {
      setActionLoading(true);
      await admitPatient({
        patientId,
        admittingDoctorId,
        reasonForAdmission,
        wardType,
        bedId: selectedBed.id || selectedBed._id
      });
      setShowAdmitModal(false);
      
      // Reset form
      setPatientId('');
      setReasonForAdmission('');
      setSelectedBed(null);

      // Refresh monitor dashboard data
      await loadData();
    } catch (err) {
      setAdmitError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Stats calculations
  const totalBedsCount = beds.length;
  const occupiedBedsCount = beds.filter(b => b.occupied).length;
  const vacantBedsCount = totalBedsCount - occupiedBedsCount;
  
  const icuBeds = beds.filter(b => b.bedType === 'INTENSIVE_CARE');
  const icuOccupied = icuBeds.filter(b => b.occupied).length;
  const icuOccupancyRate = icuBeds.length > 0 ? Math.round((icuOccupied / icuBeds.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Inpatient Ward Monitor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Live patient allocations, bed catalog states, and ward capacity widgets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalBedsCount === 0 && (
            <button
              onClick={handleSeedBeds}
              disabled={actionLoading}
              className="px-4 py-2 border border-sky-200 text-sky-600 dark:border-sky-900 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Initializing...' : 'Seed Sample Beds'}
            </button>
          )}

          <button
            onClick={() => setShowAdmitModal(true)}
            disabled={totalBedsCount === 0 || actionLoading}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Admit Patient
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500">
          <svg className="animate-spin h-8 w-8 text-sky-500 mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-bold">Syncing telemetry data...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-sm">
          System telemetry synchronization failure: {error}
        </div>
      ) : (
        <>
          {/* Key Metrics row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Catalog Capacity</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 block">{totalBedsCount}</span>
              <span className="text-xs text-slate-500 mt-2 block">Physically configured beds</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Occupancy</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 block">{occupiedBedsCount}</span>
              <span className="text-xs text-rose-500 mt-2 font-semibold block flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                {totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0}% Occupancy rate
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Vacant Beds</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 block">{vacantBedsCount}</span>
              <span className="text-xs text-emerald-500 mt-2 font-semibold block flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Available instantly
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">ICU Occupancy Rate</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 block">{icuOccupancyRate}%</span>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${icuOccupancyRate > 80 ? 'bg-rose-500' : 'bg-sky-500'}`} 
                  style={{ width: `${icuOccupancyRate}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Primary Viewport Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Admissions queue */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Admitted Patients Ledger</h3>
                
                {admissions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 italic text-sm">
                    No active inpatient admissions recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                          <th className="pb-3">Admission ID</th>
                          <th className="pb-3">Patient ID</th>
                          <th className="pb-3">Room / Bed</th>
                          <th className="pb-3">Ward</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admissions.map((adm) => {
                          const isActive = adm.status !== 'DISCHARGED';
                          return (
                            <tr key={adm.id || adm._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="py-3.5 font-bold text-slate-700 dark:text-slate-200">
                                {adm.admissionId}
                              </td>
                              <td className="py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">
                                {adm.patientId}
                              </td>
                              <td className="py-3.5">
                                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                  Room {adm.bedDetails?.roomNumber || 'N/A'}
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                  Bed {adm.bedDetails?.bedNumber || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-500 dark:text-slate-400">
                                {adm.bedDetails?.wardName || 'N/A'}
                              </td>
                              <td className="py-3.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  adm.status === 'ADMITTED'
                                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                                    : adm.status === 'TRANSFERRED'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {adm.status}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <button
                                  onClick={() => navigate(`/admissions/${adm.id || adm._id}`)}
                                  className="text-sky-500 hover:text-sky-600 font-semibold text-xs hover:underline flex items-center gap-0.5"
                                >
                                  Open File
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Room availability sidebar */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800 dark:text-white">Bed Availability Monitor</h3>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-500">
                    Live Grid
                  </span>
                </div>
                <BedGridSelector />
              </div>
            </div>

          </div>
        </>
      )}

      {/* Admission Intake Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAdmitModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form onSubmit={handleAdmitSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Inpatient Admission Registry</h2>
              
              {admitError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs">
                  {admitError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Patient ID (ObjectId)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 60b8d29a1f28b4382c8f8e04"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
                  />
                </div>

                {/* Admitting Doctor ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Admitting Doctor ID (ObjectId)</label>
                  <input
                    type="text"
                    required
                    value={admittingDoctorId}
                    onChange={(e) => setAdmittingDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
                  />
                </div>

                {/* Ward Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Ward Type Requirement</label>
                  <select
                    value={wardType}
                    onChange={(e) => {
                      setWardType(e.target.value);
                      setSelectedBed(null); // Reset selected bed as filters change
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
                  >
                    <option value="GENERAL">General Ward</option>
                    <option value="ICU">Intensive Care Unit (ICU)</option>
                    <option value="PEDIATRIC">Pediatric Ward</option>
                    <option value="PRIVATE">Private Suite</option>
                  </select>
                </div>

                {/* Reason for Admission */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Reason for Admission</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diabetic Ketoacidosis Stabilization"
                    value={reasonForAdmission}
                    onChange={(e) => setReasonForAdmission(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Bed Selector grid wrapper */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold text-slate-500">
                  Select Room / Bed Location
                  {selectedBed && (
                    <span className="ml-2 text-sky-500 font-bold">
                      (Selected: Room {selectedBed.roomNumber} - Bed {selectedBed.bedNumber})
                    </span>
                  )}
                </span>
                
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-h-[300px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
                  <BedGridSelector 
                    onSelectBed={setSelectedBed} 
                    selectedBedId={selectedBed?.id || selectedBed?._id}
                    wardTypeFilter={wardType} 
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
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
                  Register Inpatient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
