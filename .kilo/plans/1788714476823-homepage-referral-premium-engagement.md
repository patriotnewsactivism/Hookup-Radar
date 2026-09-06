# Surge: Catchy Homepage, Referral Economy, Premium Perks, and Signup Fixes

## Goal

Make SURGE's landing page and onboarding a high-desire funnel, launch a complete referral + premium-time economy (earned strictly by engagement — no payments), ship the maximal feature set with real gating, fix all signup/use bugs, and educate users to scroll the landing page.

## Decisions (confirmed with user)

- **Economy**: tiered premium-time. Reward grants add days to `surge_users.premium_until` (max(now, existing) + days) and set `is_premium`. No Stripe/real payments.
- **Invite delivery**: share sheet (navigator.share, SMS/WhatsApp/mailto, copy-link) **and** real branded email via a new Supabase Edge Function (`send-invite`) using Resend.
- **Scope**: Maximal build — core redesign + full premium gate set + Nearby Today feed, Vibe Rooms (spot threads), event RSVP in-app notifications.

## Architecture constraints (must not break)

- All client data access goes through `src/lib/surgeApi.ts`; never import `convex/react` in `src/`.
- No react-router: navigation is the view-state machine in `src/App.tsx` + `BottomNav`; add `'discover'` to `AppView` in `src/types/index.ts` if a new tab is added.
- Supabase schema is cloud-managed and the repo has **no migrations** — add `supabase/migrations/NNNN_*.sql` as the new source of truth, applied via `bunx supabase db push` (or dashboard SQL editor). Deno edge function lives in `supabase/functions/send-invite/` and is excluded from `tsconfig`/Biome (it is not part of frontend toolchain).
- Secrets: `RESEND_API_KEY` is a **Supabase secret** (set via dashboard/CLI), never VITE_-prefixed, never committed. History secret scans (gitleaks + `scripts/check-known-credential-history.py`) reject leaked credentials.
- CI gates `git grep` for `VITE_IS_PREVIEW|VIKTOR_SPACES_IS_PREVIEW|@test\.local` — never reintroduce.
- `tests/demo-test.ts` and `scripts/auth.ts` pin exact UI strings ("Get Started Free", "Sign In", nav buttons "Map/Explore/Spots/Chats/Me", "Let's set you up"). Copy changes require updating these in the same PR (they are source files CI reads).
- `tests/release-contract.test.ts` pins specific source files (`TestUserLoginSection.tsx`, `convex/*`, `ErrorBoundary.tsx`) — do not rename those files.

## Phase 0 — Trust integrity + signup bug fixes (land first, all in one PR)

1. **Kill fake-profile problem (`src/lib/bots.ts` + `src/hooks/useNearbyUsers.ts:119-141`)**: stop interleaving bot profiles (marked `is_verified: true`, "never reveal bot status", AI chat replies) into the real grid — it directly contradicts the landing claim of real verified profiles and is the #1 hookup-app complaint. New policy: bots appear **only** as an explicit, clearly-labeled "Demo area" (never verified, no chat replies) when zero real users are nearby, gated by a "Fill grid with demo profiles" toggle. Default: off.
2. **Real photo upload**: Onboarding (and Profile photo edits) currently save a blob URL that vanishes on reload (`OnboardingPage.tsx:120-123`). Wire through the existing `media.upload`/`getPublicUrl` path in `surgeApi.ts` (storage bucket `medium`/`MEDIA_BUCKET` already referenced) → set `photo_url`/`photo_urls` from the public URL; drop preview-blob fallback.
3. **Email confirmation handling**: Supabase may send confirmation emails; current flow pretends sign-in succeeded. Keep instant access (don't block conversion) but show a non-blocking banner when `email_confirmed_at` is null: "Verify your email → +1 free Premium day" (reward via ledger). `AuthContext.mapProfile` exposes the flag.
4. **Location at signup**: `users.create` forces `lat/lng: 0,0` (`surgeApi.ts:156`). Add a location/privacy step to onboarding using `useLocation.ts` (geolocation with retry + graceful "skip, set later").
5. **Inline username availability**: typeahead check in onboarding step 1 (reuse the `users.create` uniqueness query as a `users.checkUsername` API).
6. **Right Now correctness**: stop deriving state from `looking_for` includes ('Right Now'); add explicit `right_now_until` column + one-tap toggle (see Phase 4).
7. **Theme unity**: landing/onboarding use purple/pink gradients while the app is navy/gold (see `src/index.css` token overrides). Convert landing/onboarding to `var(--bg-*)`, `var(--accent)`, gradient gold → deep navy.
8. **Empty grid → referral CTA**: replace bot-fill empty state in `GridPage.tsx:237` with an "Invite friends — earn Premium" card (calls Phase 3 share flow).

## Phase 1 — Landing page redesign (high desire + scroll education)

Sections in order (mobile-first, max-w-lg, navy/gold):

1. **Hero** (full viewport): animated phone mockup (pure CSS/framer; pulsing grid, Right Now cards — no live data), rotating taglines (existing `TAGLINES`), dual CTA "Join Free — 7 Days Premium" / "Sign In", floating trust chips (Real profiles · No data selling · 18+). **Scroll education**: persistent "See everything ↓" pill + scroll-progress bar + auto-advancing "What's in Surge" ticker right under the fold that proves there's more.
2. **Sticky mini-nav** (after scroll): Join / Features / Rewards / Premium / FAQ anchors.
3. **Feature deck** — from the full menu (Phase 5 table), grouped into three lanes: **Proven** (Grindr/Sniffies-style), **Complaint solvers**, **New & exclusive**. Each card: live-style CSS preview (reuse existing `FEATURES` preview pattern), "Free / Premium" tag, "Coming next" for teasers. Copy avoids fake claims (stats reworded truthfully; bot handling means "100% real profiles" becomes honest).
4. **Referral/mission section**: 3-tier reward ladder visuals (Send invite → +1 day; Friend joins → +7 days both; Friend stays 30 days → +30 days + exclusive Rebel badge); live code entry field ("Got a friend code? Unlock 7 Free Days"); desktop email-invite mini-form (calls Edge Function).
5. **Premium showcase**: gated features with Crown locks + "Earn it free — just be active" streak explainer (day 3/7/14/30 cards).
6. **Social proof**: live-style activity ticker ("Alex is Right Now · 0.4 mi"), testimonials (existing), truthful stats.
7. **FAQ** answering complaints (safety, fake profiles, spam, privacy) + footer.
8. **Bottom CTA + above-the-fold convergence**: hero CTA scrolls to the deck; bottom CTA returns to signup.

Implementation note: keep exported component name `LandingPage`; refactor `AuthForm` (signin/signup) into the header sticky CTA and the auth modal with referral-code field pre-filled from `?ref=`.

## Phase 2 — Onboarding redesign (desire + conversion)

7-step wizard (replaces the 5 current steps), gamified progress ("3 steps from people tonight"):

1. **Referral kickoff**: if `?ref=`/code present → "You're getting 7 free days from @inviter"; else "Got a friend code?" entry (applies via `referrals.applyRefCode`). Auto-grants trial premium notice.
2. **Identity**: username (inline availability), display name, age.
3. **Body**: existing fields + vibe chips (masc/fem/vers-display).
4. **Desires**: existing looking_for/kinks/fantasies.
5. **Right Now intro**: one-tap explainer → enables `right_now_until = now + 2h` on finish (first activation free).
6. **Photo**: real storage upload, gallery-style picker, "Add 2nd photo" incentive (+2h premium if ≥2 photos, gated through rewards), optional skip.
7. **Location + privacy**: geolocation, show_on_map / show_distance toggles, **Incognito shown as locked premium feature** (fake-locked toggle that fires the premium upsell).
8. **Finish + invite moment**: welcome screen + immediate share sheet CTA ("Invite 1 friend → +7 days") + premium timer display.

Keep `users.create` signature compatible (add optional `referral_code` arg); `release-contract` and `auth.ts` strings ("Let's set you up") updated in same PR.

## Phase 3 — Referral system (backend + full UI)

### Supabase migrations (`supabase/migrations/`)

- `surge_invites`: id, inviter_id (→ surge_users.id), invite_code, recipient_email, channel ('share'|'sms'|'whatsapp'|'mailto'|'email'), status ('sent'|'signed_up'), reward_granted, created_at. RLS: inviter-read-write own rows.
- `surge_reward_ledger`: id, user_id, type ('invite_send'|'referral_signup'|'referral_30d'|'streak'|'verified_email'|'profile_complete'|'boost'), value_days, reason, granted_at.
- `surge_profile_views`: id, viewer_id, viewed_id, viewed_at (flagship "Who viewed you").
- `ALTER surge_users ADD`: `referral_code text unique`, `referrer_id uuid`, `total_invites_sent`, `total_referrals`, `total_free_days_earned`, `current_streak`, `last_active_date date`, `right_now_until timestamptz`, `boost_expires_at timestamptz`, `badges text[]`, `email_confirmed_at`.
- `SECURITY DEFINER` functions (all rewards flow through these — client can call RPC, server enforces guards):
  - `surge_grant_premium(uid, days)` — idempotent merge into `premium_until`; inserts ledger row.
  - `surge_handle_referral_signup(new_uid, code)` — validates code once (`referrer_id` null guard), sets referrer_id, grants +7 days to **both**, marks matching `surge_invites` signed_up, increments counters.
  - `surge_record_streak(uid)` — 1/day guard via `last_active_date`, updates streak, auto-grants streak rewards at 3/7/14/30 days (hours/days).
  - `surge_record_invite(uid, channel)` — daily cap (10/day), grants +1 day, logs `invite_send`.
- Lazy 30-day milestone: computed in `referrals.stats()` when the hub opens (guard on a `milestone_checked_at` column) — no pg_cron infra.

### Edge Function `supabase/functions/send-invite/`

Deno + Resend: verifies Supabase JWT, validates recipient email, looks up sender referral code, sends branded invite email (`https://surgeonline-wtpnews.netlify.app/?ref=CODE`), inserts `surge_invites` row `status='sent'`, triggers `surge_record_invite` (email channel). Excluded from frontend typecheck/Biome.

### `src/lib/surgeApi.ts` additions (`referrals` + `premium` namespaces)

- `referrals`: `myCode()`, `stats()`, `applyRefCode(code)`, `recordInviteSent({channel})` (lightweight RPC → +1 day), `sendEmailInvite({email, message})` (calls Edge Function URL from `import.meta.env.VITE_SUPABASE_FUNCTIONS_URL`), `getViews()`/`getMyViewers()`.
- `premium`: `status()` → { active, until }, `grant(days)` (used by rewards), `touchActivity()` (daily streak ping, guarded server-side).
- Update `users.create` to accept `referral_code` and call `surge_handle_referral_signup`.
- `PUBLIC_USER_COLUMNS` gains `right_now_until`, `badges`, `boost_expires_at` — never `referral_code`/`referrer_id`/emails.

### UI

- `InviteFriends` component (ProfilePage premium tab + Settings + post-onboarding screen): big code/link card, copy-link, share sheet, SMS/WhatsApp/mailto deep links with `?ref=CODE`, email-invite form, milestone ladder with live progress, toast celebration on every grant ("+1 day Premium ⚡").

## Phase 4 — Premium + engagement economy (real gates)

- `usePremium()` hook + real `PremiumGate` replacing the `PremiumUpsell` stub; ProfilePage premium tab becomes real (status card, earn options, locked list).
- **Streak engine**: `premium.touchActivity()` on app open; rewards at 3/7/14/30 consecutive days; "weekly streak = 2h premium".
- **Right Now redesign**: one-tap toggle sets `right_now_until = now+2h`; pinned + pulsing in grid/map (existing styles); free: 30-min cooldown; premium: no cooldown, 24h duration. `RightNowFeed` filters on `right_now_until > now` instead of `looking_for`.
- **Gated feature set (all real)**:
  - Incognito (`is_anonymous`) — premium only.
  - Who Viewed You — new `surge_profile_views` recording (server-side insert in `incrementViews`); free shows latest 3, premium full list.
  - Profile Boost — `boost_expires_at`; ordering rule in `users.getNearby` (boosted first); earnable via streaks.
  - Unlimited albums/photos — free capped at 3 photos / 1 album (gate in `media` functions).
  - Ad removal — already gated on `is_premium` (`GridPage` AdCard) ✓ keep.
  - Exclusive badges (`badges[]`): Referral "Rebel" (+5 referrals), streak badges Bronze/Silver/Gold/Surge, "Verified email".
  - Profile-completeness bonus (+3 days at 100%, evaluated at onboarding finish).
- **Nearby Today feed**: `users.getActiveNearby` (last 2h active, radius) → new `DiscoverPage`; add `'discover'` to `AppView`; surface as a segmented control in the Grid tab header ("Nearby | Right Now | Today") rather than a 6th nav button.
- **Vibe Rooms**: upgrade `surge_spot_messages` to threads with attendee presence (RSVP count from `surge_spot_rsvps`); room UI on Spot cards; quality cap = active RSVPs.
- **Event RSVP notifications**: insert `surge_notifications` on RSVP add/cancel (in-app only; out-of-app push is a teaser).

## Phase 5 — Feature menu (single source of truth for landing copy)

| Feature | Source | Status |
|---|---|---|
| Live Radar Map / grid | Grindr/Sniffies | exists |
| Right Now one-tap + timer | Grindr | rebuild (P4) |
| Tap-to-message, photos, read receipts | Grindr | exists |
| Who Viewed You | Grindr (most-wanted) | build (P4) |
| Incognito | Grindr/Sniffies | gate (P4) |
| Profile Boost / priority placement | Grindr | build (P4) |
| Spots + events + RSVP | Sniffies | exists + notify (P4) |
| Favorites / albums | Grindr | exists |
| Verified-by-selfie badge | complaint: fake profiles | teaser (needs moderation infra) |
| No bots in grid | complaint: fake profiles | build (P0) |
| Trust ratings + showed-up % | complaint: ghosting/flaking | exists |
| SafeWord + check-in + coarse coords | complaint: safety | exists |
| Spam control (cold-message limits non-premium) | complaint: spam | teaser |
| Icebreaker Prompt Pack | wanted | exists (`IcebreakerPrompt`) + expand (P2) |
| Vibe Rooms (spot group threads) | new | build (P4) |
| Nearby Today feed | new (Sniffies-ish) | build (P4) |
| Streak rewards | wanted/engagement | build (P4) |
| Referral ladder + codes + instant email invite | request | build (P3) |
| AI bio/photo suggestions, group video, out-of-app push | new | teaser only ("on the roadmap") |

Teasers must be honestly labeled; never claim they exist.

## Phase 6 — Validation & rollout

1. **PR 1** (Phase 0): bots, photo upload, email-confirm, username check, location step, Right Now column migration, theme unity, empty-state CTA.
2. **PR 2** (Phase 3): migrations + functions + `referrals` API + `InviteFriends` + landing referral section. Apply SQL to prod **before** frontend deploy; deploy edge function; set `RESEND_API_KEY`; manual test email.
3. **PR 3** (Phase 4): premium gates, streaks, Right Now, Views, Discover, Vibe Rooms, notifications.
4. **PR 4** (Phase 1+2): landing + onboarding redesign, demo/auth test string updates.
5. **Tests**: update `tests/demo-test.ts`, `scripts/auth.ts`, and add `tests/release-contract.test.ts` cases: bots not interleaved by default (source-assert on `useNearbyUsers.ts`), bot rows never `is_verified`, `PUBLIC_USER_COLUMNS` excludes referral fields, `PremiumUpsell` no longer a stub.
6. **Commands**: `bun run typecheck && bun run test:unit && bun run build` locally (expect documented Windows `check` failures on main — unchanged); e2e `bun run demo-test` with `E2E_TEST_EMAIL/PASSWORD`; `bunx supabase db push`, `bunx supabase functions deploy send-invite`.
7. **Release**: Netlify `workflow_dispatch` on main after all PRs; post-deploy manual walkthrough of signup → photo → referral → reward → premium timer.

## Risks

- **Economy abuse**: all grants are server-guarded (`SECURITY DEFINER` + unique/referrer/count/daily guards); client RPCs can fail closed.
- **Test string pins**: any landing/onboarding copy change must update `demo-test.ts`/`auth.ts` assertions in the same PR or CI/e2e fails.
- **Migration/db drift**: repo currently has no migrations; from now on `supabase/migrations/` is canonical and must be applied before the frontend deploy that references new columns (additive-first).
- **Windows `bun run check`**: known main-branch failure (biome.json CRLF + `convex/_generated` lint) — leave unfixed this milestone.
- **Scope size**: maximal build is large; phases land as 4 reviewable PRs, each leaving the app working.

## Out of scope

Payment/Stripe, out-of-app push notifications, AI-generated bios/photo suggestions (teased only), selfie-verification pipeline (teased only), supabase/edge-function CI coverage (manual checklist instead).