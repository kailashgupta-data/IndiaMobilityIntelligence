import React from 'react';
import { MobilityRecord, FilterState, TransportMode } from '../../types';
import {
  computeKPISummary,
  computeDailyTimeseries,
  computeModeBreakdown,
  computeDirectionalComparison,
  detectAnomalies,
} from '../../data/analytics';
import { KPICard } from '../KPICard';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { DonutChart } from '../Charts/DonutChart';
import { BarChart } from '../Charts/BarChart';
import { FlowVisualizer } from '../Charts/FlowVisualizer';
import { Users, IndianRupee, Car, Ticket, TrendingUp, AlertTriangle, Layers, Percent } from 'lucide-react';
import { MODE_COLORS } from '../../data/constants';

interface ExecutiveOverviewProps {
  records: MobilityRecord[];
  allRecords: MobilityRecord[];
  filters: FilterState;
  onSelectRoute: (origin: string, destination: string) => void;
  onSelectMode: (mode: TransportMode) => void;
  onNavigateToView: (view: any) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  records,
  allRecords,
  filters,
  onSelectRoute,
  onSelectMode,
  onNavigateToView,
}) => {
  const kpis = computeKPISummary(records, allRecords, filters);
  const daily = computeDailyTimeseries(records);
  const modeBreakdown = computeModeBreakdown(records);
  const directionalFlows = computeDirectionalComparison(records);
  const anomalies = detectAnomalies(records).slice(0, 4);

  // Sparklines from daily
  const paxSparkline = daily.slice(-14).map((d) => d.passengers);
  const revSparkline = daily.slice(-14).map((d) => d.ticketRevenue);

  // Daily Chart series
  const dailyChartData = daily.map((d) => ({
    label: d.date.slice(5),
    value: d.passengers,
    secondaryValue: d.ticketRevenue,
    tooltipText: d.isHoliday ? 'Holiday Surge' : undefined,
  }));

  // Donut data: Mode Passenger share
  const donutPaxData = modeBreakdown.map((m) => ({
    label: m.mode,
    value: m.passengers,
    color: MODE_COLORS[m.mode].primary,
    formattedValue: `${m.passengers.toLocaleString()} pax`,
  }));

  // Corridor Volumes for Bar Chart
  const corridorMap = new Map<string, number>();
  for (const r of records) {
    const pair = `${r.origin} ↔ ${r.destination}`;
    corridorMap.set(pair, (corridorMap.get(pair) || 0) + r.passengers);
  }
  const topCorridorsData = Array.from(corridorMap.entries())
    .map(([label, value]) => ({
      label: label.replace(' ↔ ', ' - '),
      value,
      color: '#0ea5e9',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Title & Scope Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Mobility Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Macro intercity transit demand, operator ticket revenue, and multi-modal network performance across India.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Window: {filters.dateStart} → {filters.dateEnd}</span>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Intercity Passengers"
          value={kpis.totalPassengers.toLocaleString()}
          change={kpis.passengerGrowthPct}
          changeLabel="vs prev period"
          sparklineData={paxSparkline}
          icon={<Users className="w-4 h-4 text-cyan-400" />}
          badge={`${kpis.activeRoutesCount} Corridors`}
        />

        <KPICard
          title="Operator Ticket Revenue"
          value={`₹${(kpis.totalTicketRevenue / 10000000).toFixed(2)} Cr`}
          change={kpis.revenueGrowthPct}
          changeLabel="vs prev period"
          sparklineData={revSparkline}
          icon={<IndianRupee className="w-4 h-4 text-emerald-400" />}
          badge="Excl. Car Exp."
        />

        <KPICard
          title="Est. Private Car Road Expenditure"
          value={`₹${(kpis.totalCarExpenditure / 10000000).toFixed(2)} Cr`}
          subtitle="Fuel, FASTag tolls & vehicle operating wear"
          icon={<Car className="w-4 h-4 text-amber-400" />}
          badge="Consumer Exp."
          onClick={() => onNavigateToView('car_analytics')}
        />

        <KPICard
          title="Network Avg Occupancy"
          value={`${kpis.avgOccupancyRate}%`}
          subtitle={`Avg Revenue: ₹${kpis.avgRevenuePerPax.toLocaleString()} / commercial pax`}
          icon={<Percent className="w-4 h-4 text-violet-400" />}
          badge="Capacity Load"
        />
      </div>

      {/* Secondary Quick Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Ticket className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="text-slate-400 text-[11px]">Total Scheduled Trips</div>
            <div className="font-bold text-white font-mono">{kpis.totalTrips.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-slate-400 text-[11px]">Highest Volume Corridor</div>
            <div className="font-bold text-white font-mono truncate">{kpis.topVolumeRoute.route}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-violet-400 shrink-0" />
          <div>
            <div className="text-slate-400 text-[11px]">Lead Commercial Revenue Mode</div>
            <div className="font-bold text-white font-mono">{kpis.topRevenueMode.mode}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <IndianRupee className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-slate-400 text-[11px]">Combined Mobility Value</div>
            <div className="font-bold text-white font-mono">₹{(kpis.totalValue / 10000000).toFixed(2)} Cr</div>
          </div>
        </div>
      </div>

      {/* Interactive Charts: Dual-axis Daily Timeseries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineAreaChart
            title="Daily Intercity Passenger Movement & Ticket Revenue"
            subtitle="Observe day-of-week rhythms, weekend peaks, and festival volume surges"
            data={dailyChartData}
            seriesName="Passengers"
            secondarySeriesName="Revenue (₹)"
            color="#0ea5e9"
            secondaryColor="#10b981"
            height={280}
          />
        </div>

        {/* Modal Share Donut */}
        <div className="lg:col-span-1">
          <DonutChart
            title="Transport Mode Passenger Share"
            subtitle="Modal distribution of intercity passengers"
            data={donutPaxData}
            centerLabel="Passengers"
            centerValue={`${(kpis.totalPassengers / 1000000).toFixed(2)}M`}
            onSegmentClick={(seg) => onSelectMode(seg.label as TransportMode)}
          />
        </div>
      </div>

      {/* Top Corridors Bar Chart & Directional Flow Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Top Indian Metropolitan Corridors by Passenger Volume"
          subtitle="Ranked passenger movement across primary origin-destination pairs"
          data={topCorridorsData}
          seriesName="Passengers"
          valueSuffix=" pax"
          height={260}
          onBarClick={(item) => {
            const parts = item.label.split(' - ');
            if (parts.length === 2) onSelectRoute(parts[0], parts[1]);
          }}
        />

        <FlowVisualizer
          flows={directionalFlows}
          title="Bidirectional Corridor Flow Imbalance"
          subtitle="Inspect outbound versus inbound flow asymmetries"
          onSelectCorridor={(a, b) => onSelectRoute(a, b)}
        />
      </div>

      {/* Recent Anomaly / Congestion Alert Strip */}
      {anomalies.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Statistical Anomaly Flags (Z-Score ≥ 2.2)
              </h3>
            </div>
            <button
              onClick={() => onNavigateToView('ai_insights')}
              className="text-xs text-cyan-400 hover:underline"
            >
              View all anomalies in AI Insights →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {anomalies.map((ano, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400">{ano.date}</span>
                  <span
                    className={`font-semibold ${
                      ano.type === 'spike' ? 'text-amber-400' : 'text-blue-400'
                    }`}
                  >
                    {ano.type === 'spike' ? '▲ Surge' : '▼ Dip'} ({ano.zScore}σ)
                  </span>
                </div>
                <div className="font-medium text-slate-200 truncate">{ano.route}</div>
                <div className="text-[11px] text-slate-400">
                  {ano.mode}: <strong className="text-white font-mono">{ano.passengers.toLocaleString()}</strong> pax
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{ano.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
