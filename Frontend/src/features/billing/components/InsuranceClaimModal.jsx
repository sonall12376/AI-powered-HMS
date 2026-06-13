import React, { useState } from 'react';
import { submitInsuranceClaim } from '../services/billingApi';

export default function InsuranceClaimModal({ invoiceId, outstandingAmount, onSuccess, onClose }) {
  const [insuranceId, setInsuranceId] = useState('');
  const [amountClaimed, setAmountClaimed] = useState(outstandingAmount.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const claimValue = parseFloat(amountClaimed);
    if (isNaN(claimValue) || claimValue <= 0) {
      setError('Please enter a valid claim value.');
      setLoading(false);
      return;
    }

    if (claimValue > outstandingAmount) {
      setError(`Claim amount cannot exceed outstanding balance of $${outstandingAmount.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      const updatedInvoice = await submitInsuranceClaim(invoiceId, {
        insuranceId,
        amountClaimed: claimValue
      });
      onSuccess(updatedInvoice);
    } catch (err) {
      setError(err.message || 'Insurance claim submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Submit Insurance Claim</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 text-sm font-medium border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Insurance Policy ID / Member ID</label>
            <input
              type="text"
              placeholder="e.g. BS-991823-A"
              value={insuranceId}
              onChange={(e) => setInsuranceId(e.target.value)}
              className="px-4 py-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Amount to Claim</label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-slate-400 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                max={outstandingAmount}
                value={amountClaimed}
                onChange={(e) => setAmountClaimed(e.target.value)}
                className="pl-8 pr-4 py-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 hover:shadow-md transition-all duration-200 flex items-center justify-center min-w-[100px]"
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
