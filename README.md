# Weather Meetup Prototype

A Next.js App Router prototype that helps an organizer compare recurring meetup weather for this week vs next week and decide whether to proceed.

## Features
- Freeform location + day + time-window controls
- Visual Crossing Timeline API integration through server proxy
- Side-by-side comparison for this occurrence and next occurrence
- Recommendation engine (`Proceed`, `Caution`, `Cancel`) with explainability reasons
- Scrollable hourly chart with Temp/Rain/Wind toggles
- Loading skeletons, retryable errors, and daily-summary fallback when hourly data is unavailable
- Copy-to-clipboard summary for sharing in chat

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create local env file:
   ```bash
   cp .env.example .env.local
   ```
3. Set your Visual Crossing key:
   ```bash
   VISUAL_CROSSING_API_KEY=your_api_key_here
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

## Scripts
- `npm run dev` - run local development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm test` - run Vitest suite

## API Route
`GET /api/forecast?location=...&day=fri&window=afternoon`

Returns normalized compare payload for `thisOccurrence` and `nextOccurrence`.

## Notes
- Units are US (`F`, `mph`, inches) in MVP.
- Time interpretation is based on the selected location timezone.
- Keep `VISUAL_CROSSING_API_KEY` server-side only.
