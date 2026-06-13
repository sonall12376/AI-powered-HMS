import React, { useState } from 'react';

export default function InvoiceTable({ invoices, onViewDetails }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (inv.patientId && inv.patientId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'PARTIALLY_PAID':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'UNPAID':
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Invoices List</h3>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by Invoice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 w-full md:w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 w-full md:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoice ID</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Encounter</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Grand Total</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Outstanding</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.invoiceId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{inv.invoiceId}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {inv.encounterType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">${inv.grandTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">${inv.outstandingAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(inv.paymentStatus)}`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onViewDetails(inv.invoiceId)}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
