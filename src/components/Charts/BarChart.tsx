import React, { useState } from 'react';

export interface BarItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  secondaryColor?: string;
  category?: string;
}

interface BarChartProps {
  data: BarItem[];
  title?: string;
  subtitle?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  seriesName?: string;
  secondarySeriesName?: string;
  height?: number;
  stacked?: boolean;
  onBarClick?: (item: BarItem) => void;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  valuePrefix = '',
  valueSuffix = '',
  seriesName = 'Value',
  secondarySeriesName,
  height = 240,
  stacked = false,
  onBarClick,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-slate-500 text-sm">
        No bar chart data available
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 42, left: 54 };
  const width = 800;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...data.map((d) => (stacked ? d.value + (d.secondaryValue || 0) : Math.max(d.value, d.secondaryValue || 0)))
  ) * 1.12 || 1;

  const barCount = data.length;
  const slotWidth = chartWidth / barCount;
  const barWidth = Math.min(36, slotWidth * 0.65);

  const activeItem = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
      {(title || subtitle) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {secondarySeriesName && (
            <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                <span>{seriesName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>{secondarySeriesName}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = padding.top + chartHeight - pct * chartHeight;
            const val = pct * maxVal;
            let formattedVal = '';
            if (val >= 10000000) formattedVal = `${(val / 10000000).toFixed(1)} Cr`;
            else if (val >= 100000) formattedVal = `${(val / 100000).toFixed(1)} L`;
            else if (val >= 1000) formattedVal = `${(val / 1000).toFixed(0)}k`;
            else formattedVal = Math.round(val).toString();

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
                  {valuePrefix}{formattedVal}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const slotX = padding.left + idx * slotWidth;
            const centerX = slotX + slotWidth / 2;
            const isHovered = hoverIdx === idx;

            if (stacked && item.secondaryValue !== undefined) {
              const h1 = (item.value / maxVal) * chartHeight;
              const h2 = (item.secondaryValue / maxVal) * chartHeight;
              const y1 = padding.top + chartHeight - h1;
              const y2 = y1 - h2;

              return (
                <g key={idx} className="cursor-pointer" onClick={() => onBarClick?.(item)}>
                  {/* Primary bottom bar */}
                  <rect
                    x={centerX - barWidth / 2}
                    y={y1}
                    width={barWidth}
                    height={Math.max(2, h1)}
                    fill={item.color || '#0ea5e9'}
                    opacity={isHovered ? 1 : 0.85}
                    rx={2}
                  />
                  {/* Secondary top bar */}
                  <rect
                    x={centerX - barWidth / 2}
                    y={y2}
                    width={barWidth}
                    height={Math.max(2, h2)}
                    fill={item.secondaryColor || '#f59e0b'}
                    opacity={isHovered ? 1 : 0.85}
                    rx={2}
                  />
                  {/* Label */}
                  <text
                    x={centerX}
                    y={height - 12}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {item.label}
                  </text>
                  <rect
                    x={slotX}
                    y={padding.top}
                    width={slotWidth}
                    height={chartHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoverIdx(idx)}
                  />
                </g>
              );
            }

            // Grouped or single bar
            const hasSecondary = secondarySeriesName && item.secondaryValue !== undefined;
            const singleW = hasSecondary ? barWidth / 2 - 1 : barWidth;
            const h1 = (item.value / maxVal) * chartHeight;
            const y1 = padding.top + chartHeight - h1;

            return (
              <g key={idx} className="cursor-pointer" onClick={() => onBarClick?.(item)}>
                <rect
                  x={hasSecondary ? centerX - barWidth / 2 : centerX - barWidth / 2}
                  y={y1}
                  width={singleW}
                  height={Math.max(2, h1)}
                  fill={item.color || '#0ea5e9'}
                  opacity={isHovered ? 1 : 0.85}
                  rx={2}
                />
                {hasSecondary && (
                  <rect
                    x={centerX - barWidth / 2 + singleW + 2}
                    y={padding.top + chartHeight - ((item.secondaryValue || 0) / maxVal) * chartHeight}
                    width={singleW}
                    height={Math.max(2, ((item.secondaryValue || 0) / maxVal) * chartHeight)}
                    fill={item.secondaryColor || '#f59e0b'}
                    opacity={isHovered ? 1 : 0.85}
                    rx={2}
                  />
                )}
                <text
                  x={centerX}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {item.label}
                </text>
                <rect
                  x={slotX}
                  y={padding.top}
                  width={slotWidth}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(idx)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {activeItem && hoverIdx !== null && (
          <div
            className="absolute pointer-events-none z-20 bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap"
            style={{
              left: `${((padding.left + hoverIdx * slotWidth + slotWidth / 2) / width) * 100}%`,
              top: '30%',
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1">
              {activeItem.label}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeItem.color || '#0ea5e9' }} />
              <span className="text-slate-400">{seriesName}:</span>
              <span className="font-bold text-white font-mono">
                {valuePrefix}{activeItem.value.toLocaleString()}{valueSuffix}
              </span>
            </div>
            {activeItem.secondaryValue !== undefined && secondarySeriesName && (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeItem.secondaryColor || '#f59e0b' }} />
                <span className="text-slate-400">{secondarySeriesName}:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {valuePrefix}{activeItem.secondaryValue.toLocaleString()}{valueSuffix}
                </span>
              </div>
            )}
            {onBarClick && <div className="text-[10px] text-cyan-400 mt-1">Click to drill-down</div>}
          </div>
        )}
      </div>
    </div>
  );
};
