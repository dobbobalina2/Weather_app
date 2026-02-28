import { describe, expect, it } from "vitest";

import { collectWindowHours, normalizeTimelinePayload } from "@/lib/visualCrossing";

describe("normalizeTimelinePayload", () => {
  it("normalizes hourly data and reports hasHourly", () => {
    const payload = normalizeTimelinePayload({
      resolvedAddress: "Austin, TX",
      timezone: "America/Chicago",
      days: [
        {
          datetime: "2026-03-06",
          tempmin: 55,
          tempmax: 75,
          precip: 0.1,
          precipprob: 50,
          windspeed: 12,
          conditions: "Partially cloudy",
          hours: [
            {
              datetime: "14:00:00",
              datetimeEpoch: 1772827200,
              temp: 72,
              precipprob: 20,
              precip: 0,
              windspeed: 10,
              humidity: 40,
              conditions: "Cloudy"
            }
          ]
        }
      ]
    });

    expect(payload.hasHourly).toBe(true);
    expect(payload.days[0].hours[0].timeLabel).toBe("2:00 PM");
  });

  it("falls back when no hourly data exists", () => {
    const payload = normalizeTimelinePayload({
      resolvedAddress: "Austin, TX",
      timezone: "America/Chicago",
      days: [
        {
          datetime: "2026-03-06",
          tempmin: 55,
          tempmax: 75,
          precip: 0.1,
          precipprob: 50,
          windspeed: 12,
          conditions: "Partially cloudy"
        }
      ]
    });

    expect(payload.hasHourly).toBe(false);
    expect(payload.days[0].fallback.tempMaxF).toBe(75);

    const hours = collectWindowHours(payload.days, 1772827200, 1772838000);
    expect(hours).toHaveLength(0);
  });
});
