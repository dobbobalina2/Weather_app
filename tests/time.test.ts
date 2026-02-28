import { describe, expect, it } from "vitest";

import { computeOccurrenceWindows } from "@/lib/time";

describe("computeOccurrenceWindows", () => {
  it("picks the nearest upcoming weekday window", () => {
    const result = computeOccurrenceWindows({
      day: "fri",
      window: "afternoon",
      timezone: "America/New_York",
      referenceTime: new Date("2026-03-02T14:00:00Z")
    });

    expect(result.thisOccurrence.date).toBe("2026-03-06");
    expect(result.nextOccurrence.date).toBe("2026-03-13");
  });

  it("rolls to next week when current window already started", () => {
    const result = computeOccurrenceWindows({
      day: "fri",
      window: "afternoon",
      timezone: "America/New_York",
      referenceTime: new Date("2026-03-06T21:30:00Z")
    });

    expect(result.thisOccurrence.date).toBe("2026-03-13");
    expect(result.nextOccurrence.date).toBe("2026-03-20");
  });
});
