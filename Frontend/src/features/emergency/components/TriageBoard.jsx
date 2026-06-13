import React from 'react';

export default function TriageBoard({ cases, onCardClick }) {
  const columns = [
    { level: 'RED', label: 'RED - Immediate', color: 'border-rose-500/20 bg-rose-500/5', text: 'text-rose-500', headerBg: 'bg-rose-500/10' },
    { level: 'ORANGE', label: 'ORANGE - Very Urgent', color: 'border-orange-500/20 bg-orange-500/5', text: 'text-orange-500', headerBg: 'bg-orange-500/10' },
    { level: 'YELLOW', label: 'YELLOW - Urgent', color: 'border-amber-500/20 bg-amber-500/5', text: 'text-amber-500', headerBg: 'bg-amber-500/10' },
    { level: 'GREEN', label: 'GREEN - Standard', color: 'border-emerald-500/20 bg-emerald-500/5', text: 'text-emerald-500', headerBg: 'bg-emerald-500/10' }
  ];

  const getElapsedTime = (arrivedAtStr) => {
    const elapsed = Date.now() - new Date(arrivedAtStr).getTime();
    const mins = Math.floor(elapsed / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((col) => {
        const colCases = cases.filter(c => c.triageLevel === col.level && c.status !== 'STABILIZED' && c.status !== 'TRANSFERRED');

        return (
          <div key={col.level} className={`flex flex-col rounded-2xl border ${col.color} min-h-[500px] shadow-sm`}>
            {/* Column Header */}
            <div className={`p-4 border-b border-slate-800 rounded-t-2xl flex justify-between items-center ${col.headerBg}`}>
              <h3 className={`font-bold text-xs uppercase tracking-wider ${col.text}`}>
                {col.label}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.text} bg-slate-900 border border-slate-800`}>
                {colCases.length}
              </span>
            </div>

            {/* Case List */}
            <div className="p-4 flex-1 space-y-4 overflow-y-auto max-h-[600px] scrollbar-thin">
              {colCases.length === 0 ? (
                <div className="text-center py-10 text-slate-500 italic text-xs">
                  No cases in this queue.
                </div>
              ) : (
                colCases.map((c) => {
                  const isRed = c.triageLevel === 'RED';
                  const isAnonymous = !c.patientId;
                  const elapsedMins = Math.floor((Date.now() - new Date(c.arrivedAt).getTime()) / 60000);
                  const isDelayedOrange = c.triageLevel === 'ORANGE' && elapsedMins > 15;

                  return (
                    <button
                      key={c.id}
                      onClick={() => onCardClick(c.emergencyId || c.id)}
                      className={`w-full text-left p-4 rounded-xl border bg-slate-900 hover:bg-slate-850/80 transition-all duration-200 shadow relative group overflow-hidden outline-none ${
                        isRed 
                          ? 'border-rose-500/30 hover:border-rose-500/60 shadow-rose-950/20' 
                          : isDelayedOrange 
                          ? 'border-orange-500/40 hover:border-orange-500/70 animate-pulse'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* RED Pulsing Background Glow */}
                      {isRed && (
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none group-hover:from-rose-500/10" />
                      )}

                      {/* Header details */}
                      <div className="flex justify-between items-start gap-2 relative z-10">
                        <span className="font-bold text-[10px] text-slate-400 group-hover:text-slate-200 transition-colors">
                          {c.emergencyId}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {getElapsedTime(c.arrivedAt)}
                        </span>
                      </div>

                      {/* Patient Ident / Name */}
                      <div className="mt-2 relative z-10">
                        {isAnonymous ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <h4 className="text-xs font-bold text-slate-300 italic">
                              {c.temporaryName}
                            </h4>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                            <h4 className="text-xs font-bold text-slate-200 font-mono">
                              ID: {c.patientId}
                            </h4>
                          </div>
                        )}
                      </div>

                      {/* Vitals snapshot strip */}
                      <div className="mt-3 grid grid-cols-3 gap-1 bg-slate-950/50 p-2 rounded-lg text-[9px] font-mono font-semibold text-slate-400 relative z-10">
                        <div className="text-center">
                          <span className="block text-[8px] text-slate-500 font-sans uppercase">BP</span>
                          {c.vitalSignsAtArrival?.bloodPressure || 'N/A'}
                        </div>
                        <div className="text-center border-x border-slate-800/60">
                          <span className="block text-[8px] text-slate-500 font-sans uppercase">HR</span>
                          {c.vitalSignsAtArrival?.heartRate ? `${c.vitalSignsAtArrival.heartRate}` : 'N/A'}
                        </div>
                        <div className="text-center">
                          <span className="block text-[8px] text-slate-500 font-sans uppercase">SpO2</span>
                          <span className={c.vitalSignsAtArrival?.spo2 < 92 ? 'text-rose-400 font-bold' : ''}>
                            {c.vitalSignsAtArrival?.spo2 ? `${c.vitalSignsAtArrival.spo2}%` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Incident notes snippet */}
                      <p className="mt-3 text-[10px] text-slate-400 line-clamp-2 leading-relaxed relative z-10">
                        {c.incidentDetails}
                      </p>

                      {/* Overdue/Urgent Status Tag */}
                      {isDelayedOrange && (
                        <div className="mt-2 text-[8px] font-bold text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/30 inline-block relative z-10">
                          ⚠️ Triage Queue Delay &gt; 15m
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
