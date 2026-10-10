import React from 'react';
import { MobilityRecord } from '../../types';
import { CITY_MAP } from '../../data/constants';
import { computeDailyTimeseries } from '../../data/analytics';
import { KPICard } from '../KPICard';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { BarChart } from '../Charts/BarChart';
import { Plane, Users, IndianRupee, Percent, ArrowRight, TrendingUp } from 'lucide-react';

interface AirAnalyticsProps {
  records: MobilityRecord[];
  onSelectRoute?: (origin: string, dest: string) => void;
}

export const AirAnalytics: React.FC<AirAnalyticsProps> = ({ records, onSelectRoute }) => {
  const airRecords = records.filter((r) => r.mode === 'Airplane');

  const totalPassengers = airRecords.reduce((s, r) => s + r.passengers, 0);
  const totalFlights = airRecords.reduce((s, r) => s + r.trips, 0);
  const totalRevenue = airRecords.reduce((s, r) => s + r.ticketRevenue, 0);
  const totalCapacity = airRecords.reduce((s, r) => s + r.capacity, 0);
  const avgPLF = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
  const avgFare = totalPassengers > 0 ? Math.round(totalRevenue / totalPassengers) : 0;

  // Airport Pairs Aggregation
  const airportMap = new Map<string, {
    pair: string;
    origCode: string;
    destCode: string;
    origCity: string;
    destCity: string;
    pax: number;
    revenue: number;
    flights: number;
    plf: number;
    avgFare: number;
  }>();

  for (const r of airRecords) {
    const origCode = CITY_MAP[r.origin]?.code || r.origin.slice(0, 3).toUpperCase();
    const destCode = CITY_MAP[r.destination]?.code || r.destination.slice(0, 3).toUpperCase();
    const pair = `${origCode} ↔ ${destCode}`;

    const curr = airportMap.get(pair) || {
      pair,
      origCode,
      destCode,
      origCity: r.origin,
      destCity: r.destination,
      pax: 0,
      revenue: 0,
      flights: 0,
      plf: 0,
      avgFare: 0,
    };
    curr.pax += r.passengers;
    curr.revenue += r.ticketRevenue;
    curr.flights += r.trips;
    airportMap.set(pair, curr);
  }

  const airportPairs = Array.from(airportMap.values())
    .map((item) => {
      const cap = item.flights * 186; // A320neo standard capacity
      return {
        ...item,
        plf: cap > 0 ? Number(((item.pax / cap) * 100).toFixed(1)) : 84.5,
        avgFare: item.pax > 0 ? Math.round(item.revenue / item.pax) : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const daily = computeDailyTimeseries(airRecords);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Domestic Air Travel & Airline Yield Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Scheduled flights, passenger load factors (PLF), dynamic ticket yield, and metro airport pairs.
          </p>
        </div>
        <div className="text-xs font-mono text-violet-400 bg-violet-950/40 border border-violet-800/80 px-3 py-1.5 rounded-lg">
          {airRecords.length.toLocaleString()} Scheduled Flight Records
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Domestic Passengers"
          value={totalPassengers.toLocaleString()}
          subtitle={`${totalFlights.toLocaleString()} scheduled departures`}
          icon={<Users className="w-4 h-4 text-violet-400" />}
          badge="Metro Aviation"
        />

        <KPICard
          title="Airline Ticket Revenue"
          value={`₹${(totalRevenue / 10000000).toFixed(2)} Cr`}
          subtitle={`Avg Fare / Yield: ₹${avgFare.toLocaleString()}`}
          icon={<IndianRupee className="w-4 h-4 text-emerald-400" />}
          badge="Aviation Revenue"
        />

        <KPICard
          title="Passenger Load Factor (PLF)"
          value={`${avgPLF.toFixed(1)}%`}
          subtitle="A320neo / B737 seat utilization"
          icon={<Percent className="w-4 h-4 text-cyan-400" />}
          badge="DGCA Standard"
        />

        <KPICard
          title="Top Aviation Revenue Pair"
          value={airportPairs[0]?.pair || 'BOM ↔ DEL'}
          subtitle={`₹${((airportPairs[0]?.revenue || 0) / 10000000).toFixed(1)} Cr generated`}
          icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
          badge="Prime Trunk Route"
        />
      </div>

      {/* Daily Timeseries & Top Airport Pairs Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineAreaChart
            title="Daily Air Passenger Traffic & Dynamic Festive Fares"
            subtitle="Massive yield spikes around Diwali, Pongal, and Summer Holiday departures"
            data={daily.map((d) => ({
              label: d.date.slice(5),
              value: d.passengers,
              tooltipText: d.isHoliday ? 'Holiday Air Surge' : undefined,
            }))}
            color="#8b5cf6"
            height={260}
          />
        </div>

        <div className="lg:col-span-1">
          <BarChart
            title="Top Airport Pairs by Passenger Volume"
            data={airportPairs.slice(0, 5).map((p) => ({
              label: p.pair,
              value: p.pax,
              color: '#8b5cf6',
            }))}
            height={260}
            onBarClick={(item) => {
              const pairObj = airportPairs.find((p) => p.pair === item.label);
              if (pairObj) onSelectRoute?.(pairObj.origCity, pairObj.destCity);
            }}
          />
        </div>
      </div>

      {/* Airport Pair Intelligence Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Metropolitan Airport Pair Commercial Ranking
          </h3>
          <span className="text-xs text-slate-400 font-mono">Ranked by Total Revenue Generated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px]">
                <th className="pb-2">Airport Pair</th>
                <th className="pb-2">City Corridor</th>
                <th className="pb-2 text-right">Passengers</th>
                <th className="pb-2 text-right">Departures</th>
                <th className="pb-2 text-right">Avg Fare</th>
                <th className="pb-2 text-right">PLF %</th>
                <th className="pb-2 text-right">Total Revenue</th>
                <th className="pb-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {airportPairs.map((pair) => (
                <tr key={pair.pair} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-sans font-bold text-violet-300">
                    {pair.pair}
                  </td>
                  <td className="py-2.5 font-sans text-slate-300">
                    {pair.origCity} ↔ {pair.destCity}
                  </td>
                  <td className="py-2.5 text-right text-white font-medium">
                    {pair.pax.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-slate-400">
                    {pair.flights.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-slate-200">
                    ₹{pair.avgFare.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-emerald-400 font-semibold">
                    {pair.plf}%
                  </td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    ₹{(pair.revenue / 10000000).toFixed(2)} Cr
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => onSelectRoute?.(pair.origCity, pair.destCity)}
                      className="px-2 py-0.5 text-[10px] text-violet-300 hover:text-white bg-slate-800 rounded hover:bg-violet-700 transition-colors"
                    >
                      Filter Pair →
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
