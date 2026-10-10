import React, { useState } from 'react';
import { ArrowRight, ArrowLeftRight, TrendingUp } from 'lucide-react';

interface CorridorFlow {
  corridor: string;
  cityA: string;
  cityB: string;
  aToBPassengers: number;
  bToAPassengers: number;
  aToBRevenue: number;
  bToARevenue: number;
  imbalancePct: number;
}

interface FlowVisualizerProps {
  flows: CorridorFlow[];
  title?: string;
  subtitle?: string;
  onSelectCorridor?: (cityA: string, cityB: string) => void;
}

export const FlowVisualizer: React.FC<FlowVisualizerProps> = ({
  flows,
  title = 'Metropolitan Corridor Directional Flows',
  subtitle = 'Outbound vs Inbound volume balance across primary Indian intercity pairs',
  onSelectCorridor,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!flows || flows.length === 0) return null;

  const current = flows[selectedIdx] || flows[0];
  const maxPaxInFlow = Math.max(current.aToBPassengers, current.bToAPassengers, 1);
  const aToBPct = (current.aToBPassengers / maxPaxInFlow) * 100;
  const bToAPct = (current.bToAPassengers / maxPaxInFlow) * 100;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bi-directional Balance Analysis</span>
        </div>
      </div>

      {/* Corridor pill selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
        {flows.map((f, idx) => (
          <button
            key={f.corridor}
            onClick={() => {
              setSelectedIdx(idx);
              onSelectCorridor?.(f.cityA, f.cityB);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedIdx === idx
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {f.corridor}
          </button>
        ))}
      </div>

      {/* Visual Directional Flow Comparison Canvas */}
      <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col gap-4">
        {/* Outbound Leg: A -> B */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span>{current.cityA}</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>{current.cityB}</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">(Outbound Flow)</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-white font-bold">{current.aToBPassengers.toLocaleString()} pax</span>
              <span className="text-emerald-400 text-[11px]">
                ₹{(current.aToBRevenue / 10000000).toFixed(2)} Cr
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${aToBPct}%` }}
            />
          </div>
        </div>

        {/* Inbound Leg: B -> A */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span>{current.cityB}</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span>{current.cityA}</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">(Return Inbound)</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-white font-bold">{current.bToAPassengers.toLocaleString()} pax</span>
              <span className="text-emerald-400 text-[11px]">
                ₹{(current.bToARevenue / 10000000).toFixed(2)} Cr
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${bToAPct}%` }}
            />
          </div>
        </div>

        {/* Directional Summary Badge */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Directional Asymmetry:</span>
            <span
              className={`font-semibold font-mono ${
                current.imbalancePct > 15 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {current.imbalancePct}% net imbalance
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {current.imbalancePct > 15
              ? 'Significant directional skew: Fleet turnaround schedules should accommodate return rush.'
              : 'Well-balanced passenger flow across bidirectional schedule.'}
          </div>
        </div>
      </div>
    </div>
  );
};
