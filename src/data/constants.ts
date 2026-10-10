import { City, CityPairDistance, HolidayEvent, TransportMode } from '../types';

export const CITIES: City[] = [
  { id: 'BLR', name: 'Bengaluru', code: 'BLR', state: 'Karnataka', lat: 12.9716, lng: 77.5946, tier: 1 },
  { id: 'MAA', name: 'Chennai', code: 'MAA', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, tier: 1 },
  { id: 'HYD', name: 'Hyderabad', code: 'HYD', state: 'Telangana', lat: 17.3850, lng: 78.4867, tier: 1 },
  { id: 'BOM', name: 'Mumbai', code: 'BOM', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, tier: 1 },
  { id: 'DEL', name: 'Delhi', code: 'DEL', state: 'Delhi NCR', lat: 28.7041, lng: 77.1025, tier: 1 },
  { id: 'PNQ', name: 'Pune', code: 'PNQ', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, tier: 1 },
  { id: 'CCU', name: 'Kolkata', code: 'CCU', state: 'West Bengal', lat: 22.5726, lng: 88.3639, tier: 1 },
  { id: 'JAI', name: 'Jaipur', code: 'JAI', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, tier: 2 },
];

export const CITY_MAP: Record<string, City> = CITIES.reduce((acc, c) => {
  acc[c.name] = c;
  return acc;
}, {} as Record<string, City>);

// Primary Corridors & Real-world Distances
export const CORRIDORS: CityPairDistance[] = [
  { origin: 'Bengaluru', destination: 'Chennai', roadDistanceKm: 348, railDistanceKm: 362, airDistanceKm: 290 },
  { origin: 'Bengaluru', destination: 'Hyderabad', roadDistanceKm: 569, railDistanceKm: 620, airDistanceKm: 505 },
  { origin: 'Mumbai', destination: 'Pune', roadDistanceKm: 149, railDistanceKm: 192, airDistanceKm: 120 },
  { origin: 'Delhi', destination: 'Jaipur', roadDistanceKm: 281, railDistanceKm: 308, airDistanceKm: 235 },
  { origin: 'Chennai', destination: 'Hyderabad', roadDistanceKm: 628, railDistanceKm: 715, airDistanceKm: 520 },
  { origin: 'Mumbai', destination: 'Delhi', roadDistanceKm: 1420, railDistanceKm: 1386, airDistanceKm: 1148 },
  { origin: 'Delhi', destination: 'Kolkata', roadDistanceKm: 1530, railDistanceKm: 1445, airDistanceKm: 1305 },
  { origin: 'Bengaluru', destination: 'Mumbai', roadDistanceKm: 984, railDistanceKm: 1120, airDistanceKm: 842 },
];

export const MODE_COLORS: Record<TransportMode, { primary: string; light: string; border: string; badge: string; text: string }> = {
  Bus: {
    primary: '#0ea5e9', // Sky blue
    light: 'rgba(14, 165, 233, 0.12)',
    border: '#0284c7',
    badge: 'bg-sky-950 text-sky-400 border-sky-800',
    text: 'text-sky-400',
  },
  Car: {
    primary: '#f59e0b', // Amber
    light: 'rgba(245, 158, 11, 0.12)',
    border: '#d97706',
    badge: 'bg-amber-950 text-amber-400 border-amber-800',
    text: 'text-amber-400',
  },
  Train: {
    primary: '#10b981', // Emerald green
    light: 'rgba(16, 185, 129, 0.12)',
    border: '#059669',
    badge: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    text: 'text-emerald-400',
  },
  Airplane: {
    primary: '#8b5cf6', // Violet
    light: 'rgba(139, 92, 246, 0.12)',
    border: '#7c3aed',
    badge: 'bg-violet-950 text-violet-400 border-violet-800',
    text: 'text-violet-400',
  },
};

// 2025-2026 Indian Holiday Calendar with regional multipliers
export const HOLIDAYS: HolidayEvent[] = [
  {
    id: 'pongal_sankranti',
    name: 'Pongal / Makar Sankranti',
    date: '2026-01-14',
    durationDays: 4,
    primaryRegions: ['South', 'National'],
    demandMultiplier: 1.65,
    description: 'Major South India harvest festival with extreme Chennai/Bengaluru/Hyderabad movement.',
  },
  {
    id: 'republic_day',
    name: 'Republic Day Long Weekend',
    date: '2026-01-26',
    durationDays: 3,
    primaryRegions: ['National'],
    demandMultiplier: 1.35,
    description: 'National 3-day extended weekend leisure & family travel peak.',
  },
  {
    id: 'holi',
    name: 'Holi',
    date: '2026-03-04',
    durationDays: 3,
    primaryRegions: ['North', 'West', 'East'],
    demandMultiplier: 1.55,
    description: 'North and Central Indian festival of colors triggering strong Delhi-Jaipur return rush.',
  },
  {
    id: 'eid_ul_fitr',
    name: 'Eid-ul-Fitr',
    date: '2026-03-21',
    durationDays: 3,
    primaryRegions: ['National'],
    demandMultiplier: 1.45,
    description: 'Pan-Indian festive family reunion surge across all transport modes.',
  },
  {
    id: 'summer_vacation',
    name: 'Summer Vacation Peak',
    date: '2026-05-15',
    durationDays: 14,
    primaryRegions: ['National'],
    demandMultiplier: 1.38,
    description: 'Annual school summer vacation travel surge affecting trains and flights.',
  },
  {
    id: 'independence_day',
    name: 'Independence Day Long Weekend',
    date: '2026-08-15',
    durationDays: 3,
    primaryRegions: ['National'],
    demandMultiplier: 1.40,
    description: 'National long weekend travel surge across intercity highways and railways.',
  },
  {
    id: 'ganesh_chaturthi',
    name: 'Ganesh Chaturthi',
    date: '2026-09-14',
    durationDays: 5,
    primaryRegions: ['West'],
    demandMultiplier: 1.70,
    description: 'Massive travel surge on Mumbai-Pune and Konkan Maharashtra corridors.',
  },
  {
    id: 'durga_puja_dussehra',
    name: 'Durga Puja & Dussehra',
    date: '2026-10-20',
    durationDays: 6,
    primaryRegions: ['East', 'National'],
    demandMultiplier: 1.60,
    description: 'Eastern India premier festival with huge Kolkata inflows and festive holidays.',
  },
  {
    id: 'diwali',
    name: 'Diwali Festive Window',
    date: '2025-11-01',
    durationDays: 6,
    primaryRegions: ['National'],
    demandMultiplier: 1.95,
    description: 'Highest travel surge of the year across all Indian corridors and transport modes.',
  },
  {
    id: 'christmas_new_year',
    name: 'Christmas & New Year',
    date: '2025-12-25',
    durationDays: 8,
    primaryRegions: ['National'],
    demandMultiplier: 1.50,
    description: 'Year-end leisure and homecoming surge between all major metropolitan pairs.',
  },
];

// Transport Sub-categories & Operators
export const BUS_OPERATORS = [
  { name: 'KSRTC (Airavat Club Class)', type: 'State RTC', marketShare: 0.28 },
  { name: 'SETC / TNSTC', type: 'State RTC', marketShare: 0.22 },
  { name: 'MSRTC (Shivneri Volvo)', type: 'State RTC', marketShare: 0.18 },
  { name: 'VRL Travels (Multi-Axle)', type: 'Private Operator', marketShare: 0.14 },
  { name: 'Zingbus / IntrCity SmartBus', type: 'Private Operator', marketShare: 0.18 },
];

export const TRAIN_CATEGORIES = [
  { name: 'Vande Bharat Express', speedKmph: 130, share: 0.22, avgOccupancy: 0.94, premiumFare: 1.45 },
  { name: 'Rajdhani / Shatabdi Express', speedKmph: 120, share: 0.28, avgOccupancy: 0.92, premiumFare: 1.25 },
  { name: 'Superfast Mail / Express', speedKmph: 85, share: 0.38, avgOccupancy: 0.96, premiumFare: 0.85 },
  { name: 'Intercity / Garib Rath', speedKmph: 75, share: 0.12, avgOccupancy: 0.88, premiumFare: 0.70 },
];

export const CAR_MODELS = [
  { category: 'Private Owned Car', avgOccupancy: 2.85, share: 0.65 },
  { category: 'Intercity App Cab / Outstation', avgOccupancy: 3.20, share: 0.25 },
  { category: 'Shared Carpool / BlaBlaCar', avgOccupancy: 3.80, share: 0.10 },
];
