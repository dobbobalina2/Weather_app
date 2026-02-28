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
});
