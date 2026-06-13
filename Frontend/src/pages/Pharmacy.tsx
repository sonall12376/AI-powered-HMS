import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pill, Plus, AlertTriangle, Calendar, CheckCircle2, RotateCw, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MedicineType {
  id: string;
  name: string;
  batchNo: string;
  price: number;
  expiryDate: string;
  stockQuantity: number;
}

interface PrescriptionType {
  id: string;
  patientId: string;
  doctorId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: 'PENDING' | 'DISPENSED';
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    sequenceId: string;
  };
}

export const Pharmacy: React.FC = () => {
  const auth = useAuth();
  const currentUser = auth.user;

  const [medicines, setMedicines] = useState<MedicineType[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'inventory' | 'queue'>('inventory');

  // Add Medicine Form
  const [showAddMedForm, setShowAddMedForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    batchNo: '',
    price: '',
    expiryDate: '',
    stockQuantity: ''
  });
  const [formStatus, setFormStatus] = useState<string | null>(null);

  // Edit Stock modal/state
  const [adjustMed, setAdjustMed] = useState<MedicineType | null>(null);
  const [adjustData, setAdjustData] = useState({
    action: 'ADD_STOCK', // ADD_STOCK, EXPIRED_REMOVED, STOCK_TAKE
    quantity: ''
  });
  const [adjustStatus, setAdjustStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    setLoading(true);
    try {
      const [medsRes, prescriptionsRes] = await Promise.all([
        axios.get('/api/pharmacy/medicines'),
        axios.get('/api/pharmacy/prescriptions')
      ]);
      setMedicines(medsRes.data);
      setPrescriptions(prescriptionsRes.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch pharmacy database logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('Adding batch to catalog...');
    
    try {
      await axios.post('/api/pharmacy/medicines', {
        ...newMed,
        price: parseFloat(newMed.price),
        stockQuantity: parseInt(newMed.stockQuantity, 10)
      });
      setFormStatus('Success!');
      setNewMed({ name: '', batchNo: '', price: '', expiryDate: '', stockQuantity: '' });
      setTimeout(() => {
        setShowAddMedForm(false);
        setFormStatus(null);
        fetchPharmacyData();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setFormStatus(err.response?.data?.message || 'Failed to catalog medicine');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustMed) return;
    setAdjustStatus('Applying inventory adjustments...');

    try {
      await axios.put(`/api/pharmacy/medicines/${adjustMed.id}`, {
        action: adjustData.action,
        quantity: parseInt(adjustData.quantity, 10)
      });
      setAdjustStatus('Stock adjusted successfully.');
      setTimeout(() => {
        setAdjustMed(null);
        setAdjustData({ action: 'ADD_STOCK', quantity: '' });
        setAdjustStatus(null);
        fetchPharmacyData();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setAdjustStatus(err.response?.data?.message || 'Failed to adjust inventory');
    }
  };

  const handleDispense = async (prescriptionId: string) => {
    try {
      const res = await axios.post(`/api/pharmacy/prescriptions/${prescriptionId}/dispense`);
      alert(res.data.message);
      fetchPharmacyData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Dispensing check failed');
    }
  };

  const isPharmacist = currentUser?.role === 'PHARMACIST' || currentUser?.role === 'SUPER_ADMIN';

  // Alerts Heuristics
  const today = new Date();
  const lowStockAlerts = medicines.filter(m => m.stockQuantity < 10);
  const expiryAlerts = medicines.filter(m => {
    const exp = new Date(m.expiryDate);
    const timeDiff = exp.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1024 * 3600 * 24));
    return daysDiff <= 30; // 30 days buffer
  });

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 pb-16 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Page Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <Pill className="text-indigo-400 h-7 w-7 animate-pulse" /> Pharmacy Dispensary & Inventory
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dispense doctor prescriptions, log inventory transactions, and monitor low stock or expiry logs.
            </p>
          </div>
          
          <button 
            onClick={fetchPharmacyData}
            className="rounded-lg border border-slate-800 bg-[#0b0f19] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 self-start md:self-auto"
          >
            <RotateCw className="h-4 w-4" /> Refresh Portal
          </button>
        </div>

        {/* Expiry / Stock Alerts Banner */}
        {(lowStockAlerts.length > 0 || expiryAlerts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {lowStockAlerts.length > 0 && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-950/15 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Low Stock Inventory Warnings</h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    The following medicines are running critical stock balances: <strong className="text-white">
                      {lowStockAlerts.map(m => `${m.name} (${m.stockQuantity} left)`).join(', ')}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {expiryAlerts.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/15 p-4 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Expiry Warning System</h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    The following batches are nearing or have passed their expiry: <strong className="text-white">
                      {expiryAlerts.map(m => `${m.name} (Exp: ${new Date(m.expiryDate).toLocaleDateString()})`).join(', ')}
                    </strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Selection */}
        <div className="mb-6 flex space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Medicine Inventory
          </button>
          
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
              activeTab === 'queue' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prescription Dispensing Queue ({prescriptions.filter(p => p.status === 'PENDING').length})
          </button>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-indigo-500">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-red-950/15 border border-red-500/15 rounded-2xl text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-sm font-bold text-red-400">{error}</p>
          </div>
        ) : activeTab === 'inventory' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-bold text-slate-400 uppercase tracking-wider">Catalog Inventory Ledger</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Manage medicine specifications and add new medicine stocks.</p>
              </div>

              {isPharmacist && (
                <button
                  onClick={() => setShowAddMedForm(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Catalog Medicine
                </button>
              )}
            </div>

            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Medicine Name</th>
                    <th className="px-6 py-4">Batch Number</th>
                    <th className="px-6 py-4">Unit Price</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Stock Balance</th>
                    {isPharmacist && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs font-medium text-slate-300">
                  {medicines.map((med) => {
                    const isLow = med.stockQuantity < 10;
                    const exp = new Date(med.expiryDate);
                    const isExpired = exp.getTime() < today.getTime();
                    return (
                      <tr key={med.id} className="hover:bg-slate-900/10">
                        <td className="px-6 py-4 font-bold text-white text-sm">{med.name}</td>
                        <td className="px-6 py-4 font-mono text-indigo-400">{med.batchNo}</td>
                        <td className="px-6 py-4 font-bold text-emerald-400">${med.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500 font-bold' : 'text-slate-300'}`}>
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(med.expiryDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            med.stockQuantity === 0 ? 'bg-red-500/15 text-red-400 border border-red-500/10' :
                            isLow ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {med.stockQuantity} units
                          </span>
                        </td>
                        {isPharmacist && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setAdjustMed(med)}
                              className="rounded border border-slate-800 bg-[#0b0f19] px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {medicines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No medicines cataloged in inventory. Click 'Catalog Medicine' to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Prescription Queue */
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-sm font-bold text-slate-400 uppercase tracking-wider">Intake Prescription Queue</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Dispense medications ordered by the physician staff.</p>
            </div>

            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Patient Profile</th>
                    <th className="px-6 py-4">Medicine Order</th>
                    <th className="px-6 py-4">Dosage Schema</th>
                    <th className="px-6 py-4">Prescribed Time</th>
                    <th className="px-6 py-4">Status</th>
                    {isPharmacist && <th className="px-6 py-4 text-right">Dispensary Handshake</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {prescriptions.map((pres) => (
                    <tr key={pres.id} className="hover:bg-slate-900/10">
                      <td className="px-6 py-4">
                        <span className="block font-bold text-white">{pres.patient.firstName} {pres.patient.lastName}</span>
                        <span className="block text-[10px] text-indigo-400 font-mono mt-0.5">{pres.patient.sequenceId}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-200 text-sm">{pres.medicineName}</td>
                      <td className="px-6 py-4 text-slate-300">
                        <span className="block font-semibold">{pres.dosage} • {pres.frequency}</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">Duration: {pres.duration}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {new Date(pres.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                          pres.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          {pres.status}
                        </span>
                      </td>
                      {isPharmacist && (
                        <td className="px-6 py-4 text-right">
                          {pres.status === 'PENDING' ? (
                            <button
                              onClick={() => handleDispense(pres.id)}
                              className="rounded bg-indigo-600 px-3 py-1.5 font-bold text-white hover:bg-indigo-500 flex items-center gap-1.5 ml-auto"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Dispense Order
                            </button>
                          ) : (
                            <span className="text-slate-500 font-bold uppercase text-[10px]">Fulfilled</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {prescriptions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No prescriptions found in the queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Catalog Medicine Modal */}
      {showAddMedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="glass-premium w-full max-w-md rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-heading text-base font-bold text-white flex items-center gap-1">
                <Pill className="h-5 w-5 text-indigo-400" /> Catalog New Medicine
              </h3>
              <button 
                onClick={() => setShowAddMedForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Medicine Name</label>
                <input
                  type="text" required
                  placeholder="e.g. Amoxicillin 500mg, Metformin 1000mg"
                  value={newMed.name}
                  onChange={(e) => setNewMed(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Batch Number</label>
                  <input
                    type="text" required
                    placeholder="BATCH-0012"
                    value={newMed.batchNo}
                    onChange={(e) => setNewMed(prev => ({ ...prev, batchNo: e.target.value }))}
                    className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Unit Price ($)</label>
                  <input
                    type="number" step="0.01" required
                    placeholder="12.50"
                    value={newMed.price}
                    onChange={(e) => setNewMed(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                  <input
                    type="date" required
                    value={newMed.expiryDate}
                    onChange={(e) => setNewMed(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Starting Stock Quantity</label>
                  <input
                    type="number" required
                    placeholder="100"
                    value={newMed.stockQuantity}
                    onChange={(e) => setNewMed(prev => ({ ...prev, stockQuantity: e.target.value }))}
                    className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {formStatus && (
                <div className="text-xs text-indigo-400 bg-[#070a13] p-2.5 rounded border border-slate-800 text-center font-bold">
                  {formStatus}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMedForm(false)}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="glass-premium w-full max-w-sm rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-heading text-base font-bold text-white flex items-center gap-1.5">
                Adjust Inventory Level
              </h3>
              <button 
                onClick={() => setAdjustMed(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div className="bg-[#070a13] p-3 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Target Item</span>
                <span className="text-sm font-bold text-white mt-1 block">{adjustMed.name}</span>
                <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">Batch: {adjustMed.batchNo} • Stock Balance: {adjustMed.stockQuantity} units</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Adjustment Action</label>
                <select
                  value={adjustData.action}
                  onChange={(e) => setAdjustData(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-white focus:outline-none"
                >
                  <option value="ADD_STOCK">Restock Batch (Add to current)</option>
                  <option value="EXPIRED_REMOVED">Remove Damaged/Expired (Subtract from current)</option>
                  <option value="STOCK_TAKE">Set Exact Inventory Level (Override current)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Adjustment Quantity</label>
                <input
                  type="number" required
                  placeholder="50"
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {adjustStatus && (
                <div className="text-xs text-indigo-400 bg-[#070a13] p-2.5 rounded border border-slate-800 text-center font-bold">
                  {adjustStatus}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setAdjustMed(null)}
                  className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
                >
                  Apply Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
