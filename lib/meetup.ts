import { deriveGenericMessage } from "@/lib/messages";
import { deriveComparisonRecommendation, deriveDecision, deriveOccurrenceMetrics, deriveWeightedRiskScore } from "@/lib/scoring";
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
  const metrics = deriveOccurrenceMetrics(hours, fallback, {
    startEpoch: window.startEpoch,
    timezone
  });
  const decision = deriveDecision(metrics);
  const weightedRisk = deriveWeightedRiskScore(metrics);
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
    weightedRisk,
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
  const recommendation = deriveComparisonRecommendation({
    thisWeek: {
      decision: thisOccurrence.decision,
      weightedRisk: thisOccurrence.weightedRisk
    },
    nextWeek: {
      decision: nextOccurrence.decision,
      weightedRisk: nextOccurrence.weightedRisk
    }
  });

  return {
    config: args.config,
    resolvedAddress: args.source.resolvedAddress,
    timezone: args.source.timezone,
    thisOccurrence,
    nextOccurrence,
    recommendation,
    updatedAt: new Date().toISOString(),
    fallbackMode: thisOccurrence.hours.length === 0 || nextOccurrence.hours.length === 0
  };
}
