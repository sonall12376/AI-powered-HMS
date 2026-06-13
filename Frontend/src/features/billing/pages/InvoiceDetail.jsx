import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import InsuranceClaimModal from '../components/InsuranceClaimModal';
import { fetchInvoiceById, fetchPaymentHistory } from '../services/billingApi';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      const invoiceData = await fetchInvoiceById(id);
      setInvoice(invoiceData);
      try {
        const paymentData = await fetchPaymentHistory(id);
        setPayments(paymentData);
      } catch (payErr) {
        console.error('Failed to load transaction history ledger', payErr);
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoiceData();
  }, [id]);

  const handlePaymentSuccess = (updatedInvoice) => {
    setInvoice(updatedInvoice);
    setShowPaymentForm(false);
    // Reload full payment history list to capture new entries
    loadInvoiceData();
  };

  const handleClaimSuccess = (updatedInvoice) => {
    setInvoice(updatedInvoice);
    setShowClaimModal(false);
    loadInvoiceData();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-6 text-slate-800 dark:text-white">Loading Invoice Details...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <div className="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl mb-4">
          {error || 'Invoice record not found.'}
        </div>
        <button onClick={() => navigate('/billing/invoices')} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto print:p-0">
      {/* Back Header */}
      <div className="flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate('/billing/invoices')}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          ← Back to Invoices
        </button>
        <button
          onClick={handlePrint}
          className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 font-semibold text-sm hover:shadow transition-all duration-200"
        >
          🖨️ Print Sheet
        </button>
      </div>

      {/* Main printable Invoice Frame */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">CareFlow AI</h1>
            <p className="text-slate-500 text-xs mt-1">Hospital Management Solutions</p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">INVOICE</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">ID: {invoice.invoiceId}</p>
            <p className="text-slate-500 text-xs mt-1">
              Date: {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* References info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Details</h4>
            <p className="text-slate-900 dark:text-slate-100 font-semibold mt-1">ID: {invoice.patientId}</p>
            {invoice.insuranceClaim && (
              <div className="mt-2 text-xs font-semibold text-sky-500 bg-sky-50 dark:bg-sky-950/20 px-3 py-1.5 rounded-lg inline-block">
                🛡️ Insurance Claim Status: {invoice.insuranceClaim.status} ({invoice.insuranceClaim.insuranceId})
              </div>
            )}
          </div>
          <div className="text-left md:text-right">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Encounter Details</h4>
            <p className="text-slate-900 dark:text-slate-100 mt-1">Ref ID: {invoice.encounterRefId}</p>
            <p className="text-slate-500 text-sm mt-1">Type: {invoice.encounterType}</p>
            <p className="text-slate-500 text-xs mt-1">
              Due Date: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Items Grid */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Item Description</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Qty</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Unit Price</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Tax</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Discount</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx} className="text-slate-700 dark:text-slate-300 text-sm">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.description}</td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${item.tax.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${item.discount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-right">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="w-full md:w-80 space-y-3 text-right">
            <div className="flex justify-between text-sm text-slate-650 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-950 dark:text-slate-200">${invoice.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-650 dark:text-slate-400">
              <span>Tax Total:</span>
              <span className="font-semibold text-slate-950 dark:text-slate-200">+${invoice.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-650 dark:text-slate-400">
              <span>Discount Total:</span>
              <span className="font-semibold text-slate-950 dark:text-slate-200">-${invoice.discountTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-500 font-semibold">
              <span>Paid Amount:</span>
              <span>-${invoice.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-750 pt-2 text-xl font-bold text-slate-900 dark:text-white">
              <span>Outstanding:</span>
              <span className={invoice.outstandingAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                ${invoice.outstandingAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction History Logs */}
        {invoice.transactions && invoice.transactions.length > 0 && (
          <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase">
                    <th className="py-2">Transaction ID</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Mode</th>
                    <th className="py-2">Ref ID</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {invoice.transactions.map((txn, idx) => (
                    <tr key={idx} className="text-slate-650 dark:text-slate-350">
                      <td className="py-2.5 font-mono">{txn.transactionId}</td>
                      <td className="py-2.5">{txn.transactionDate ? new Date(txn.transactionDate).toLocaleString() : 'N/A'}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          {txn.paymentMode}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono">{txn.referenceNumber}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-slate-200">${txn.amount.toFixed(2)}</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-bold text-[10px]">
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail actions panel (Hidden when printing) */}
      {invoice.outstandingAmount > 0 && (
        <div className="flex flex-col md:flex-row gap-6 print:hidden">
          {!showPaymentForm && (
            <div className="flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Outstanding Balance</h4>
                <p className="text-2xl font-bold text-rose-500 mt-1">${invoice.outstandingAmount.toFixed(2)}</p>
              </div>
              <div className="flex gap-3">
                {!invoice.insuranceClaim && (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl font-bold text-sm text-slate-800 dark:text-slate-200 shadow transition-all duration-200"
                  >
                    File Claim
                  </button>
                )}
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition-all duration-200"
                >
                  Pay Invoice
                </button>
              </div>
            </div>
          )}

          {showPaymentForm && (
            <div className="flex-1">
              <PaymentForm
                invoiceId={invoice.invoiceId}
                outstandingAmount={invoice.outstandingAmount}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentForm(false)}
              />
            </div>
          )}
        </div>
      )}

      {showClaimModal && (
        <InsuranceClaimModal
          invoiceId={invoice.invoiceId}
          outstandingAmount={invoice.outstandingAmount}
          onSuccess={handleClaimSuccess}
          onClose={() => setShowClaimModal(false)}
        />
      )}
    </div>
  );
}
