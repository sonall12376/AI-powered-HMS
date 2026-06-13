import React, { useState } from 'react';

export default function DischargeModal({ onSubmit, onClose, isSubmitting }) {
  const [formData, setFormData] = useState({
    dischargeNotes: '',
    diagnosisAtDischarge: '',
    treatmentSummary: ''
  });

  const [validationError, setValidationError] = useState('');

  const handleInputChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.dischargeNotes.trim()) {
      setValidationError('Discharge notes are required.');
      return;
    }
    if (!formData.diagnosisAtDischarge.trim()) {
      setValidationError('Diagnosis at discharge is required.');
      return;
    }
    if (!formData.treatmentSummary.trim()) {
      setValidationError('Treatment summary is required.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-rose-500 mb-2">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirm Inpatient Discharge</h3>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Discharging this patient will release their allocated room/bed and automatically trigger a billing invoice calculation based on their hourly stay rate and daily rounds logs.
      </p>

      {validationError && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs">
          {validationError}
        </div>
      )}

      {/* Diagnosis at Discharge */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Final Diagnosis at Discharge</label>
        <input
          type="text"
          placeholder="e.g. Type 2 Diabetes Stabilized, Acute Bronchitis Recovered"
          required
          value={formData.diagnosisAtDischarge}
          onChange={(e) => handleInputChange('diagnosisAtDischarge', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Treatment Summary */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Inpatient Treatment Summary</label>
        <textarea
          required
          rows="3"
          placeholder="Summarize therapies, IV fluids, surgical operations, or medications administered during the stay..."
          value={formData.treatmentSummary}
          onChange={(e) => handleInputChange('treatmentSummary', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Discharge Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Discharge Instructions & Follow-up Plans</label>
        <textarea
          required
          rows="3"
          placeholder="Describe home care instructions, prescribed take-home drugs, and scheduled clinic return dates..."
          value={formData.dischargeNotes}
          onChange={(e) => handleInputChange('dischargeNotes', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isSubmitting && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          Discharge & Bill Patient
        </button>
      </div>
    </form>
  );
}
