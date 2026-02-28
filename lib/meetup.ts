import { deriveGenericMessage } from "@/lib/messages";
import { deriveDecision, deriveOccurrenceMetrics } from "@/lib/scoring";
import { collectWindowHours } from "@/lib/visualCrossing";
import type { CompareViewModel, MeetupConfig, NormalizedForecast, OccurrenceSlice, OccurrenceWindow } from "@/types/weather";

function buildOccurrenceSlice(
  label: "thisWeek" | "nextWeek",
  timezone: string,
  source: NormalizedForecast,
  window: OccurrenceWindow
): OccurrenceSlice {
  const hours = collectWindowHours(source.days, window.startEpoch, window.endEpoch);
  const fallback = source.days.find((day) => day.date === window.date)?.fallback;
  const metrics = deriveOccurrenceMetrics(hours, fallback);
  const decision = deriveDecision(metrics);
  const summary = deriveGenericMessage(decision, metrics);

  return {
    label,
    date: window.date,
    timezone,
    startEpoch: window.startEpoch,
    endEpoch: window.endEpoch,
    hours,
    dailyFallback: hours.length === 0 ? fallback : undefined,
    metrics,
    decision,
    summary
  };
}

export function buildCompareViewModel(args: {
  config: MeetupConfig;
  source: NormalizedForecast;
  thisWindow: OccurrenceWindow;
  nextWindow: OccurrenceWindow;
}): CompareViewModel {
  const thisOccurrence = buildOccurrenceSlice(
    "thisWeek",
    args.source.timezone,
    args.source,
    args.thisWindow
  );
  const nextOccurrence = buildOccurrenceSlice(
    "nextWeek",
    args.source.timezone,
    args.source,
    args.nextWindow
  );

  return {
    config: args.config,
    resolvedAddress: args.source.resolvedAddress,
    timezone: args.source.timezone,
    thisOccurrence,
    nextOccurrence,
    updatedAt: new Date().toISOString(),
    fallbackMode: thisOccurrence.hours.length === 0 || nextOccurrence.hours.length === 0
  };
}
