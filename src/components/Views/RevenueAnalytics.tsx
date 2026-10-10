import React from 'react';
import { MobilityRecord, FilterState } from '../../types';
import { computeKPISummary, computeModeBreakdown, computeDailyTimeseries } from '../../data/analytics';
import { KPICard } from '../KPICard';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { BarChart } from '../Charts/BarChart';
import { DonutChart } from '../Charts/DonutChart';
import { IndianRupee, TrendingUp, PieChart, ShieldCheck, DollarSign, ArrowRight, Layers } from 'lucide-react';
import { MODE_COLORS } from '../../data/constants';

interface RevenueAnalyticsProps {
  records: MobilityRecord[];
  allRecords: MobilityRecord[];
  filters: FilterState;
  onSelectRoute?: (origin: string, dest: string) => void;
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({
  records,
  allRecords,
  filters,
  onSelectRoute,
}) => {
  const kpis = computeKPISummary(records, allRecords, filters);
  const modeBreakdown = computeModeBreakdown(records);
  const daily = computeDailyTimeseries(records);

  // Commercial modes only for margin analysis
  const commercialModes = modeBreakdown.filter((m) => m.mode !== 'Car');
  const totalCommercialRev = commercialModes.reduce((s, m) => s + m.ticketRevenue, 0);
  const totalCommercialCost = commercialModes.reduce((s, m) => s + m.operatingCost, 0);
  const totalCommercialMargin = totalCommercialRev - totalCommercialCost;
  const netMarginPct = totalCommercialRev > 0 ? (totalCommercialMargin / totalCommercialRev) * 100 : 0;

  // Corridor Revenue Ranking
  const corridorRevMap = new Map<string, { rev: number; pax: number; trips: number; carExp: number; orig: string; dest: string }>();
  for (const r of records) {
    const key = `${r.origin} ↔ ${r.destination}`;
    const curr = corridorRevMap.get(key) || { rev: 0, pax: 0, trips: 0, carExp: 0, orig: r.origin, dest: r.destination };
    curr.rev += r.ticketRevenue;
    curr.pax += r.passengers;
    curr.trips += r.trips;
    curr.carExp += r.carExpenditure;
    corridorRevMap.set(key, curr);
  }

  const sortedCorridors = Array.from(corridorRevMap.entries())
    .map(([corridor, val]) => ({
      corridor,
      ...val,
      avgRevPerPax: val.pax > 0 ? Math.round(val.rev / val.pax) : 0,
    }))
    .sort((a, b) => b.rev - a.rev);

  // Revenue by Mode for Donut
  const modeDonutData = commercialModes.map((m) => ({
    label: m.mode,
    value: m.ticketRevenue,
    color: MODE_COLORS[m.mode].primary,
    formattedValue: `₹${(m.ticketRevenue / 10000000).toFixed(1)} Cr (${m.revShare}%)`,
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Revenue & Yield Intelligence</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Commercial transit ticket revenues, operating cost and margin modeling, and private road expenditure separation.
          </p>
        </div>
        <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 px-3 py-1.5 rounded-lg">
          Filtered Revenue Window: {filters.dateStart} → {filters.dateEnd}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Operator Ticket Revenue"
          value={`₹${(kpis.totalTicketRevenue / 10000000).toFixed(2)} Cr`}
          change={kpis.revenueGrowthPct}
          changeLabel="vs prev period"
          icon={<IndianRupee className="w-4 h-4 text-emerald-400" />}
          badge="Commercial Ticket"
        />

        <KPICard
          title="Est. Operating Margin"
          value={`${netMarginPct.toFixed(1)}%`}
          subtitle={`₹${(totalCommercialMargin / 10000000).toFixed(2)} Cr Net Margin`}
          icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
          badge="Operating Profit"
        />

        <KPICard
          title="Avg Revenue per Commercial Pax"
          value={`₹${kpis.avgRevenuePerPax.toLocaleString()}`}
          subtitle="Blended yield across Bus, Train, and Air"
          icon={<DollarSign className="w-4 h-4 text-violet-400" />}
          badge="Passenger Yield"
        />

        <KPICard
          title="Private Road Outlay (Isolated)"
          value={`₹${(kpis.totalCarExpenditure / 10000000).toFixed(2)} Cr`}
          subtitle="Consumer fuel + FASTag electronic tolls"
          icon={<ShieldCheck className="w-4 h-4 text-amber-400" />}
          badge="Separate Ledger"
        />
      </div>

      {/* Daily Revenue Timeseries & Mode Revenue Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineAreaChart
            title="Daily Commercial Ticket Revenue vs Private Car Outlay"
            subtitle="Clear dual-ledger tracking over time"
            data={daily.map((d) => ({
              label: d.date.slice(5),
              value: d.ticketRevenue,
              secondaryValue: d.carExpenditure,
            }))}
            seriesName="Ticket Revenue (₹)"
            secondarySeriesName="Car Outlay (₹)"
            color="#10b981"
            secondaryColor="#f59e0b"
            height={280}
          />
        </div>

        <div className="lg:col-span-1">
          <DonutChart
            title="Commercial Ticket Revenue Contribution"
            subtitle="Share of operator revenue by transport mode"
            data={modeDonutData}
            centerLabel="Ticket Rev"
            centerValue={`₹${(totalCommercialRev / 10000000).toFixed(1)}Cr`}
          />
        </div>
      </div>

      {/* Cost & Operating Margin Breakdown Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Commercial Mode Unit Economics, Costs & Margin Modeling
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Simulated Cost Model Assumptions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px]">
                <th className="pb-2">Mode</th>
                <th className="pb-2 text-right">Passengers</th>
                <th className="pb-2 text-right">Trips</th>
                <th className="pb-2 text-right">Avg Fare</th>
                <th className="pb-2 text-right">Gross Ticket Rev</th>
                <th className="pb-2 text-right">Est. Operating Cost</th>
                <th className="pb-2 text-right">Operating Margin</th>
                <th className="pb-2 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {commercialModes.map((m) => (
                <tr key={m.mode} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-sans font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODE_COLORS[m.mode].primary }} />
                    <span>{m.mode}</span>
                  </td>
                  <td className="py-2.5 text-right text-slate-200">{m.passengers.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-slate-400">{m.trips.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-slate-200">₹{m.avgFareOrExp.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    ₹{(m.ticketRevenue / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-2.5 text-right text-rose-400">
                    ₹{(m.operatingCost / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-2.5 text-right text-cyan-300 font-semibold">
                    ₹{(m.operatingMargin / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-2.5 text-right font-bold text-white">
                    {m.marginPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Corridors by Revenue */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Corridor Commercial Revenue Performance Ranking
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px]">
                <th className="pb-2">Corridor Pair</th>
                <th className="pb-2 text-right">Total Passengers</th>
                <th className="pb-2 text-right">Trips</th>
                <th className="pb-2 text-right">Yield / Pax</th>
                <th className="pb-2 text-right">Ticket Revenue</th>
                <th className="pb-2 text-right">Car Outlay (Separate)</th>
                <th className="pb-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {sortedCorridors.map((c) => (
                <tr key={c.corridor} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-sans font-semibold text-white">
                    {c.corridor}
                  </td>
                  <td className="py-2.5 text-right text-slate-200">
                    {c.pax.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-slate-400">
                    {c.trips.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-slate-200">
                    ₹{c.avgRevPerPax.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    ₹{(c.rev / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-2.5 text-right text-amber-400 font-mono">
                    ₹{(c.carExp / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => onSelectRoute?.(c.orig, c.dest)}
                      className="px-2 py-0.5 text-[10px] text-cyan-400 hover:text-white bg-slate-800 rounded hover:bg-cyan-600 transition-colors"
                    >
                      Filter Corridor →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
