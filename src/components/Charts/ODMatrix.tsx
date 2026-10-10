import React, { useState } from 'react';

interface ODMatrixProps {
  cities: string[];
  matrix: Record<string, Record<string, { passengers: number; revenue: number; trips: number }>>;
  metric?: 'passengers' | 'revenue';
  title?: string;
  onCellClick?: (origin: string, destination: string) => void;
}

export const ODMatrix: React.FC<ODMatrixProps> = ({
  cities,
  matrix,
  metric = 'passengers',
  title = 'Origin-Destination Travel Demand Matrix',
  onCellClick,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ origin: string; destination: string } | null>(null);

  // Find max value for color intensity
  let maxVal = 1;
  cities.forEach((orig) => {
    cities.forEach((dest) => {
      if (orig !== dest && matrix[orig]?.[dest]) {
        const val = metric === 'passengers' ? matrix[orig][dest].passengers : matrix[orig][dest].revenue;
        if (val > maxVal) maxVal = val;
      }
    });
  });

  const getColor = (val: number) => {
    if (val === 0) return 'bg-slate-900/60 text-slate-600';
    const intensity = Math.min(1, val / maxVal);
    if (intensity > 0.75) return 'bg-cyan-600/90 text-white font-bold';
    if (intensity > 0.5) return 'bg-cyan-700/80 text-cyan-50 font-medium';
    if (intensity > 0.25) return 'bg-cyan-800/60 text-cyan-200';
    if (intensity > 0.1) return 'bg-cyan-950 text-cyan-300';
    return 'bg-slate-800/80 text-slate-300';
  };

  const formatVal = (val: number) => {
    if (val === 0) return '—';
    if (metric === 'revenue') {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
      return `₹${Math.round(val)}`;
    }
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Intercity traffic flow (Origin in rows, Destination in columns). Click cell to filter route.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Low</span>
          <span className="w-3 h-3 rounded-sm bg-slate-800" />
          <span className="w-3 h-3 rounded-sm bg-cyan-900" />
          <span className="w-3 h-3 rounded-sm bg-cyan-700" />
          <span className="w-3 h-3 rounded-sm bg-cyan-500" />
          <span>High Volume</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr>
              <th className="p-2 bg-slate-950/60 border border-slate-800 text-slate-400 font-semibold w-24">
                Origin ↓ / Dest →
              </th>
              {cities.map((city) => (
                <th
                  key={city}
                  className="p-2 text-center bg-slate-950/40 border border-slate-800 text-slate-300 font-semibold truncate max-w-[80px]"
                >
                  {city}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cities.map((orig) => (
              <tr key={orig}>
                <td className="p-2 bg-slate-950/40 border border-slate-800 text-slate-300 font-medium truncate max-w-[90px]">
                  {orig}
                </td>
                {cities.map((dest) => {
                  const isDiag = orig === dest;
                  const cell = matrix[orig]?.[dest] || { passengers: 0, revenue: 0, trips: 0 };
                  const val = metric === 'passengers' ? cell.passengers : cell.revenue;
                  const isHovered = hoveredCell?.origin === orig && hoveredCell?.destination === dest;

                  if (isDiag) {
                    return (
                      <td
                        key={dest}
                        className="p-2 text-center border border-slate-800/80 bg-slate-950/80 text-slate-700 select-none font-mono text-[11px]"
                      >
                        N/A
                      </td>
                    );
                  }

                  return (
                    <td
                      key={dest}
                      onMouseEnter={() => setHoveredCell({ origin: orig, destination: dest })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => val > 0 && onCellClick?.(orig, dest)}
                      className={`p-2 text-center border border-slate-800 transition-all cursor-pointer font-mono text-[11px] ${getColor(
                        val
                      )} ${isHovered ? 'ring-2 ring-cyan-400 z-10 scale-105' : ''}`}
                      title={`${orig} → ${dest}: ${cell.passengers.toLocaleString()} passengers, ₹${(
                        cell.revenue / 10000000
                      ).toFixed(2)} Cr`}
                    >
                      {formatVal(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredCell && matrix[hoveredCell.origin]?.[hoveredCell.destination] && (
        <div className="mt-2.5 p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
          <span className="text-slate-300 font-medium">
            Corridor: <span className="text-cyan-400">{hoveredCell.origin} → {hoveredCell.destination}</span>
          </span>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>
              Passengers:{' '}
              <strong className="text-white">
                {matrix[hoveredCell.origin][hoveredCell.destination].passengers.toLocaleString()}
              </strong>
            </span>
            <span>
              Revenue:{' '}
              <strong className="text-emerald-400">
                ₹{(matrix[hoveredCell.origin][hoveredCell.destination].revenue / 10000000).toFixed(2)} Cr
              </strong>
            </span>
            <span>
              Trips:{' '}
              <strong className="text-amber-400">
                {matrix[hoveredCell.origin][hoveredCell.destination].trips.toLocaleString()}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
