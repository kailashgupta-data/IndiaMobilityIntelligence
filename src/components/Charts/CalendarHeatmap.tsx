import React, { useState } from 'react';
import { HOLIDAYS } from '../../data/constants';

interface DayDemand {
  date: string;
  passengers: number;
  isHoliday: boolean;
  holidayName: string | null;
}

interface CalendarHeatmapProps {
  days: DayDemand[];
  title?: string;
  subtitle?: string;
  onDayClick?: (date: string) => void;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  days,
  title = 'Annual Travel Demand Calendar Heatmap',
  subtitle = 'Daily passenger volume intensity across all corridors with festival markers',
  onDayClick,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayDemand | null>(null);

  if (!days || days.length === 0) return null;

  const maxPax = Math.max(...days.map((d) => d.passengers)) || 1;
  const minPax = Math.min(...days.map((d) => d.passengers)) || 0;

  // Group days into weeks (52 columns, 7 rows for Mon-Sun)
  // Day of week mapping: 0=Sun, 1=Mon, ..., 6=Sat
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Organize by week index
  const firstDate = new Date(days[0].date);
  const weeks: (DayDemand | null)[][] = [];
  let currentWeek: (DayDemand | null)[] = new Array(7).fill(null);

  days.forEach((day) => {
    const d = new Date(day.date);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 && currentWeek.some((x) => x !== null)) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(null);
    }
    currentWeek[dayOfWeek] = day;
  });
  if (currentWeek.some((x) => x !== null)) {
    weeks.push(currentWeek);
  }

  const getHeatColor = (day: DayDemand | null) => {
    if (!day) return 'bg-transparent';
    const intensity = (day.passengers - minPax) / (maxPax - minPax || 1);
    if (day.isHoliday) {
      if (intensity > 0.8) return 'bg-amber-500 border border-amber-300';
      return 'bg-amber-600/90 border border-amber-500/60';
    }
    if (intensity > 0.85) return 'bg-cyan-400';
    if (intensity > 0.65) return 'bg-cyan-600';
    if (intensity > 0.45) return 'bg-cyan-800';
    if (intensity > 0.25) return 'bg-cyan-950 border border-cyan-800/40';
    return 'bg-slate-800/60';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Low</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-950" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
            <span>High Volume</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-amber-400 font-medium">Holiday Surge</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1 min-w-[760px]">
          {/* Day labels column */}
          <div className="flex flex-col gap-1 pr-1.5 text-[10px] text-slate-400 font-mono select-none pt-0.5">
            {dayNames.map((d, idx) => (
              <div key={d} className="h-3.5 leading-[14px] text-right w-6">
                {idx % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex gap-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => {
                  if (!day) return <div key={dIdx} className="w-3.5 h-3.5" />;
                  return (
                    <div
                      key={day.date}
                      onClick={() => onDayClick?.(day.date)}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3.5 h-3.5 rounded-xs cursor-pointer transition-all ${getHeatColor(day)} ${
                        hoveredDay?.date === day.date ? 'ring-2 ring-white scale-125 z-10' : ''
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Status Bar */}
      <div className="mt-2.5 p-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs flex items-center justify-between min-h-[36px]">
        {hoveredDay ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400 font-semibold">{hoveredDay.date}</span>
              {hoveredDay.isHoliday && (
                <span className="text-amber-400 font-medium">
                  ★ {hoveredDay.holidayName || 'Festival Day'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">
                Daily Network Pax:{' '}
                <strong className="text-white">{hoveredDay.passengers.toLocaleString()}</strong>
              </span>
              <span className="text-slate-400">
                Demand Index:{' '}
                <strong className="text-cyan-300">
                  {((hoveredDay.passengers / minPax) * 100).toFixed(0)}%
                </strong>
              </span>
            </div>
          </>
        ) : (
          <span className="text-slate-400 text-[11px]">
            Hover over any day square to inspect passenger density and holiday surges. Click to filter.
          </span>
        )}
      </div>
    </div>
  );
};
