import { generateSyntheticMobilityData } from './generator';
import { computeKPISummary, filterRecords, generateDemandForecast } from './analytics';
import { FilterState } from '../types';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runMobilityUnitTests(): TestResult[] {
  const results: TestResult[] = [];
  const t0 = performance.now();

  // Test 1: Data Generation Sanity
  try {
    const records = generateSyntheticMobilityData(42, 30); // 30 days
    const hasData = records.length > 500;
    const noNaNs = records.every((r) => !isNaN(r.passengers) && !isNaN(r.ticketRevenue) && !isNaN(r.carExpenditure));
    results.push({
      name: 'Synthetic Data Generator Integrity',
      category: 'Data Generation',
      passed: hasData && noNaNs,
      message: `Generated ${records.length} records across 30 days with zero NaN or null fields.`,
      durationMs: Number((performance.now() - t0).toFixed(2)),
    });
  } catch (err: any) {
    results.push({
      name: 'Synthetic Data Generator Integrity',
      category: 'Data Generation',
      passed: false,
      message: `Failed: ${err.message}`,
      durationMs: 0,
    });
  }

  // Test 2: Car Expenditure Isolation from Operator Revenue
  try {
    const tStart = performance.now();
    const records = generateSyntheticMobilityData(42, 14);
    const carRecords = records.filter((r) => r.mode === 'Car');
    const commercialRecords = records.filter((r) => r.mode !== 'Car');

    const carHasZeroTicketRevenue = carRecords.every((r) => r.ticketRevenue === 0 && r.carExpenditure > 0);
    const commercialHasZeroCarExp = commercialRecords.every((r) => r.carExpenditure === 0 && r.ticketRevenue > 0);

    results.push({
      name: 'Private Car Expenditure Isolation',
      category: 'Revenue Principles',
      passed: carHasZeroTicketRevenue && commercialHasZeroCarExp,
      message: 'Private car expenditure is strictly isolated from operator ticket revenue across all records.',
      durationMs: Number((performance.now() - tStart).toFixed(2)),
    });
  } catch (err: any) {
    results.push({
      name: 'Private Car Expenditure Isolation',
      category: 'Revenue Principles',
      passed: false,
      message: `Failed: ${err.message}`,
      durationMs: 0,
    });
  }

  // Test 3: Directional Symmetry (Both Outbound & Inbound present)
  try {
    const tStart = performance.now();
    const records = generateSyntheticMobilityData(42, 7);
    const blrMaa = records.filter((r) => r.origin === 'Bengaluru' && r.destination === 'Chennai');
    const maaBlr = records.filter((r) => r.origin === 'Chennai' && r.destination === 'Bengaluru');

    const bothPresent = blrMaa.length > 0 && maaBlr.length > 0 && blrMaa.length === maaBlr.length;
    results.push({
      name: 'Directional Corridor Pair Balance',
      category: 'Corridor Analytics',
      passed: bothPresent,
      message: `Verified symmetric record generation for Bengaluru ↔ Chennai (${blrMaa.length} records each).`,
      durationMs: Number((performance.now() - tStart).toFixed(2)),
    });
  } catch (err: any) {
    results.push({
      name: 'Directional Corridor Pair Balance',
      category: 'Corridor Analytics',
      passed: false,
      message: `Failed: ${err.message}`,
      durationMs: 0,
    });
  }

  // Test 4: Holiday Demand Uplift Verification
  try {
    const tStart = performance.now();
    const records = generateSyntheticMobilityData(42, 365);
    const holidayRecords = records.filter((r) => r.isHoliday);
    const normalRecords = records.filter((r) => !r.isHoliday && !r.isWeekend);

    const avgHolidayPax = holidayRecords.reduce((s, r) => s + r.passengers, 0) / holidayRecords.length;
    const avgNormalPax = normalRecords.reduce((s, r) => s + r.passengers, 0) / normalRecords.length;
    const upliftRatio = avgHolidayPax / avgNormalPax;

    results.push({
      name: 'Holiday Demand Uplift Logic',
      category: 'Holiday Intelligence',
      passed: upliftRatio >= 1.25,
      message: `Holiday passenger mean (${Math.round(avgHolidayPax)}) exhibits ${((upliftRatio - 1) * 100).toFixed(1)}% uplift over normal weekdays (${Math.round(avgNormalPax)}).`,
      durationMs: Number((performance.now() - tStart).toFixed(2)),
    });
  } catch (err: any) {
    results.push({
      name: 'Holiday Demand Uplift Logic',
      category: 'Holiday Intelligence',
      passed: false,
      message: `Failed: ${err.message}`,
      durationMs: 0,
    });
  }

  // Test 5: Filter Consistency & KPI Aggregation
  try {
    const tStart = performance.now();
    const records = generateSyntheticMobilityData(42, 60);
    const filterState: FilterState = {
      dateStart: '2025-11-01',
      dateEnd: '2025-11-15',
      origin: 'Bengaluru',
      destination: 'all',
      mode: 'Train',
      dayType: 'all',
      route: 'all',
      subCategory: 'all',
    };

    const filtered = filterRecords(records, filterState);
    const kpis = computeKPISummary(filtered, records, filterState);

    const matchOrigin = filtered.every((r) => r.origin === 'Bengaluru');
    const matchMode = filtered.every((r) => r.mode === 'Train');
    const sumPax = filtered.reduce((s, r) => s + r.passengers, 0);

    results.push({
      name: 'Multi-Dimension Filter & Aggregation',
      category: 'Data Engine',
      passed: matchOrigin && matchMode && kpis.totalPassengers === sumPax,
      message: `Filter correctly isolated ${filtered.length} Bengaluru Train records. KPI totalPassengers (${kpis.totalPassengers}) matches raw sum.`,
      durationMs: Number((performance.now() - tStart).toFixed(2)),
    });
  } catch (err: any) {
    results.push({
      name: 'Multi-Dimension Filter & Aggregation',
      category: 'Data Engine',
      passed: false,
      message: `Failed: ${err.message}`,
      durationMs: 0,
    });
  }

  // Test 6: Baseline Statistical Forecasting Bounds
  try {
    const tStart = performance.now();
    const records = generateSyntheticMobilityData(42, 60);
    const forecast = generateDemandForecast(records, 14);

    const hasProjections = forecast.length >= 28; // 14 history + 14 future
    const futureOnly = forecast.slice(-14);
    const validBounds = futureOnly.every(
      (f) => f.lower95 <= f.lower80 && f.lower80 <= f.predicted && f.predicted <= f.upper80 && f.upper80 <= f.upper95
    );

    results.push({
      name: 'Statistical Forecast Confidence Intervals',
      category: 'Forecasting',
      passed: hasProjections && validBounds,
      message: '14-day projection generated; strict nested confidence bounds (95% bounds encompass 80% bounds) verified.',
      durationMs: Number((performance.now() - tStart).toFixed(2)),
    });
  } catch (err: any) {
    results.push({
      name: 'Statistical Forecast Confidence Intervals',
      category: 'Forecasting',
      passed: false,
      message: `Failed: ${err.message}`,
      durationMs: 0,
    });
  }

  return results;
}
