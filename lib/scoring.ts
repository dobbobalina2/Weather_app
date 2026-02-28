import { DateTime } from "luxon";

import type { DailyFallback, DecisionResult, ForecastHour, OccurrenceMetrics } from "@/types/weather";
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
