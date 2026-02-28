import { describe, expect, it } from "vitest";

import { deriveDecision, deriveOccurrenceMetrics } from "@/lib/scoring";
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
