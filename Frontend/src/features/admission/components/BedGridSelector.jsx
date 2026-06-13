import React, { useEffect, useState } from 'react';
import { fetchBeds } from '../services/admissionApi';

export default function BedGridSelector({ onSelectBed, selectedBedId, wardTypeFilter }) {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBeds = async () => {
      try {
        setLoading(true);
        const data = await fetchBeds();
        setBeds(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBeds();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-slate-500">
        <svg className="animate-spin h-5 w-5 mr-3 text-sky-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading room layouts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-sm">
        Error loading beds: {error}
      </div>
    );
  }

  if (beds.length === 0) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center rounded-xl">
        <p className="text-slate-500 text-sm">No beds initialized in the directory.</p>
        <p className="text-xs text-slate-400 mt-1">Please use the "Seed Sample Beds" button in the dashboard to set up ward templates.</p>
      </div>
    );
  }

  // Group beds by Ward Name
  const wards = beds.reduce((acc, bed) => {
    if (!acc[bed.wardName]) acc[bed.wardName] = [];
    acc[bed.wardName].push(bed);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(wards).map(([wardName, wardBeds]) => {
        // Filter beds if wardTypeFilter is defined (e.g. ICU matching INTENSIVE_CARE)
        const isWardMatchingFilter = !wardTypeFilter || 
          (wardTypeFilter === 'ICU' && wardBeds[0]?.bedType === 'INTENSIVE_CARE') ||
          (wardTypeFilter === 'GENERAL' && wardBeds[0]?.bedType === 'GENERAL_WARD') ||
          (wardTypeFilter === 'PEDIATRIC' && wardBeds[0]?.bedType === 'PEDIATRIC_WARD') ||
          (wardTypeFilter === 'PRIVATE' && wardBeds[0]?.bedType === 'PRIVATE_ROOM');

        return (
          <div 
            key={wardName} 
            className={`border rounded-2xl p-4 transition-all duration-300 ${
              isWardMatchingFilter 
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' 
                : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-60'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  {wardName}
                </h4>
                <span className="text-xs text-slate-400 capitalize">
                  {wardBeds[0]?.bedType.replace('_', ' ').toLowerCase()} ({wardBeds[0]?.hourlyRate ? `$${wardBeds[0].hourlyRate}/hr` : 'N/A'})
                </span>
              </div>
              {isWardMatchingFilter && wardTypeFilter && (
                <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  Matching Ward Type
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {wardBeds.map((bed) => {
                const isSelected = selectedBedId === bed.id || selectedBedId === bed._id;
                const isOccupied = bed.occupied;

                return (
                  <button
                    key={bed.id || bed._id}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => onSelectBed(bed)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 outline-none text-left ${
                      isOccupied
                        ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/50 text-rose-500 cursor-not-allowed'
                        : isSelected
                        ? 'bg-sky-500 border-sky-600 text-white shadow-md shadow-sky-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {/* Bed Icon */}
                    <svg 
                      className={`h-7 w-7 mb-1 ${isSelected ? 'text-white' : isOccupied ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10V3a1 1 0 011-1h1v8h12V3a1 1 0 011-1h1v7a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2v-5a2 2 0 012-2zm0 0h18" />
                    </svg>

                    <span className="text-xs font-bold">Room {bed.roomNumber}</span>
                    <span className="text-[10px] opacity-75">Bed {bed.bedNumber}</span>

                    {/* Status badge / selection tick */}
                    {isSelected && (
                      <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-white text-sky-500 rounded-full flex items-center justify-center">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}

                    {isOccupied && (
                      <span className="absolute top-1 right-1 text-[8px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                        Occupied
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
