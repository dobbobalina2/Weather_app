import type { DailyFallback, DecisionResult, ForecastHour, OccurrenceMetrics } from "@/types/weather";

const THRESHOLDS = {
  cancel: {
    windMph: 25,
    rainProb: 70,
    rainAmount: 0.1,
    minTempF: 35,
    maxTempF: 95
  },
  caution: {
    windMph: 18,
    rainProb: 40,
    minTempF: 45,
    maxTempF: 85
  }
} as const;

export function deriveOccurrenceMetrics(hours: ForecastHour[], fallback?: DailyFallback): OccurrenceMetrics {
  if (hours.length === 0 && fallback) {
    return {
      tempMinF: fallback.tempMinF,
      tempMaxF: fallback.tempMaxF,
      tempAvgF: Number(((fallback.tempMinF + fallback.tempMaxF) / 2).toFixed(1)),
      peakWindMph: fallback.windMph,
      peakPrecipProb: fallback.precipProb,
      totalPrecipIn: fallback.precipIn,
      sampleCount: 1
    };
  }

  if (hours.length === 0) {
    return {
      tempMinF: 0,
      tempMaxF: 0,
      tempAvgF: 0,
      peakWindMph: 0,
      peakPrecipProb: 0,
      totalPrecipIn: 0,
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
    peakWindMph: Number(peakWindMph.toFixed(1)),
    peakWindTime,
    peakPrecipProb: Number(peakPrecipProb.toFixed(1)),
    peakPrecipTime,
    totalPrecipIn: Number(totalPrecipIn.toFixed(2)),
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

  if (severeWind || severeRain || severeTemp) {
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

    return { level: "cancel", reasons };
  }

  const moderateWind = metrics.peakWindMph >= THRESHOLDS.caution.windMph;
  const moderateRain = metrics.peakPrecipProb >= THRESHOLDS.caution.rainProb;
  const moderateTemp =
    metrics.tempMinF < THRESHOLDS.caution.minTempF ||
    metrics.tempMaxF > THRESHOLDS.caution.maxTempF;

  if (moderateWind || moderateRain || moderateTemp) {
    if (moderateWind) {
      reasons.push(`Wind may be uncomfortable at ${metrics.peakWindMph} mph.`);
    }
    if (moderateRain) {
      reasons.push(`Rain chance climbs to ${metrics.peakPrecipProb}% in this window.`);
    }
    if (moderateTemp) {
      reasons.push(`Temperatures sit outside ideal comfort (${metrics.tempMinF}-${metrics.tempMaxF}F).`);
    }

    return { level: "caution", reasons };
  }

  reasons.push(
    `Comfortable range (${metrics.tempMinF}-${metrics.tempMaxF}F), low rain risk (${metrics.peakPrecipProb}%), and manageable wind (${metrics.peakWindMph} mph).`
  );

  return { level: "proceed", reasons };
}
