import { describe, expect, it } from "vitest";

import { deriveComparisonRecommendation, deriveDecision, deriveOccurrenceMetrics, deriveWeightedRiskScore } from "@/lib/scoring";
import type { ForecastHour } from "@/types/weather";

const sampleHours = (partial: Partial<ForecastHour>): ForecastHour[] => [
  {
    datetime: "2026-03-06T14:00:00",
    datetimeEpoch: 1772824800,
    timeLabel: "2:00 PM",
    tempF: 70,
    precipProb: 10,
    precipAmountIn: 0,
    windMph: 8,
    humidityPct: 55,
    conditions: "Clear",
    ...partial
  }
];

describe("deriveDecision", () => {
  it("returns cancel for severe rain profile", () => {
    const metrics = deriveOccurrenceMetrics(
      sampleHours({ precipProb: 80, precipAmountIn: 0.3 })
    );
    const decision = deriveDecision(metrics);

    expect(decision.level).toBe("cancel");
    expect(decision.reasons.join(" ")).toContain("Rain risk is high");
  });

  it("returns caution for moderate wind", () => {
    const metrics = deriveOccurrenceMetrics(sampleHours({ windMph: 19 }));
    const decision = deriveDecision(metrics);

    expect(decision.level).toBe("caution");
  });

  it("returns proceed for comfortable conditions", () => {
    const metrics = deriveOccurrenceMetrics(sampleHours({ tempF: 72, windMph: 9, precipProb: 5 }));
    const decision = deriveDecision(metrics);

    expect(decision.level).toBe("proceed");
  });

  it("returns cancel when snow accumulation is significant", () => {
    const metrics = deriveOccurrenceMetrics(sampleHours({}), {
      date: "2026-03-06",
      tempMinF: 33,
      tempMaxF: 36,
      feelsLikeMinF: 25,
      feelsLikeMaxF: 34,
      precipIn: 0.2,
      precipProb: 70,
      snowIn: 0.8,
      snowDepthIn: 2.4,
      windMph: 14,
      sunrise: "06:40:00",
      sunset: "18:10:00",
      conditions: "Snow"
    });
    const decision = deriveDecision(metrics);

    expect(decision.level).toBe("cancel");
    expect(decision.reasons.join(" ")).toContain("Snow conditions are significant");
  });

  it("returns caution when meetup starts after sunset", () => {
    const metrics = deriveOccurrenceMetrics(
      sampleHours({ tempF: 67, windMph: 8, precipProb: 10 }),
      {
        date: "2026-12-11",
        tempMinF: 58,
        tempMaxF: 69,
        feelsLikeMinF: 57,
        feelsLikeMaxF: 68,
        precipIn: 0,
        precipProb: 10,
        snowIn: 0,
        snowDepthIn: 0,
        windMph: 8,
        sunrise: "07:12:00",
        sunset: "16:42:00",
        conditions: "Clear"
      },
      { startEpoch: 1797030000, timezone: "America/New_York" }
    );
    const decision = deriveDecision(metrics);

    expect(metrics.startsAfterSunset).toBe(true);
    expect(decision.level).toBe("caution");
    expect(decision.reasons.join(" ")).toContain("starts after sunset");
  });
});

describe("deriveWeightedRiskScore", () => {
  it("weights rain as the dominant driver in wet windows", () => {
    const metrics = deriveOccurrenceMetrics(sampleHours({ precipProb: 90, precipAmountIn: 0.25, windMph: 8, tempF: 68 }));
    const weighted = deriveWeightedRiskScore(metrics);

    expect(weighted.rainRisk).toBeGreaterThan(weighted.windSeverity);
    expect(weighted.dominantFactor).toBe("rain");
    expect(weighted.total).toBeGreaterThan(40);
  });

  it("weights temperature discomfort when cold thresholds are crossed", () => {
    const metrics = deriveOccurrenceMetrics(sampleHours({ tempF: 34, windMph: 6, precipProb: 5 }), {
      date: "2026-03-06",
      tempMinF: 33,
      tempMaxF: 38,
      feelsLikeMinF: 27,
      feelsLikeMaxF: 35,
      precipIn: 0,
      precipProb: 5,
      snowIn: 0,
      snowDepthIn: 0,
      windMph: 6,
      conditions: "Clear"
    });
    const weighted = deriveWeightedRiskScore(metrics);

    expect(weighted.tempDiscomfort).toBeGreaterThan(0);
    expect(weighted.dominantFactor).toBe("temp");
  });
});

describe("deriveComparisonRecommendation", () => {
  it("recommends reschedule when next week is materially safer", () => {
    const thisWeekMetrics = deriveOccurrenceMetrics(sampleHours({ precipProb: 88, precipAmountIn: 0.35, windMph: 22, tempF: 56 }));
    const nextWeekMetrics = deriveOccurrenceMetrics(sampleHours({ precipProb: 12, precipAmountIn: 0, windMph: 7, tempF: 72 }));
    const recommendation = deriveComparisonRecommendation({
      thisWeek: {
        decision: deriveDecision(thisWeekMetrics),
        weightedRisk: deriveWeightedRiskScore(thisWeekMetrics)
      },
      nextWeek: {
        decision: deriveDecision(nextWeekMetrics),
        weightedRisk: deriveWeightedRiskScore(nextWeekMetrics)
      }
    });

    expect(recommendation.level).toBe("reschedule");
    expect(recommendation.action).toBe("moveToNextWeek");
    expect(recommendation.thisWeekScore).toBeGreaterThan(recommendation.nextWeekScore);
  });

  it("recommends proceed when this week is low-risk and stable", () => {
    const thisWeekMetrics = deriveOccurrenceMetrics(sampleHours({ precipProb: 5, precipAmountIn: 0, windMph: 6, tempF: 71 }));
    const nextWeekMetrics = deriveOccurrenceMetrics(sampleHours({ precipProb: 35, precipAmountIn: 0.08, windMph: 16, tempF: 60 }));
    const recommendation = deriveComparisonRecommendation({
      thisWeek: {
        decision: deriveDecision(thisWeekMetrics),
        weightedRisk: deriveWeightedRiskScore(thisWeekMetrics)
      },
      nextWeek: {
        decision: deriveDecision(nextWeekMetrics),
        weightedRisk: deriveWeightedRiskScore(nextWeekMetrics)
      }
    });

    expect(recommendation.level).toBe("proceed");
    expect(recommendation.action).toBe("keepThisWeek");
  });
});
