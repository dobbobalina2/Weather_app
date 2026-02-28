# agnets.md

This file tracks conventions and practical rules that are easy to miss in a quick code scan.

## Data Practices
- Do not pass raw Visual Crossing payloads into UI components.
- Normalize upstream payloads through `lib/visualCrossing.ts`.
- Keep weather domain types in `types/weather.ts` as the source of truth.

## Recommendation Practices
- Keep per-week safety evaluation (`proceed|caution|cancel`) in `lib/scoring.ts`.
- Keep cross-week recommendation (`proceed|caution|reschedule`) derived from weighted risk plus threshold severity.
- Weighted risk currently uses: rain 45%, wind 25%, temperature 30%.
- Any weight or threshold changes should update tests in `tests/scoring.test.ts`.

## Reliability Practices
- Prefer deterministic helpers in `lib/*` over component-local business logic.
- If a workaround is needed due to a blocker, stop and ask before implementing the workaround.
- Update `memory.md` whenever a blocker or bug is encountered, including anti-patterns.

## Repo Hygiene
- Keep implementation files under 500 LOC where practical.
- Put reproducible logic in reusable modules/components, not in ad-hoc inline code.
- Do not manually edit `package.json` or lockfiles for dependency changes; use npm commands.
