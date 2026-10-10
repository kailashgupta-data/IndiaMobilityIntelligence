import React, { useState } from 'react';
import { MobilityRecord, TransportMode } from '../../types';
import { CORRIDORS, MODE_COLORS } from '../../data/constants';
import { computeDailyTimeseries, computeModeBreakdown } from '../../data/analytics';
import { LineAreaChart } from '../Charts/LineAreaChart';
import { BarChart } from '../Charts/BarChart';
import { ChevronRight, ArrowRight, Compass, Calendar, ArrowLeftRight, FileText } from 'lucide-react';

interface RouteIntelligenceProps {
  records: MobilityRecord[];
  initialCityA?: string;
  initialCityB?: string;
  onSelectDate?: (date: string) => void;
}

export const RouteIntelligence: React.FC<RouteIntelligenceProps> = ({
  records,
  initialCityA = 'Bengaluru',
  initialCityB = 'Chennai',
  onSelectDate,
}) => {
  // Drill-down levels: 'national' | 'corridor' | 'direction' | 'mode' | 'date'
  const [drillLevel, setDrillLevel] = useState<'national' | 'corridor' | 'direction' | 'mode' | 'date'>('corridor');

  const [selectedCorridor, setSelectedCorridor] = useState<{ cityA: string; cityB: string }>({
    cityA: initialCityA,
    cityB: initialCityB,
  });

  const [selectedDirection, setSelectedDirection] = useState<'Outbound' | 'Inbound'>('Outbound');
  const [selectedMode, setSelectedMode] = useState<TransportMode>('Train');
  const [selectedDate, setSelectedDate] = useState<string>('2025-11-01');

  // Filter records based on current hierarchy
  const corridorRecords = records.filter(
    (r) =>
      (r.origin === selectedCorridor.cityA && r.destination === selectedCorridor.cityB) ||
      (r.origin === selectedCorridor.cityB && r.destination === selectedCorridor.cityA)
  );

  const directionOrigin = selectedDirection === 'Outbound' ? selectedCorridor.cityA : selectedCorridor.cityB;
  const directionDest = selectedDirection === 'Outbound' ? selectedCorridor.cityB : selectedCorridor.cityA;

  const directionRecords = corridorRecords.filter(
    (r) => r.origin === directionOrigin && r.destination === directionDest
  );

  const modeRecords = directionRecords.filter((r) => r.mode === selectedMode);
  const dateRecords = modeRecords.filter((r) => r.date === selectedDate);

  // Aggregations
  const corridorDaily = computeDailyTimeseries(corridorRecords);
  const corridorModes = computeModeBreakdown(corridorRecords);
  const modeDaily = computeDailyTimeseries(modeRecords);

  const totalCorridorPax = corridorRecords.reduce((s, r) => s + r.passengers, 0);
  const totalCorridorRev = corridorRecords.reduce((s, r) => s + r.ticketRevenue, 0);
  const totalDirectionPax = directionRecords.reduce((s, r) => s + r.passengers, 0);
  const totalModePax = modeRecords.reduce((s, r) => s + r.passengers, 0);

  const corridorMeta = CORRIDORS.find(
    (c) =>
      (c.origin === selectedCorridor.cityA && c.destination === selectedCorridor.cityB) ||
      (c.origin === selectedCorridor.cityB && c.destination === selectedCorridor.cityA)
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Hierarchical Route Intelligence & Drill-Down
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Step-by-step granular exploration: India → City Pair → Direction → Transport Mode → Date → Underlying Record.
        </p>
      </div>

      {/* Interactive Breadcrumb Hierarchy Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
        {/* Step 1: India */}
        <button
          onClick={() => setDrillLevel('national')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            drillLevel === 'national'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>1. India Network</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

        {/* Step 2: Corridor */}
        <button
          onClick={() => setDrillLevel('corridor')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            drillLevel === 'corridor'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>2. {selectedCorridor.cityA} ↔ {selectedCorridor.cityB}</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

        {/* Step 3: Direction */}
        <button
          onClick={() => setDrillLevel('direction')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            drillLevel === 'direction'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>3. {directionOrigin} → {directionDest}</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

        {/* Step 4: Mode */}
        <button
          onClick={() => setDrillLevel('mode')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            drillLevel === 'mode'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MODE_COLORS[selectedMode].primary }} />
          <span>4. {selectedMode}</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

        {/* Step 5: Date */}
        <button
          onClick={() => setDrillLevel('date')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            drillLevel === 'date'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>5. {selectedDate}</span>
        </button>
      </div>

      {/* Corridor Quick Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 shrink-0 font-medium">Switch Corridor:</span>
        {CORRIDORS.map((c) => {
          const isSelected =
            (c.origin === selectedCorridor.cityA && c.destination === selectedCorridor.cityB) ||
            (c.origin === selectedCorridor.cityB && c.destination === selectedCorridor.cityA);

          return (
            <button
              key={`${c.origin}-${c.destination}`}
              onClick={() => {
                setSelectedCorridor({ cityA: c.origin, cityB: c.destination });
                setDrillLevel('corridor');
              }}
              className={`px-3 py-1.5 rounded-lg font-mono whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-800'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c.origin} ↔ {c.destination}
            </button>
          );
        })}
      </div>

      {/* DRILL LEVEL 1: NATIONAL OVERVIEW */}
      {drillLevel === 'national' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-1">National Corridor Hierarchy</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select any corridor below to drill down into directional flows and modal distributions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CORRIDORS.map((c) => {
                const recs = records.filter(
                  (r) =>
                    (r.origin === c.origin && r.destination === c.destination) ||
                    (r.origin === c.destination && r.destination === c.origin)
                );
                const pax = recs.reduce((s, r) => s + r.passengers, 0);
                const rev = recs.reduce((s, r) => s + r.ticketRevenue, 0);

                return (
                  <div
                    key={`${c.origin}-${c.destination}`}
                    onClick={() => {
                      setSelectedCorridor({ cityA: c.origin, cityB: c.destination });
                      setDrillLevel('corridor');
                    }}
                    className="p-3 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/80 rounded-xl cursor-pointer transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between font-semibold text-white text-xs">
                      <span>{c.origin} ↔ {c.destination}</span>
                      <ChevronRight className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-lg font-bold text-white font-mono">{pax.toLocaleString()} pax</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Road: {c.roadDistanceKm} km</span>
                      <span className="text-emerald-400">₹{(rev / 10000000).toFixed(2)} Cr</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DRILL LEVEL 2: CORRIDOR OVERVIEW */}
      {drillLevel === 'corridor' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Corridor Pax</span>
              <span className="text-2xl font-bold text-white font-mono mt-1">{totalCorridorPax.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400 mt-1">Both outbound and inbound</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-xs text-slate-400 uppercase font-semibold">Corridor Ticket Revenue</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                ₹{(totalCorridorRev / 10000000).toFixed(2)} Cr
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Commercial operator share</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col">
              <span className="text-xs text-slate-400 uppercase font-semibold">Distance Profile</span>
              <span className="text-2xl font-bold text-white font-mono mt-1">{corridorMeta?.roadDistanceKm} km</span>
              <span className="text-[11px] text-slate-400 mt-1">
                Rail: {corridorMeta?.railDistanceKm} km · Air: {corridorMeta?.airDistanceKm} km
              </span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Choose Direction</span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setSelectedDirection('Outbound');
                      setDrillLevel('direction');
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-white rounded text-xs font-semibold transition-colors truncate"
                  >
                    {selectedCorridor.cityA} → {selectedCorridor.cityB}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDirection('Inbound');
                      setDrillLevel('direction');
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-white rounded text-xs font-semibold transition-colors truncate"
                  >
                    {selectedCorridor.cityB} → {selectedCorridor.cityA}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineAreaChart
              title={`${selectedCorridor.cityA} ↔ ${selectedCorridor.cityB} Demand Timeseries`}
              data={corridorDaily.map((d) => ({ label: d.date.slice(5), value: d.passengers }))}
              height={240}
            />

            <BarChart
              title="Modal Split on Corridor"
              data={corridorModes.map((m) => ({
                label: m.mode,
                value: m.passengers,
                color: MODE_COLORS[m.mode].primary,
              }))}
              height={240}
              onBarClick={(item) => {
                setSelectedMode(item.label as TransportMode);
                setDrillLevel('mode');
              }}
            />
          </div>
        </div>
      )}

      {/* DRILL LEVEL 3: DIRECTION DRILL-DOWN */}
      {drillLevel === 'direction' && (
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono">Drill Level 3: Directional Corridor</span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <span>{directionOrigin}</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span>{directionDest}</span>
              </h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-slate-400">
                Total Passengers: <strong className="text-white">{totalDirectionPax.toLocaleString()}</strong>
              </span>
              <button
                onClick={() => {
                  setSelectedDirection(selectedDirection === 'Outbound' ? 'Inbound' : 'Outbound');
                }}
                className="px-2.5 py-1 text-xs bg-slate-800 text-cyan-400 rounded-lg hover:bg-slate-700"
              >
                Invert Direction ⇄
              </button>
            </div>
          </div>

          {/* Mode selector for this direction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['Bus', 'Car', 'Train', 'Airplane'] as TransportMode[]).map((mode) => {
              const recs = directionRecords.filter((r) => r.mode === mode);
              const pax = recs.reduce((s, r) => s + r.passengers, 0);
              const rev = recs.reduce((s, r) => s + r.ticketRevenue, 0);
              const isSelected = selectedMode === mode;

              return (
                <div
                  key={mode}
                  onClick={() => {
                    setSelectedMode(mode);
                    setDrillLevel('mode');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ color: MODE_COLORS[mode].primary }}>
                      {mode}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">Select Mode →</span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono">{pax.toLocaleString()} pax</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {mode === 'Car' ? 'Private Road Exp.' : `₹${(rev / 10000000).toFixed(2)} Cr`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DRILL LEVEL 4: MODE DRILL-DOWN */}
      {drillLevel === 'mode' && (
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono">
                Drill Level 4: {directionOrigin} → {directionDest} · {selectedMode}
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {selectedMode} Travel Dynamics & Daily Dates
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Total Mode Volume: <strong className="text-white">{totalModePax.toLocaleString()} pax</strong>
            </div>
          </div>

          <LineAreaChart
            title={`Daily ${selectedMode} Volume on ${directionOrigin} → ${directionDest}`}
            subtitle="Click or hover any date to inspect individual daily manifest"
            data={modeDaily.map((d) => ({ label: d.date, value: d.passengers }))}
            color={MODE_COLORS[selectedMode].primary}
            height={260}
          />

          {/* Quick Date Table for this mode */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-slate-200">Recent Days (Click row to drill into Date Level)</span>
              <span className="text-slate-400 font-mono">Showing recent 10 days</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono text-[11px]">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Passengers</th>
                    <th className="pb-2">Trips</th>
                    <th className="pb-2">Avg Fare / Exp</th>
                    <th className="pb-2">Revenue / Exp</th>
                    <th className="pb-2">Holiday</th>
                    <th className="pb-2 text-right">Drill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {modeRecords.slice(-10).map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setSelectedDate(r.date);
                        setDrillLevel('date');
                      }}
                      className="hover:bg-slate-800/60 cursor-pointer"
                    >
                      <td className="py-2 text-white font-semibold">{r.date}</td>
                      <td className="py-2 text-white">{r.passengers.toLocaleString()}</td>
                      <td className="py-2 text-slate-300">{r.trips.toLocaleString()}</td>
                      <td className="py-2 text-slate-300">₹{r.avgFareOrExp.toLocaleString()}</td>
                      <td className="py-2 text-emerald-400 font-semibold">
                        ₹{(r.totalValue / 100000).toFixed(2)} Lakh
                      </td>
                      <td className="py-2">
                        {r.isHoliday ? (
                          <span className="text-amber-400">★ {r.holidayName}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-cyan-400 hover:underline">Inspect →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DRILL LEVEL 5: DATE & RECORD DETAIL */}
      {drillLevel === 'date' && (
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono">
                Drill Level 5: Granular Manifest Record
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {selectedDate} · {directionOrigin} → {directionDest} · {selectedMode}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-2.5 py-1 font-mono"
              />
            </div>
          </div>

          {dateRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dateRecords.map((r) => (
                <div key={r.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-slate-300">{r.subCategory}</span>
                    <span className="text-[11px] font-mono text-cyan-400">{r.routeId}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Passengers</span>
                      <strong className="text-white text-base">{r.passengers.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Scheduled Trips</span>
                      <strong className="text-white text-base">{r.trips.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Seat Capacity / Fleet</span>
                      <strong className="text-white">{r.capacity.toLocaleString()} seats</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Load Factor / Occupancy</span>
                      <strong className="text-emerald-400">{(r.occupancyRate * 100).toFixed(1)}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ticket Fare / Pax Spend</span>
                      <strong className="text-white">₹{r.avgFareOrExp.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Financial Volume</span>
                      <strong className="text-emerald-400">
                        {r.mode === 'Car'
                          ? `₹${(r.carExpenditure / 100000).toFixed(2)} L (Exp)`
                          : `₹${(r.ticketRevenue / 100000).toFixed(2)} L (Rev)`}
                      </strong>
                    </div>
                  </div>

                  {r.isHoliday && (
                    <div className="p-2 bg-amber-950/40 border border-amber-900/60 rounded text-xs text-amber-300">
                      ★ Active Holiday Window: {r.holidayName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl text-xs">
              No matching records for date {selectedDate} with current selection. Try selecting another date above.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
