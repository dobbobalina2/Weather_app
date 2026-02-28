export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type TimeWindowPreset = "morning" | "afternoon" | "evening";

export type DecisionLevel = "proceed" | "caution" | "cancel";

export interface MeetupConfig {
  location: string;
  day: DayOfWeek;
  window: TimeWindowPreset;
}

export interface TimeWindow {
  startHour: number;
  endHour: number;
  label: string;
}

export interface ForecastHour {
  datetime: string;
  datetimeEpoch: number;
  timeLabel: string;
  tempF: number;
  precipProb: number;
  precipAmountIn: number;
  windMph: number;
  humidityPct: number;
  conditions: string;
  icon?: string;
}

export interface DailyFallback {
  date: string;
  tempMinF: number;
  tempMaxF: number;
  precipIn: number;
  precipProb: number;
  windMph: number;
  conditions: string;
}

export interface OccurrenceMetrics {
  tempMinF: number;
  tempMaxF: number;
  tempAvgF: number;
  peakWindMph: number;
  peakWindTime?: string;
  peakPrecipProb: number;
  peakPrecipTime?: string;
  totalPrecipIn: number;
  sampleCount: number;
}

export interface DecisionResult {
  level: DecisionLevel;
  reasons: string[];
}

export interface OccurrenceSlice {
  label: "thisWeek" | "nextWeek";
  date: string;
  timezone: string;
  startEpoch: number;
  endEpoch: number;
  hours: ForecastHour[];
  dailyFallback?: DailyFallback;
  metrics: OccurrenceMetrics;
  decision: DecisionResult;
  summary: string;
}

export interface CompareViewModel {
  config: MeetupConfig;
  resolvedAddress: string;
  timezone: string;
  thisOccurrence: OccurrenceSlice;
  nextOccurrence: OccurrenceSlice;
  updatedAt: string;
  fallbackMode: boolean;
}

export interface ApiErrorPayload {
  error: {
    code:
      | "INVALID_QUERY"
      | "UPSTREAM_BAD_REQUEST"
      | "UPSTREAM_RATE_LIMIT"
      | "UPSTREAM_UNAVAILABLE"
      | "INTERNAL_ERROR";
    message: string;
    details?: string;
  };
}

export interface NormalizedDay {
  date: string;
  hours: ForecastHour[];
  fallback: DailyFallback;
}

export interface NormalizedForecast {
  resolvedAddress: string;
  timezone: string;
  days: NormalizedDay[];
  hasHourly: boolean;
}

export interface OccurrenceWindow {
  date: string;
  startEpoch: number;
  endEpoch: number;
}
