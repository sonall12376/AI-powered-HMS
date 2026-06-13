import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export default function RoundsLoggerForm({ onSubmit, onClose, isSubmitting }) {
  const { user } = useAuth();
  
  // Set up default doctor ID from auth session, falling back to a dummy ObjectId if testing
  const defaultDoctorId = user?.linkedEntityId || '60b8d29a1f28b4382c8f8e02';

  const [formData, setFormData] = useState({
    visitingDoctorId: defaultDoctorId,
    notes: '',
    prescribedChanges: '',
    vitals: {
      bloodPressure: '120/80',
      heartRate: 75,
      temperature: 36.8,
      spo2: 98
    }
  });

  const [validationError, setValidationError] = useState('');

  const handleInputChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleVitalsChange = (field, val) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [field]: val
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.visitingDoctorId) {
      setValidationError('Visiting Doctor ID is required.');
      return;
    }
    if (!formData.notes.trim()) {
      setValidationError('Clinical notes are required.');
      return;
    }
    if (!formData.vitals.bloodPressure.trim()) {
      setValidationError('Blood pressure vital reading is required.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Record Daily Clinical Round</h3>
      
      {validationError && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs">
          {validationError}
        </div>
      )}

      {/* Doctor ID */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Visiting Doctor ID (ObjectId)</label>
        <input
          type="text"
          required
          value={formData.visitingDoctorId}
          onChange={(e) => handleInputChange('visitingDoctorId', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Vitals Form Grid */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Vitals</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Blood Pressure</label>
            <input
              type="text"
              placeholder="e.g. 120/80"
              required
              value={formData.vitals.bloodPressure}
              onChange={(e) => handleVitalsChange('bloodPressure', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Heart Rate (bpm)</label>
            <input
              type="number"
              min="30"
              max="250"
              required
              value={formData.vitals.heartRate}
              onChange={(e) => handleVitalsChange('heartRate', parseInt(e.target.value, 10) || 0)}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="45"
              required
              value={formData.vitals.temperature}
              onChange={(e) => handleVitalsChange('temperature', parseFloat(e.target.value) || 0.0)}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Oxygen Saturation (SpO2 %)</label>
            <input
              type="number"
              min="50"
              max="100"
              required
              value={formData.vitals.spo2}
              onChange={(e) => handleVitalsChange('spo2', parseInt(e.target.value, 10) || 0)}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Clinical Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Clinical Round Notes / Observations</label>
        <textarea
          required
          rows="3"
          placeholder="Describe patient recovery status, pain levels, general conditions..."
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Prescribed Changes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Prescribed Changes (Medications / Fluid Adjustments)</label>
        <textarea
          rows="2"
          placeholder="e.g. Decrease fluid drip rate to 50ml/hr, add Amoxicillin 500mg"
          value={formData.prescribedChanges}
          onChange={(e) => handleInputChange('prescribedChanges', e.target.value)}
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
          className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isSubmitting && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          Record Observations
        </button>
      </div>
    </form>
  );
}
