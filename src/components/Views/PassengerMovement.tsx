import React, { useState } from 'react';
import { MobilityRecord, FilterState } from '../../types';
import {
  computeODMatrix,
  computeDirectionalComparison,
  computeModeBreakdown,
  computeDailyTimeseries,
} from '../../data/analytics';
import { ODMatrix } from '../Charts/ODMatrix';
import { FlowVisualizer } from '../Charts/FlowVisualizer';
import { BarChart } from '../Charts/BarChart';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { ArrowRight, Clock, Compass, Layers, ArrowLeftRight } from 'lucide-react';
import { MODE_COLORS } from '../../data/constants';

interface PassengerMovementProps {
  records: MobilityRecord[];
  filters: FilterState;
  onSelectRoute: (origin: string, destination: string) => void;
  onDrillDown: (origin: string, destination: string) => void;
}

export const PassengerMovement: React.FC<PassengerMovementProps> = ({
  records,
  filters,
  onSelectRoute,
  onDrillDown,
}) => {
  const [matrixMetric, setMatrixMetric] = useState<'passengers' | 'revenue'>('passengers');
  const [selectedCityPair, setSelectedCityPair] = useState<string>('Bengaluru - Chennai');

  const { cities, matrix } = computeODMatrix(records);
  const directional = computeDirectionalComparison(records);
  const daily = computeDailyTimeseries(records);

  // Group by Route Direction
  const routeMap = new Map<string, { passengers: number; trips: number; revenue: number; origin: string; dest: string }>();
  for (const r of records) {
    const key = `${r.origin} → ${r.destination}`;
    const curr = routeMap.get(key) || { passengers: 0, trips: 0, revenue: 0, origin: r.origin, dest: r.destination };
    curr.passengers += r.passengers;
    curr.trips += r.trips;
    curr.revenue += r.ticketRevenue;
    routeMap.set(key, curr);
  }

  const sortedRoutes = Array.from(routeMap.entries())
    .map(([route, val]) => ({
      route,
      ...val,
    }))
    .sort((a, b) => b.passengers - a.passengers);

  // Filter records for selected city pair
  const [cityA, cityB] = selectedCityPair.split(' - ');
  const pairRecords = records.filter(
    (r) =>
      (r.origin === cityA && r.destination === cityB) ||
      (r.origin === cityB && r.destination === cityA)
  );

  const pairDaily = computeDailyTimeseries(pairRecords);
  const pairModes = computeModeBreakdown(pairRecords);

  // Mock hourly peak departure distribution curve (typical Indian intercity transport)
  const departureHourlyData = [
    { hour: '05:00', share: 4.2 },
    { hour: '06:00', share: 8.5 }, // Early morning trains & flights
    { hour: '07:00', share: 10.2 },
    { hour: '08:00', share: 7.8 },
    { hour: '11:00', share: 4.1 },
    { hour: '14:00', share: 3.5 },
    { hour: '16:00', share: 5.6 },
    { hour: '18:00', share: 9.4 }, // Evening business rush
    { hour: '20:00', share: 13.8 }, // Overnight buses & trains
    { hour: '21:30', share: 16.2 }, // Peak overnight sleeper buses & express rakes
    { hour: '23:00', share: 11.5 },
    { hour: '01:00', share: 5.2 },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Passenger Movement Intelligence</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Intercity origin-destination matrices, directional volume symmetry, and corridor ranking.
          </p>
        </div>

        {/* Matrix toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setMatrixMetric('passengers')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              matrixMetric === 'passengers'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Volume (Pax)
          </button>
          <button
            onClick={() => setMatrixMetric('revenue')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              matrixMetric === 'revenue'
                ? 'bg-slate-800 text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Revenue (₹)
          </button>
        </div>
      </div>

      {/* Origin-Destination Heatmap Matrix */}
      <ODMatrix
        cities={cities}
        matrix={matrix}
        metric={matrixMetric}
        onCellClick={(orig, dest) => {
          onSelectRoute(orig, dest);
          setSelectedCityPair(`${orig} - ${dest}`);
        }}
      />

      {/* Directional Flow Visualizer */}
      <FlowVisualizer
        flows={directional}
        onSelectCorridor={(a, b) => {
          setSelectedCityPair(`${a} - ${b}`);
          onSelectRoute(a, b);
        }}
      />

      {/* Selected Corridor Deep Dive */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Corridor Deep Dive: <span className="text-cyan-400">{selectedCityPair}</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDrillDown(cityA, cityB)}
              className="px-3 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-xs"
            >
              Enter Full Route Drill-Down →
            </button>
          </div>
        </div>

        {/* Modal share for this corridor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pairModes.map((m) => (
            <div
              key={m.mode}
              className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: MODE_COLORS[m.mode].primary }}>
                  {m.mode}
                </span>
                <span className="font-mono text-slate-400">{m.paxShare}% share</span>
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1">
                {m.passengers.toLocaleString()} pax
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Avg Spend: ₹{m.avgFareOrExp}</span>
                <span>Load: {m.occupancy}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Timeseries for selected corridor */}
        <LineAreaChart
          title={`${selectedCityPair} Daily Volume Trend`}
          subtitle="Seasonal variations and weekend demand fluctuations"
          data={pairDaily.map((d) => ({ label: d.date.slice(5), value: d.passengers }))}
          color="#0ea5e9"
          height={200}
        />
      </div>

      {/* Hourly Departure Curve & Top Directional Routes Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Departure curve */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Peak Departure Periods</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Estimated distribution of daily departures by time slot across Indian intercity corridors.
          </p>
          <div className="flex flex-col gap-2 mt-auto">
            {departureHourlyData.map((d) => (
              <div key={d.hour} className="flex items-center gap-2 text-xs">
                <span className="w-12 font-mono text-slate-400 text-[11px]">{d.hour}</span>
                <div className="flex-1 bg-slate-950 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      d.share > 12 ? 'bg-amber-400' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${(d.share / 18) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-[11px] text-slate-300">
                  {d.share}%
                </span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
            Note: Heavy twin peaks at 06:00-08:00 (Shatabdi/Flights) and 20:00-22:30 (Overnight Sleepers/Trains).
          </div>
        </div>

        {/* Top Directional Routes Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Directional Route Popularity & Revenue Ranking
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Top {Math.min(10, sortedRoutes.length)} Directional Routes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2">Route</th>
                  <th className="pb-2 text-right">Passengers</th>
                  <th className="pb-2 text-right">Trips</th>
                  <th className="pb-2 text-right">Ticket Revenue</th>
                  <th className="pb-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {sortedRoutes.slice(0, 8).map((r) => (
                  <tr key={r.route} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-sans font-medium text-slate-200">
                      {r.route}
                    </td>
                    <td className="py-2.5 text-right text-white font-bold">
                      {r.passengers.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-slate-400">
                      {r.trips.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-emerald-400 font-semibold">
                      ₹{(r.revenue / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="py-2.5 text-center">
                      <button
                        onClick={() => onDrillDown(r.origin, r.dest)}
                        className="px-2 py-0.5 text-[10px] text-cyan-400 hover:text-white bg-slate-800 rounded hover:bg-cyan-600 transition-colors"
                      >
                        Drill Down →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
