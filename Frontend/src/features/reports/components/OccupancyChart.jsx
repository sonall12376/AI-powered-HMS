import React, { useState } from 'react';

export default function OccupancyChart({ data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-400">
        No occupancy data available.
      </div>
    );
  }

  // Helper to format dates
  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    if (Array.isArray(dateVal)) {
      const [year, month, day] = dateVal;
      return `${month}/${day}`;
    }
    return dateVal.split('-').slice(1).join('/'); // MM/DD
  };

  // Extract keys for wards
  const wardNames = ['General Ward', 'ICU-South', 'Pediatric Ward'];
  const colors = {
    'General Ward': { stroke: '#0ea5e9', fill: 'url(#grad-general)', dot: '#38bdf8' },
    'ICU-South': { stroke: '#f43f5e', fill: 'url(#grad-icu)', dot: '#fb7185' },
    'Pediatric Ward': { stroke: '#a855f7', fill: 'url(#grad-peds)', dot: '#c084fc' }
  };

  // Dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate points
  const pointsCount = data.length;
  const stepX = pointsCount > 1 ? chartWidth / (pointsCount - 1) : chartWidth;

  const getPointsPath = (wardName, isArea = false) => {
    let pts = data.map((d, index) => {
      const rates = d.bedOccupancyRates || {};
      const rate = rates[wardName] !== undefined ? rates[wardName] : 0.0;
      const x = paddingLeft + index * stepX;
      // rate is 0.0 to 1.0 (or percentage 0 to 100). If it is a decimal like 0.85, multiply by 100 if we want percent.
      // Let's check: in ReportsService we put values like Math.round(rate * 100) / 100 which is 0.0 to 1.0.
      const val = rate <= 1.0 ? rate : rate / 100.0;
      const y = paddingTop + chartHeight - val * chartHeight;
      return { x, y, value: val };
    });

    if (pts.length === 0) return '';

    if (isArea) {
      const firstX = pts[0].x;
      const lastX = pts[pts.length - 1].x;
      const baselineY = paddingTop + chartHeight;
      let path = `M ${firstX} ${baselineY} `;
      pts.forEach(p => {
        path += `L ${p.x} ${p.y} `;
      });
      path += `L ${lastX} ${baselineY} Z`;
      return path;
    } else {
      let path = `M ${pts[0].x} ${pts[0].y} `;
      for (let i = 1; i < pts.length; i++) {
        path += `L ${pts[i].x} ${pts[i].y} `;
      }
      return path;
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate nearest point index
    const relativeX = x - paddingLeft;
    let index = Math.round(relativeX / stepX);
    index = Math.max(0, Math.min(pointsCount - 1, index));

    setHoverIndex(index);
    setTooltipPos({ x: paddingLeft + index * stepX, y: Math.max(y, paddingTop) });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Get active hover details
  const activeData = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/50">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Bed Occupancy Rates</h3>
          <p className="text-xs text-slate-400">Weekly occupancy trends by ward</p>
        </div>
        
        {/* Legends */}
        <div className="flex items-center gap-3 text-xs">
          {wardNames.map(ward => (
            <div key={ward} className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[ward].stroke }} />
              <span>{ward.replace(' Ward', '')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full select-none overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="grad-general" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad-icu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad-peds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
            const y = paddingTop + chartHeight - val * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  className="font-medium"
                >
                  {Math.round(val * 100)}%
                </text>
              </g>
            );
          })}

          {/* X-axis ticks (showing labels for subset of dates to avoid collision) */}
          {data.map((d, index) => {
            const showLabel = pointsCount <= 7 || index % Math.ceil(pointsCount / 7) === 0;
            const x = paddingLeft + index * stepX;
            return (
              showLabel && (
                <text
                  key={index}
                  x={x}
                  y={height - paddingBottom + 18}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-medium animate-fade-in"
                >
                  {formatDate(d.date)}
                </text>
              )
            );
          })}

          {/* Render Area fills first */}
          {wardNames.map(ward => (
            <path
              key={`area-${ward}`}
              d={getPointsPath(ward, true)}
              fill={colors[ward].fill}
              className="transition-all duration-300"
            />
          ))}

          {/* Render Line strokes */}
          {wardNames.map(ward => (
            <path
              key={`line-${ward}`}
              d={getPointsPath(ward, false)}
              fill="none"
              stroke={colors[ward].stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          ))}

          {/* Active hover indicator line */}
          {hoverIndex !== null && (
            <line
              x1={tooltipPos.x}
              y1={paddingTop}
              x2={tooltipPos.x}
              y2={paddingTop + chartHeight}
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          )}

          {/* Render dots for hover point */}
          {hoverIndex !== null && wardNames.map(ward => {
            const rates = data[hoverIndex].bedOccupancyRates || {};
            const rate = rates[ward] !== undefined ? rates[ward] : 0.0;
            const val = rate <= 1.0 ? rate : rate / 100.0;
            const x = paddingLeft + hoverIndex * stepX;
            const y = paddingTop + chartHeight - val * chartHeight;
            return (
              <circle
                key={`dot-${ward}`}
                cx={x}
                cy={y}
                r="4.5"
                fill={colors[ward].dot}
                stroke="#0f172a"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && activeData && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-xs shadow-xl backdrop-blur-md transition-all duration-75"
            style={{
              left: `${(tooltipPos.x / width) * 100}%`,
              top: `${((tooltipPos.y - 80) / height) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="mb-1.5 font-bold text-slate-200">
              {activeData.date ? (Array.isArray(activeData.date) ? activeData.date.join('-') : activeData.date) : ''}
            </div>
            <div className="space-y-1">
              {wardNames.map(ward => {
                const rates = activeData.bedOccupancyRates || {};
                const val = rates[ward] !== undefined ? rates[ward] : 0;
                const percent = val <= 1.0 ? Math.round(val * 100) : Math.round(val);
                return (
                  <div key={ward} className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors[ward].stroke }} />
                      {ward.replace(' Ward', '')}
                    </span>
                    <span className="font-bold text-white">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
