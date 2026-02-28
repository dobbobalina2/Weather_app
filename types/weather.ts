export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type TimeWindowPreset = "morning" | "afternoon" | "evening";

export type DecisionLevel = "proceed" | "caution" | "cancel";
export type CompareRecommendationLevel = "proceed" | "caution" | "reschedule";

export interface MeetupConfig {
  location: string;
  day: DayOfWeek;
  window: TimeWindowPreset;
}

export interface TimeWindow {
  startHour: number;
  endHour: number;
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
  feelsLikeMinF: number;
  feelsLikeMaxF: number;
  precipIn: number;
  precipProb: number;
  snowIn: number;
  snowDepthIn: number;
  windMph: number;
  sunrise?: string;
  sunset?: string;
  conditions: string;
}

export interface OccurrenceMetrics {
  tempMinF: number;
  tempMaxF: number;
  tempAvgF: number;
  feelsLikeMinF: number;
  feelsLikeMaxF: number;
  peakWindMph: number;
  peakWindTime?: string;
  peakPrecipProb: number;
  peakPrecipTime?: string;
  totalPrecipIn: number;
  snowIn: number;
  snowDepthIn: number;
  sunriseLabel?: string;
  sunsetLabel?: string;
  startsAfterSunset: boolean;
  sampleCount: number;
}

export interface DecisionResult {
  level: DecisionLevel;
  reasons: string[];
}

export interface WeightedRiskScore {
  total: number;
  rainRisk: number;
  windSeverity: number;
  tempDiscomfort: number;
  weights: {
    rainWeight: number;
    windWeight: number;
    tempWeight: number;
  };
  contributions: {
    rain: number;
    wind: number;
    temp: number;
  };
  dominantFactor: "rain" | "wind" | "temp";
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
  weightedRisk: WeightedRiskScore;
  summary: string;
}

export interface CompareRecommendation {
  level: CompareRecommendationLevel;
  label: string;
  emoji: "🟢" | "🟡" | "🔴";
  action: "keepThisWeek" | "moveToNextWeek" | "monitor";
  summary: string;
  reason: string;
  thisWeekScore: number;
  nextWeekScore: number;
  scoreDelta: number;
}

export interface CompareViewModel {
  config: MeetupConfig;
  resolvedAddress: string;
  timezone: string;
  thisOccurrence: OccurrenceSlice;
  nextOccurrence: OccurrenceSlice;
  recommendation: CompareRecommendation;
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
