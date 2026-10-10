import React, { useState } from 'react';
import { MobilityRecord, TransportMode } from '../../types';
import { HOLIDAYS, MODE_COLORS } from '../../data/constants';
import { computeDailyTimeseries, computeModeBreakdown } from '../../data/analytics';
import { KPICard } from '../KPICard';
import { CalendarHeatmap } from '../Charts/CalendarHeatmap';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { BarChart } from '../Charts/BarChart';
import { Sparkles, Calendar, TrendingUp, ArrowRight, Compass, AlertCircle } from 'lucide-react';

interface HolidayIntelligenceProps {
  records: MobilityRecord[];
  allRecords: MobilityRecord[];
  onSelectDateRange?: (start: string, end: string) => void;
  onSelectRoute?: (origin: string, dest: string) => void;
}

export const HolidayIntelligence: React.FC<HolidayIntelligenceProps> = ({
  records,
  allRecords,
  onSelectDateRange,
  onSelectRoute,
}) => {
  const [selectedHolidayId, setSelectedHolidayId] = useState<string>('diwali');

  const selectedHoliday = HOLIDAYS.find((h) => h.id === selectedHolidayId) || HOLIDAYS[0];

  // Calculate holiday window date range (T-2 to T+duration)
  const hDate = new Date(selectedHoliday.date);
  const winStart = new Date(hDate);
  winStart.setDate(winStart.getDate() - 2);
  const winEnd = new Date(hDate);
  winEnd.setDate(winEnd.getDate() + selectedHoliday.durationDays + 1);

  const winStartStr = winStart.toISOString().split('T')[0];
  const winEndStr = winEnd.toISOString().split('T')[0];

  // Holiday window records
  const holidayRecords = allRecords.filter((r) => r.date >= winStartStr && r.date <= winEndStr);

  // Baseline comparison window: same number of days exactly 3 weeks prior
  const windowDays = Math.max(1, Math.round((winEnd.getTime() - winStart.getTime()) / (1000 * 60 * 60 * 24)));
  const baseStart = new Date(winStart);
  baseStart.setDate(baseStart.getDate() - 28);
  const baseEnd = new Date(baseStart);
  baseEnd.setDate(baseEnd.getDate() + windowDays);

  const baseStartStr = baseStart.toISOString().split('T')[0];
  const baseEndStr = baseEnd.toISOString().split('T')[0];

  const baselineRecords = allRecords.filter((r) => r.date >= baseStartStr && r.date <= baseEndStr);

  // Metrics for Holiday Window vs Baseline Window
  const hPax = holidayRecords.reduce((s, r) => s + r.passengers, 0);
  const bPax = baselineRecords.reduce((s, r) => s + r.passengers, 0);
  const paxUpliftPct = bPax > 0 ? Number((((hPax - bPax) / bPax) * 100).toFixed(1)) : 0;

  const hRev = holidayRecords.reduce((s, r) => s + r.ticketRevenue, 0);
  const bRev = baselineRecords.reduce((s, r) => s + r.ticketRevenue, 0);
  const revUpliftPct = bRev > 0 ? Number((((hRev - bRev) / bRev) * 100).toFixed(1)) : 0;
  const revenueUpliftRupees = hRev - bRev;

  // Mode shifts in holiday window vs baseline
  const hModes = computeModeBreakdown(holidayRecords);
  const bModes = computeModeBreakdown(baselineRecords);

  // Corridor demand in holiday window
  const corrMap = new Map<string, { pax: number; rev: number; orig: string; dest: string }>();
  for (const r of holidayRecords) {
    const key = `${r.origin} ↔ ${r.destination}`;
    const curr = corrMap.get(key) || { pax: 0, rev: 0, orig: r.origin, dest: r.destination };
    curr.pax += r.passengers;
    curr.rev += r.ticketRevenue;
    corrMap.set(key, curr);
  }

  const topHolidayCorridors = Array.from(corrMap.entries())
    .map(([corridor, val]) => ({ corridor, ...val }))
    .sort((a, b) => b.pax - a.pax);

  // Full year calendar data
  const calendarDaily = computeDailyTimeseries(allRecords).map((d) => ({
    date: d.date,
    passengers: d.passengers,
    isHoliday: d.isHoliday,
    holidayName: allRecords.find((r) => r.date === d.date && r.holidayName)?.holidayName || null,
  }));

  // Daily timeseries inside holiday window
  const holidayDaily = computeDailyTimeseries(holidayRecords);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Festival & Seasonal Travel Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate festival travel surges, regional impacts, pre/post rush directional shifts, and baseline comparisons.
          </p>
        </div>

        {/* Festival Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
          {HOLIDAYS.map((h) => {
            const isSelected = selectedHolidayId === h.id;
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHolidayId(h.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {h.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Festival Analysis Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/60 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">{selectedHoliday.name} Travel Window</h3>
            <span className="text-[10px] font-mono font-medium text-amber-400 border border-amber-700/80 px-2 py-0.5 rounded">
              {winStartStr} → {winEndStr} ({windowDays} Days)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Regions: {selectedHoliday.primaryRegions.join(', ')}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {selectedHoliday.description} Compared against a baseline non-holiday reference window ({baseStartStr} → {baseEndStr}).
          </p>
        </div>

        <button
          onClick={() => onSelectDateRange?.(winStartStr, winEndStr)}
          className="shrink-0 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
        >
          Apply Date Window to Global Filter →
        </button>
      </div>

      {/* Holiday Impact KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Festival Passenger Surge"
          value={hPax.toLocaleString()}
          change={paxUpliftPct}
          changeLabel="vs baseline window"
          badge={`${selectedHoliday.durationDays}D Festival`}
        />

        <KPICard
          title="Commercial Ticket Revenue"
          value={`₹${(hRev / 10000000).toFixed(2)} Cr`}
          change={revUpliftPct}
          changeLabel="vs baseline window"
          badge="Operator Rev"
        />

        <KPICard
          title="Estimated Revenue Uplift"
          value={`+₹${(revenueUpliftRupees / 10000000).toFixed(2)} Cr`}
          subtitle="Net incremental ticket earnings"
          badge="Pure Uplift"
        />

        <KPICard
          title="Demand Multiplier Peak"
          value={`${selectedHoliday.demandMultiplier.toFixed(2)}x`}
          subtitle={`Impacts ${selectedHoliday.primaryRegions.join('/')} corridors`}
          badge="Peak Factor"
        />
      </div>

      {/* Daily Rush Curve & Mode Preference Shifts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineAreaChart
            title={`${selectedHoliday.name} Daily Passenger Flow Progression`}
            subtitle="Observe Pre-Festival departure surge (T-2, T-1) and Post-Festival return compressions"
            data={holidayDaily.map((d) => ({
              label: d.date,
              value: d.passengers,
              tooltipText: d.isHoliday ? 'Holiday Peak Day' : undefined,
            }))}
            color="#f59e0b"
            height={260}
          />
        </div>

        {/* Modal Share Shift During Festival */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Modal Preference Shift</h3>
            <p className="text-xs text-slate-400 mb-4">
              How festival pressures shift traffic between Trains, Buses, Flights & Cars
            </p>

            <div className="flex flex-col gap-3">
              {hModes.map((hm) => {
                const bm = bModes.find((x) => x.mode === hm.mode);
                const shiftDiff = Number((hm.paxShare - (bm?.paxShare || hm.paxShare)).toFixed(1));

                return (
                  <div key={hm.mode} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span style={{ color: MODE_COLORS[hm.mode].primary }}>{hm.mode}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-white">{hm.paxShare}% share</span>
                        <span
                          className={`font-semibold ${
                            shiftDiff > 0 ? 'text-emerald-400' : shiftDiff < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {shiftDiff > 0 ? `+${shiftDiff}%` : `${shiftDiff}%`}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      {hm.passengers.toLocaleString()} pax during festival
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Air ticket price surges cause spillover into intercity sleeper buses.</span>
          </div>
        </div>
      </div>

      {/* Top Festival Corridors */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Highest Demand Corridors During {selectedHoliday.name}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topHolidayCorridors.slice(0, 4).map((c) => (
            <div
              key={c.corridor}
              onClick={() => onSelectRoute?.(c.orig, c.dest)}
              className="p-3 bg-slate-950/80 border border-slate-800 hover:border-amber-500 rounded-lg cursor-pointer transition-all flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center justify-between font-semibold text-white">
                <span>{c.corridor}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1">
                {c.pax.toLocaleString()} pax
              </div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                ₹{(c.rev / 10000000).toFixed(2)} Cr Revenue
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Year Demand Calendar Heatmap */}
      <CalendarHeatmap
        days={calendarDaily}
        title="Full Year Calendar Travel Demand Heatmap"
        subtitle="Year-round intensity matrix with festival surge indicators"
        onDayClick={(d) => onSelectDateRange?.(d, d)}
      />
    </div>
  );
};
