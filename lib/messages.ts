import type { DecisionResult, OccurrenceMetrics } from "@/types/weather";

export function deriveGenericMessage(decision: DecisionResult, metrics: OccurrenceMetrics): string {
  if (decision.level === "cancel") {
    if (metrics.peakPrecipProb >= 70) {
      return "High chance of rain during meetup hours.";
    }

    if (metrics.peakWindMph >= 25) {
      return "Very windy conditions expected.";
    }

    return "Conditions look rough for an outdoor meetup.";
  }

  if (decision.level === "caution") {
    if (metrics.peakPrecipProb >= 40) {
      return "Chance of rain, plan a backup option.";
    }

    if (metrics.peakWindMph >= 18) {
      return "Breezy to windy window, prepare accordingly.";
    }

    return "Mixed conditions; monitor updates before kickoff.";
  }

  return "Nice day for the meetup window.";
}
