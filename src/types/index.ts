export type TransportMode = 'Bus' | 'Car' | 'Train' | 'Airplane';

export interface City {
  id: string;
  name: string;
  code: string;
  state: string;
  lat: number;
  lng: number;
  tier: 1 | 2;
}

export interface CityPairDistance {
  origin: string;
  destination: string;
  roadDistanceKm: number;
  railDistanceKm: number;
  airDistanceKm: number;
}

export interface MobilityRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (Sun-Sat)
  origin: string;
  destination: string;
  routeId: string; // e.g. "BLR-MAA"
  direction: 'Outbound' | 'Inbound'; // Relative to alphabetically first city
  mode: TransportMode;
  passengers: number;
  trips: number;
  avgFareOrExp: number; // Fare for commercial, travel expenditure per pax for car
  ticketRevenue: number; // 0 for private cars
  carExpenditure: number; // 0 for public transit
  totalValue: number; // ticketRevenue + carExpenditure
  capacity: number;
  occupancyRate: number; // passengers / capacity
  isHoliday: boolean;
  holidayName: string | null;
  isWeekend: boolean;
  subCategory: string; // e.g. "Vande Bharat", "KSRTC Airavat", "Private Car", "Domestic Air"
  operatingCost: number; // Estimated operating costs
  operatingMargin: number; // ticketRevenue - operatingCost
}

export interface FilterState {
  dateStart: string;
  dateEnd: string;
  origin: string; // 'all' or city name
  destination: string; // 'all' or city name
  mode: 'all' | TransportMode;
  dayType: 'all' | 'weekday' | 'weekend' | 'holiday';
  route: string; // 'all' or corridor like "Bengaluru - Chennai"
  subCategory: string; // 'all' or specific
}

export interface HolidayEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  durationDays: number;
  primaryRegions: string[]; // ['South', 'North', 'West', 'East', 'National']
  demandMultiplier: number;
  description: string;
}

export interface KPISummary {
  totalPassengers: number;
  prevPassengers: number;
  passengerGrowthPct: number;
  totalTicketRevenue: number;
  prevTicketRevenue: number;
  revenueGrowthPct: number;
  totalCarExpenditure: number;
  totalValue: number; // Ticket rev + Car exp
  avgRevenuePerPax: number;
  avgOccupancyRate: number;
  totalTrips: number;
  activeRoutesCount: number;
  topVolumeRoute: { route: string; volume: number };
  topRevenueMode: { mode: TransportMode; revenue: number };
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  predicted: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

export interface AnomalyRecord {
  date: string;
  route: string;
  mode: TransportMode;
  passengers: number;
  expectedPassengers: number;
  zScore: number;
  type: 'spike' | 'drop';
  reason: string;
}

export interface CapacityRisk {
  route: string;
  mode: TransportMode;
  avgOccupancy: number;
  peakOccupancy: number;
  peakDate: string;
  riskLevel: 'Critical' | 'High' | 'Moderate';
  recommendedAction: string;
}
