import React from 'react';
import { MobilityRecord } from '../../types';
import { TRAIN_CATEGORIES } from '../../data/constants';
import { computeDailyTimeseries } from '../../data/analytics';
import { KPICard } from '../KPICard';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { BarChart } from '../Charts/BarChart';
import { DonutChart } from '../Charts/DonutChart';
import { Train, Users, IndianRupee, Percent, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TrainAnalyticsProps {
  records: MobilityRecord[];
  onSelectRoute?: (origin: string, dest: string) => void;
}

export const TrainAnalytics: React.FC<TrainAnalyticsProps> = ({ records, onSelectRoute }) => {
  const trainRecords = records.filter((r) => r.mode === 'Train');

  const totalPassengers = trainRecords.reduce((s, r) => s + r.passengers, 0);
  const totalTrips = trainRecords.reduce((s, r) => s + r.trips, 0); // Train rake runs
  const totalRevenue = trainRecords.reduce((s, r) => s + r.ticketRevenue, 0);
  const totalCapacity = trainRecords.reduce((s, r) => s + r.capacity, 0);
  const avgOccupancy = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
  const avgFare = totalPassengers > 0 ? Math.round(totalRevenue / totalPassengers) : 0;

  // Category statistics (Vande Bharat, Rajdhani, Superfast, Intercity)
  const categoryStats = TRAIN_CATEGORIES.map((cat) => {
    const recs = trainRecords.filter((r) => r.subCategory === cat.name);
    const pax = recs.reduce((s, r) => s + r.passengers, 0);
    const rev = recs.reduce((s, r) => s + r.ticketRevenue, 0);
    const cap = recs.reduce((s, r) => s + r.capacity, 0);
    const occ = cap > 0 ? (pax / cap) * 100 : 0;

    return {
      name: cat.name,
      speedKmph: cat.speedKmph,
      passengers: pax,
      revenue: rev,
      occupancy: Number(occ.toFixed(1)),
      avgFare: pax > 0 ? Math.round(rev / pax) : 0,
      share: totalPassengers > 0 ? ((pax / totalPassengers) * 100).toFixed(1) : '0',
    };
  });

  // Class breakdown estimate (Executive, 2A/3A, Sleeper, CC)
  const classBreakdown = [
    { class: 'AC Chair Car (CC / Exec)', share: 28, avgFare: '₹950', load: '94%' },
    { class: '3-Tier AC (3A / Economy)', share: 38, avgFare: '₹1,250', load: '97%' },
    { class: '2-Tier & 1st AC (2A / 1A)', share: 14, avgFare: '₹2,100', load: '91%' },
    { class: 'Sleeper Class (SL)', share: 20, avgFare: '₹380', load: '99%' },
  ];

  // Top Train Corridors
  const corridorMap = new Map<string, { pax: number; rev: number; trips: number; orig: string; dest: string }>();
  for (const r of trainRecords) {
    const key = `${r.origin} ↔ ${r.destination}`;
    const curr = corridorMap.get(key) || { pax: 0, rev: 0, trips: 0, orig: r.origin, dest: r.destination };
    curr.pax += r.passengers;
    curr.rev += r.ticketRevenue;
    curr.trips += r.trips;
    corridorMap.set(key, curr);
  }

  const topTrainCorridors = Array.from(corridorMap.entries())
    .map(([corridor, val]) => ({ corridor, ...val }))
    .sort((a, b) => b.pax - a.pax);

  const daily = computeDailyTimeseries(trainRecords);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Train className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Indian Railways Passenger & Revenue Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Vande Bharat, Rajdhani, Superfast Express rakes, berth capacity utilization, and dynamic holiday bookings.
          </p>
        </div>
        <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 px-3 py-1.5 rounded-lg">
          {trainRecords.length.toLocaleString()} Train Operations Scheduled
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Rail Passengers"
          value={totalPassengers.toLocaleString()}
          subtitle={`${totalTrips.toLocaleString()} rake trips operated`}
          icon={<Users className="w-4 h-4 text-emerald-400" />}
          badge="National Rail"
        />

        <KPICard
          title="Rail Passenger Revenue"
          value={`₹${(totalRevenue / 10000000).toFixed(2)} Cr`}
          subtitle={`Avg Ticket Fare: ₹${avgFare.toLocaleString()}`}
          icon={<IndianRupee className="w-4 h-4 text-emerald-400" />}
          badge="IRCTC & PRS"
        />

        <KPICard
          title="Berth Capacity Utilization"
          value={`${avgOccupancy.toFixed(1)}%`}
          subtitle="Average rake seat/berth load factor"
          icon={<Percent className="w-4 h-4 text-cyan-400" />}
          badge="High Utilization"
        />

        <KPICard
          title="Vande Bharat Fleet Volume"
          value={categoryStats.find((c) => c.name.includes('Vande'))?.passengers.toLocaleString() || 'N/A'}
          subtitle="Semi-high speed premium service share"
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          badge="Premium Corridor"
        />
      </div>

      {/* Daily Timeseries & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineAreaChart
            title="Daily Rail Passenger Volume & Booking Pressure"
            subtitle="Festivals push demand to 100%+ berth capacity, creating extensive waitlists"
            data={daily.map((d) => ({
              label: d.date.slice(5),
              value: d.passengers,
              tooltipText: d.isHoliday ? 'Holiday Special Trains Active' : undefined,
            }))}
            color="#10b981"
            height={260}
          />
        </div>

        <div className="lg:col-span-1">
          <DonutChart
            title="Train Category Share"
            subtitle="Vande Bharat vs Rajdhani vs Superfast"
            data={categoryStats.map((cat, idx) => ({
              label: cat.name.split(' ')[0],
              value: cat.passengers,
              color: ['#10b981', '#34d399', '#059669', '#6ee7b7'][idx % 4],
              formattedValue: `${cat.share}%`,
            }))}
            centerLabel="Railways"
            centerValue={`${(totalPassengers / 1000000).toFixed(2)}M`}
          />
        </div>
      </div>

      {/* Train Categories Performance Benchmark */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Train Category Operational Benchmark
          </h3>
          <span className="text-xs text-slate-400 font-mono">Speed & Yield Comparison</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px]">
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Max Speed</th>
                <th className="pb-2 text-right">Passengers</th>
                <th className="pb-2 text-right">Share</th>
                <th className="pb-2 text-right">Avg Fare</th>
                <th className="pb-2 text-right">Berth Load</th>
                <th className="pb-2 text-right">Ticket Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {categoryStats.map((cat) => (
                <tr key={cat.name} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-sans font-semibold text-white">{cat.name}</td>
                  <td className="py-2.5 text-right text-cyan-400">{cat.speedKmph} km/h</td>
                  <td className="py-2.5 text-right text-slate-200">{cat.passengers.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">{cat.share}%</td>
                  <td className="py-2.5 text-right text-slate-200">₹{cat.avgFare.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-400 font-semibold">{cat.occupancy}%</td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    ₹{(cat.revenue / 10000000).toFixed(2)} Cr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accommodation Classes & Top Corridors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Breakdown Grid */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Berth Class Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">
              Estimated distribution across passenger travel classes on Indian Railways rakes
            </p>
            <div className="flex flex-col gap-2.5">
              {classBreakdown.map((cl) => (
                <div key={cl.class} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium text-slate-200">{cl.class}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[11px]">
                    <span className="text-slate-400">Yield: {cl.avgFare}</span>
                    <span className="text-emerald-400 font-semibold">Load: {cl.load}</span>
                    <span className="text-white font-bold w-10 text-right">{cl.share}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Rail Corridors */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Top Rail Corridors</h3>
            <p className="text-xs text-slate-400 mb-4">
              High-frequency passenger demand corridors (Click to filter)
            </p>
            <div className="flex flex-col gap-2.5">
              {topTrainCorridors.slice(0, 4).map((c) => (
                <div
                  key={c.corridor}
                  onClick={() => onSelectRoute?.(c.orig, c.dest)}
                  className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-emerald-500 rounded-lg cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <span>{c.corridor}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[11px]">
                    <span className="text-white font-bold">{c.pax.toLocaleString()} pax</span>
                    <span className="text-emerald-400">₹{(c.rev / 10000000).toFixed(2)} Cr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
