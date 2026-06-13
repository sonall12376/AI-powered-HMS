import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { User, AlertTriangle, ShieldAlert, FileText, ArrowLeft, BrainCircuit, HeartPulse, ChevronRight, Stethoscope, X } from 'lucide-react';
import { CriticalAlert } from '../components/CriticalAlert';
import { useAuth } from '../context/AuthContext';

interface Allergy {
  allergen: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  reaction?: string;
}

interface ChronicCondition {
  conditionName: string;
  diagnosedDate?: string;
  status: 'Active' | 'Resolved' | 'Remission';
}

interface PastOperation {
  procedure: string;
  date?: string;
  surgeon?: string;
  notes?: string;
}

interface FamilyHistory {
  relationship: string;
  conditionName: string;
}

interface Patient {
  id: string;
  sequenceId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  medicalHistory: {
    allergies: Allergy[];
    chronicConditions: ChronicCondition[];
    pastOperations: PastOperation[];
    familyHistory: FamilyHistory[];
  };
}

interface TriageResult {
  conditions: string[];
  department: string;
  urgency: 'Low' | 'Medium' | 'High';
  disclaimer: string;
}

export const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Symptom analyzer state
  const [symptomsInput, setSymptomsInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // AI Summarizer states
  const [aiSummary, setAiSummary] = useState<{
    chronicDiseases: string[];
    allergies: string[];
    surgeries: string[];
    activeMedications: string[];
  } | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleGenerateAiSummary = async () => {
    setGeneratingSummary(true);
    setSummaryError(null);
    setShowSummaryModal(true);
    try {
      const res = await axios.post(`/api/patients/${id}/ai-summary`);
      setAiSummary(res.data);
    } catch (err: any) {
      console.error('AI Summary error:', err);
      setSummaryError(err.response?.data?.message || 'Failed to generate AI clinical summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await axios.get(`/api/patients/${id}`);
        setPatient(res.data);
      } catch (err) {
        console.error('Fetch patient error:', err);
        setError('Failed to fetch secure EMR data');
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleAnalyzeSymptoms = async () => {
    if (!symptomsInput.trim()) return;
    setAnalyzing(true);
    setTriageResult(null);

    try {
      const res = await axios.post('/api/ai/analyze-symptoms', { symptoms: symptomsInput });
      setTriageResult(res.data);
    } catch (err) {
      console.error('Symptom analyze failure:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070a13] text-indigo-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#070a13] text-slate-300">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="font-heading text-lg font-bold">{error || 'Patient not found'}</p>
        <Link to="/" className="mt-4 text-indigo-400 hover:underline flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  // Check if patient has any severe allergy to display in the CriticalAlert banner
  const severeAllergies = patient.medicalHistory.allergies.filter(a => a.severity === 'Severe');
  const alertBannerText = severeAllergies.length > 0 
    ? `${patient.firstName} is ALLERGIC TO ${severeAllergies.map(a => a.allergen.toUpperCase()).join(', ')} (${severeAllergies[0].reaction || 'SEVERE REACTION'})`
    : '';

  return (
    <div className="relative min-h-screen bg-[#070a13] pb-16 pt-24 text-slate-200">
      
      {/* Top Banner Alert (absolute top) */}
      {alertBannerText && <CriticalAlert message={alertBannerText} />}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="mr-2 h-4.5 w-4.5" /> Back to Patient Ledger
          </Link>
          <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 font-heading text-xs font-bold text-indigo-400 tracking-wide">
            EMR Record: {patient.sequenceId}
          </span>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Demographics Card (Col 1) */}
          <div className="glass-premium rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <User className="h-5.5 w-5.5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-white">{patient.firstName} {patient.lastName}</h2>
                <span className="text-xs text-slate-400 capitalize">{patient.gender} • {new Date(patient.dob).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-4 text-sm border-t border-slate-800/80 pt-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Secure Email</span>
                <span className="text-slate-300 font-medium">{patient.email}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encrypted Phone</span>
                <span className="text-indigo-300 font-mono font-medium">{patient.phone}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encrypted Address</span>
                <span className="text-slate-300 leading-relaxed font-medium">{patient.address}</span>
              </div>
            </div>

            {severeAllergies.length > 0 && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-950/20 p-4 flex items-start space-x-3">
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading text-xs font-bold text-red-400 uppercase tracking-wider">Allergy Danger Flags</h4>
                  <ul className="mt-1 text-xs text-red-300/90 list-disc list-inside space-y-1">
                    {severeAllergies.map((a, i) => (
                      <li key={i}>{a.allergen}: {a.reaction || 'Anaphylaxis Risk'}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Clinical EMR Section (Col 2 & 3) */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Medical History Tabs */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4.5 border-b border-slate-800 pb-3">
                <h3 className="font-heading text-base font-bold text-white flex items-center">
                  <HeartPulse className="mr-2 h-5 w-5 text-indigo-400" /> Digital Clinical History (MongoDB EMR)
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'DOCTOR' || user?.role === 'NURSE') && (
                    <button
                      onClick={handleGenerateAiSummary}
                      className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/15"
                    >
                      <BrainCircuit className="h-4 w-4 animate-pulse" /> Generate AI Summary
                    </button>
                  )}
                  <Link
                    to={`/patient/${id}/records`}
                    className="rounded-lg border border-slate-800 bg-[#0b0f19] px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" /> View EMR Files
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Chronic Conditions */}
                <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Chronic Conditions</span>
                  {patient.medicalHistory.chronicConditions.length > 0 ? (
                    <ul className="space-y-2.5">
                      {patient.medicalHistory.chronicConditions.map((c, i) => (
                        <li key={i} className="flex justify-between items-center text-xs">
                          <span className="text-slate-200 font-medium">{c.conditionName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'Active' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-700/20 text-slate-400'
                          }`}>{c.status}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-500">No reported chronic conditions.</span>
                  )}
                </div>

                {/* Allergies */}
                <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Allergies Matrix</span>
                  {patient.medicalHistory.allergies.length > 0 ? (
                    <ul className="space-y-2.5">
                      {patient.medicalHistory.allergies.map((a, i) => (
                        <li key={i} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-200 font-medium">{a.allergen}</span>
                            {a.reaction && <span className="block text-[10px] text-slate-500">{a.reaction}</span>}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.severity === 'Severe' ? 'bg-red-600/25 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                          }`}>{a.severity}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-500">No allergies flagged.</span>
                  )}
                </div>

                {/* Past Surgeries */}
                <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Surgical History</span>
                  {patient.medicalHistory.pastOperations.length > 0 ? (
                    <ul className="space-y-2 text-xs">
                      {patient.medicalHistory.pastOperations.map((o, i) => (
                        <li key={i} className="text-slate-300 font-medium">
                          {o.procedure} {o.date && <span className="text-slate-500">({new Date(o.date).getFullYear()})</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-500">No recorded surgeries.</span>
                  )}
                </div>

                {/* Family History */}
                <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Family Risk Markers</span>
                  {patient.medicalHistory.familyHistory.length > 0 ? (
                    <ul className="space-y-2 text-xs">
                      {patient.medicalHistory.familyHistory.map((f, i) => (
                        <li key={i} className="flex justify-between text-slate-300 font-medium">
                          <span>{f.conditionName}</span>
                          <span className="text-slate-500 text-[10px] uppercase">{f.relationship}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-500">No risk factors listed.</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Triage / Symptom Analyzer */}
            <div className="glass-premium rounded-2xl border border-indigo-500/10 p-6">
              <h3 className="font-heading text-base font-bold text-white flex items-center mb-1.5">
                <BrainCircuit className="mr-2 h-5 w-5 text-indigo-400" /> AI Symptom Analyzer & Triage Guide
              </h3>
              <p className="text-xs text-slate-400 mb-4.5">
                Input clinical intake logs to map potential differentials and target hospital departments.
              </p>

              <div className="space-y-4">
                <textarea
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="Patient describes sudden onset chest pain radiating to the left shoulder, with shortness of breath..."
                  rows={3}
                  className="w-full rounded-lg bg-[#070a13]/80 border border-slate-800 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleAnalyzeSymptoms}
                    disabled={analyzing || !symptomsInput.trim()}
                    className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-xs font-bold tracking-wide text-white hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 flex items-center transition-all"
                  >
                    {analyzing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Triaging logs...
                      </>
                    ) : (
                      <>
                        <Stethoscope className="mr-1.5 h-4 w-4" /> Run AI Diagnosis & Triage
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Render Triage Result */}
              {triageResult && (
                <div className="mt-6 border-t border-indigo-500/20 pt-6 space-y-4 animate-slide-down">
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recommended Referral Unit</span>
                      <span className="font-heading text-sm font-bold text-white flex items-center mt-1">
                        <ChevronRight className="h-4 w-4 mr-1 text-indigo-400" /> {triageResult.department}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right md:text-left">Severity Tier</span>
                      <span className={`inline-block mt-1 px-2.5 py-1 rounded-md text-xs font-extrabold tracking-wider ${
                        triageResult.urgency === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        triageResult.urgency === 'Medium' ? 'bg-yellow-500/25 text-yellow-400 border border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {triageResult.urgency.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Differential Diagnoses</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {triageResult.conditions.map((cond, i) => (
                        <div key={i} className="bg-[#070a13] border border-slate-800 rounded-lg p-3 text-xs font-semibold text-slate-200">
                          {cond}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-indigo-950/20 border border-indigo-500/10 p-3.5 flex items-start space-x-2.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] leading-relaxed text-indigo-300/80 font-medium">
                      {triageResult.disclaimer}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* AI Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="glass-premium w-full max-w-2xl rounded-2xl p-6 border border-slate-800 max-h-[85vh] overflow-y-auto animate-slide-down">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="font-heading text-base font-bold text-white">Clinical AI Dossier Summary</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Synthesized patient clinical history, prescriptions, and diagnostics
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {generatingSummary ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4"></div>
                <span className="text-sm font-semibold text-slate-300">Synthesizing Clinical Dossier...</span>
                <p className="text-[10px] text-slate-500 mt-1">Collecting patient clinical history, lab reports, and prescriptions via Secure AI.</p>
              </div>
            ) : summaryError ? (
              <div className="flex flex-col items-center justify-center p-8 bg-red-950/15 border border-red-500/15 rounded-xl text-center">
                <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
                <p className="text-xs font-bold text-red-400">{summaryError}</p>
                <button onClick={handleGenerateAiSummary} className="mt-4 text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-bold animate-pulse">Try Again</button>
              </div>
            ) : aiSummary ? (
              <div className="space-y-6 text-xs">
                
                {/* 2x2 Grid for Summary Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Chronic Diseases */}
                  <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2.5">Chronic Diseases</span>
                    {aiSummary.chronicDiseases && aiSummary.chronicDiseases.length > 0 && aiSummary.chronicDiseases[0] !== 'No active chronic conditions recorded' ? (
                      <ul className="space-y-1.5 text-slate-200">
                        {aiSummary.chronicDiseases.map((item, idx) => (
                          <li key={idx} className="list-disc list-inside font-medium text-slate-300">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 italic">No active chronic diseases detected</span>
                    )}
                  </div>

                  {/* Allergies */}
                  <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2.5">Allergies</span>
                    {aiSummary.allergies && aiSummary.allergies.length > 0 && aiSummary.allergies[0] !== 'No allergies recorded' ? (
                      <ul className="space-y-1.5 text-slate-200">
                        {aiSummary.allergies.map((item, idx) => (
                          <li key={idx} className="list-disc list-inside font-medium text-slate-300">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 italic">No allergies detected</span>
                    )}
                  </div>

                  {/* Surgeries */}
                  <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2.5">Surgeries</span>
                    {aiSummary.surgeries && aiSummary.surgeries.length > 0 && aiSummary.surgeries[0] !== 'No surgical history recorded' ? (
                      <ul className="space-y-1.5 text-slate-200">
                        {aiSummary.surgeries.map((item, idx) => (
                          <li key={idx} className="list-disc list-inside font-medium text-slate-300">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 italic">No surgeries detected</span>
                    )}
                  </div>

                  {/* Active Medications */}
                  <div className="rounded-xl bg-slate-900/40 border border-slate-800/80 p-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2.5">Active Medications</span>
                    {aiSummary.activeMedications && aiSummary.activeMedications.length > 0 && aiSummary.activeMedications[0] !== 'No active medications recorded' ? (
                      <ul className="space-y-1.5 text-slate-200">
                        {aiSummary.activeMedications.map((item, idx) => (
                          <li key={idx} className="list-disc list-inside font-medium text-slate-300">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-500 italic">No active medications detected</span>
                    )}
                  </div>

                </div>

                {/* Medical Disclaimer */}
                <div className="rounded-lg bg-indigo-950/20 border border-indigo-500/10 p-3.5 flex items-start space-x-2.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] leading-relaxed text-indigo-300/80 font-medium">
                    This automated summary compiles historical records, lab filings, and active scripts for patient care reference. Please cross-verify critical values with original EMR documents before making treatment decisions.
                  </span>
                </div>

                {/* Close action */}
                <div className="flex justify-end border-t border-slate-800 pt-4">
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Close Summary
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};
