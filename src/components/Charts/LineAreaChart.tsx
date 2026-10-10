import React, { useState } from 'react';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  tooltipText?: string;
}

interface LineAreaChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  color?: string;
  secondaryColor?: string;
  seriesName?: string;
  secondarySeriesName?: string;
  height?: number;
  showArea?: boolean;
}

export const LineAreaChart: React.FC<LineAreaChartProps> = ({
  data,
  title,
  subtitle,
  valuePrefix = '',
  valueSuffix = '',
  color = '#0ea5e9', // Sky
  secondaryColor = '#f59e0b', // Amber
  seriesName = 'Primary',
  secondarySeriesName,
  height = 240,
  showArea = true,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-slate-500 text-sm">
        No timeseries data available for selected filter range
      </div>
    );
  }

  // Sample data points if very large (> 90 points) to maintain SVG performance
  const step = Math.max(1, Math.floor(data.length / 80));
  const sampledData = data.filter((_, idx) => idx % step === 0 || idx === data.length - 1);

  const values = sampledData.map((d) => d.value);
  const secondaryValues = secondarySeriesName
    ? sampledData.map((d) => d.secondaryValue || 0)
    : [];

  const allVals = [...values, ...secondaryValues];
  const minVal = Math.min(0, Math.min(...allVals));
  const maxVal = Math.max(...allVals) * 1.08 || 1;
  const range = maxVal - minVal || 1;

  const padding = { top: 20, right: 24, bottom: 32, left: 54 };
  const width = 800; // SVG coordinate system
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getCoordinates = (vals: number[]) => {
    return vals.map((v, i) => {
      const x = padding.left + (i / (vals.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((v - minVal) / range) * chartHeight;
      return { x, y };
    });
  };

  const coords = getCoordinates(values);
  const secondaryCoords = secondarySeriesName ? getCoordinates(secondaryValues) : [];

  const pointsPath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${pointsPath} L ${coords[coords.length - 1]?.x.toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} L ${coords[0]?.x.toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} Z`;

  const secondaryPointsPath = secondaryCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');

  // Y-axis grid ticks (4 ticks)
  const yTicks = [0, 0.33, 0.66, 1].map((pct) => {
    const val = minVal + pct * range;
    const y = padding.top + chartHeight - pct * chartHeight;
    let formattedVal = '';
    if (val >= 10000000) formattedVal = `${(val / 10000000).toFixed(1)} Cr`;
    else if (val >= 100000) formattedVal = `${(val / 100000).toFixed(1)} L`;
    else if (val >= 1000) formattedVal = `${(val / 1000).toFixed(0)}k`;
    else formattedVal = Math.round(val).toString();
    return { val: formattedVal, y };
  });

  // X-axis label samples (up to 6 ticks)
  const xTickIndices = [0, 0.2, 0.4, 0.6, 0.8, 1].map((pct) => Math.floor(pct * (sampledData.length - 1)));

  const activePoint = hoverIndex !== null && sampledData[hoverIndex] ? sampledData[hoverIndex] : null;
  const activeCoord = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
      {(title || subtitle) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span>{seriesName}</span>
            </div>
            {secondarySeriesName && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <span>{secondarySeriesName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-ticks */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#334155"
                strokeWidth="0.75"
                strokeDasharray="4 4"
                opacity="0.4"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {valuePrefix}{tick.val}
              </text>
            </g>
          ))}

          {/* X-axis ticks */}
          {xTickIndices.map((idx) => {
            const pt = sampledData[idx];
            const coord = coords[idx];
            if (!pt || !coord) return null;
            return (
              <text
                key={idx}
                x={coord.x}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {pt.label}
              </text>
            );
          })}

          {/* Area fill */}
          {showArea && <path d={areaPath} fill={`url(#gradient-${color.replace('#', '')})`} />}

          {/* Primary Line */}
          <path
            d={pointsPath}
            fill="none"
            stroke={color}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secondary Line (if present) */}
          {secondarySeriesName && (
            <path
              d={secondaryPointsPath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover interactive vertical line and points */}
          {activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={padding.top}
                x2={activeCoord.x}
                y2={padding.top + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle cx={activeCoord.x} cy={activeCoord.y} r="4.5" fill={color} stroke="#0f172a" strokeWidth="2" />
              {secondaryCoords[hoverIndex!] && (
                <circle
                  cx={secondaryCoords[hoverIndex!].x}
                  cy={secondaryCoords[hoverIndex!].y}
                  r="4.5"
                  fill={secondaryColor}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Transparent hit boxes for mouse movement */}
          {coords.map((c, idx) => (
            <rect
              key={idx}
              x={c.x - chartWidth / (coords.length * 2)}
              y={padding.top}
              width={chartWidth / coords.length}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(idx)}
            />
          ))}
        </svg>

        {/* Hover Tooltip Box */}
        {activePoint && activeCoord && (
          <div
            className="absolute pointer-events-none z-20 bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap"
            style={{
              left: `${(activeCoord.x / width) * 100}%`,
              top: `${Math.max(10, (activeCoord.y / height) * 100)}%`,
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-3">
              <span>{activePoint.label}</span>
              {activePoint.tooltipText && <span className="text-[10px] text-amber-400">{activePoint.tooltipText}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-400">{seriesName}:</span>
              <span className="font-bold text-white font-mono">
                {valuePrefix}{activePoint.value.toLocaleString()}{valueSuffix}
              </span>
            </div>
            {secondarySeriesName && activePoint.secondaryValue !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <span className="text-slate-400">{secondarySeriesName}:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {valuePrefix}{activePoint.secondaryValue.toLocaleString()}{valueSuffix}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
