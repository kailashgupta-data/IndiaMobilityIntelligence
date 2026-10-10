import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
  percentage?: number;
}

interface DonutChartProps {
  data: DonutSegment[];
  title?: string;
  subtitle?: string;
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  onSegmentClick?: (segment: DonutSegment) => void;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  subtitle,
  centerLabel = 'Total',
  centerValue,
  size = 220,
  onSegmentClick,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2;
  const strokeWidth = 32;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;

  // Calculate arc offsets
  let accumulatedAngle = 0;
  const segmentsWithArcs = data.map((d) => {
    const pct = d.value / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += pct;
    return {
      ...d,
      pct: (pct * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = hoveredIdx !== null ? segmentsWithArcs[hoveredIdx] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />

            {/* Arcs */}
            {segmentsWithArcs.map((seg, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={idx}
                  cx={radius}
                  cy={radius}
                  r={innerRadius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  style={{ opacity: hoveredIdx === null || isHovered ? 1 : 0.6 }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSegmentClick?.(seg)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
              {activeSegment ? activeSegment.label : centerLabel}
            </span>
            <span className="text-lg font-bold text-white font-mono mt-0.5">
              {activeSegment
                ? `${activeSegment.pct}%`
                : centerValue || total.toLocaleString()}
            </span>
            {activeSegment && activeSegment.formattedValue && (
              <span className="text-[10px] text-slate-400 font-mono">
                {activeSegment.formattedValue}
              </span>
            )}
          </div>
        </div>

        {/* Legend list */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {segmentsWithArcs.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                  isHovered ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSegmentClick?.(seg)}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="font-medium text-slate-300 truncate">{seg.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-slate-400 text-[11px]">{seg.formattedValue || seg.value.toLocaleString()}</span>
                  <span className="font-semibold text-white w-10 text-right">{seg.pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
