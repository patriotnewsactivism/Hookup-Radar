# AGENTS.md

SURGE — a mobile-first hookup app. Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui, managed with **Bun** (the only package manager; never introduce npm/yarn lockfiles). Prod deploys to Netlify (manual workflow), Vercel config also present.

## Architecture (read before editing)

- **The live backend is Supabase.** Commit `fa58e52` migrated the frontend off Convex. All data access goes through `src/lib/surgeApi.ts` — its exports deliberately mirror the old Convex function names (`users`, `messages`, `spots`, `media`, `ratings`, `reports`, `notifications`, `moderation`, `account`) — via `src/lib/supabaseClient.ts`. Do not reintroduce `convex/react` imports in `src/` components.
- **`convex/` is legacy** but still tracked and shipped; only `tests/` import it (`convex/security.ts`). `src/services/supabase.ts` is a no-op shim (dead code). `convex/_generated/` is committed — regenerate with `bunx convex dev` if you touch the schema.
- **No react-router.** Navigation is a view-state machine in `src/App.tsx` (`grid`/`map`/`chat-list`/`profile`/`spots`) with `BottomNav`; `AuthContext` gates auth → profile → onboarding.
- **`README.md` is the stale starter template.** It documents Convex as the backend, `bun run sync:build`, a preview test login, and baked-in test credentials — none of which exist. Trust `package.json` and `.github/workflows/*`.

## Commands

- `bun install` — install deps. CI then verifies `bun.lock` is canonical, so don't hand-edit it or mix bun versions.
- `bun run dev` — Vite dev server. `bun run build` — `tsc -b && vite build` (must run before previewing/tests).
- `bun run typecheck` / `bun run check` — TypeScript (passes on main) and Biome (see gotchas).
- `bun run ci` — full gate: `typecheck && check && test:unit && build`.
- `bun run test:unit` — `bun test tests` (2 files, fast).
- `bun run test scripts/demo-test.ts` — Playwright e2e. Requires a prior `bun run build` (it serves `dist/` via `vite preview` on :4173, which the script starts and stops itself, setting `APP_URL`). Requires Chromium (`bunx playwright install chromium`).
- E2E auth uses runtime env `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` (never `VITE_`-prefixed — Vite vars get bundled into client assets; `.env.example` says this). Auth state is cached in `tmp/auth-state-*.json`, TTL 50 min; delete `tmp/` to force fresh sign-in.
- `bun run logs:fetch` — tail Convex backend logs (only useful for legacy backend debugging).

## Testing quirks

- Checked-in src conventions are enforced only via CI; there is no test runner beyond the two `tests/` files.
- `tests/security.test.ts` and `tests/release-contract.test.ts` are **source-assertion tests** — they read committed source files. Renaming a file they reference (e.g. `src/components/TestUserLoginSection.tsx`) breaks them.
- `tests/release-contract.test.ts` pins: preview/test-auth markers absent from `src/components/TestUserLoginSection.tsx`, `convex/auth.ts`, `convex/seedTestUser.ts`, `convex/testAuth.ts`; `convex/surgeModeration.ts` must use `requireModerator` and never gate on `is_verified`; each `surge*.ts` module must use `requireSurgeUser`/`getAuthUserId`; `ErrorBoundary.tsx` must never render `error?.stack`.

## Security gates — CI will reject you

- Every CI run and the Netlify prod deploy `git grep` `src`, `convex`, `scripts` for `VITE_IS_PREVIEW|VIKTOR_SPACES_IS_PREVIEW|@test\.local` and fail. Never reintroduce preview/test-account backdoors (local dev test logins were removed on purpose).
- Git history is scanned on every push (`scripts/check-known-credential-history.py` + gitleaks). Production deploys are blocked while a known exposed credential remains in history; never commit secrets, and don't rewrite history to work around this.
- Netlify production deploy is `workflow_dispatch`-only, restricted to `main`, and requires `E2E_TEST_EMAIL/PASSWORD` + Netlify tokens.
- Authorization/privacy helpers live in `convex/security.ts` (and mirrored in `surgeApi.ts`): `toPublicProfile` strips PII and coarsens lat/lng to 2 decimals; the Supabase mirror whitelists columns via `PUBLIC_USER_COLUMNS`.

## Platform gotchas (Windows dev machine)

- `bun run check` currently fails on main: `convex/_generated/api.d.ts` has a Biome `noBannedTypes` lint error, and `biome.json` is flagged for CRLF vs LF formatting (repo is LF, `core.autocrlf` converts on checkout). Linux CI is unaffected by the CRLF half. `bun run format` rewrites files to LF — expect noise in `git status` afterwards.
- `bun run test:unit` fails on a clean `bun install`: tests import `@convex-dev/auth/server` (via `convex/security.ts`) but Convex deps were removed from `package.json` during the Supabase migration, so a fresh install prunes them (`bun.lock` at HEAD is stale and lists them). Requires `bun add @convex-dev/auth` or restoring `bun.lock` to proceed.
- `tsconfig.*.tsbuildinfo` files are committed; `bun run build`/`tsc -b` will dirty them — don't commit unintended diffs.