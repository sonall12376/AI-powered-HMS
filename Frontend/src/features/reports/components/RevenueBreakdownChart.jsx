import React, { useState } from 'react';

export default function RevenueBreakdownChart({ snapshots = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // 1. Aggregate revenue by department across all snapshots
  const depts = {
    CONSULTATION: { label: 'Consultations', color: '#0ea5e9', value: 0 },
    ADMISSION: { label: 'Admissions', color: '#10b981', value: 0 },
    LAB_TEST: { label: 'Lab Tests', color: '#f59e0b', value: 0 }
  };

  let grandTotal = 0;

  snapshots.forEach(snap => {
    const deptRev = snap.revenueByDepartment || {};
    Object.keys(deptRev).forEach(key => {
      const ukey = key.toUpperCase();
      const val = deptRev[key] || 0;
      if (depts[ukey]) {
        depts[ukey].value += val;
      } else {
        // Dynamic additions of other departments (like PHARMACY) if present
        depts[ukey] = {
          label: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' '),
          color: '#a855f7',
          value: val
        };
      }
      grandTotal += val;
    });
  });

  const chartData = Object.values(depts)
    .filter(d => d.value > 0)
    .map(d => ({
      ...d,
      value: Math.round(d.value * 100) / 100
    }));

  grandTotal = Math.round(grandTotal * 100) / 100;

  if (grandTotal === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-400">
        No revenue data available.
      </div>
    );
  }

  // Draw parameters
  const radius = 55;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius; // ~345.57
  const center = 80;

  // Compute angles
  let accumulatedPercent = 0;
  const slices = chartData.map((d, index) => {
    const percent = d.value / grandTotal;
    const strokeLength = percent * circumference;
    const strokeOffset = circumference - (accumulatedPercent * circumference);
    accumulatedPercent += percent;

    return {
      ...d,
      percent: Math.round(percent * 100),
      strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
      strokeOffset: strokeOffset
    };
  });

  // Highlight details
  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/50">
      <div className="mb-4">
        <h3 className="text-base font-bold text-white">Revenue Breakdown</h3>
        <p className="text-xs text-slate-400">Income shares by hospital department</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
        {/* SVG Donut Circle */}
        <div className="relative h-40 w-40 flex-shrink-0">
          <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible">
            {/* Background Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeOffset}
                  transform={`rotate(-90 ${center} ${center})`}
                  className="cursor-pointer transition-all duration-300 ease-out"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 6px ${slice.color}80)` : 'none'
                  }}
                />
              );
            })}
          </svg>

          {/* Center Text displaying totals */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {activeSlice ? activeSlice.label : 'Total Revenue'}
            </span>
            <span className="text-base font-bold text-white transition-all duration-200">
              ${(activeSlice ? activeSlice.value : grandTotal).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            {activeSlice && (
              <span className="text-xs font-semibold text-slate-300 animate-fade-in">
                {activeSlice.percent}%
              </span>
            )}
          </div>
        </div>

        {/* Legend listing values */}
        <div className="flex-grow space-y-2.5 w-full sm:w-auto">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                className={`flex items-center justify-between rounded-xl px-3 py-1.5 transition-colors duration-250 cursor-pointer ${
                  isHovered ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className={`text-xs font-medium ${isHovered ? 'text-white' : 'text-slate-300'}`}>
                    {slice.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white block">
                    ${slice.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {slice.percent}% share
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
