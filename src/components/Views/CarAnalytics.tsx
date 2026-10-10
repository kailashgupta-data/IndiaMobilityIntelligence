import React from 'react';
import { MobilityRecord } from '../../types';
import { CAR_MODELS } from '../../data/constants';
import { computeDailyTimeseries } from '../../data/analytics';
import { KPICard } from '../KPICard';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { BarChart } from '../Charts/BarChart';
import { Car, Users, IndianRupee, Fuel, Info, Calendar, ArrowRight, Gauge } from 'lucide-react';

interface CarAnalyticsProps {
  records: MobilityRecord[];
  onSelectRoute?: (origin: string, dest: string) => void;
}

export const CarAnalytics: React.FC<CarAnalyticsProps> = ({ records, onSelectRoute }) => {
  const carRecords = records.filter((r) => r.mode === 'Car');

  const totalPassengers = carRecords.reduce((s, r) => s + r.passengers, 0);
  const totalVehicles = carRecords.reduce((s, r) => s + r.trips, 0);
  const totalExpenditure = carRecords.reduce((s, r) => s + r.carExpenditure, 0);
  const avgPaxPerCar = totalVehicles > 0 ? (totalPassengers / totalVehicles).toFixed(2) : '2.95';
  const avgExpPerPax = totalPassengers > 0 ? Math.round(totalExpenditure / totalPassengers) : 0;
  const avgExpPerCar = totalVehicles > 0 ? Math.round(totalExpenditure / totalVehicles) : 0;

  // Breakdown by car subcategory
  const categoryStats = CAR_MODELS.map((model) => {
    const recs = carRecords.filter((r) => r.subCategory === model.category);
    const pax = recs.reduce((s, r) => s + r.passengers, 0);
    const vehicles = recs.reduce((s, r) => s + r.trips, 0);
    const exp = recs.reduce((s, r) => s + r.carExpenditure, 0);

    return {
      category: model.category,
      passengers: pax,
      vehicles,
      expenditure: exp,
      avgOccupancy: vehicles > 0 ? (pax / vehicles).toFixed(2) : model.avgOccupancy.toString(),
      share: totalPassengers > 0 ? ((pax / totalPassengers) * 100).toFixed(1) : '0',
    };
  });

  // Top Highway Corridors by Car Volume
  const corridorMap = new Map<string, { pax: number; vehicles: number; exp: number; orig: string; dest: string }>();
  for (const r of carRecords) {
    const key = `${r.origin} ↔ ${r.destination}`;
    const curr = corridorMap.get(key) || { pax: 0, vehicles: 0, exp: 0, orig: r.origin, dest: r.destination };
    curr.pax += r.passengers;
    curr.vehicles += r.trips;
    curr.exp += r.carExpenditure;
    corridorMap.set(key, curr);
  }

  const topCarCorridors = Array.from(corridorMap.entries())
    .map(([corridor, val]) => ({ corridor, ...val }))
    .sort((a, b) => b.pax - a.pax);

  const daily = computeDailyTimeseries(carRecords);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Highway Car Travel & Road Expenditure Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Estimated passenger vehicle movements, passenger counts, fuel & FASTag toll outlays, and highway congestion patterns.
          </p>
        </div>
        <div className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/80 px-3 py-1.5 rounded-lg">
          {carRecords.length.toLocaleString()} Road Segment Observations
        </div>
      </div>

      {/* Critical Methodology Notice: Ticket Rev vs Car Exp Isolation */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-amber-200">
            Accounting Distinction: Consumer Road Travel Outlay vs Commercial Ticket Revenue
          </span>
          <p className="text-slate-300 leading-relaxed">
            Private vehicle expenditure (estimated fuel at ~₹7/km + NHAI FASTag electronic tolls at ~₹2/km) represents
            consumer out-of-pocket highway expenses and is strictly <strong>isolated from transit operator ticket revenue</strong>.
            Vehicle trips are modeled assuming an average of <strong>2.85 – 3.20 passengers per private vehicle</strong>,
            surging during long weekends and holiday periods.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Road Passengers"
          value={totalPassengers.toLocaleString()}
          subtitle={`${totalVehicles.toLocaleString()} passenger vehicles`}
          icon={<Users className="w-4 h-4 text-amber-400" />}
          badge="Highway Commute"
        />

        <KPICard
          title="Est. Total Road Travel Outlay"
          value={`₹${(totalExpenditure / 10000000).toFixed(2)} Cr`}
          subtitle={`Avg: ₹${avgExpPerPax.toLocaleString()} / passenger`}
          icon={<IndianRupee className="w-4 h-4 text-emerald-400" />}
          badge="Fuel + Tolls"
        />

        <KPICard
          title="Avg Vehicle Occupancy"
          value={`${avgPaxPerCar} pax`}
          subtitle="Passengers per active automobile"
          icon={<Gauge className="w-4 h-4 text-cyan-400" />}
          badge="Carpool Density"
        />

        <KPICard
          title="Avg Outlay Per Vehicle Trip"
          value={`₹${avgExpPerCar.toLocaleString()}`}
          subtitle="Full distance fuel + FASTag toll total"
          icon={<Fuel className="w-4 h-4 text-violet-400" />}
          badge="Vehicle Spend"
        />
      </div>

      {/* Daily Timeseries & Top Corridors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineAreaChart
            title="Daily Highway Passenger Movement & Weekend Exodus"
            subtitle="Massive Saturday morning outbound and Sunday evening return spikes"
            data={daily.map((d) => ({
              label: d.date.slice(5),
              value: d.passengers,
              tooltipText: d.isHoliday ? 'Holiday Weekend Rush' : undefined,
            }))}
            color="#f59e0b"
            height={260}
          />
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Vehicle Classification Mix</h3>
            <p className="text-xs text-slate-400 mb-4">
              Private ownership vs intercity app-based cabs vs carpooling
            </p>
            <div className="flex flex-col gap-3">
              {categoryStats.map((c) => (
                <div key={c.category} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span>{c.category}</span>
                    <span className="text-amber-400 font-mono">{c.share}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>Occupancy: {c.avgOccupancy} pax/car</span>
                    <span>{c.vehicles.toLocaleString()} trips</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Highest car adoption observed on Mumbai ↔ Pune Expressway and Delhi ↔ Jaipur NH48.
          </div>
        </div>
      </div>

      {/* Top Highway Corridors Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Top Intercity Highway Corridors (Ranked by Road Passenger Volume)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topCarCorridors.slice(0, 4).map((c) => (
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
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>{c.vehicles.toLocaleString()} cars</span>
                <span className="text-amber-400">₹{(c.exp / 10000000).toFixed(2)} Cr Exp</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
