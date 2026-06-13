import React, { useState } from 'react';

export default function ERRushHourChart({ data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-400">
        No ER data available.
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

  // Dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Maximum calculations
  const maxCases = Math.max(...data.map(d => d.erCasesCount || 0), 5);
  const maxWait = Math.max(...data.map(d => d.erAverageWaitTimeMinutes || 0), 15);

  const pointsCount = data.length;
  const stepX = pointsCount > 1 ? chartWidth / (pointsCount - 1) : chartWidth;
  const barWidth = Math.max(4, Math.min(20, stepX * 0.4));

  // Compute line path for ER Wait Time
  const linePoints = data.map((d, index) => {
    const wait = d.erAverageWaitTimeMinutes || 0;
    const x = paddingLeft + index * stepX;
    const y = paddingTop + chartHeight - (wait / maxWait) * chartHeight;
    return { x, y, val: wait };
  });

  let linePath = '';
  if (linePoints.length > 0) {
    linePath = `M ${linePoints[0].x} ${linePoints[0].y} `;
    for (let i = 1; i < linePoints.length; i++) {
      linePath += `L ${linePoints[i].x} ${linePoints[i].y} `;
    }
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const relativeX = x - paddingLeft;
    let index = Math.round(relativeX / stepX);
    index = Math.max(0, Math.min(pointsCount - 1, index));

    setHoverIndex(index);
    setTooltipPos({ x: paddingLeft + index * stepX, y: Math.max(y, paddingTop) });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeData = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/50">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">ER Intake &amp; Wait Times</h3>
          <p className="text-xs text-slate-400">Daily ER case counts compared with triage delay averages</p>
        </div>
        
        {/* Legends */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-3 w-3 rounded bg-sky-500/80" />
            <span>Cases Billed</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-0.5 w-4 bg-rose-500" />
            <span>Avg Wait (Mins)</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full select-none overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Horizontal lines */}
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
                {/* Left Y Axis: Cases */}
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  className="font-medium"
                >
                  {Math.round(val * maxCases)}
                </text>
                {/* Right Y Axis: Wait times */}
                <text
                  x={width - paddingRight + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="start"
                  className="font-medium"
                >
                  {Math.round(val * maxWait)}m
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
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
                  className="font-medium"
                >
                  {formatDate(d.date)}
                </text>
              )
            );
          })}

          {/* Draw bars: ER Case Counts */}
          {data.map((d, index) => {
            const count = d.erCasesCount || 0;
            const x = paddingLeft + index * stepX - barWidth / 2;
            const barHeight = (count / maxCases) * chartHeight;
            const y = paddingTop + chartHeight - barHeight;
            const isHovered = hoverIndex === index;

            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx="2"
                fill={isHovered ? '#0ea5e9' : '#0ea5e9d0'}
                opacity={hoverIndex === null || isHovered ? 1.0 : 0.4}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Draw line: Wait time */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={hoverIndex === null ? 0.95 : 0.6}
              className="transition-all duration-200"
            />
          )}

          {/* Hover tracker guideline */}
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

          {/* Wait time dots on hover */}
          {hoverIndex !== null && (
            <circle
              cx={linePoints[hoverIndex].x}
              cy={linePoints[hoverIndex].y}
              r="4.5"
              fill="#fb7185"
              stroke="#0f172a"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoverIndex !== null && activeData && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-slate-800 bg-slate-950/95 p-3 text-xs shadow-xl backdrop-blur-md"
            style={{
              left: `${(tooltipPos.x / width) * 100}%`,
              top: `${((tooltipPos.y - 75) / height) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="mb-1 font-bold text-slate-200">
              {activeData.date ? (Array.isArray(activeData.date) ? activeData.date.join('-') : activeData.date) : ''}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">ER Cases Arrived:</span>
                <span className="font-bold text-sky-400">{activeData.erCasesCount || 0} cases</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Avg Wait Time:</span>
                <span className="font-bold text-rose-400">{activeData.erAverageWaitTimeMinutes || 0} mins</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
