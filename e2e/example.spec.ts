import { expect, type Page, test } from "@playwright/test";

const HOURLY_RESPONSE = {
  config: {
    location: "San Francisco, CA",
    day: "fri",
    window: "afternoon"
  },
  resolvedAddress: "San Francisco, CA",
  timezone: "America/Los_Angeles",
  thisOccurrence: {
    label: "thisWeek",
    date: "2026-03-06",
    timezone: "America/Los_Angeles",
    startEpoch: 1772834400,
    endEpoch: 1772848800,
    hours: [
      {
        datetime: "2026-03-06T14:00:00",
        datetimeEpoch: 1772834400,
        timeLabel: "2:00 PM",
        tempF: 66,
        precipProb: 18,
        precipAmountIn: 0.01,
        windMph: 9,
        humidityPct: 62,
        conditions: "Partially cloudy"
      },
      {
        datetime: "2026-03-06T15:00:00",
        datetimeEpoch: 1772838000,
        timeLabel: "3:00 PM",
        tempF: 67,
        precipProb: 15,
        precipAmountIn: 0,
        windMph: 10,
        humidityPct: 60,
        conditions: "Partially cloudy"
      },
      {
        datetime: "2026-03-06T16:00:00",
        datetimeEpoch: 1772841600,
        timeLabel: "4:00 PM",
        tempF: 65,
        precipProb: 12,
        precipAmountIn: 0,
        windMph: 8,
        humidityPct: 59,
        conditions: "Clear"
      }
    ],
    metrics: {
      tempMinF: 65,
      tempMaxF: 67,
      tempAvgF: 66,
      feelsLikeMinF: 64,
      feelsLikeMaxF: 68,
      peakWindMph: 10,
      peakWindTime: "3:00 PM",
      peakPrecipProb: 18,
      peakPrecipTime: "2:00 PM",
      totalPrecipIn: 0.01,
      snowIn: 0,
      snowDepthIn: 0,
      sunriseLabel: "6:35 AM",
      sunsetLabel: "5:58 PM",
      startsAfterSunset: false,
      sampleCount: 3
    },
    decision: {
      level: "proceed",
      reasons: ["Comfortable and dry for most of the window."]
    },
    weightedRisk: {
      total: 15.2,
      rainRisk: 13.1,
      windSeverity: 40,
      tempDiscomfort: 0,
      weights: {
        rainWeight: 0.45,
        windWeight: 0.25,
        tempWeight: 0.3
      },
      contributions: {
        rain: 5.9,
        wind: 10,
        temp: 0
      },
      dominantFactor: "wind"
    },
    summary: "Nice day for the meetup window."
  },
  nextOccurrence: {
    label: "nextWeek",
    date: "2026-03-13",
    timezone: "America/Los_Angeles",
    startEpoch: 1773439200,
    endEpoch: 1773453600,
    hours: [
      {
        datetime: "2026-03-13T14:00:00",
        datetimeEpoch: 1773439200,
        timeLabel: "2:00 PM",
        tempF: 63,
        precipProb: 30,
        precipAmountIn: 0.04,
        windMph: 12,
        humidityPct: 71,
        conditions: "Cloudy"
      },
      {
        datetime: "2026-03-13T15:00:00",
        datetimeEpoch: 1773442800,
        timeLabel: "3:00 PM",
        tempF: 62,
        precipProb: 35,
        precipAmountIn: 0.05,
        windMph: 13,
        humidityPct: 73,
        conditions: "Cloudy"
      },
      {
        datetime: "2026-03-13T16:00:00",
        datetimeEpoch: 1773446400,
        timeLabel: "4:00 PM",
        tempF: 61,
        precipProb: 38,
        precipAmountIn: 0.06,
        windMph: 12,
        humidityPct: 74,
        conditions: "Light rain"
      }
    ],
    metrics: {
      tempMinF: 61,
      tempMaxF: 63,
      tempAvgF: 62,
      feelsLikeMinF: 60,
      feelsLikeMaxF: 64,
      peakWindMph: 13,
      peakWindTime: "3:00 PM",
      peakPrecipProb: 38,
      peakPrecipTime: "4:00 PM",
      totalPrecipIn: 0.15,
      snowIn: 0,
      snowDepthIn: 0,
      sunriseLabel: "6:25 AM",
      sunsetLabel: "6:05 PM",
      startsAfterSunset: false,
      sampleCount: 3
    },
    decision: {
      level: "proceed",
      reasons: ["Conditions are acceptable with modest rain risk."]
    },
    weightedRisk: {
      total: 27.8,
      rainRisk: 35.6,
      windSeverity: 52,
      tempDiscomfort: 0,
      weights: {
        rainWeight: 0.45,
        windWeight: 0.25,
        tempWeight: 0.3
      },
      contributions: {
        rain: 16,
        wind: 13,
        temp: 0
      },
      dominantFactor: "rain"
    },
    summary: "Mixed conditions; monitor updates before kickoff."
  },
  recommendation: {
    level: "proceed",
    label: "Proceed",
    emoji: "🟢",
    action: "keepThisWeek",
    summary: "Proceed this week; conditions look favorable.",
    reason: "Top risk driver is wind, but overall risk is low.",
    thisWeekScore: 15.2,
    nextWeekScore: 27.8,
    scoreDelta: -12.6
  },
  updatedAt: "2026-03-01T12:00:00.000Z",
  fallbackMode: false
} as const;

const FALLBACK_RESPONSE = {
  ...HOURLY_RESPONSE,
  thisOccurrence: {
    ...HOURLY_RESPONSE.thisOccurrence,
    hours: [],
    dailyFallback: {
      date: "2026-03-06",
      tempMinF: 59,
      tempMaxF: 68,
      feelsLikeMinF: 58,
      feelsLikeMaxF: 69,
      precipIn: 0.12,
      precipProb: 42,
      snowIn: 0,
      snowDepthIn: 0,
      windMph: 14,
      sunrise: "06:35:00",
      sunset: "17:58:00",
      conditions: "Cloudy with occasional drizzle"
    }
  },
  nextOccurrence: {
    ...HOURLY_RESPONSE.nextOccurrence,
    hours: [],
    dailyFallback: {
      date: "2026-03-13",
      tempMinF: 55,
      tempMaxF: 64,
      feelsLikeMinF: 54,
      feelsLikeMaxF: 66,
      precipIn: 0.08,
      precipProb: 30,
      snowIn: 0,
      snowDepthIn: 0,
      windMph: 12,
      sunrise: "06:25:00",
      sunset: "18:05:00",
      conditions: "Mostly cloudy"
    }
  },
  fallbackMode: true
} as const;

async function mockForecast(page: Page, payload: unknown) {
  await page.route("**/api/forecast**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload)
    });
  });
}

test("renders planner defaults and chart panels", async ({ page }) => {
  await mockForecast(page, HOURLY_RESPONSE);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Weather Planner" })).toBeVisible();
  await expect(page.getByLabel("Location")).toHaveValue(/San Francisco, CA/i);
  await expect(page.getByRole("combobox").first()).toHaveValue("fri");
  await expect(page.getByRole("combobox").nth(1)).toHaveValue("afternoon");
  await expect(page.getByRole("heading", { name: "San Francisco, CA" })).toBeVisible();

  await expect(page.getByText("Smart Recommendation Engine")).toBeVisible();
  await expect(page.locator("span:has-text('Weather Trend'):visible").first()).toBeVisible();
  await expect(page.locator(".chart-box svg:visible")).toHaveCount(2);
  await expect(page.locator("span:has-text('Temperature (F)'):visible").first()).toBeVisible();
  await expect(page.locator("span:has-text('Rain Probability (%)'):visible").first()).toBeVisible();
  await expect(page.locator("span:has-text('Precipitation (in)'):visible").first()).toBeVisible();
});

test("shows daily fallback summary when hourly data is unavailable", async ({ page }) => {
  await mockForecast(page, FALLBACK_RESPONSE);
  await page.goto("/");

  await expect(page.locator("p:has-text('Daily summary'):visible").first()).toBeVisible();
  await expect(page.locator("p:has-text('Cloudy with occasional drizzle'):visible").first()).toBeVisible();
  await expect(page.locator(".chart-box svg:visible")).toHaveCount(0);
});
