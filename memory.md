# Memory Log

## 2026-02-28

### Bug: Vitest JSX runtime mismatch in component tests
- Context: Running `npm test` after implementing the meetup prototype.
- Symptom: `tests/meetupControls.test.tsx` failed with `ReferenceError: React is not defined`.
- Root cause: With the current test transform settings, TSX was compiled in a way that expected `React` in scope.
- Fix: Switched Vitest esbuild JSX mode to automatic (`vitest.config.ts`), and kept explicit import in the initial failing test.
- Status: Resolved.

### Anti-pattern to avoid
- Avoid assuming JSX auto-runtime behavior is identical between Next.js app code and Vitest test transforms. Validate with an early test run and standardize imports/config before adding multiple component tests.
- Ensure explicit DOM cleanup in Vitest setup when component tests share global document state; otherwise queries can fail due to duplicate mounted trees.

### Bug: Next build failure from remote Google Font dependency
- Context: Running `npm run build` in restricted network environment.
- Symptom: `next/font` failed to fetch `Source Sans 3` from `fonts.googleapis.com` and aborted build.
- Root cause: `next/font/google` requires outbound network access at build time.
- Fix: Removed remote font dependency and switched to local/system font stack in `app/globals.css`.
- Status: Resolved.

### Bug: App Router build failure from `useSearchParams` in root page
- Context: Running `npm run build` after moving to App Router client page logic.
- Symptom: Build failed with `useSearchParams() should be wrapped in a suspense boundary at page "/"`.
- Root cause: `app/page.tsx` used client-only navigation hooks directly without a server-side suspense wrapper for CSR bailout.
- Fix: Split into server `app/page.tsx` with `<Suspense>` and moved hook logic into `app/MeetupClientPage.tsx`.
- Status: Resolved.

### Blocker: Next 16 Turbopack build panic in restricted sandbox
- Context: Running `npm run build` after upgrading dependencies to latest (Next.js 16).
- Symptom: Build fails with `TurbopackInternalError: Failed to write app endpoint /page` and `Operation not permitted (os error 1)` while processing `app/globals.css`.
- Root cause: Environment-level process/port restrictions in this sandbox when Turbopack invokes CSS/PostCSS worker steps.
- Status: Unresolved in sandbox; likely environment-specific.
- Antipattern: Treating Turbopack panics under restricted execution environments as app-code failures without validating environment constraints first.

### Bug: Tailwind v4 PostCSS plugin package mismatch
- Context: Running app/build after dependency upgrades.
- Symptom: `tailwindcss` could not be used directly as a PostCSS plugin and suggested `@tailwindcss/postcss`.
- Root cause: Tailwind v4 moved PostCSS integration from `tailwindcss` to `@tailwindcss/postcss`.
- Fix: Installed `@tailwindcss/postcss` and updated `postcss.config.mjs` plugin key.
- Status: Resolved.

### Bug: React 19 type namespace mismatch with explicit `JSX.Element` annotations
- Context: Webpack build type-check on latest React/Next stack.
- Symptom: `Cannot find namespace 'JSX'` in component/function return annotations.
- Root cause: Explicit global `JSX.Element` annotations are not reliable across newer React type setups.
- Fix: Removed explicit `: JSX.Element` return annotations and relied on inference.
- Status: Resolved.

### Warning: Next.js workspace root inferred from unrelated parent lockfile
- Context: Running build after dependency upgrades with lockfiles in parent directories.
- Symptom: Next.js warned it inferred workspace root from `/Users/Americansprit/yarn.lock` and detected additional lockfile in this project.
- Root cause: No explicit root config, so Next auto-detected from nearest lockfile set.
- Fix: Set explicit `turbopack.root` and `outputFileTracingRoot` to project directory in `next.config.mjs`.
- Status: Resolved.

### Blocker: Figma mockup retrieval returns unusable black thumbnails
- Context: User requested precise UI match against `https://www.figma.com/make/PVidFEUmEm7Iqk2uWhpfvk/Weather-comparison-app`.
- Symptom: Figma thumbnail URLs resolved but produced black PNG outputs; embed endpoint not retrievable in this environment.
- Root cause: Environment/network/access limitation for Figma asset rendering (likely auth/cdn restrictions in this runtime).
- Status: Blocked pending user-provided visual reference assets.
- Antipattern: Attempting to \"match exactly\" from inaccessible Figma links without obtaining renderable reference screenshots.

### Bug: Recharts tooltip formatter type mismatch after UI chart rewrite
- Context: Running `npm run build -- --webpack` after implementing Figma-style chart sections.
- Symptom: TypeScript failed in `components/ForecastChart.tsx` due tooltip formatter callback type incompatibility.
- Root cause: Formatter callback was typed too narrowly (`number` only).
- Fix: Widened formatter input type to `number | string | undefined`.
- Status: Resolved.

### Warning recurrence: Next.js workspace root inference
- Context: Build warning reappeared during UI refactor validation.
- Symptom: Next.js again inferred root from `/Users/Americansprit/yarn.lock`.
- Root cause: `next.config.mjs` lost explicit root settings during intermediate edits.
- Fix: Restored `turbopack.root` and `outputFileTracingRoot` using project root path.
- Status: Resolved.

### Blocker: Could not directly reproduce live dev-server resource usage in sandbox
- Context: Investigating report that `next dev` consumes excessive RAM/CPU.
- Symptom: Sandbox cannot bind dev port (`listen EPERM 0.0.0.0:3000`); escalated run was denied, so live sampling could not be performed in this session.
- Root cause: Environment execution restriction plus denied escalation.
- Status: Blocked for direct reproduction in-agent; mitigations applied via config/code changes.
- Antipattern: Assuming low-resource behavior from static review alone when the issue requires process-level runtime sampling.

### Bug: Potential render churn from URL-sync effect in client page
- Context: Reviewing high CPU usage paths in `app/MeetupClientPage.tsx`.
- Symptom: Config state was always reset from query-derived object in an effect, which can cause repeated state work if query object identity changes frequently.
- Root cause: Effect called `setConfig(resolvedInitial)` without an equality guard.
- Fix: Added string-based query memo dependency and a state equality guard before applying URL-derived config.
- Status: Resolved.

### Bug: Turbopack as default dev runtime can cause high resource usage on this project/setup
- Context: User-reported sustained RAM/CPU spikes during normal dev usage.
- Symptom: `next dev` (Turbopack default on Next 16) is reported to exhaust system resources.
- Root cause: Runtime/tooling-level behavior with Turbopack in this environment.
- Fix: Changed default script to `next dev --webpack`; kept opt-in `dev:turbo` script for explicit Turbopack runs.
- Status: Mitigated.

### Anti-pattern to avoid
- Do not keep Turbopack as the default dev server when team machines show repeatable resource exhaustion; prefer Webpack default and make Turbopack opt-in.

### Blocker: Vitest startup fails with ESM/CJS loader mismatch
- Context: Running `npm test` to validate runtime/config edits from this session.
- Symptom: Vitest failed at startup with `Error [ERR_REQUIRE_ESM]: require() of ES Module .../vite/dist/node/index.js from .../vitest/dist/config.cjs not supported`.
- Root cause: Toolchain module-format mismatch in current local dependency/runtime combination (not introduced by this change set).
- Status: Unresolved in this pass; test verification was blocked.
- Antipattern: Treating app-level changes as the cause when the failure happens before tests execute due to runner/toolchain loading.

### Bug: Component test selector drift after UI label rename
- Context: Running `npm test` after Figma-style UI updates.
- Symptom: `meetupControls` test failed to find label `Location`.
- Root cause: UI label text was intentionally changed to `Event Location` to match mockup.
- Fix: Updated test query to use `Event Location`.
- Status: Resolved.

### Bug: Recharts Tooltip formatter typing after combined chart refactor
- Context: Running `npm run build -- --webpack` after merging two charts into one dual-axis chart.
- Symptom: TypeScript error on tooltip formatter callback due to strict `name` parameter typing.
- Root cause: Formatter callback used explicit narrow parameter types that did not match Recharts' optional signature.
- Fix: Removed explicit callback parameter types and normalized label with `String(name ?? "")`.
- Status: Resolved.

### Bug: Meetup controls tests failed after button label rename
- Context: Running `npm test` after compact control-bar refactor.
- Symptom: `tests/meetupControls.test.tsx` could not find submit button name `Update Forecast`.
- Root cause: UI button label changed to `Update` while tests still asserted old text.
- Fix: Updated test button queries to use `Update`.
- Status: Resolved.

### Anti-pattern to avoid
- After UI text refactors, avoid hard-coded outdated control labels in tests; either update assertions in the same change or use resilient role/name patterns when copy is expected to evolve.

### Warning: Next dev lock conflict while running Playwright iteration
- Context: Starting a fresh `npm run dev` to capture Playwright screenshots.
- Symptom: Next reported `.next/dev/lock` already held and aborted startup on fallback port.
- Root cause: Another `next dev` instance was already running in the project.
- Fix: Reused the active server on `http://localhost:3000` for screenshot iteration instead of forcing a restart.
- Status: Resolved.

### Blocker: Vitest worker startup fails due transitive ESM/CJS incompatibility
- Context: Running `npm test` after adding weather decision support for feels-like/snow/sun events.
- Symptom: Vitest starts, then every worker fails with `ERR_REQUIRE_ESM` from `html-encoding-sniffer` requiring `@exodus/bytes/encoding-lite.js`.
- Root cause: Dependency graph module-format mismatch in the current local test runtime (worker bootstrap failure before project tests execute).
- Status: Resolved in later audit pass by pinning `jsdom` to `26.1.0`.
- Antipattern: Assuming feature-code regressions when failures occur during worker/bootstrap dependency loading before any app test executes.

### Blocker: Lint script no longer valid with current Next CLI
- Context: Running `npm run lint` as part of feature validation.
- Symptom: Script exits with `Invalid project directory provided, no such directory: .../Weather_app/lint`.
- Root cause: `next lint` is not accepted in the current Next CLI behavior for this project/version combination; the subcommand is treated as a path argument.
- Status: Resolved in later audit pass by migrating to direct ESLint config/script.
- Antipattern: Keeping legacy `next lint` scripts after major Next upgrades without confirming CLI support and command semantics.

### Bug: Vitest worker bootstrap incompatibility with `jsdom@28` on local Node runtime
- Context: Full test run during final interview-readiness audit.
- Symptom: All test workers failed before execution with `ERR_REQUIRE_ESM` via `html-encoding-sniffer` requiring `@exodus/bytes/encoding-lite.js`.
- Root cause: `jsdom@28` dependency stack expects newer Node engine behavior than current local runtime.
- Fix: Pinned `jsdom` to `26.1.0` via npm.
- Status: Resolved.
- Antipattern: Upgrading infra dependencies (test runners/DOM envs) without checking their engine requirements against the pinned Node runtime.

### Bug: Build path defaulted to Turbopack despite repo preference and resource constraints
- Context: Build verification during the same audit.
- Symptom: `next build` used Turbopack by default; user requirement is to avoid Turbopack due memory usage.
- Root cause: `scripts.build` still pointed to plain `next build`, which resolves to Turbopack on Next 16.
- Fix: Set `scripts.build` to `next build --webpack` and removed `dev:turbo`.
- Status: Resolved.
- Antipattern: Leaving optional high-resource runtimes available in scripts when the team has already standardized on a lower-resource baseline.

### Bug: Lint workflow broken for Next 16 CLI
- Context: Audit verification pipeline (`lint`, `typecheck`, `test`, `build`).
- Symptom: `next lint` no longer works as a stable lint entrypoint in this project; command interpreted as invalid directory.
- Root cause: Legacy script and missing ESLint flat config after framework/tooling changes.
- Fix: Switched lint script to `eslint . --max-warnings=0`, installed `eslint` + `eslint-config-next`, and added `eslint.config.mjs`.
- Status: Resolved.
- Antipattern: Treating linting as a framework subcommand concern instead of owning a first-class ESLint configuration in the repo.
