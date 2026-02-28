import type { DecisionResult, OccurrenceMetrics } from "@/types/weather";

export function deriveGenericMessage(decision: DecisionResult, metrics: OccurrenceMetrics): string {
  if (decision.level === "cancel") {
    if (metrics.snowIn >= 0.5 || metrics.snowDepthIn >= 2) {
      return "Snow and ground accumulation make this meetup window risky.";
    }

    if (metrics.feelsLikeMinF <= 32 || metrics.feelsLikeMaxF >= 100) {
      return "Real-feel temperatures are too extreme for comfort.";
    }

    if (metrics.peakPrecipProb >= 70) {
      return "High chance of rain during meetup hours.";
    }

    if (metrics.peakWindMph >= 25) {
      return "Very windy conditions expected.";
    }

    return "Conditions look rough for an outdoor meetup.";
  }

  if (decision.level === "caution") {
    if (metrics.startsAfterSunset) {
      return "Window starts after sunset; plan for low-light conditions.";
    }

    if (metrics.snowIn >= 0.1 || metrics.snowDepthIn >= 0.5) {
      return "Snow may impact travel and meetup comfort.";
    }

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
