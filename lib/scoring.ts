import { DateTime } from "luxon";

import type {
  CompareRecommendation,
  DailyFallback,
  DecisionResult,
  ForecastHour,
  OccurrenceMetrics,
  WeightedRiskScore
} from "@/types/weather";
import { safeZone } from "@/lib/time";

const THRESHOLDS = {
  cancel: {
    windMph: 25,
    rainProb: 70,
    rainAmount: 0.1,
    minTempF: 35,
    maxTempF: 95,
    minFeelsLikeF: 32,
    maxFeelsLikeF: 100,
    snowIn: 0.5,
    snowDepthIn: 2
  },
  caution: {
    windMph: 18,
    rainProb: 40,
    minTempF: 45,
    maxTempF: 85,
    minFeelsLikeF: 40,
    maxFeelsLikeF: 90,
    snowIn: 0.1,
    snowDepthIn: 0.5
  }
} as const;

const SCORE_WEIGHTS = {
  rainWeight: 0.45,
  windWeight: 0.25,
  tempWeight: 0.3
} as const;

const STRONG_ADVANTAGE_POINTS = 12;
const LOW_RISK_SCORE = 30;
const MODERATE_RISK_SCORE = 50;

interface MetricsWindowContext {
  startEpoch: number;
  timezone: string;
}

export function deriveOccurrenceMetrics(
  hours: ForecastHour[],
  fallback?: DailyFallback,
  context?: MetricsWindowContext
): OccurrenceMetrics {
  const timezone = safeZone(context?.timezone);
  const sunriseEpoch = resolveDayTimeEpoch(fallback?.date, fallback?.sunrise, timezone);
  const sunsetEpoch = resolveDayTimeEpoch(fallback?.date, fallback?.sunset, timezone);
  const sunriseLabel = sunriseEpoch ? DateTime.fromSeconds(sunriseEpoch, { zone: timezone }).toFormat("h:mm a") : undefined;
  const sunsetLabel = sunsetEpoch ? DateTime.fromSeconds(sunsetEpoch, { zone: timezone }).toFormat("h:mm a") : undefined;
  const startsAfterSunset = Boolean(context && sunsetEpoch && context.startEpoch >= sunsetEpoch);

  if (hours.length === 0 && fallback) {
    return {
      tempMinF: fallback.tempMinF,
      tempMaxF: fallback.tempMaxF,
      tempAvgF: Number(((fallback.tempMinF + fallback.tempMaxF) / 2).toFixed(1)),
      feelsLikeMinF: fallback.feelsLikeMinF,
      feelsLikeMaxF: fallback.feelsLikeMaxF,
      peakWindMph: fallback.windMph,
      peakPrecipProb: fallback.precipProb,
      totalPrecipIn: fallback.precipIn,
      snowIn: fallback.snowIn,
      snowDepthIn: fallback.snowDepthIn,
      sunriseLabel,
      sunsetLabel,
      startsAfterSunset,
      sampleCount: 1
    };
  }

  if (hours.length === 0) {
    return {
      tempMinF: 0,
      tempMaxF: 0,
      tempAvgF: 0,
      feelsLikeMinF: 0,
      feelsLikeMaxF: 0,
      peakWindMph: 0,
      peakPrecipProb: 0,
      totalPrecipIn: 0,
      snowIn: 0,
      snowDepthIn: 0,
      sunriseLabel,
      sunsetLabel,
      startsAfterSunset,
      sampleCount: 0
    };
  }

  let tempMinF = Number.POSITIVE_INFINITY;
  let tempMaxF = Number.NEGATIVE_INFINITY;
  let tempSum = 0;
  let peakWindMph = 0;
  let peakWindTime: string | undefined;
  let peakPrecipProb = 0;
  let peakPrecipTime: string | undefined;
  let totalPrecipIn = 0;

  for (const hour of hours) {
    tempMinF = Math.min(tempMinF, hour.tempF);
    tempMaxF = Math.max(tempMaxF, hour.tempF);
    tempSum += hour.tempF;

    if (hour.windMph > peakWindMph) {
      peakWindMph = hour.windMph;
      peakWindTime = hour.timeLabel;
    }

    if (hour.precipProb > peakPrecipProb) {
      peakPrecipProb = hour.precipProb;
      peakPrecipTime = hour.timeLabel;
    }

    totalPrecipIn += hour.precipAmountIn;
  }

  return {
    tempMinF: Number(tempMinF.toFixed(1)),
    tempMaxF: Number(tempMaxF.toFixed(1)),
    tempAvgF: Number((tempSum / hours.length).toFixed(1)),
    feelsLikeMinF: fallback?.feelsLikeMinF ?? Number(tempMinF.toFixed(1)),
    feelsLikeMaxF: fallback?.feelsLikeMaxF ?? Number(tempMaxF.toFixed(1)),
    peakWindMph: Number(peakWindMph.toFixed(1)),
    peakWindTime,
    peakPrecipProb: Number(peakPrecipProb.toFixed(1)),
    peakPrecipTime,
    totalPrecipIn: Number(totalPrecipIn.toFixed(2)),
    snowIn: fallback?.snowIn ?? 0,
    snowDepthIn: fallback?.snowDepthIn ?? 0,
    sunriseLabel,
    sunsetLabel,
    startsAfterSunset,
    sampleCount: hours.length
  };
}

export function deriveDecision(metrics: OccurrenceMetrics): DecisionResult {
  const reasons: string[] = [];

  const severeWind = metrics.peakWindMph >= THRESHOLDS.cancel.windMph;
  const severeRain =
    metrics.peakPrecipProb >= THRESHOLDS.cancel.rainProb &&
    metrics.totalPrecipIn >= THRESHOLDS.cancel.rainAmount;
  const severeTemp =
    metrics.tempMinF <= THRESHOLDS.cancel.minTempF ||
    metrics.tempMaxF >= THRESHOLDS.cancel.maxTempF;
  const severeFeelsLike =
    metrics.feelsLikeMinF <= THRESHOLDS.cancel.minFeelsLikeF ||
    metrics.feelsLikeMaxF >= THRESHOLDS.cancel.maxFeelsLikeF;
  const severeSnow =
    metrics.snowIn >= THRESHOLDS.cancel.snowIn ||
    metrics.snowDepthIn >= THRESHOLDS.cancel.snowDepthIn;

  if (severeWind || severeRain || severeTemp || severeFeelsLike || severeSnow) {
    if (severeWind) {
      reasons.push(`Wind peaks at ${metrics.peakWindMph} mph${metrics.peakWindTime ? ` around ${metrics.peakWindTime}` : ""}.`);
    }
    if (severeRain) {
      reasons.push(
        `Rain risk is high (${metrics.peakPrecipProb}% peak chance, ${metrics.totalPrecipIn} in expected).`
      );
    }
    if (severeTemp) {
      reasons.push(`Temperatures reach ${metrics.tempMinF}-${metrics.tempMaxF}F in the window.`);
    }
    if (severeFeelsLike) {
      reasons.push(`Real-feel swings to ${metrics.feelsLikeMinF}-${metrics.feelsLikeMaxF}F.`);
    }
    if (severeSnow) {
      reasons.push(`Snow conditions are significant (${metrics.snowIn}" expected, ${metrics.snowDepthIn}" on ground).`);
    }

    return { level: "cancel", reasons };
  }

  const moderateWind = metrics.peakWindMph >= THRESHOLDS.caution.windMph;
  const moderateRain = metrics.peakPrecipProb >= THRESHOLDS.caution.rainProb;
  const moderateTemp =
    metrics.tempMinF < THRESHOLDS.caution.minTempF ||
    metrics.tempMaxF > THRESHOLDS.caution.maxTempF;
  const moderateFeelsLike =
    metrics.feelsLikeMinF < THRESHOLDS.caution.minFeelsLikeF ||
    metrics.feelsLikeMaxF > THRESHOLDS.caution.maxFeelsLikeF;
  const moderateSnow =
    metrics.snowIn >= THRESHOLDS.caution.snowIn ||
    metrics.snowDepthIn >= THRESHOLDS.caution.snowDepthIn;
  const lowLightWindow = metrics.startsAfterSunset;

  if (moderateWind || moderateRain || moderateTemp || moderateFeelsLike || moderateSnow || lowLightWindow) {
    if (moderateWind) {
      reasons.push(`Wind may be uncomfortable at ${metrics.peakWindMph} mph.`);
    }
    if (moderateRain) {
      reasons.push(`Rain chance climbs to ${metrics.peakPrecipProb}% in this window.`);
    }
    if (moderateTemp) {
      reasons.push(`Temperatures sit outside ideal comfort (${metrics.tempMinF}-${metrics.tempMaxF}F).`);
    }
    if (moderateFeelsLike) {
      reasons.push(`Feels-like range is ${metrics.feelsLikeMinF}-${metrics.feelsLikeMaxF}F.`);
    }
    if (moderateSnow) {
      reasons.push(`Snow may affect travel/ground conditions (${metrics.snowIn}" snow, ${metrics.snowDepthIn}" depth).`);
    }
    if (lowLightWindow && metrics.sunsetLabel) {
      reasons.push(`Meetup starts after sunset (${metrics.sunsetLabel}).`);
    }

    return { level: "caution", reasons };
  }

  reasons.push(
    `Comfortable range (${metrics.tempMinF}-${metrics.tempMaxF}F), low rain risk (${metrics.peakPrecipProb}%), and manageable wind (${metrics.peakWindMph} mph).`
  );

  return { level: "proceed", reasons };
}

export function deriveWeightedRiskScore(metrics: OccurrenceMetrics): WeightedRiskScore {
  const rainProbabilityRisk = clamp01(metrics.peakPrecipProb / 100);
  const rainAmountRisk = clamp01(metrics.totalPrecipIn / 0.3);
  const rainRisk = roundRisk((rainProbabilityRisk * 0.7 + rainAmountRisk * 0.3) * 100);

  const windSeverity = roundRisk(clamp01(metrics.peakWindMph / THRESHOLDS.cancel.windMph) * 100);

  const coldTemp = clamp01((THRESHOLDS.caution.minTempF - metrics.tempMinF) / 20);
  const hotTemp = clamp01((metrics.tempMaxF - THRESHOLDS.caution.maxTempF) / 20);
  const coldFeels = clamp01((THRESHOLDS.caution.minFeelsLikeF - metrics.feelsLikeMinF) / 20);
  const hotFeels = clamp01((metrics.feelsLikeMaxF - THRESHOLDS.caution.maxFeelsLikeF) / 20);
  const tempDiscomfort = roundRisk(Math.max(coldTemp, hotTemp, coldFeels, hotFeels) * 100);

  const rainContribution = roundRisk(SCORE_WEIGHTS.rainWeight * rainRisk);
  const windContribution = roundRisk(SCORE_WEIGHTS.windWeight * windSeverity);
  const tempContribution = roundRisk(SCORE_WEIGHTS.tempWeight * tempDiscomfort);
  const total = roundRisk(rainContribution + windContribution + tempContribution);

  const dominantFactor = getDominantFactor({
    rain: rainContribution,
    wind: windContribution,
    temp: tempContribution
  });

  return {
    total,
    rainRisk,
    windSeverity,
    tempDiscomfort,
    weights: {
      rainWeight: SCORE_WEIGHTS.rainWeight,
      windWeight: SCORE_WEIGHTS.windWeight,
      tempWeight: SCORE_WEIGHTS.tempWeight
    },
    contributions: {
      rain: rainContribution,
      wind: windContribution,
      temp: tempContribution
    },
    dominantFactor
  };
}

export function deriveComparisonRecommendation(args: {
  thisWeek: {
    decision: DecisionResult;
    weightedRisk: WeightedRiskScore;
  };
  nextWeek: {
    decision: DecisionResult;
    weightedRisk: WeightedRiskScore;
  };
}): CompareRecommendation {
  const thisWeekScore = args.thisWeek.weightedRisk.total;
  const nextWeekScore = args.nextWeek.weightedRisk.total;
  const scoreDelta = roundRisk(thisWeekScore - nextWeekScore);
  const nextWeekClearlyBetter = scoreDelta >= STRONG_ADVANTAGE_POINTS;
  const thisWeekClearlyBetter = scoreDelta <= -STRONG_ADVANTAGE_POINTS;

  const thisWeekSeverity = decisionSeverity(args.thisWeek.decision.level);
  const nextWeekSeverity = decisionSeverity(args.nextWeek.decision.level);

  if (
    args.nextWeek.decision.level !== "cancel" &&
    (thisWeekSeverity > nextWeekSeverity || nextWeekClearlyBetter)
  ) {
    return {
      level: "reschedule",
      label: "Recommend Reschedule",
      emoji: "🔴",
      action: "moveToNextWeek",
      summary:
        scoreDelta > 0
          ? `Move to next week (${scoreDelta.toFixed(1)} points lower risk).`
          : "Move to next week based on safer weather profile.",
      reason: `This week is mostly driven by ${factorLabel(args.thisWeek.weightedRisk.dominantFactor)} risk.`,
      thisWeekScore,
      nextWeekScore,
      scoreDelta
    };
  }

  if (thisWeekSeverity < nextWeekSeverity && thisWeekScore <= MODERATE_RISK_SCORE) {
    return {
      level: "proceed",
      label: "Proceed",
      emoji: "🟢",
      action: "keepThisWeek",
      summary: "This week remains the better option.",
      reason: `Risk is primarily ${factorLabel(args.thisWeek.weightedRisk.dominantFactor)}, but still manageable.`,
      thisWeekScore,
      nextWeekScore,
      scoreDelta
    };
  }

  if (thisWeekScore <= LOW_RISK_SCORE && !nextWeekClearlyBetter) {
    return {
      level: "proceed",
      label: "Proceed",
      emoji: "🟢",
      action: "keepThisWeek",
      summary: "Proceed this week; conditions look favorable.",
      reason: `Top risk driver is ${factorLabel(args.thisWeek.weightedRisk.dominantFactor)}, but overall risk is low.`,
      thisWeekScore,
      nextWeekScore,
      scoreDelta
    };
  }

  if (thisWeekClearlyBetter && thisWeekScore <= MODERATE_RISK_SCORE) {
    return {
      level: "proceed",
      label: "Proceed",
      emoji: "🟢",
      action: "keepThisWeek",
      summary:
        scoreDelta < 0
          ? `Proceed this week (${Math.abs(scoreDelta).toFixed(1)} points lower risk than next week).`
          : "Proceed this week.",
      reason: `Next week is more exposed to ${factorLabel(args.nextWeek.weightedRisk.dominantFactor)} risk.`,
      thisWeekScore,
      nextWeekScore,
      scoreDelta
    };
  }

  return {
    level: "caution",
    label: "Caution",
    emoji: "🟡",
    action: "monitor",
    summary: "Close call between weeks; monitor updates before committing.",
    reason: `Current week risk is led by ${factorLabel(args.thisWeek.weightedRisk.dominantFactor)} conditions.`,
    thisWeekScore,
    nextWeekScore,
    scoreDelta
  };
}

function resolveDayTimeEpoch(date: string | undefined, timeText: string | undefined, timezone: string): number | undefined {
  if (!date || !timeText) {
    return undefined;
  }

  const dateTimeText = timeText.includes("T") ? timeText : `${date}T${timeText}`;
  const local = DateTime.fromISO(dateTimeText, { zone: timezone });
  if (!local.isValid) {
    return undefined;
  }

  return Math.trunc(local.toSeconds());
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roundRisk(value: number): number {
  return Number(value.toFixed(1));
}

function getDominantFactor(contributions: { rain: number; wind: number; temp: number }): "rain" | "wind" | "temp" {
  if (contributions.rain >= contributions.wind && contributions.rain >= contributions.temp) {
    return "rain";
  }

  if (contributions.wind >= contributions.temp) {
    return "wind";
  }

  return "temp";
}

function decisionSeverity(level: DecisionResult["level"]): number {
  if (level === "cancel") {
    return 2;
  }
  if (level === "caution") {
    return 1;
  }

  return 0;
}

function factorLabel(factor: WeightedRiskScore["dominantFactor"]): string {
  if (factor === "rain") {
    return "rain";
  }
  if (factor === "wind") {
    return "wind";
  }

  return "temperature";
}
