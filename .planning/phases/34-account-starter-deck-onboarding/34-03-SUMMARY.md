---
phase: 34-account-starter-deck-onboarding
plan: 03
subsystem: ui
tags: [lobby, deck-select, modal, playwright, firebase-rtdb]

# Dependency graph
requires:
  - phase: 34-account-starter-deck-onboarding (plan 01)
    provides: getPlayerFacingDecks(), getActiveDeckId/setActiveDeckId, resolveActiveDeck, claimStarterDeck
  - phase: 34-account-starter-deck-onboarding (plan 02)
    provides: #modal-root + board.css in index.html, showOptionSelect modal pattern, handleLobbyAuthChange seam, testOnboarding hook style
provides:
  - "Pure true-random bot-deck picker (src/bot/pickBotDeck.js), wired into all 3 bot-deck call sites"
  - "Guest lobby dropdown populated dynamically from getPlayerFacingDecks() (5 duo decks only, 8 hardcoded options removed)"
  - "Active-deck panel (src/ui/activeDeckPanel.js) + Change-deck switcher for signed-in users"
  - "Game start reads active deck (signed-in) or dropdown (guest); no player-facing default resolves to an original id"
  - "Two committed Playwright test hooks (?testGuestDeck=1, ?testActiveDeck=1) driving the real lobby code with no Firebase"
affects: [account, lobby, deck-builder]

tech-stack:
  added: []
  patterns:
    - "Optional dependency-injection params on setupActiveDeckPanel({getActive, setActive}) default to real store accessors — lets a test hook drive the exact production code path with in-memory stubs instead of duplicating logic."
    - "Param-gated test hooks (?testOnboarding=1, ?testGuestDeck=1, ?testActiveDeck=1) bypass the Firebase auth gate but call the REAL handler functions, never a parallel test-only implementation."

key-files:
  created:
    - src/bot/pickBotDeck.js
    - src/ui/activeDeckPanel.js
    - tests/bot/pick-bot-deck.test.ts
    - tests/ui/active-deck-lobby.spec.js
  modified:
    - src/main.js
    - index.html
    - styles/main.css

key-decisions:
  - "Two test hooks, not one: the plan only mandated ?testActiveDeck=1 for the signed-in panel; a second ?testGuestDeck=1 hook was added because the guest dropdown branch inside handleLobbyAuthChange is only reachable with a real (or faked) anonymous user object — blocking Firebase makes onAuthStateChanged call back with null (redirect to account.html), so there was no way to reach the guest branch at all otherwise."
  - "setupActiveDeckPanel(uid, decks, {getActive, setActive}) accepts optional store overrides (default to the real getActiveDeckId/setActiveDeckId) so runStubbedActiveDeck() drives the identical production code — no test-only duplicate panel/switcher logic."
  - "The switcher options passed to showOptionSelect use {id, label} only (no metaLabel) per the plan's exact literal action-step text — simpler than the onboarding picker's Mosje-prettified metaLabel."

patterns-established:
  - "Guest dropdown, bot pool, and onboarding/switcher options all read getPlayerFacingDecks() exclusively — never STARTER_DECKS directly — closing the phase-wide single-source-of-truth requirement."

requirements-completed: [ONBOARD-04, ONBOARD-05, ONBOARD-06]

duration: ~55min
completed: 2026-07-04
---

# Phase 34 Plan 03: Lobby Active-Deck Rewiring Summary

**Pure true-random pickBotDeck wired into 3 call sites, a signed-in active-deck panel + Change-deck switcher replacing the old dropdown-append, and a duo-only guest dropdown — closed by two param-gated Playwright test hooks proving the switcher's Firebase round-trip live.**

## Performance

- **Duration:** ~55 min (this session; Task 1 had already been committed by a prior session before this session started)
- **Started:** 2026-07-04 (session start; Task 1 pre-existing)
- **Completed:** 2026-07-04T00:55:00Z
- **Tasks:** 3/3 complete
- **Files modified/created:** 7 (3 new: pickBotDeck.js, activeDeckPanel.js, active-deck-lobby.spec.js; 4 modified: main.js, index.html, styles/main.css, pick-bot-deck.test.ts already existed pre-session)

## Accomplishments

- **Task 1 (pre-existing on entry, verified not re-done):** `src/bot/pickBotDeck.js` — pure `pickBotDeck(decks)`, true-random, mirror allowed, null-safe on empty/missing input. Wired into all 3 main.js bot-deck call sites (offline branch, bot-vs-bot param path, `pickOpponentDeck`). Guest `#deck-select` populated dynamically from `getPlayerFacingDecks()`; the 8 hardcoded `<option>`s removed from index.html. N1 fallback (`localDeckId || 'DIGITAL_CONTROL'`) already replaced with `getPlayerFacingDecks()[0].id`. `tests/bot/pick-bot-deck.test.ts` (5 tests, an orphaned draft from a prior cut-off session per the task brief) verified GREEN as-is — no revision needed.
- **Task 2:** `src/ui/activeDeckPanel.js` — `renderActiveDeckPanel(container, deck)`, pure DOM render of deck name + its two Mosje nicknames (bracket-name extraction with a prettified-id fallback). `index.html` gained `#active-deck-panel` (hidden by default) with name/Mosjes/`#btn-change-deck`. `styles/main.css` got minimal panel styling matching the lobby form. `main.js`'s signed-in branch now calls `setupActiveDeckPanel(uid, decks)`: hides `#deck-select` + its label, loads `getActiveDeckId` → `resolveActiveDeck`, persists a migration-safe default when `activeDeckId` was missing, renders the panel, and wires `#btn-change-deck` to a `showOptionSelect({allowCancel:true})` switcher that persists via `setActiveDeckId` and re-renders. The old "── My Decks ──" append into `#deck-select` for signed-in users is gone (replaced by the panel, per plan). Form submit now reads the tracked `signedInDeckId` for signed-in users / dropdown value for guests — the last `'DIGITAL_CONTROL'` fallback is gone.
- **Task 3:** `tests/ui/active-deck-lobby.spec.js` — 4 live Playwright tests via two new committed hooks:
  - `?testGuestDeck=1` calls the real `handleLobbyAuthChange` with a fake anonymous user object (safe — that branch makes zero Firebase calls) to prove the guest dropdown is exactly the 5 duo ids, no originals.
  - `?testActiveDeck=1` calls the real `setupActiveDeckPanel()` against 2 real seeded duo decks + a fake active id, with `getActiveDeckId`/`setActiveDeckId` injected as in-memory stubs, exposing `window.__testActiveDeckHook.signedInDeckId`. Proves: panel renders the seeded active deck + hides the dropdown; Change-deck lists exactly the seeded decks; picking a different one re-renders the panel AND updates the tracked id (what game-start would read); cancelling leaves the active deck unchanged.
  - Reproduce-first proven: stashed the Task-3 main.js changes and confirmed all 4 new tests fail (3 fail on missing DOM/hook state, 1 times out waiting for `#btn-change-deck` because the redirect to account.html never renders the lobby form) against the pre-hook code, then restored and confirmed all 4 pass.

## Task Commits

1. **Task 1: Pure pickBotDeck + guest dropdown from getPlayerFacingDecks + rewire bot pool + kill originals defaults** - `0317a3b` (feat) — completed by a prior session before this execution began; verified (not redone).
2. **Task 2: Active-deck panel + Change-deck switcher + game-start reads active deck** - `94e678b` (feat)
3. **Task 3: Playwright lobby spec (guest dropdown + LIVE active-deck switcher) + full verification** - `1aa9fcc` (test)

**Plan metadata:** this SUMMARY's commit (docs, see below).

## Files Created/Modified

- `src/bot/pickBotDeck.js` — pure true-random deck picker (mirror allowed, null-safe).
- `src/ui/activeDeckPanel.js` — `renderActiveDeckPanel(container, deck)`, pure DOM render.
- `src/main.js` — bot-deck call sites use `pickBotDeck`; guest dropdown populated from `getPlayerFacingDecks()`; signed-in lobby wired to `setupActiveDeckPanel` (panel + switcher, persists via `setActiveDeckId`); form submit reads `signedInDeckId`/dropdown never `'DIGITAL_CONTROL'`; three param-gated test hooks (`testOnboarding`, `testGuestDeck`, `testActiveDeck`).
- `index.html` — `#deck-select` emptied (dynamic population only); `#active-deck-panel` block added (hidden by default).
- `styles/main.css` — `.active-deck-panel` + child element styling.
- `tests/bot/pick-bot-deck.test.ts` — 5 unit tests (deterministic stub, full-pool sweep, no-originals, mirror-allowed, empty/null-safe).
- `tests/ui/active-deck-lobby.spec.js` — 4 live Playwright tests (guest dropdown duo-only; signed-in panel render; switcher pick + re-render + tracked id; switcher cancel is a no-op).

## Decisions Made

- Added a second test hook (`?testGuestDeck=1`) beyond the plan's mandated `?testActiveDeck=1`, because the guest branch of `handleLobbyAuthChange` is unreachable with Firebase blocked (the auth gate redirects on `user === null` before the anonymous branch ever runs). The hook calls the exact real function with a fake anonymous user object — zero Firebase calls occur on that branch (verified: `initNewAccount`/`loadUserDecks`/`claimStarterDeck` are all gated on `!user.isAnonymous`), so this is safe and adds no test-only duplicate logic.
- `setupActiveDeckPanel` takes optional `{getActive, setActive}` overrides (default to the real `userStore.js` accessors) instead of a bespoke stubbed panel-rendering function, so the `?testActiveDeck=1` hook exercises the identical production code path the real signed-in flow uses.
- Switcher options omit `metaLabel` (just `{id, label}`), matching the plan's literal action-step text — the onboarding picker's Mosje-prettified `metaLabel` pattern was intentionally not duplicated here since the plan didn't call for it.

## Deviations from Plan

**1. [Rule 3 - Blocking] Added `?testGuestDeck=1` hook — not explicitly in the plan text**
- **Found during:** Task 3
- **Issue:** The plan's Task 3 only specifies a hook for the signed-in panel (`?testActiveDeck=1`); assertion (a) (guest dropdown) implicitly assumed the guest branch was reachable via the existing `blockFirebase()` pattern. It is not — `onAuthStateChanged` calls back with `null` when Firebase is blocked, and `handleLobbyAuthChange(null)` redirects to `account.html` before the `user.isAnonymous` branch (where guest dropdown population lives) is ever reached.
- **Fix:** Added a second, equally minimal param-gated hook (`?testGuestDeck=1`) that calls the real `handleLobbyAuthChange` with a fake anonymous user object. No Firebase calls occur on that code path (verified by reading every call inside the `!user.isAnonymous` guards), so this is a safe, zero-risk addition consistent with the existing `testOnboarding` hook style ("Claude's Discretion" in CONTEXT.md explicitly permits filename/wiring choices).
- **Files modified:** src/main.js
- **Verification:** Guest dropdown assertion passes live; unit suite (469 tests) and prior Playwright specs unaffected.
- **Committed in:** 1aa9fcc (Task 3 commit)

---

**Total deviations:** 1 auto-added (test-infrastructure hook, Rule 3 — blocking, needed to make a plan-mandated assertion reachable at all).
**Impact on plan:** No scope creep — the addition only makes the plan's own required guest-dropdown assertion executable; no production (non-test) behavior changed.

## Issues Encountered

None beyond the deviation above. The orphaned `tests/bot/pick-bot-deck.test.ts` left by a prior cut-off session (per this session's task brief) was inspected and found already correct against the plan's Task 1 spec — used as-is, no revision needed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

**Phase 34 (Account Starter-Deck Onboarding & Active Deck) is now COMPLETE — all 3 plans (34-01, 34-02, 34-03) executed and verified.**

- The 5 duo decks are the sole player-facing surface across onboarding, guest dropdown, bot pool, and the signed-in switcher — all sourced from the single `getPlayerFacingDecks()` accessor (CONTEXT's core requirement).
- New accounts: 0 cards until the blocking onboarding picker (34-02) → `claimStarterDeck` grants the exact multiset + sets the active deck.
- Every signed-in game start reads `resolveActiveDeck` via the tracked `signedInDeckId`; every guest game start reads the (duo-only) dropdown. No path resolves to an original id (`DIGITAL_CONTROL`/`PHYSICAL_FORCE`/`ARTISTIC_RHYTHM`) as a player-facing default — those 3 originals remain intact in `starterDecks.js` purely as bot/test fixtures (T-34-06/07 threats mitigated/accepted as specified; unchanged from plan).
- `STATE.md`/`ROADMAP.md`/`REQUIREMENTS.md` were NOT updated by this plan (consistent with 34-01/34-02: `gsd-sdk` is not installed in this repo, and these tracking files have been stale since Phase 32 per prior SUMMARYs — phase tracking lives in the three 34-0X-SUMMARY.md files). If the user wants these reconciled, that's a manual follow-up, not a blocker for merging this branch.
- No known stubs, no new threat-surface beyond the plan's own threat model (T-34-06 mitigated: switcher options built only from the user's loaded `decks`; T-34-07 accepted: guest dropdown values only ever resolve to a valid duo/bot-fixture deck def).
- Ready to merge `feature/phase-34-starter-deck-onboarding` to `main` pending user review.

## Self-Check: PASSED

All 5 created/claimed files exist on disk (pickBotDeck.js, activeDeckPanel.js,
pick-bot-deck.test.ts, active-deck-lobby.spec.js, this SUMMARY). All 3 task
commits (0317a3b, 94e678b, 1aa9fcc) present in `git log` on
`feature/phase-34-starter-deck-onboarding`.

---
*Phase: 34-account-starter-deck-onboarding*
*Completed: 2026-07-04*
