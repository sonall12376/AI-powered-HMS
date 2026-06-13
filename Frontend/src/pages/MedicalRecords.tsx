import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FileText, Upload, Search, Download, Clock, Eye, AlertCircle, RefreshCcw, FileSpreadsheet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RecordType {
  id?: string;
  _id?: string;
  patientId: string;
  doctorId: string;
  recordType: 'Radiology' | 'Prescription' | 'Lab Report' | 'Consultation';
  title: string;
  description: string;
  fileUrl: string;
  uploadDate: string;
  createdAt: string;
}

export const MedicalRecords: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // patientId
  const { user } = useAuth();
  
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [recordType, setRecordType] = useState('');

  // Upload Record Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    recordType: 'Consultation' as 'Radiology' | 'Prescription' | 'Lab Report' | 'Consultation',
    fileName: '',
    fileBase64: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active View Record
  const [selectedRecord, setSelectedRecord] = useState<RecordType | null>(null);

  useEffect(() => {
    fetchPatientDemographics();
    fetchRecords();
  }, [id, recordType]);

  const fetchPatientDemographics = async () => {
    try {
      const res = await axios.get(`/api/patients/${id}`);
      setPatient(res.data);
    } catch (err) {
      console.error('Demographics err:', err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (recordType) params.recordType = recordType;
      if (search.trim()) params.search = search;
      
      const res = await axios.get(`/api/patients/${id}/records`, { params });
      setRecords(res.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load EMR records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds the 15MB size limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadData(prev => ({
        ...prev,
        fileName: file.name,
        fileBase64: reader.result as string
      }));
      setUploadError(null);
    };
    reader.onerror = () => {
      setUploadError('Failed to read selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.fileName || !uploadData.fileBase64) {
      setUploadError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setUploadError(null);

    try {
      await axios.post(`/api/patients/${id}/records`, uploadData);
      
      // Reset & Reload
      setShowUploadModal(false);
      setUploadData({
        title: '',
        description: '',
        recordType: 'Consultation',
        fileName: '',
        fileBase64: ''
      });
      fetchRecords();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.response?.data?.message || 'Failed to upload medical record');
    } finally {
      setUploading(false);
    }
  };

  const canUpload = user?.role === 'SUPER_ADMIN' || user?.role === 'DOCTOR' || user?.role === 'NURSE';

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 pb-16 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            to={patient ? `/patient/${patient.id}` : '/'} 
            className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4.5 w-4.5" /> Back to EMR Chart
          </Link>
          {patient && (
            <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 font-heading text-xs font-bold text-indigo-400 tracking-wide">
              EMR Ledger: {patient.firstName} {patient.lastName} ({patient.sequenceId})
            </span>
          )}
        </div>

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <FileText className="text-indigo-400 h-7 w-7" /> Medical Records Archive
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Secure MongoDB database for storing lab reports, prescriptions, consultation notes, and radiology scans.
            </p>
          </div>
          
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 justify-center"
            >
              <Upload className="h-4 w-4" /> Upload Medical File
            </button>
          )}
        </div>

        {/* Search and Filters Bar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search file title or details description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-[#0b0f19] border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <button type="submit" className="hidden">Search</button>
          </form>

          <div className="flex w-full md:w-auto items-center gap-3">
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="w-full md:w-48 rounded-lg bg-[#0b0f19] border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Radiology">Radiology Scans</option>
              <option value="Prescription">Prescriptions</option>
              <option value="Lab Report">Lab Reports</option>
              <option value="Consultation">Consultation Notes</option>
            </select>
            
            <button 
              onClick={fetchRecords} 
              className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              title="Refresh timeline"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* EMR Content Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-indigo-500">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-red-950/15 border border-red-500/15 rounded-2xl text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
            <p className="text-sm font-bold text-red-400">{error}</p>
            <button onClick={fetchRecords} className="mt-4 text-xs text-indigo-400 hover:underline">Try Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Timeline View (Left 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-heading text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Medical History Timeline</h3>
              
              {records.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  No records uploaded matching the criteria. Use the "Upload Medical File" button to add a record.
                </div>
              ) : (
                <div className="relative border-l border-slate-800 ml-4 pl-8 space-y-8">
                  {records.map((rec) => {
                    const recId = rec.id || rec._id || '';
                    return (
                      <div key={recId} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#070a13] border-2 border-indigo-500 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Clock className="h-3 w-3" />
                        </div>

                        {/* Record Card */}
                        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mb-2 ${
                                rec.recordType === 'Radiology' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                rec.recordType === 'Prescription' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                rec.recordType === 'Lab Report' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {rec.recordType}
                              </span>

                              <h4 className="font-heading text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                                {rec.title}
                              </h4>
                              
                              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {rec.description}
                              </p>

                              <span className="block text-[10px] text-slate-500 mt-3 font-semibold">
                                Uploaded on: {new Date(rec.uploadDate || rec.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setSelectedRecord(rec)}
                                className="rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" /> View
                              </button>
                              <a
                                href={rec.fileUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-1"
                              >
                                <Download className="h-3.5 w-3.5" /> Download
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Summary / Right sidebar Panel */}
            <div>
              <h3 className="font-heading text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Patient Document Breakdown</h3>
              <div className="glass-premium rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Uploaded Files</span>
                  <span className="font-bold text-white">{records.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-purple-400">Radiology Scans</span>
                  <span className="font-bold text-white">{records.filter(r => r.recordType === 'Radiology').length}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-emerald-400">Prescriptions</span>
                  <span className="font-bold text-white">{records.filter(r => r.recordType === 'Prescription').length}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                  <span className="text-blue-400">Lab Reports</span>
                  <span className="font-bold text-white">{records.filter(r => r.recordType === 'Lab Report').length}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <span className="text-yellow-400">Consultation Notes</span>
                  <span className="font-bold text-white">{records.filter(r => r.recordType === 'Consultation').length}</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Upload Record Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="glass-premium w-full max-w-lg rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-bold text-white flex items-center gap-1.5">
                <Upload className="h-5 w-5 text-indigo-400" /> Upload EMR Document
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Document Title</label>
                <input
                  type="text" required
                  placeholder="e.g. Chest X-Ray Frontal, Blood Glucose Panel"
                  value={uploadData.title}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Document Category</label>
                <select
                  value={uploadData.recordType}
                  onChange={(e) => setUploadData(prev => ({ ...prev, recordType: e.target.value as any }))}
                  className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Consultation">Consultation Notes</option>
                  <option value="Radiology">Radiology Scans</option>
                  <option value="Prescription">Prescriptions</option>
                  <option value="Lab Report">Lab Reports</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes / Description</label>
                <textarea
                  required
                  placeholder="Input detailed findings or comments..."
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Upload File (PDF, PNG, JPG)</label>
                <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-800 px-6 py-6 bg-[#070a13]/50">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-slate-500" />
                    <div className="mt-2 flex text-xs text-slate-400 justify-center">
                      <label className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-300">
                        <span>Select a file</span>
                        <input 
                          type="file" 
                          required
                          accept="application/pdf,image/png,image/jpeg"
                          onChange={handleFileChange}
                          className="sr-only" 
                        />
                      </label>
                    </div>
                    {uploadData.fileName ? (
                      <span className="block mt-2 text-xs text-indigo-300 font-semibold">{uploadData.fileName}</span>
                    ) : (
                      <span className="block mt-1 text-[10px] text-slate-500">PDF, PNG, or JPG up to 15MB</span>
                    )}
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/10 p-2.5 rounded">
                  {uploadError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="glass-premium w-full max-w-2xl rounded-2xl p-6 border border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-1">
                  {selectedRecord.recordType}
                </span>
                <h3 className="font-heading text-base font-bold text-white">{selectedRecord.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Description</span>
                <p className="mt-1 text-slate-200 leading-relaxed bg-[#070a13] p-3 rounded-lg border border-slate-800">{selectedRecord.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upload Date</span>
                  <span className="text-slate-300 font-semibold">{new Date(selectedRecord.uploadDate || selectedRecord.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Doctor Clearance</span>
                  <span className="text-slate-300 font-mono">ID: {selectedRecord.doctorId}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Document Preview</span>
                {selectedRecord.fileUrl.match(/\.(jpeg|jpg|gif|png)/i) ? (
                  <div className="flex justify-center bg-[#070a13] p-4 rounded-xl border border-slate-800 max-h-96 overflow-hidden">
                    <img 
                      src={selectedRecord.fileUrl} 
                      alt={selectedRecord.title} 
                      className="max-h-80 object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center bg-[#070a13] p-8 rounded-xl border border-slate-800 text-center">
                    <FileSpreadsheet className="h-14 w-14 text-indigo-400 mb-2" />
                    <span className="font-semibold text-slate-300">Portable Document Format (PDF)</span>
                    <p className="text-[10px] text-slate-500 mt-1 mb-4">Secure file is stored. To view the contents, open the file or click download.</p>
                    <a
                      href={selectedRecord.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="h-4 w-4" /> Open / Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
