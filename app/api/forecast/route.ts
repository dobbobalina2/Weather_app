import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildCompareViewModel } from "@/lib/meetup";
import { computeOccurrenceWindows } from "@/lib/time";
import { fetchTimeline, VisualCrossingError } from "@/lib/visualCrossing";
import type { ApiErrorPayload, MeetupConfig, NormalizedForecast } from "@/types/weather";

const querySchema = z.object({
  location: z.string().trim().min(2, "Location must be at least 2 characters."),
  day: z.enum(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]),
  window: z.enum(["morning", "afternoon", "evening"])
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const parsedQuery = querySchema.safeParse({
      location: request.nextUrl.searchParams.get("location") ?? "",
      day: request.nextUrl.searchParams.get("day") ?? "fri",
      window: request.nextUrl.searchParams.get("window") ?? "afternoon"
    });

    if (!parsedQuery.success) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: {
            code: "INVALID_QUERY",
            message: "Invalid request parameters.",
            details: parsedQuery.error.issues[0]?.message
          }
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.VISUAL_CROSSING_API_KEY;
    if (!apiKey) {
      return NextResponse.json<ApiErrorPayload>(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "Server weather configuration is missing."
          }
        },
        { status: 500 }
      );
    }

    const config: MeetupConfig = {
      location: parsedQuery.data.location,
      day: parsedQuery.data.day,
      window: parsedQuery.data.window
    };

    const timezoneProbe = await retryVisualCrossing(() =>
      fetchTimeline({
        apiKey,
        location: config.location,
        date1: "today",
        date2: "today",
        includeHours: false
      })
    );

    const occurrenceWindows = computeOccurrenceWindows({
      day: config.day,
      window: config.window,
      timezone: timezoneProbe.timezone
    });

    let forecast = await retryVisualCrossing(() =>
      fetchTimeline({
        apiKey,
        location: config.location,
        date1: occurrenceWindows.thisOccurrence.date,
        date2: occurrenceWindows.nextOccurrence.date,
        includeHours: true
      })
    );

    if (!forecast.hasHourly) {
      forecast = await retryVisualCrossing(() =>
        fetchTimeline({
          apiKey,
          location: config.location,
          date1: occurrenceWindows.thisOccurrence.date,
          date2: occurrenceWindows.nextOccurrence.date,
          includeHours: false
        })
      );
    }

    const model = buildCompareViewModel({
      config,
      source: mergeResolvedAddress(timezoneProbe, forecast),
      thisWindow: occurrenceWindows.thisOccurrence,
      nextWindow: occurrenceWindows.nextOccurrence
    });

    return NextResponse.json(model);
  } catch (error) {
    if (error instanceof VisualCrossingError) {
      const status = error.status;

      if (status === 400 || status === 404) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: {
              code: "UPSTREAM_BAD_REQUEST",
              message: "Location could not be resolved by weather provider."
            }
          },
          { status: 400 }
        );
      }

      if (status === 429) {
        return NextResponse.json<ApiErrorPayload>(
          {
            error: {
              code: "UPSTREAM_RATE_LIMIT",
              message: "Weather service rate limit reached. Please retry shortly."
            }
          },
          { status: 429 }
        );
      }

      return NextResponse.json<ApiErrorPayload>(
        {
          error: {
            code: "UPSTREAM_UNAVAILABLE",
            message: "Weather provider is temporarily unavailable."
          }
        },
        { status: 503 }
      );
    }

    return NextResponse.json<ApiErrorPayload>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Unexpected server error while fetching forecast."
        }
      },
      { status: 500 }
    );
  }
}

function mergeResolvedAddress(primary: NormalizedForecast, secondary: NormalizedForecast): NormalizedForecast {
  return {
    ...secondary,
    resolvedAddress: secondary.resolvedAddress !== "Unknown location" ? secondary.resolvedAddress : primary.resolvedAddress,
    timezone: secondary.timezone || primary.timezone
  };
}

async function retryVisualCrossing(fetcher: () => Promise<NormalizedForecast>): Promise<NormalizedForecast> {
  try {
    return await fetcher();
  } catch (error) {
    if (!(error instanceof VisualCrossingError) || !error.retriable) {
      throw error;
    }
  }

  return fetcher();
}
