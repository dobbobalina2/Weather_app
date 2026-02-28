# AGENTS.md

## Purpose
This repo hosts a Next.js App Router prototype for weekly meetup weather decisions.
Primary UX goal: compare the selected meetup window for this week vs next week and provide an actionable recommendation.

## Stack and Boundaries
- Frontend and backend share one runtime: Next.js + React + TypeScript.
- Server proxy path: `app/api/forecast/route.ts`.
- Visual Crossing key must remain server-only (`VISUAL_CROSSING_API_KEY`).
- Domain logic is centralized in `lib/*` and `types/weather.ts`; UI should not consume raw Visual Crossing payloads.

## Data Conventions
### Query inputs
`GET /api/forecast`
- `location`: freeform text (required, min length 2 after trim)
- `day`: `sun|mon|tue|wed|thu|fri|sat`
- `window`: `morning|afternoon|evening`
- `weekOffset`: integer `0..8` (optional; default `0`) to compare future repeating weeks

### Internal domain types
- `MeetupConfig`: organizer selection state.
- `ForecastHour`: normalized hourly datapoint (US units).
- `OccurrenceSlice`: one weekly comparison target (`thisWeek` or `nextWeek`).
- `CompareViewModel`: final server response used by UI.

### Normalization rules
- All external payload parsing must go through `normalizeTimelinePayload` in `lib/visualCrossing.ts`.
- Visual Crossing requests should include decision-critical elements: `feelslikemax`, `feelslikemin`, `snow`, `snowdepth`, `sunrise`, `sunset` (alongside existing temp/rain/wind fields).
- Null numeric fields are normalized to `0` (prototype behavior).
- Hour labels are converted to human-readable `h:mm AM/PM` strings.
- Missing hourly data sets `hasHourly=false`; UI uses daily fallback messaging.

## Time and Scheduling Rules
- Timezone source of truth is the location timezone returned by Visual Crossing.
- Compute upcoming occurrence from current time in location timezone.
- If current occurrence window already started, roll forward by 7 days.
- Next occurrence is exactly +7 days from this occurrence.
- Window presets:
  - `morning`: 09:00-12:00
  - `afternoon`: 14:00-18:00
  - `evening`: 18:00-21:00

## Decision Rules (Balanced Profile)
Recommendation levels: `proceed`, `caution`, `cancel`.

### Cancel
- Wind peak >= 25 mph, or
- Rain probability >= 70% with precip amount >= 0.1 in, or
- Temperature <= 35F or >= 95F, or
- Feels-like <= 32F or >= 100F, or
- Snow >= 0.5 in or snow depth >= 2 in.

### Caution
- Wind peak >= 18 mph, or
- Rain probability >= 40%, or
- Temperature outside 45F-85F comfort band, or
- Feels-like outside 40F-90F, or
- Snow >= 0.1 in or snow depth >= 0.5 in, or
- Meetup window starts after sunset.

### Proceed
- If none of the cancel/caution conditions are met.

## Error Mapping Conventions
Server route returns typed error payloads:
- `INVALID_QUERY` (400)
- `UPSTREAM_BAD_REQUEST` (400)
- `UPSTREAM_RATE_LIMIT` (429)
- `UPSTREAM_UNAVAILABLE` (503)
- `INTERNAL_ERROR` (500)

## Resilience Practices
- Use retry only for retriable upstream failures (429/5xx/timeouts/network).
- On changed meetup params, show loading state for the new request before rendering new comparison cards.
- Show inline/location-safe validation messages for bad inputs.
- If hourly slices are missing, continue with daily summary fallback (never crash).

## Testing Practices
- Unit tests for time slicing and scoring thresholds.
- Integration-style tests for payload normalization/fallback behavior.
- Component tests for control validation and user interactions.
- Keep Vitest setup explicit for JSX transform and DOM cleanup.

## Repo Practices
- Keep implementation files under 500 LOC when practical.
- Prefer deterministic, reusable logic in `lib/` over component-local duplication.
- Update `memory.md` whenever a blocker or bug is encountered, including anti-pattern notes.
- Avoid workaround hacks when blocked; surface blockers clearly.
