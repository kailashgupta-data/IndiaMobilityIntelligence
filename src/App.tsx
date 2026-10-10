/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { generateSyntheticMobilityData } from './data/generator';
import { filterRecords, computeKPISummary } from './data/analytics';
import { FilterState, TransportMode } from './types';
import { Header } from './components/Header';
import { Sidebar, NavSection } from './components/Sidebar';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { ExecutiveOverview } from './components/Views/ExecutiveOverview';
import { PassengerMovement } from './components/Views/PassengerMovement';
import { RouteIntelligence } from './components/Views/RouteIntelligence';
import { BusAnalytics } from './components/Views/BusAnalytics';
import { CarAnalytics } from './components/Views/CarAnalytics';
import { TrainAnalytics } from './components/Views/TrainAnalytics';
import { AirAnalytics } from './components/Views/AirAnalytics';
import { HolidayIntelligence } from './components/Views/HolidayIntelligence';
import { RevenueAnalytics } from './components/Views/RevenueAnalytics';
import { AIInsightsWorkspace } from './components/Views/AIInsightsWorkspace';
import { DataExplorer } from './components/Views/DataExplorer';
import { SettingsAndDocs } from './components/Views/SettingsAndDocs';
import { PrintReportModal } from './components/PrintReportModal';

export default function App() {
  const [seed, setSeed] = useState<number>(42);
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Route drill-down memory
  const [drillCityA, setDrillCityA] = useState<string>('Bengaluru');
  const [drillCityB, setDrillCityB] = useState<string>('Chennai');

  // Filter state (covers full 12 months by default)
  const [filters, setFilters] = useState<FilterState>({
    dateStart: '2025-10-15',
    dateEnd: '2026-10-14',
    origin: 'all',
    destination: 'all',
    mode: 'all',
    dayType: 'all',
    route: 'all',
    subCategory: 'all',
  });

  // Generate full 365-day dataset with reproducible seed
  const allRecords = useMemo(() => {
    return generateSyntheticMobilityData(seed, 365, '2025-10-15');
  }, [seed]);

  // Apply active filters
  const filteredRecords = useMemo(() => {
    return filterRecords(allRecords, filters);
  }, [allRecords, filters]);

  // Executive KPI summary
  const kpis = useMemo(() => {
    return computeKPISummary(filteredRecords, allRecords, filters);
  }, [filteredRecords, allRecords, filters]);

  // Handlers
  const handleRegenerateData = () => {
    const nextSeed = Math.floor(Math.random() * 9000) + 1000;
    setSeed(nextSeed);
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'id',
      'date',
      'dayOfWeek',
      'origin',
      'destination',
      'routeId',
      'direction',
      'mode',
      'subCategory',
      'passengers',
      'trips',
      'avgFareOrExp',
      'ticketRevenue',
      'carExpenditure',
      'capacity',
      'occupancyRate',
      'isHoliday',
      'holidayName',
      'isWeekend',
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.date,
      r.dayOfWeek,
      `"${r.origin}"`,
      `"${r.destination}"`,
      r.routeId,
      r.direction,
      r.mode,
      `"${r.subCategory}"`,
      r.passengers,
      r.trips,
      r.avgFareOrExp,
      r.ticketRevenue,
      r.carExpenditure,
      r.capacity,
      r.occupancyRate.toFixed(4),
      r.isHoliday ? '1' : '0',
      r.holidayName ? `"${r.holidayName}"` : '""',
      r.isWeekend ? '1' : '0',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `india_mobility_intelligence_${filters.dateStart}_${filters.dateEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectRoute = (orig: string, dest: string) => {
    setFilters((prev) => ({
      ...prev,
      origin: orig,
      destination: dest,
    }));
    setDrillCityA(orig);
    setDrillCityB(dest);
  };

  const handleDrillDownRoute = (orig: string, dest: string) => {
    setDrillCityA(orig);
    setDrillCityB(dest);
    setActiveSection('route_intelligence');
  };

  const handleSelectMode = (mode: TransportMode) => {
    setFilters((prev) => ({ ...prev, mode }));
    if (mode === 'Bus') setActiveSection('bus_analytics');
    else if (mode === 'Car') setActiveSection('car_analytics');
    else if (mode === 'Train') setActiveSection('train_analytics');
    else if (mode === 'Airplane') setActiveSection('air_analytics');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Executive Header */}
      <Header
        currentSeed={seed}
        totalRecordsCount={allRecords.length}
        onRegenerateData={handleRegenerateData}
        onExportCSV={handleExportCSV}
        onOpenPrintReport={() => setIsPrintModalOpen(true)}
        onOpenAIInsights={() => setActiveSection('ai_insights')}
      />

      {/* Global Filter Bar */}
      <GlobalFilterBar
        filters={filters}
        onFilterChange={setFilters}
        filteredCount={filteredRecords.length}
        totalCount={allRecords.length}
      />

      {/* Main Desktop Container with Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onQuickRouteSelect={(a, b) => handleSelectRoute(a, b)}
        />

        {/* Main Dashboard Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeSection === 'overview' && (
            <ExecutiveOverview
              records={filteredRecords}
              allRecords={allRecords}
              filters={filters}
              onSelectRoute={handleSelectRoute}
              onSelectMode={handleSelectMode}
              onNavigateToView={(view) => setActiveSection(view)}
            />
          )}

          {activeSection === 'passenger_movement' && (
            <PassengerMovement
              records={filteredRecords}
              filters={filters}
              onSelectRoute={handleSelectRoute}
              onDrillDown={handleDrillDownRoute}
            />
          )}

          {activeSection === 'route_intelligence' && (
            <RouteIntelligence
              records={allRecords}
              initialCityA={drillCityA}
              initialCityB={drillCityB}
              onSelectDate={(d) => setFilters((prev) => ({ ...prev, dateStart: d, dateEnd: d }))}
            />
          )}

          {activeSection === 'bus_analytics' && (
            <BusAnalytics
              records={filteredRecords}
              onSelectRoute={handleSelectRoute}
            />
          )}

          {activeSection === 'car_analytics' && (
            <CarAnalytics
              records={filteredRecords}
              onSelectRoute={handleSelectRoute}
            />
          )}

          {activeSection === 'train_analytics' && (
            <TrainAnalytics
              records={filteredRecords}
              onSelectRoute={handleSelectRoute}
            />
          )}

          {activeSection === 'air_analytics' && (
            <AirAnalytics
              records={filteredRecords}
              onSelectRoute={handleSelectRoute}
            />
          )}

          {activeSection === 'holiday_intelligence' && (
            <HolidayIntelligence
              records={filteredRecords}
              allRecords={allRecords}
              onSelectDateRange={(start, end) => setFilters((prev) => ({ ...prev, dateStart: start, dateEnd: end }))}
              onSelectRoute={handleSelectRoute}
            />
          )}

          {activeSection === 'revenue_analytics' && (
            <RevenueAnalytics
              records={filteredRecords}
              allRecords={allRecords}
              filters={filters}
              onSelectRoute={handleSelectRoute}
            />
          )}

          {activeSection === 'ai_insights' && (
            <AIInsightsWorkspace
              records={filteredRecords}
              allRecords={allRecords}
              filters={filters}
              onSelectRoute={handleSelectRoute}
            />
          )}

          {activeSection === 'data_explorer' && (
            <DataExplorer
              records={filteredRecords}
              onExportCSV={handleExportCSV}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsAndDocs
              currentSeed={seed}
              totalRecordsCount={allRecords.length}
              onUpdateSeed={(newSeed) => setSeed(newSeed)}
            />
          )}
        </main>
      </div>

      {/* Printable Executive PDF Brief Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        kpis={kpis}
        filters={filters}
        dateGenerated={new Date().toISOString().split('T')[0]}
      />
    </div>
  );
}
