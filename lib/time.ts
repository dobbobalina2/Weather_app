import { DateTime } from "luxon";

import type { DayOfWeek, OccurrenceWindow, TimeWindow, TimeWindowPreset } from "@/types/weather";

const DAY_INDEX: Record<DayOfWeek, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7
};

const WINDOW_PRESETS: Record<TimeWindowPreset, TimeWindow> = {
  morning: { startHour: 9, endHour: 12, label: "Morning" },
  afternoon: { startHour: 14, endHour: 18, label: "Afternoon" },
  evening: { startHour: 18, endHour: 21, label: "Evening" }
};

const FALLBACK_ZONE = "UTC";

export function getWindowPreset(window: TimeWindowPreset): TimeWindow {
  return WINDOW_PRESETS[window];
}

export function getWindowLabel(window: TimeWindowPreset): string {
  return WINDOW_PRESETS[window].label;
}

export function safeZone(zone?: string): string {
  if (!zone) {
    return FALLBACK_ZONE;
  }

  const now = DateTime.now().setZone(zone);
  return now.isValid ? zone : FALLBACK_ZONE;
}

export function computeOccurrenceWindows(args: {
  day: DayOfWeek;
  window: TimeWindowPreset;
  timezone: string;
  referenceTime?: Date;
}): { thisOccurrence: OccurrenceWindow; nextOccurrence: OccurrenceWindow } {
  const timezone = safeZone(args.timezone);
  const preset = getWindowPreset(args.window);
  const targetDay = DAY_INDEX[args.day];

  const localNow = DateTime.fromJSDate(args.referenceTime ?? new Date()).setZone(timezone);
  const baseDay = localNow.startOf("day");

  const dayOffset = (targetDay - baseDay.weekday + 7) % 7;

  let currentDate = baseDay.plus({ days: dayOffset });
  let currentStart = currentDate.set({
    hour: preset.startHour,
    minute: 0,
    second: 0,
    millisecond: 0
  });

  if (currentStart <= localNow) {
    currentDate = currentDate.plus({ days: 7 });
    currentStart = currentStart.plus({ days: 7 });
  }

  const currentEnd = currentDate.set({
    hour: preset.endHour,
    minute: 0,
    second: 0,
    millisecond: 0
  });

  const nextStart = currentStart.plus({ days: 7 });
  const nextEnd = currentEnd.plus({ days: 7 });

  return {
    thisOccurrence: {
      date: currentStart.toFormat("yyyy-MM-dd"),
      startEpoch: currentStart.toSeconds(),
      endEpoch: currentEnd.toSeconds()
    },
    nextOccurrence: {
      date: nextStart.toFormat("yyyy-MM-dd"),
      startEpoch: nextStart.toSeconds(),
      endEpoch: nextEnd.toSeconds()
    }
  };
}

export function formatEpochToLocalTime(epochSeconds: number, timezone: string): string {
  return DateTime.fromSeconds(epochSeconds, { zone: safeZone(timezone) }).toFormat("h:mm a");
}
