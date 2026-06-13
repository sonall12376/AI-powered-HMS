import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ClipboardList, CheckCircle2, Clock, Play, FlaskConical, AlertCircle, RefreshCcw, FileText, Upload, X, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LabTestType {
  id: string;
  patientId: string;
  doctorId: string;
  testName: string;
  status: 'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULTS_READY' | 'COMPLETED';
  createdAt: string;
  patient: {
    sequenceId: string;
    firstName: string;
    lastName: string;
  };
  reports?: {
    id: string;
    resultSummary: string;
    reportUrl?: string;
    completedAt: string;
  }[];
}

export const Laboratory: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<LabTestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'queue' | 'reports'>('queue');

  // Submit Report Modal
  const [submitReportModal, setSubmitReportModal] = useState<LabTestType | null>(null);
  const [reportData, setReportData] = useState({
    resultSummary: '',
    fileName: '',
    fileBase64: ''
  });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // View Report Modal
  const [viewReportModal, setViewReportModal] = useState<LabTestType | null>(null);

  useEffect(() => {
    fetchLabQueue();
  }, []);

  const fetchLabQueue = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/labs/queue');
      setQueue(res.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch laboratory queue data.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (testId: string, nextStatus: string) => {
    try {
      await axios.put(`/api/labs/tests/${testId}/status`, { status: nextStatus });
      fetchLabQueue();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setReportError('File exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReportData(prev => ({
        ...prev,
        fileName: file.name,
        fileBase64: reader.result as string
      }));
      setReportError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitReportModal) return;
    if (!reportData.resultSummary.trim()) {
      setReportError('Please provide a result summary.');
      return;
    }

    setReportSubmitting(true);
    try {
      await axios.post(`/api/labs/tests/${submitReportModal.id}/report`, reportData);
      setSubmitReportModal(null);
      setReportData({ resultSummary: '', fileName: '', fileBase64: '' });
      fetchLabQueue();
    } catch (err: any) {
      console.error(err);
      setReportError(err.response?.data?.message || 'Failed to submit lab report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const isTech = user?.role === 'LAB_TECH' || user?.role === 'SUPER_ADMIN';

  // Metrics
  const totalCount = queue.length;
  const pendingCount = queue.filter(q => q.status === 'PENDING').length;
  const activeProcessingCount = queue.filter(q => q.status === 'SAMPLE_COLLECTED' || q.status === 'PROCESSING' || q.status === 'RESULTS_READY').length;
  const completedCount = queue.filter(q => q.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 pb-16 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Page Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <FlaskConical className="text-indigo-400 h-7 w-7" /> Laboratory Diagnostics Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track laboratory test workflow states, process incoming diagnostic orders, and dispatch PDF reports.
            </p>
          </div>
          <button 
            onClick={fetchLabQueue}
            className="rounded-lg border border-slate-800 bg-[#0b0f19] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh Dashboard
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400 border border-indigo-500/10">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Diagnostic Orders</span>
              <span className="text-xl font-black text-white mt-0.5">{totalCount}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="rounded-xl bg-yellow-500/10 p-3 text-yellow-400 border border-yellow-500/10">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Awaiting Sample</span>
              <span className="text-xl font-black text-white mt-0.5">{pendingCount}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400 border border-purple-500/10">
              <Play className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Processing</span>
              <span className="text-xl font-black text-white mt-0.5">{activeProcessingCount}</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="rounded-xl bg-green-500/10 p-3 text-green-400 border border-green-500/10">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed Reports</span>
              <span className="text-xl font-black text-white mt-0.5">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mb-6 flex space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
              activeTab === 'queue' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Laboratory Work Queue
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
              activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Diagnostic Lab Reports
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-indigo-500">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-red-950/15 border border-red-500/15 rounded-2xl text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-sm font-bold text-red-400">{error}</p>
          </div>
        ) : activeTab === 'queue' ? (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Ordered Test Name</th>
                  <th className="px-6 py-4">Patient Demographics</th>
                  <th className="px-6 py-4">Status State</th>
                  <th className="px-6 py-4">Order Date</th>
                  {isTech && <th className="px-6 py-4 text-right">Workflow Transition</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {queue.filter(q => q.status !== 'COMPLETED').map((test) => (
                  <tr key={test.id} className="hover:bg-slate-900/10">
                    <td className="px-6 py-4 font-bold text-white text-sm">{test.testName}</td>
                    <td className="px-6 py-4">
                      <span className="block font-bold text-slate-200">{test.patient.firstName} {test.patient.lastName}</span>
                      <span className="block text-[10px] text-indigo-400 font-mono mt-0.5">{test.patient.sequenceId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold ${
                        test.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        test.status === 'SAMPLE_COLLECTED' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        test.status === 'PROCESSING' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20' // RESULTS_READY
                      }`}>
                        {test.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {new Date(test.createdAt).toLocaleString()}
                    </td>
                    {isTech && (
                      <td className="px-6 py-4 text-right">
                        {test.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusTransition(test.id, 'SAMPLE_COLLECTED')}
                            className="rounded bg-indigo-600 px-3 py-1.5 font-bold text-white hover:bg-indigo-500"
                          >
                            Collect Sample
                          </button>
                        )}
                        {test.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => handleStatusTransition(test.id, 'PROCESSING')}
                            className="rounded bg-purple-600 px-3 py-1.5 font-bold text-white hover:bg-purple-500"
                          >
                            Start Processing
                          </button>
                        )}
                        {test.status === 'PROCESSING' && (
                          <button
                            onClick={() => handleStatusTransition(test.id, 'RESULTS_READY')}
                            className="rounded bg-blue-600 px-3 py-1.5 font-bold text-white hover:bg-blue-500"
                          >
                            Mark Results Ready
                          </button>
                        )}
                        {test.status === 'RESULTS_READY' && (
                          <button
                            onClick={() => setSubmitReportModal(test)}
                            className="rounded bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-500 flex items-center gap-1.5 ml-auto"
                          >
                            <Upload className="h-3.5 w-3.5" /> Submit Report
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {queue.filter(q => q.status !== 'COMPLETED').length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No active diagnostic orders in the queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Reports Directory */
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Test Name</th>
                  <th className="px-6 py-4">Patient Demographics</th>
                  <th className="px-6 py-4">Diagnostics Findings Summary</th>
                  <th className="px-6 py-4">Completion Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {queue.filter(q => q.status === 'COMPLETED').map((test) => {
                  const rep = test.reports?.[0];
                  return (
                    <tr key={test.id} className="hover:bg-slate-900/10">
                      <td className="px-6 py-4 font-bold text-white text-sm">{test.testName}</td>
                      <td className="px-6 py-4">
                        <span className="block font-bold text-slate-200">{test.patient.firstName} {test.patient.lastName}</span>
                        <span className="block text-[10px] text-indigo-400 font-mono mt-0.5">{test.patient.sequenceId}</span>
                      </td>
                      <td className="px-6 py-4 max-w-sm truncate text-slate-300 font-medium">
                        {rep?.resultSummary || 'No summary registered.'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {rep?.completedAt ? new Date(rep.completedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setViewReportModal(test)}
                          className="inline-flex items-center gap-1 rounded border border-slate-800 bg-[#0b0f19] px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </button>
                        {rep?.reportUrl && (
                          <a
                            href={rep.reportUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-slate-800 bg-[#0b0f19] px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <FileText className="h-3.5 w-3.5" /> PDF File
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {queue.filter(q => q.status === 'COMPLETED').length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No completed reports found in the history ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Submit Report Modal */}
      {submitReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="glass-premium w-full max-w-lg rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-white">Generate Lab Report</h3>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Closing test order for {submitReportModal.patient.firstName} {submitReportModal.patient.lastName} ({submitReportModal.testName})
                </span>
              </div>
              <button 
                onClick={() => setSubmitReportModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Result Summary Findings</label>
                <textarea
                  required
                  placeholder="Input summary findings (e.g. Platelet count normal at 250,000, Hemoglobin slightly low at 11.2g/dL)..."
                  value={reportData.resultSummary}
                  onChange={(e) => setReportData(prev => ({ ...prev, resultSummary: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Attach PDF Report (Optional)</label>
                <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-800 px-6 py-5 bg-[#070a13]/50">
                  <div className="text-center">
                    <Upload className="mx-auto h-7 w-7 text-slate-500" />
                    <div className="mt-2 flex text-xs text-slate-400 justify-center">
                      <label className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-300">
                        <span>Select file</span>
                        <input 
                          type="file" 
                          accept="application/pdf"
                          onChange={handleReportFileChange}
                          className="sr-only" 
                        />
                      </label>
                    </div>
                    {reportData.fileName ? (
                      <span className="block mt-2 text-xs text-indigo-300 font-semibold">{reportData.fileName}</span>
                    ) : (
                      <span className="block mt-1 text-[10px] text-slate-500">PDF documents only</span>
                    )}
                  </div>
                </div>
              </div>

              {reportError && (
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/10 p-2.5 rounded">
                  {reportError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setSubmitReportModal(null)}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {reportSubmitting ? 'Submitting...' : 'Dispatch Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Report Details Modal */}
      {viewReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="glass-premium w-full max-w-lg rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-white">Laboratory Diagnostic Ledger Details</h3>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{viewReportModal.testName}</span>
              </div>
              <button 
                onClick={() => setViewReportModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient Name</span>
                  <span className="text-slate-200 font-bold mt-0.5 block">
                    {viewReportModal.patient.firstName} {viewReportModal.patient.lastName}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient ID Sequence</span>
                  <span className="text-indigo-400 font-mono font-bold mt-0.5 block">{viewReportModal.patient.sequenceId}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Result Summary Findings</span>
                <p className="mt-1.5 text-slate-200 leading-relaxed bg-[#070a13] p-3 rounded-lg border border-slate-800">
                  {viewReportModal.reports?.[0]?.resultSummary || 'No clinical summary registered.'}
                </p>
              </div>

              {viewReportModal.reports?.[0]?.reportUrl && (
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attached PDF File</span>
                  <a
                    href={viewReportModal.reports[0].reportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-500 transition-colors"
                  >
                    <FileText className="h-4 w-4" /> Open Attached Lab PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
