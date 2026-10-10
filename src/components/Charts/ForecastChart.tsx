import React, { useState } from 'react';
import { ForecastPoint } from '../../types';

interface ForecastChartProps {
  data: ForecastPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  title = 'Statistical Passenger Demand Forecast',
  subtitle = 'Baseline Holt-Winters projection with 80% & 95% confidence prediction bands',
  height = 260,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const padding = { top: 24, right: 30, bottom: 36, left: 60 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.upper95)) * 1.08;
  const minVal = Math.max(0, Math.min(...data.map((d) => d.lower95)) * 0.92);
  const range = maxVal - minVal || 1;

  const getCoord = (idx: number, val: number) => {
    const x = padding.left + (idx / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y };
  };

  // Build polygon path for 95% interval
  const upper95Coords = data.map((d, i) => getCoord(i, d.upper95));
  const lower95Coords = data.map((d, i) => getCoord(i, d.lower95)).reverse();
  const band95Path = `M ${upper95Coords.map((c) => `${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' L ')} L ${lower95Coords.map((c) => `${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' L ')} Z`;

  // Build polygon path for 80% interval
  const upper80Coords = data.map((d, i) => getCoord(i, d.upper80));
  const lower80Coords = data.map((d, i) => getCoord(i, d.lower80)).reverse();
  const band80Path = `M ${upper80Coords.map((c) => `${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' L ')} L ${lower80Coords.map((c) => `${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' L ')} Z`;

  // Forecast center line
  const predictedCoords = data.map((d, i) => getCoord(i, d.predicted));
  const predictedPath = `M ${predictedCoords.map((c) => `${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' L ')}`;

  // Actuals line (only for points that have actual)
  const actualPoints = data.map((d, i) => ({ ...d, index: i })).filter((d) => d.actual !== undefined);
  const actualCoords = actualPoints.map((p) => getCoord(p.index, p.actual!));
  const actualPath = actualCoords.length > 0 ? `M ${actualCoords.map((c) => `${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' L ')}` : '';

  // Forecast start point indicator
  const firstFutureIndex = data.findIndex((d) => d.actual === undefined);
  const splitCoord = firstFutureIndex > 0 ? getCoord(firstFutureIndex, data[firstFutureIndex].predicted) : null;

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;
  const activeCoord = hoverIndex !== null ? predictedCoords[hoverIndex] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400" />
            <span>Predicted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-amber-500/20 border border-amber-500/40 rounded-xs" />
            <span>80% Bound</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-amber-500/10 border border-amber-500/20 rounded-xs" />
            <span>95% Bound</span>
          </div>
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Y-axis grid ticks */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = padding.top + chartHeight - pct * chartHeight;
            const val = minVal + pct * range;
            const formatted = val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {formatted}
                </text>
              </g>
            );
          })}

          {/* 95% Confidence Shaded Area */}
          <path d={band95Path} fill="#f59e0b" fillOpacity="0.08" stroke="#f59e0b" strokeOpacity="0.25" strokeWidth="0.75" />

          {/* 80% Confidence Shaded Area */}
          <path d={band80Path} fill="#f59e0b" fillOpacity="0.16" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="0.75" />

          {/* Historical Actuals Line */}
          {actualPath && (
            <path d={actualPath} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* Future Forecast Line */}
          <path
            d={predictedPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.25"
            strokeDasharray="5 3"
            strokeLinecap="round"
          />

          {/* Forecast Split Line */}
          {splitCoord && (
            <g>
              <line
                x1={splitCoord.x}
                y1={padding.top}
                x2={splitCoord.x}
                y2={padding.top + chartHeight}
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <text
                x={splitCoord.x + 6}
                y={padding.top + 14}
                className="text-[10px] fill-slate-400 font-mono uppercase"
              >
                Forecast Horizon →
              </text>
            </g>
          )}

          {/* X ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const index = Math.floor(pct * (data.length - 1));
            const pt = data[index];
            const coord = predictedCoords[index];
            if (!pt || !coord) return null;
            return (
              <text
                key={idx}
                x={coord.x}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {pt.date.slice(5)}
              </text>
            );
          })}

          {/* Mouse hover crosshair & dots */}
          {activeCoord && activePoint && (
            <g>
              <line
                x1={activeCoord.x}
                y1={padding.top}
                x2={activeCoord.x}
                y2={padding.top + chartHeight}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle cx={activeCoord.x} cy={activeCoord.y} r="4" fill="#f59e0b" stroke="#0f172a" strokeWidth="2" />
            </g>
          )}

          {/* Hit areas */}
          {data.map((_, idx) => {
            const c = predictedCoords[idx];
            return (
              <rect
                key={idx}
                x={c.x - chartWidth / (data.length * 2)}
                y={padding.top}
                width={chartWidth / data.length}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && activeCoord && (
          <div
            className="absolute pointer-events-none z-20 bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap"
            style={{
              left: `${(activeCoord.x / width) * 100}%`,
              top: `${Math.max(10, (activeCoord.y / height) * 100)}%`,
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-3">
              <span>{activePoint.date}</span>
              <span className="text-[10px] text-amber-400">
                {activePoint.actual !== undefined ? 'Historical Actual' : 'Statistical Projection'}
              </span>
            </div>
            {activePoint.actual !== undefined && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-slate-400">Actual Passengers:</span>
                <span className="font-bold text-white font-mono">{activePoint.actual.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">Predicted Demand:</span>
              <span className="font-bold text-amber-300 font-mono">{activePoint.predicted.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 border-t border-slate-800 pt-1 font-mono">
              80% Interval: [{activePoint.lower80.toLocaleString()} – {activePoint.upper80.toLocaleString()}]
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              95% Interval: [{activePoint.lower95.toLocaleString()} – {activePoint.upper95.toLocaleString()}]
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
