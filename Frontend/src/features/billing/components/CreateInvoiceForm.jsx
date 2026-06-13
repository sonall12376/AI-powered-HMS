import React, { useState } from 'react';
import { createInvoice } from '../services/billingApi';

export default function CreateInvoiceForm({ onSuccess, onCancel }) {
  const [patientId, setPatientId] = useState('');
  const [encounterRefId, setEncounterRefId] = useState('');
  const [encounterType, setEncounterType] = useState('CONSULTATION');
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    if (field === 'description') {
      updated[index][field] = value;
    } else {
      updated[index][field] = parseFloat(value) || 0;
    }
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotalTax = () => {
    return lineItems.reduce((sum, item) => sum + item.tax, 0);
  };

  const calculateTotalDiscount = () => {
    return lineItems.reduce((sum, item) => sum + item.discount, 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTotalTax() - calculateTotalDiscount();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const hasEmptyDescription = lineItems.some(item => !item.description.trim());
    if (hasEmptyDescription) {
      setError('All line items must have descriptions.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        patientId,
        encounterRefId,
        encounterType,
        lineItems
      };
      const newInvoice = await createInvoice(payload);
      onSuccess(newInvoice);
    } catch (err) {
      setError(err.message || 'Failed to generate invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl w-full mx-auto">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Generate New Invoice</h3>
      
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 text-sm font-medium border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Patient Database ID</label>
            <input
              type="text"
              placeholder="e.g. 60b8d29a1f28b4382c8f8e04"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="px-4 py-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Encounter ID (Admissions / Consults)</label>
            <input
              type="text"
              placeholder="e.g. 60b8d29a1f28b4382c8f8e0d"
              value={encounterRefId}
              onChange={(e) => setEncounterRefId(e.target.value)}
              className="px-4 py-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Encounter Type</label>
            <select
              value={encounterType}
              onChange={(e) => setEncounterType(e.target.value)}
              className="px-4 py-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="CONSULTATION">Consultation Fee</option>
              <option value="ADMISSION">Admission/Ward stay</option>
              <option value="LAB_TEST">Lab Diagnostics</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Billable Line Items</h4>
            <button
              type="button"
              onClick={addLineItem}
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-3 items-end md:items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative">
                <div className="flex-1 w-full">
                  <label className="md:hidden block text-xs text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Consultation Fee"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    className="px-3 py-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div className="w-24 w-full md:w-24">
                  <label className="md:hidden block text-xs text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                    className="px-3 py-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div className="w-32 w-full md:w-32">
                  <label className="md:hidden block text-xs text-slate-400 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                    className="px-3 py-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
                <div className="w-24 w-full md:w-24">
                  <label className="md:hidden block text-xs text-slate-400 mb-1">Tax ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Tax"
                    value={item.tax}
                    onChange={(e) => handleLineItemChange(index, 'tax', e.target.value)}
                    className="px-3 py-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="w-24 w-full md:w-24">
                  <label className="md:hidden block text-xs text-slate-400 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Disc"
                    value={item.discount}
                    onChange={(e) => handleLineItemChange(index, 'discount', e.target.value)}
                    className="px-3 py-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="text-red-500 hover:text-red-600 font-semibold text-xs py-2 px-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex justify-end">
          <div className="w-full md:w-64 space-y-2 text-right">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Tax Total:</span>
              <span className="font-semibold text-slate-850 dark:text-slate-300">+${calculateTotalTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Discount Total:</span>
              <span className="font-semibold text-slate-850 dark:text-slate-300">-${calculateTotalDiscount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-750 pt-2 text-lg font-bold text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span>${calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 hover:shadow-lg transition-all duration-200 min-w-[120px]"
          >
            {loading ? 'Submitting...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
