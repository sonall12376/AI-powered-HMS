import React, { useState } from 'react';
import { processPayment } from '../services/billingApi';

export default function PaymentForm({ invoiceId, outstandingAmount, onSuccess, onCancel }) {
  const [amount, setAmount] = useState(outstandingAmount.toString());
  const [paymentMode, setPaymentMode] = useState('CARD');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid positive amount.');
      setLoading(false);
      return;
    }

    if (paymentAmount > outstandingAmount) {
      setError(`Payment amount cannot exceed outstanding balance of $${outstandingAmount.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      const updatedInvoice = await processPayment(invoiceId, {
        amount: paymentAmount,
        paymentMode,
        referenceNumber: referenceNumber || 'CASH_DIRECT'
      });
      onSuccess(updatedInvoice);
    } catch (err) {
      setError(err.message || 'Payment failed. Please check your parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 transition-all duration-300">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Record Payment</h3>
      
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 text-sm font-medium border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Amount to Pay</label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-slate-400 font-semibold">$</span>
            <input
              type="number"
              step="0.01"
              max={outstandingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 pr-4 py-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {['CARD', 'UPI', 'CASH'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={`py-2 px-4 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  paymentMode === mode
                    ? 'bg-sky-500 border-sky-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Reference Number</label>
          <input
            type="text"
            placeholder="UPI Ref ID, Card Auth Code, or Notes"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            className="px-4 py-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-md transition-all duration-200 flex items-center justify-center min-w-[100px]"
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  );
}
