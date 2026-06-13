import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InvoiceTable from '../components/InvoiceTable';
import CreateInvoiceForm from '../components/CreateInvoiceForm';
import { fetchInvoices } from '../services/billingApi';

export default function InvoiceDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      setError('Failed to load invoices. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleCreateSuccess = () => {
    setIsCreating(false);
    loadInvoices();
  };

  const calculateKPIs = () => {
    let totalRevenue = 0;
    let totalOutstanding = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    invoices.forEach((inv) => {
      totalRevenue += inv.paidAmount;
      totalOutstanding += inv.outstandingAmount;
      if (inv.paymentStatus === 'PAID') paidCount++;
      else if (inv.paymentStatus === 'PARTIALLY_PAID') partialCount++;
      else unpaidCount++;
    });

    return { totalRevenue, totalOutstanding, paidCount, partialCount, unpaidCount };
  };

  const kpis = calculateKPIs();

  if (loading) {
    return <div className="p-6 text-slate-800 dark:text-white">Loading Billing Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl mb-4">
          {error}
        </div>
        <button onClick={loadInvoices} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-650 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Billing & Payments</h2>
          <p className="text-slate-500 text-sm mt-1">Manage consultation billing, inpatient invoices, claims, and card checkouts</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 hover:shadow-lg transition-all duration-200"
        >
          {isCreating ? 'View Invoices' : 'Generate Invoice'}
        </button>
      </div>

      {!isCreating && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue KPI Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-md">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue Collected</h4>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">${kpis.totalRevenue.toFixed(2)}</p>
            <div className="mt-2 text-emerald-500 text-xs font-semibold">💳 Cash / Card / UPI / Claim approvals</div>
          </div>

          {/* Outstanding Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-md">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Outstanding Bills</h4>
            <p className="text-2xl font-bold text-rose-500 mt-2">${kpis.totalOutstanding.toFixed(2)}</p>
            <div className="mt-2 text-rose-400 text-xs font-semibold">⚠️ Pending patient settlements</div>
          </div>

          {/* Paid count */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-md">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid Invoices</h4>
            <p className="text-2xl font-bold text-emerald-500 mt-2">{kpis.paidCount}</p>
            <div className="mt-2 text-slate-400 text-xs font-semibold">Completed transactions</div>
          </div>

          {/* Unpaid / Partial Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-md">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue & Partial Bills</h4>
            <p className="text-2xl font-bold text-amber-500 mt-2">{kpis.unpaidCount + kpis.partialCount}</p>
            <div className="mt-2 text-slate-400 text-xs font-semibold">{kpis.partialCount} partially paid, {kpis.unpaidCount} unpaid</div>
          </div>
        </div>
      )}

      {isCreating ? (
        <CreateInvoiceForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreating(false)} />
      ) : (
        <InvoiceTable invoices={invoices} onViewDetails={(id) => navigate(`/billing/invoices/${id}`)} />
      )}
    </div>
  );
}
