import React from 'react';
import {
  LayoutDashboard,
  Compass,
  GitBranch,
  Bus,
  Car,
  Train,
  Plane,
  CalendarDays,
  IndianRupee,
  Sparkles,
  Database,
  Sliders,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export type NavSection =
  | 'overview'
  | 'passenger_movement'
  | 'route_intelligence'
  | 'bus_analytics'
  | 'car_analytics'
  | 'train_analytics'
  | 'air_analytics'
  | 'holiday_intelligence'
  | 'revenue_analytics'
  | 'ai_insights'
  | 'data_explorer'
  | 'settings';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onQuickRouteSelect?: (origin: string, dest: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  onQuickRouteSelect,
}) => {
  const navItems: { id: NavSection; label: string; icon: React.ReactNode; group: string }[] = [
    { id: 'overview', label: 'Executive Overview', icon: <LayoutDashboard className="w-4 h-4" />, group: 'Core' },
    { id: 'passenger_movement', label: 'Passenger Movement', icon: <Compass className="w-4 h-4" />, group: 'Core' },
    { id: 'route_intelligence', label: 'Route Intelligence', icon: <GitBranch className="w-4 h-4" />, group: 'Core' },

    { id: 'bus_analytics', label: 'Bus Analytics', icon: <Bus className="w-4 h-4 text-sky-400" />, group: 'Modes' },
    { id: 'car_analytics', label: 'Car Analytics', icon: <Car className="w-4 h-4 text-amber-400" />, group: 'Modes' },
    { id: 'train_analytics', label: 'Train Analytics', icon: <Train className="w-4 h-4 text-emerald-400" />, group: 'Modes' },
    { id: 'air_analytics', label: 'Air Travel Analytics', icon: <Plane className="w-4 h-4 text-violet-400" />, group: 'Modes' },

    { id: 'holiday_intelligence', label: 'Holiday & Festivals', icon: <CalendarDays className="w-4 h-4" />, group: 'Intelligence' },
    { id: 'revenue_analytics', label: 'Revenue Analytics', icon: <IndianRupee className="w-4 h-4" />, group: 'Intelligence' },
    { id: 'ai_insights', label: 'AI Insights & Forecast', icon: <Sparkles className="w-4 h-4 text-amber-300" />, group: 'Intelligence' },

    { id: 'data_explorer', label: 'Data Explorer', icon: <Database className="w-4 h-4" />, group: 'System' },
    { id: 'settings', label: 'Settings & Model Docs', icon: <Sliders className="w-4 h-4" />, group: 'System' },
  ];

  return (
    <aside
      className={`relative bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 transition-all duration-300 z-20 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors shadow-sm"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-2.5 flex flex-col gap-1">
        {navItems.map((item, idx) => {
          const isActive = activeSection === item.id;
          const showGroup =
            !collapsed && (idx === 0 || item.group !== navItems[idx - 1].group);

          return (
            <React.Fragment key={item.id}>
              {showGroup && (
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider px-3 pt-3 pb-1">
                  {item.group}
                </div>
              )}
              <button
                onClick={() => onSelectSection(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <div className="shrink-0">{item.icon}</div>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </React.Fragment>
          );
        })}

        {/* Quick Corridor Bookmarks (when expanded) */}
        {!collapsed && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 px-2">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-2 flex items-center justify-between">
              <span>Key Corridors</span>
              <TrendingUp className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="flex flex-col gap-1 text-[11px]">
              {[
                { a: 'Bengaluru', b: 'Chennai' },
                { a: 'Bengaluru', b: 'Hyderabad' },
                { a: 'Mumbai', b: 'Pune' },
                { a: 'Delhi', b: 'Jaipur' },
                { a: 'Mumbai', b: 'Delhi' },
              ].map((c) => (
                <button
                  key={`${c.a}-${c.b}`}
                  onClick={() => onQuickRouteSelect?.(c.a, c.b)}
                  className="text-left text-slate-400 hover:text-cyan-400 hover:bg-slate-900/60 p-1.5 rounded transition-colors truncate font-mono"
                >
                  {c.a} ↔ {c.b}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span>Model: Synthetic 365D</span>
            <span className="text-emerald-400">Validated</span>
          </div>
        </div>
      )}
    </aside>
  );
};
