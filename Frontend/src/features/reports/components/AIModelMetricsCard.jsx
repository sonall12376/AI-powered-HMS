import React, { useState } from 'react';

export default function AIModelMetricsCard({ insights = [], onTrigger, loading }) {
  const [checkedSteps, setCheckedSteps] = useState({});

  const toggleStep = (insightId, stepIndex) => {
    const key = `${insightId}-${stepIndex}`;
    setCheckedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getSeverityStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return {
          border: 'border-rose-800/80 bg-rose-950/20 text-rose-400',
          badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          bullet: 'bg-rose-500',
          icon: '⚠️'
        };
      case 'MEDIUM':
        return {
          border: 'border-amber-800/80 bg-amber-950/20 text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          bullet: 'bg-amber-500',
          icon: '⚡'
        };
      case 'LOW':
      default:
        return {
          border: 'border-sky-800/80 bg-sky-950/20 text-sky-400',
          badge: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
          bullet: 'bg-sky-500',
          icon: 'ℹ️'
        };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/50">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🧠 CareFlow Operations Analyst</span>
          </h3>
          <p className="text-xs text-slate-400">AI-generated diagnostic alerts &amp; bottlenecks</p>
        </div>
        <button
          onClick={onTrigger}
          disabled={loading}
          className={`flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all duration-150 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Running Diagnostics...</span>
            </>
          ) : (
            <>
              <span>🔍 Run AI Diagnosis</span>
            </>
          )}
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-2">🤖</span>
          <p className="text-xs text-slate-400 max-w-sm">
            No active operational warnings found. Click "Run AI Diagnosis" to analyze recent snapshots and identify warnings.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {insights.map((insight, idx) => {
            const styles = getSeverityStyle(insight.severity);
            const insightId = insight.id || `insight-${idx}`;

            return (
              <div
                key={insightId}
                className={`rounded-xl border p-4 transition-all duration-300 ${styles.border}`}
              >
                {/* Alert Header */}
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{styles.icon}</span>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {insight.insightType?.replace('_', ' ')}
                    </h4>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles.badge}`}>
                    {insight.severity} Priority
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {insight.description}
                </p>

                {/* Checklist Actionable Steps */}
                {insight.actionableSteps && insight.actionableSteps.length > 0 && (
                  <div className="mt-3 border-t border-slate-800/50 pt-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Actionable Mitigation Steps:
                    </span>
                    <ul className="space-y-1.5">
                      {insight.actionableSteps.map((step, sIdx) => {
                        const stepKey = `${insightId}-${sIdx}`;
                        const isChecked = !!checkedSteps[stepKey];

                        return (
                          <li
                            key={sIdx}
                            onClick={() => toggleStep(insightId, sIdx)}
                            className="group flex items-start gap-2.5 cursor-pointer select-none py-0.5"
                          >
                            <div className={`mt-0.5 flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
                              isChecked
                                ? 'border-sky-500 bg-sky-500 text-white'
                                : 'border-slate-700 bg-slate-850 group-hover:border-slate-500'
                            }`}>
                              {isChecked && (
                                <svg className="h-3 w-3 fill-current font-bold" viewBox="0 0 20 20">
                                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-xs transition-all duration-200 ${
                              isChecked ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'
                            }`}>
                              {step}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
