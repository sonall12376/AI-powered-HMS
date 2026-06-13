import React, { useState, useEffect } from 'react';

export default function TraumaIntakeForm({ onSubmit, onClose, actionLoading }) {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [temporaryName, setTemporaryName] = useState('');
  const [incidentDetails, setIncidentDetails] = useState('');
  const [incomingEMSDetails, setIncomingEMSDetails] = useState('');
  
  // Vitals
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [heartRate, setHeartRate] = useState(75);
  const [temperature, setTemperature] = useState(37.0);
  const [spo2, setSpo2] = useState(98);

  // AI Suggestion Preview State
  const [aiPreview, setAiPreview] = useState(null);

  // Compute live local AI Triage preview
  useEffect(() => {
    if (!incidentDetails.trim()) {
      setAiPreview(null);
      return;
    }

    let level = 'GREEN';
    let severity = 0.15;
    let actions = [];

    // Max vital severity rules
    let systolic = 120;
    if (bloodPressure && bloodPressure.includes('/')) {
      const parts = bloodPressure.split('/');
      const parsed = parseInt(parts[0]);
      if (!isNaN(parsed)) systolic = parsed;
    }

    if (spo2 < 90 || heartRate > 130 || heartRate < 40 || systolic < 80 || systolic > 200) {
      level = 'RED';
      severity = 0.92;
    } else if (
      (spo2 >= 90 && spo2 <= 94) ||
      (heartRate >= 120 && heartRate <= 129) ||
      (heartRate >= 40 && heartRate <= 49) ||
      (systolic >= 80 && systolic <= 89) ||
      (systolic >= 180 && systolic <= 199) ||
      temperature > 40.0 ||
      temperature < 35.0
    ) {
      level = 'ORANGE';
      severity = 0.76;
    } else if (
      (heartRate >= 100 && heartRate <= 119) ||
      (systolic >= 140 && systolic <= 179) ||
      (temperature >= 38.5 && temperature <= 40.0) ||
      (temperature >= 35.0 && temperature < 36.0)
    ) {
      level = 'YELLOW';
      severity = 0.48;
    }

    const lowerNotes = incidentDetails.toLowerCase();
    if (
      lowerNotes.includes('arrest') ||
      lowerNotes.includes('unresponsive') ||
      lowerNotes.includes('unconscious') ||
      lowerNotes.includes('gunshot') ||
      lowerNotes.includes('stab') ||
      lowerNotes.includes('stroke') ||
      lowerNotes.includes('seizure') ||
      lowerNotes.includes('amputation') ||
      lowerNotes.includes('severe burn')
    ) {
      level = 'RED';
      severity = Math.max(severity, 0.95);
    } else if (
      lowerNotes.includes('chest pain') ||
      lowerNotes.includes('dyspnea') ||
      lowerNotes.includes('fracture') ||
      lowerNotes.includes('bleeding') ||
      lowerNotes.includes('poison')
    ) {
      if (level !== 'RED') {
        level = 'ORANGE';
        severity = Math.max(severity, 0.78);
      }
    }

    if (level === 'RED') {
      actions = [
        'Immediate airway management / oxygen supply',
        'Continuous ECG telemetry monitoring',
        'Establish dual large-bore IV access',
        'Call Emergency Trauma Surgeon',
        'Order stat lab work & blood crossmatch'
      ];
    } else if (level === 'ORANGE') {
      actions = [
        'Continuous pulse oximetry monitoring',
        'Administer supplementary oxygen support',
        'Establish IV access line',
        'Urgent physician evaluation (within 10 mins)'
      ];
    } else if (level === 'YELLOW') {
      actions = [
        'Re-check vitals every 30 mins',
        'Establish IV saline lock',
        'Routine emergency panel lab tests',
        'Physician evaluation (within 30 mins)'
      ];
    } else {
      actions = [
        'Check vital signs every 60 mins',
        'Provide oral symptomatic medications',
        'Redirection to outpatient desk if stable'
      ];
    }

    setAiPreview({ level, severity, actions });
  }, [bloodPressure, heartRate, temperature, spo2, incidentDetails]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      incidentDetails,
      incomingEMSDetails: incomingEMSDetails || null,
      vitalSignsAtArrival: {
        bloodPressure,
        heartRate: Number(heartRate),
        temperature: Number(temperature),
        spo2: Number(spo2)
      }
    };

    if (isAnonymous) {
      payload.temporaryName = temporaryName || 'Unknown Patient';
      payload.patientId = null;
    } else {
      payload.patientId = patientId;
      payload.temporaryName = null;
    }

    onSubmit(payload);
  };

  const getTriageColorClass = (level) => {
    switch (level) {
      case 'RED': return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
      case 'ORANGE': return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
      case 'YELLOW': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      default: return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative my-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Register Emergency Trauma Case</h3>
            <p className="text-slate-400 text-xs mt-1">Intake telemetry and triage scoring checklist</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Block */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300">Identity Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAnonymous} 
                  onChange={(e) => setIsAnonymous(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500" />
                <span className="ml-2 text-xs text-slate-400">Anonymous John/Jane Doe</span>
              </label>
            </div>

            {isAnonymous ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Temporary Reference Name</label>
                <input
                  type="text"
                  placeholder="e.g. Unknown Male 05"
                  value={temporaryName}
                  onChange={(e) => setTemporaryName(e.target.value)}
                  className="px-4 py-2 w-full rounded-xl border border-slate-700 bg-slate-850 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Patient ID</label>
                <input
                  type="text"
                  placeholder="e.g. 60b8d29a1f28b4382c8f8e04"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="px-4 py-2 w-full rounded-xl border border-slate-700 bg-slate-850 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Vitals Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Pressure</label>
              <input
                type="text"
                placeholder="120/80"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Heart Rate (BPM)</label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SpO2 (%)</label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                className="px-3 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Details Block */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incident Details & Symptoms</label>
              <textarea
                rows="3"
                placeholder="Describe accident, symptoms, consciousness status..."
                value={incidentDetails}
                onChange={(e) => setIncidentDetails(e.target.value)}
                className="px-4 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incoming EMS details</label>
              <input
                type="text"
                placeholder="Ambulance crew observations, intubations, medications on scene..."
                value={incomingEMSDetails}
                onChange={(e) => setIncomingEMSDetails(e.target.value)}
                className="px-4 py-2 w-full rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* AI Live Suggestions Preview Panel */}
          {aiPreview && (
            <div className={`border rounded-2xl p-4 transition-all duration-300 ${getTriageColorClass(aiPreview.level)}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full animate-ping ${
                    aiPreview.level === 'RED' ? 'bg-rose-500' : aiPreview.level === 'ORANGE' ? 'bg-orange-500' : 'bg-amber-500'
                  }`} />
                  AI Sugggested Triage: {aiPreview.level}
                </span>
                <span className="text-xs font-bold font-mono">Severity: {Math.round(aiPreview.severity * 100)}%</span>
              </div>
              <p className="text-[11px] opacity-80 mb-2">Clinical recommended actions based on intake metrics:</p>
              <ul className="text-[10px] list-disc list-inside space-y-0.5 opacity-80">
                {aiPreview.actions.map((act, index) => (
                  <li key={index}>{act}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Saving Case...' : 'Register & Queue Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
