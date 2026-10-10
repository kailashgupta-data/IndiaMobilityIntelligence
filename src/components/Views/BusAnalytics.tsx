import React, { useState } from 'react';
import { MobilityRecord } from '../../types';
import { BUS_OPERATORS } from '../../data/constants';
import { computeDailyTimeseries } from '../../data/analytics';
import { KPICard } from '../KPICard';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { BarChart } from '../Charts/BarChart';
import { DonutChart } from '../Charts/DonutChart';
import { Bus, Users, IndianRupee, Percent, Shield, Calendar, ArrowRight } from 'lucide-react';

interface BusAnalyticsProps {
  records: MobilityRecord[];
  onSelectRoute?: (origin: string, dest: string) => void;
}

export const BusAnalytics: React.FC<BusAnalyticsProps> = ({ records, onSelectRoute }) => {
  const busRecords = records.filter((r) => r.mode === 'Bus');

  const totalPassengers = busRecords.reduce((s, r) => s + r.passengers, 0);
  const totalTrips = busRecords.reduce((s, r) => s + r.trips, 0);
  const totalRevenue = busRecords.reduce((s, r) => s + r.ticketRevenue, 0);
  const totalCapacity = busRecords.reduce((s, r) => s + r.capacity, 0);
  const avgOccupancy = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
  const avgFare = totalPassengers > 0 ? Math.round(totalRevenue / totalPassengers) : 0;

  // Weekend vs Weekday analysis
  const weekendRecords = busRecords.filter((r) => r.isWeekend);
  const weekdayRecords = busRecords.filter((r) => !r.isWeekend);
  const avgWeekendDailyPax = weekendRecords.length > 0 ? weekendRecords.reduce((s, r) => s + r.passengers, 0) / (weekendRecords.length / 8 || 1) : 0;
  const avgWeekdayDailyPax = weekdayRecords.length > 0 ? weekdayRecords.reduce((s, r) => s + r.passengers, 0) / (weekdayRecords.length / 8 || 1) : 0;
  const weekendMultiplier = avgWeekdayDailyPax > 0 ? avgWeekendDailyPax / avgWeekdayDailyPax : 1.25;

  // Operator-level market share & performance
  const operatorStats = BUS_OPERATORS.map((op) => {
    const opRecords = busRecords.filter((r) => r.subCategory === op.name);
    const pax = opRecords.reduce((s, r) => s + r.passengers, 0);
    const trips = opRecords.reduce((s, r) => s + r.trips, 0);
    const rev = opRecords.reduce((s, r) => s + r.ticketRevenue, 0);
    const cap = opRecords.reduce((s, r) => s + r.capacity, 0);
    const occ = cap > 0 ? (pax / cap) * 100 : 0;

    return {
      name: op.name,
      type: op.type,
      passengers: pax,
      trips,
      revenue: rev,
      occupancy: Number(occ.toFixed(1)),
      avgFare: pax > 0 ? Math.round(rev / pax) : 0,
      share: totalPassengers > 0 ? ((pax / totalPassengers) * 100).toFixed(1) : '0',
    };
  });

  // Top Bus Corridors
  const corridorMap = new Map<string, { pax: number; rev: number; trips: number; orig: string; dest: string }>();
  for (const r of busRecords) {
    const key = `${r.origin} ↔ ${r.destination}`;
    const curr = corridorMap.get(key) || { pax: 0, rev: 0, trips: 0, orig: r.origin, dest: r.destination };
    curr.pax += r.passengers;
    curr.rev += r.ticketRevenue;
    curr.trips += r.trips;
    corridorMap.set(key, curr);
  }

  const topCorridors = Array.from(corridorMap.entries())
    .map(([corridor, val]) => ({ corridor, ...val }))
    .sort((a, b) => b.pax - a.pax);

  const daily = computeDailyTimeseries(busRecords);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Intercity Bus Transport Analytics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Fleet operations, state RTC vs private fleet share, load factors, and fare yield across highway routes.
          </p>
        </div>
        <div className="text-xs font-mono text-sky-400 bg-sky-950/40 border border-sky-800/80 px-3 py-1.5 rounded-lg">
          {busRecords.length.toLocaleString()} Bus Route Logs Analyzed
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Bus Passengers"
          value={totalPassengers.toLocaleString()}
          subtitle={`${totalTrips.toLocaleString()} bus trips operated`}
          icon={<Users className="w-4 h-4 text-sky-400" />}
          badge="Highway Transit"
        />

        <KPICard
          title="Total Bus Ticket Revenue"
          value={`₹${(totalRevenue / 10000000).toFixed(2)} Cr`}
          subtitle={`Avg Fare: ₹${avgFare.toLocaleString()} / seat`}
          icon={<IndianRupee className="w-4 h-4 text-emerald-400" />}
          badge="Direct Revenue"
        />

        <KPICard
          title="Average Seat Occupancy"
          value={`${avgOccupancy.toFixed(1)}%`}
          subtitle="42-48 seats per standard multi-axle coach"
          icon={<Percent className="w-4 h-4 text-amber-400" />}
          badge="Load Factor"
        />

        <KPICard
          title="Weekend Demand Multiplier"
          value={`${weekendMultiplier.toFixed(2)}x`}
          subtitle="Friday/Sunday departure surge"
          icon={<Calendar className="w-4 h-4 text-violet-400" />}
          badge="Spike Index"
        />
      </div>

      {/* Timeseries & Market Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineAreaChart
            title="Daily Bus Passenger Volume & Festive Demand"
            subtitle="Spikes coincide with weekend holiday departures and festival getaways"
            data={daily.map((d) => ({
              label: d.date.slice(5),
              value: d.passengers,
              tooltipText: d.isHoliday ? 'Holiday Special Runs' : undefined,
            }))}
            color="#0ea5e9"
            height={260}
          />
        </div>

        <div className="lg:col-span-1">
          <DonutChart
            title="Operator Passenger Share"
            subtitle="State RTCs vs Private Luxury Multi-Axle Fleets"
            data={operatorStats.map((op, idx) => ({
              label: op.name,
              value: op.passengers,
              color: ['#0ea5e9', '#38bdf8', '#0284c7', '#0369a1', '#7dd3fc'][idx % 5],
              formattedValue: `${op.share}%`,
            }))}
            centerLabel="Bus Fleets"
            centerValue={`${(totalPassengers / 1000000).toFixed(2)}M`}
          />
        </div>
      </div>

      {/* Operator Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Operator Performance & Fleet Benchmark
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Mock Operator Fleet Metrics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px]">
                <th className="pb-2">Operator</th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Passengers</th>
                <th className="pb-2 text-right">Share</th>
                <th className="pb-2 text-right">Trips</th>
                <th className="pb-2 text-right">Avg Fare</th>
                <th className="pb-2 text-right">Occupancy</th>
                <th className="pb-2 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {operatorStats.map((op) => (
                <tr key={op.name} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-sans font-semibold text-white">{op.name}</td>
                  <td className="py-2.5 text-slate-400 font-sans">{op.type}</td>
                  <td className="py-2.5 text-right text-slate-200">{op.passengers.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-cyan-400 font-bold">{op.share}%</td>
                  <td className="py-2.5 text-right text-slate-400">{op.trips.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-slate-200">₹{op.avgFare.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-400 font-semibold">{op.occupancy}%</td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold">
                    ₹{(op.revenue / 10000000).toFixed(2)} Cr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Bus Corridors */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Top Intercity Bus Corridors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topCorridors.slice(0, 4).map((c) => (
            <div
              key={c.corridor}
              onClick={() => onSelectRoute?.(c.orig, c.dest)}
              className="p-3 bg-slate-950/80 border border-slate-800 hover:border-sky-500 rounded-lg cursor-pointer transition-all flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center justify-between font-semibold text-white">
                <span>{c.corridor}</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1">
                {c.pax.toLocaleString()} pax
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>{c.trips.toLocaleString()} trips</span>
                <span className="text-emerald-400">₹{(c.rev / 10000000).toFixed(2)} Cr</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
