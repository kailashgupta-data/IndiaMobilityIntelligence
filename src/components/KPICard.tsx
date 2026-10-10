import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number; // e.g. +12.4
  changeLabel?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  sparklineData?: number[];
  badge?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs prev period',
  icon,
  accentColor = 'cyan',
  sparklineData = [],
  badge,
  onClick,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  // Mini sparkline renderer
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const w = 72;
    const h = 24;

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * w;
        const y = h - ((val - min) / range) * (h - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg className="w-18 h-6 overflow-visible opacity-70" viewBox={`0 0 ${w} ${h}`}>
        <polyline
          fill="none"
          stroke={isPositive ? '#10b981' : isNegative ? '#f43f5e' : '#94a3b8'}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-slate-900/90 border border-slate-800 rounded-xl p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 shadow-sm ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className="text-[10px] font-medium text-slate-400 border border-slate-700/80 px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
          {icon && <div className="text-slate-400 p-1 bg-slate-800/80 rounded-lg">{icon}</div>}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">{value}</div>
        {renderSparkline()}
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
        {change !== undefined ? (
          <div className="flex items-center gap-1">
            {isPositive && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
            {isNeutral && <Minus className="w-3.5 h-3.5 text-slate-400" />}
            <span
              className={`font-semibold font-mono ${
                isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {change}%
            </span>
            <span className="text-slate-500 text-[11px] ml-1">{changeLabel}</span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px]">{subtitle || 'Aggregate Metric'}</span>
        )}
      </div>
    </div>
  );
};
