import React, { useState, useEffect } from 'react';
import { fetchReportsSummary, fetchReportsSnapshots, seedReportsDemoData } from '../services/reportsApi';
import { fetchOperationalInsights, triggerOperationalInsights } from '../../ai-explainer/services/explainerApi';
import OccupancyChart from '../components/OccupancyChart';
import RevenueBreakdownChart from '../components/RevenueBreakdownChart';
import ERRushHourChart from '../components/ERRushHourChart';
import AIModelMetricsCard from '../components/AIModelMetricsCard';

export default function ReportsDashboard() {
  const [summary, setSummary] = useState({
    activeAdmissions: 0,
    occupiedBeds: 0,
    totalBeds: 0,
    activeERCases: 0,
    todayRevenue: 0.0
  });

  const [snapshots, setSnapshots] = useState([]);
  const [insights, setInsights] = useState([]);
  
  // Date filter states (default past 30 days)
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [triggeringAI, setTriggeringAI] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await fetchReportsSummary();
      if (data) setSummary(data);
    } catch (err) {
      console.error('Error fetching live summary metrics:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadSnapshots = async () => {
    try {
      setLoadingCharts(true);
      setError(null);
      const data = await fetchReportsSnapshots(startDate, endDate);
      if (data) setSnapshots(data);
    } catch (err) {
      setError('Failed to fetch historical snapshots.');
      console.error(err);
    } finally {
      setLoadingCharts(false);
    }
  };

  const loadInsights = async () => {
    try {
      setLoadingInsights(true);
      const data = await fetchOperationalInsights();
      if (data) setInsights(data);
    } catch (err) {
      console.error('Error loading AI insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadInsights();
  }, []);

  useEffect(() => {
    loadSnapshots();
  }, [startDate, endDate]);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await seedReportsDemoData();
      // Re-trigger analysis
      await triggerOperationalInsights();
      // Reload everything
      await Promise.all([loadSummary(), loadSnapshots(), loadInsights()]);
    } catch (err) {
      alert('Seeding failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleTriggerAI = async () => {
    try {
      setTriggeringAI(true);
      const updated = await triggerOperationalInsights();
      if (updated) setInsights(updated);
    } catch (err) {
      alert('AI diagnosis compile failed: ' + err.message);
    } finally {
      setTriggeringAI(false);
    }
  };

  const calculatedOccupancyRate = summary.totalBeds > 0 
    ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) 
    : 0;

  return (
    <div className="space-y-6 p-6 text-slate-100 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Hospital Operations &amp; BI</h1>
          <p className="text-sm text-slate-400">Real-time indicators, historical audit snapshots, and AI bottleneck recommendations</p>
        </div>

        {/* Date Filter & Seeding Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs">
            <span className="text-slate-400">Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none border-none cursor-pointer"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none border-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleSeedData}
            disabled={seeding}
            className={`rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700/80 px-4 py-2 text-xs font-bold text-white transition-all ${
              seeding ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {seeding ? 'Seeding...' : '🌱 Seed Demo Data'}
          </button>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Billing Revenue</span>
            <span className="text-xl">💰</span>
          </div>
          {loadingSummary ? (
            <div className="h-8 w-24 animate-pulse rounded bg-slate-850" />
          ) : (
            <div className="text-2xl font-bold text-emerald-400">
              ${summary.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
          <span className="text-[10px] text-slate-500 block mt-1">Accumulated from all encounters today</span>
        </div>

        {/* Card 2: Active Admissions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Inpatients</span>
            <span className="text-xl">🛌</span>
          </div>
          {loadingSummary ? (
            <div className="h-8 w-12 animate-pulse rounded bg-slate-850" />
          ) : (
            <div className="text-2xl font-bold text-white">{summary.activeAdmissions}</div>
          )}
          <span className="text-[10px] text-slate-500 block mt-1">Patients occupying inpatient wards</span>
        </div>

        {/* Card 3: Bed Occupancy Rate */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ward Occupancy Rate</span>
            <span className="text-xl">📊</span>
          </div>
          {loadingSummary ? (
            <div className="h-8 w-20 animate-pulse rounded bg-slate-850" />
          ) : (
            <div className="text-2xl font-bold text-sky-400">
              {calculatedOccupancyRate}%
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({summary.occupiedBeds}/{summary.totalBeds} beds)
              </span>
            </div>
          )}
          <span className="text-[10px] text-slate-500 block mt-1">General &amp; ICU ward utilization</span>
        </div>

        {/* Card 4: Emergency arrivals */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active ER Cases</span>
            <span className="text-xl">🚨</span>
          </div>
          {loadingSummary ? (
            <div className="h-8 w-12 animate-pulse rounded bg-slate-850" />
          ) : (
            <div className="text-2xl font-bold text-rose-400">{summary.activeERCases}</div>
          )}
          <span className="text-[10px] text-slate-500 block mt-1">Critical cases undergoing ER triage/care</span>
        </div>
      </div>

      {/* Main Charts & Analytics Block */}
      {snapshots.length === 0 && !loadingCharts ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center shadow-md">
          <span className="text-5xl mb-4">📈</span>
          <h2 className="text-lg font-bold text-white mb-2">Dashboard Seeding Required</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            There is no historical snapshot database compiled for this period. Click the button below to seed 30 days of randomized operational metrics and charts.
          </p>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className={`rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 font-bold text-white shadow-lg shadow-sky-500/25 transition-all ${
              seeding ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {seeding ? 'Seeding Snapshot Data...' : '🌱 Generate 30-Day Historical Data'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts area (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {loadingCharts ? (
              <div className="space-y-6">
                <div className="h-64 animate-pulse rounded-2xl bg-slate-900/50" />
                <div className="h-64 animate-pulse rounded-2xl bg-slate-900/50" />
              </div>
            ) : (
              <>
                <OccupancyChart data={snapshots} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RevenueBreakdownChart snapshots={snapshots} />
                  <ERRushHourChart data={snapshots} />
                </div>
              </>
            )}
          </div>

          {/* AI recommendations sidebar (Right 1 column) */}
          <div>
            {loadingInsights ? (
              <div className="h-96 animate-pulse rounded-2xl bg-slate-900/50" />
            ) : (
              <AIModelMetricsCard
                insights={insights}
                onTrigger={handleTriggerAI}
                loading={triggeringAI}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
