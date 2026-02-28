import { DateTime } from "luxon";
import { z } from "zod";

import type { ForecastHour, NormalizedDay, NormalizedForecast } from "@/types/weather";
import { safeZone } from "@/lib/time";

const hourSchema = z.object({
  datetime: z.string().optional(),
  datetimeEpoch: z.number().optional(),
  temp: z.number().nullable().optional(),
  precipprob: z.number().nullable().optional(),
  precip: z.number().nullable().optional(),
  windspeed: z.number().nullable().optional(),
  humidity: z.number().nullable().optional(),
  conditions: z.string().nullable().optional(),
  icon: z.string().nullable().optional()
});

const daySchema = z.object({
  datetime: z.string(),
  tempmin: z.number().nullable().optional(),
  tempmax: z.number().nullable().optional(),
  feelslikemin: z.number().nullable().optional(),
  feelslikemax: z.number().nullable().optional(),
  precip: z.number().nullable().optional(),
  precipprob: z.number().nullable().optional(),
  snow: z.number().nullable().optional(),
  snowdepth: z.number().nullable().optional(),
  windspeed: z.number().nullable().optional(),
  sunrise: z.string().nullable().optional(),
  sunset: z.string().nullable().optional(),
  conditions: z.string().nullable().optional(),
  hours: z.array(hourSchema).optional()
});

const timelineSchema = z.object({
  resolvedAddress: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  days: z.array(daySchema).default([])
});

export class VisualCrossingError extends Error {
  status: number;
  retriable: boolean;

  constructor(message: string, status: number, retriable = false) {
    super(message);
    this.status = status;
    this.retriable = retriable;
  }
}

export interface TimelineRequestOptions {
  location: string;
  apiKey: string;
  date1?: string;
  date2?: string;
  includeHours: boolean;
  signal?: AbortSignal;
}

export function buildTimelineUrl(opts: TimelineRequestOptions): string {
  const encodedLocation = encodeURIComponent(opts.location);
  const datePath = opts.date1 ? `/${opts.date1}${opts.date2 ? `/${opts.date2}` : ""}` : "";
  const base = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodedLocation}${datePath}`;

  const params = new URLSearchParams({
    key: opts.apiKey,
    unitGroup: "us",
    lang: "en",
    include: opts.includeHours ? "days,hours,current" : "days,current",
    elements:
      "datetime,datetimeEpoch,temp,precip,precipprob,windspeed,humidity,conditions,icon,tempmax,tempmin,feelslikemax,feelslikemin,snow,snowdepth,sunrise,sunset",
    options: "nonulls"
  });

  return `${base}?${params.toString()}`;
}

export async function fetchTimeline(opts: TimelineRequestOptions): Promise<NormalizedForecast> {
  const url = buildTimelineUrl(opts);
  const response = await fetchWithTimeout(url, 12_000, opts.signal);

  if (!response.ok) {
    const retriable = response.status === 429 || response.status >= 500;
    throw new VisualCrossingError(`Visual Crossing request failed (${response.status}).`, response.status, retriable);
  }

  const json: unknown = await response.json();
  return normalizeTimelinePayload(json);
}

export async function fetchWithTimeout(url: string, timeoutMs: number, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new VisualCrossingError("Visual Crossing request timed out.", 504, true);
    }

    throw new VisualCrossingError("Unable to reach Visual Crossing API.", 503, true);
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeTimelinePayload(raw: unknown): NormalizedForecast {
  const parsed = timelineSchema.parse(raw);
  const timezone = safeZone(parsed.timezone);
  const days: NormalizedDay[] = parsed.days.map((day) => {
    const date = day.datetime;
    const hours = (day.hours ?? []).map((hour) => normalizeHour(hour, date, timezone));

    return {
      date,
      hours,
      fallback: {
        date,
        tempMinF: Number((day.tempmin ?? 0).toFixed(1)),
        tempMaxF: Number((day.tempmax ?? 0).toFixed(1)),
        feelsLikeMinF: Number((day.feelslikemin ?? 0).toFixed(1)),
        feelsLikeMaxF: Number((day.feelslikemax ?? 0).toFixed(1)),
        precipIn: Number((day.precip ?? 0).toFixed(2)),
        precipProb: Number((day.precipprob ?? 0).toFixed(1)),
        snowIn: Number((day.snow ?? 0).toFixed(2)),
        snowDepthIn: Number((day.snowdepth ?? 0).toFixed(2)),
        windMph: Number((day.windspeed ?? 0).toFixed(1)),
        sunrise: day.sunrise ?? undefined,
        sunset: day.sunset ?? undefined,
        conditions: day.conditions ?? "No conditions available"
      }
    };
  });

  return {
    resolvedAddress: parsed.resolvedAddress ?? parsed.address ?? "Unknown location",
    timezone,
    days,
    hasHourly: days.some((day) => day.hours.length > 0)
  };
}

export function collectWindowHours(
  days: NormalizedDay[],
  startEpoch: number,
  endEpoch: number
): ForecastHour[] {
  const hours = days.flatMap((day) => day.hours);

  return hours
    .filter((hour) => hour.datetimeEpoch >= startEpoch && hour.datetimeEpoch < endEpoch)
    .sort((a, b) => a.datetimeEpoch - b.datetimeEpoch);
}

function normalizeHour(
  hour: z.infer<typeof hourSchema>,
  date: string,
  timezone: string
): ForecastHour {
  const fallbackHour = hour.datetime?.slice(0, 5) ?? "00:00";
  const datetimeIso = `${date}T${hour.datetime ?? "00:00:00"}`;
  const computedEpoch = Math.trunc(DateTime.fromISO(datetimeIso, { zone: timezone }).toSeconds());

  return {
    datetime: datetimeIso,
    datetimeEpoch: hour.datetimeEpoch ?? computedEpoch,
    timeLabel: formatHourLabel(fallbackHour),
    tempF: Number((hour.temp ?? 0).toFixed(1)),
    precipProb: Number((hour.precipprob ?? 0).toFixed(1)),
    precipAmountIn: Number((hour.precip ?? 0).toFixed(2)),
    windMph: Number((hour.windspeed ?? 0).toFixed(1)),
    humidityPct: Number((hour.humidity ?? 0).toFixed(1)),
    conditions: hour.conditions ?? "No conditions available",
    icon: hour.icon ?? undefined
  };
}

function formatHourLabel(hourText: string): string {
  const [hour, minute] = hourText.split(":").map((value) => Number(value));

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return hourText;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${period}`;
}
