import React from 'react';
import { FilterState, TransportMode } from '../types';
import { CITIES } from '../data/constants';
import { RotateCcw, Filter, Calendar } from 'lucide-react';

interface GlobalFilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  filteredCount: number;
  totalCount: number;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onFilterChange,
  filteredCount,
  totalCount,
}) => {
  const modes: ('all' | TransportMode)[] = ['all', 'Bus', 'Car', 'Train', 'Airplane'];
  const dayTypes: { id: FilterState['dayType']; label: string }[] = [
    { id: 'all', label: 'All Days' },
    { id: 'weekday', label: 'Weekday' },
    { id: 'weekend', label: 'Weekend' },
    { id: 'holiday', label: 'Holiday' },
  ];

  const presets = [
    { label: 'Full 1 Year', start: '2025-10-15', end: '2026-10-14' },
    { label: 'Last 30 Days', start: '2026-09-15', end: '2026-10-14' },
    { label: 'Diwali Window', start: '2025-10-28', end: '2025-11-08' },
    { label: 'Pongal Surge', start: '2026-01-12', end: '2026-01-20' },
    { label: 'Summer Peak', start: '2026-05-10', end: '2026-05-30' },
  ];

  const handleReset = () => {
    onFilterChange({
      dateStart: '2025-10-15',
      dateEnd: '2026-10-14',
      origin: 'all',
      destination: 'all',
      mode: 'all',
      dayType: 'all',
      route: 'all',
      subCategory: 'all',
    });
  };

  const isFiltered =
    filters.origin !== 'all' ||
    filters.destination !== 'all' ||
    filters.mode !== 'all' ||
    filters.dayType !== 'all' ||
    filters.route !== 'all' ||
    filters.dateStart !== '2025-10-15' ||
    filters.dateEnd !== '2026-10-14';

  return (
    <div className="bg-slate-900/95 border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Presets */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {presets.map((p) => {
            const isActive = filters.dateStart === p.start && filters.dateEnd === p.end;
            return (
              <button
                key={p.label}
                onClick={() => onFilterChange({ ...filters, dateStart: p.start, dateEnd: p.end })}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
          <input
            type="date"
            value={filters.dateStart}
            onChange={(e) => onFilterChange({ ...filters, dateStart: e.target.value })}
            className="bg-transparent text-slate-200 focus:outline-none focus:text-cyan-400"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => onFilterChange({ ...filters, dateEnd: e.target.value })}
            className="bg-transparent text-slate-200 focus:outline-none focus:text-cyan-400"
          />
        </div>

        {/* Origin Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <span className="text-slate-400">Origin:</span>
          <select
            value={filters.origin}
            onChange={(e) => onFilterChange({ ...filters, origin: e.target.value })}
            aria-label="Filter by origin city"
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
          >
            <option value="all" className="bg-slate-900">All Cities</option>
            {CITIES.map((c) => (
              <option key={c.name} value={c.name} className="bg-slate-900">
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <span className="text-slate-400">Dest:</span>
          <select
            value={filters.destination}
            onChange={(e) => onFilterChange({ ...filters, destination: e.target.value })}
            aria-label="Filter by destination city"
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
          >
            <option value="all" className="bg-slate-900">All Cities</option>
            {CITIES.map((c) => (
              <option key={c.name} value={c.name} className="bg-slate-900">
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Mode Segmented Controls */}
        <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {modes.map((m) => {
            const isActive = filters.mode === m;
            return (
              <button
                key={m}
                onClick={() => onFilterChange({ ...filters, mode: m })}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'all' ? 'All Modes' : m}
              </button>
            );
          })}
        </div>

        {/* Day Type Selector */}
        <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {dayTypes.map((d) => {
            const isActive = filters.dayType === d.id;
            return (
              <button
                key={d.id}
                onClick={() => onFilterChange({ ...filters, dayType: d.id })}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Record count & Reset */}
      <div className="flex items-center gap-3">
        <div className="text-[11px] font-mono text-slate-400">
          <span className="text-white font-semibold">{filteredCount.toLocaleString()}</span>
          <span className="text-slate-400"> / {totalCount.toLocaleString()} records</span>
        </div>

        {isFiltered && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg hover:bg-rose-900/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
