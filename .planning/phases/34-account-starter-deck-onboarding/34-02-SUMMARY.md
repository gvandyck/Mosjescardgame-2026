---
phase: 34-account-starter-deck-onboarding
plan: 02
type: execute
status: complete
requirements: [ONBOARD-01, ONBOARD-02]
files_created:
  - src/ui/onboardingDeckPicker.js
  - tests/ui/onboarding-starter-deck.spec.js
files_modified:
  - index.html
  - src/main.js
---

# Phase 34 Plan 02: Blocking Starter-Deck Onboarding Modal Summary

**One-liner:** Blocking first-login duo-deck picker built on the generic
modalManager.showOptionSelect (allowCancel:false), wired into initLobbyPage's
0-decks branch -> claimStarterDeck, with a param-gated ?testOnboarding=1 hook
proven live by a 3-test Playwright spec.

## What was built

- **index.html** — added `<div id="modal-root" class="modal-root">` before the
  module script so the lobby can host modals, plus a `styles/board.css` link
  (see Deviations — the modal CSS lives there, not in main.css). Lobby form
  untouched.
- **src/ui/onboardingDeckPicker.js** (30 lines) — `showOnboardingDeckPicker(modal, decks)`:
  maps the 5 duo decks to `{ id, label: deck.name, metaLabel: <prettified Mosje names> }`
  options and awaits `modal.showOptionSelect({ title: 'Choose your starter deck',
  ..., allowCancel: false, autoSelectSingle: false })`. Pure UI-composition —
  no Firebase imports, no bespoke modal (CLAUDE.md reusable-selector rule).
  metaLabel uses `&amp;` because showOptionSelect injects metaLabel as raw HTML.
- **src/main.js** —
  - The lobby auth gate was extracted verbatim into a module-level
    `handleLobbyAuthChange(user)` (behavior unchanged) so initLobbyPage can
    branch cleanly between the real gate and the test hook.
  - **0-decks trigger:** for non-anonymous users, after
    `loadUserDecks(user.uid)`, if `customDecks.length === 0` (and the load did
    NOT error — see Deviations) the lobby blocks on `promptStarterDeckPick()`
    (inits modalManager on `#modal-root`, loops until a deckId resolves —
    defensive since allowCancel:false), then
    `await claimStarterDeck(user.uid, deck)` (34-01: save + setActive + exact
    multiset grant), then re-runs `loadUserDecks` so `_customDecksCache` and
    the dropdown-append block see the owned deck. The non-zero custom-deck
    append behavior is byte-identical.
  - **testOnboarding hook (committed test path):** `?testOnboarding=1` skips
    the auth gate and runs the SAME blocking picker against a stub claim (logs
    `[UI] testOnboarding: picked starter deck <id>`, no Firebase writes).
    Param-gated exactly like the existing testMode pattern; zero effect on real
    play, online create/join untouched.
- **tests/ui/onboarding-starter-deck.spec.js** — 3 tests driving the REAL
  lobby (gstatic + firebase-config blocked -> LOCAL mode, seedOfflineSession's
  pattern):
  1. Modal appears (`.modal-card` h3 "Choose your starter deck",
     `.modal-root--open`, backdrop present); exactly 5
     `.modal-mosje-select-btn` whose data-ids equal the 5 duo ids in order;
     none of the 3 originals; `#modal-option-cancel` absent.
  2. Clicking `DUO_JISCA_ALYSSA` empties `#modal-root`, removes
     `modal-root--open`, logs the deckId, and the lobby form is
     visible/editable again.
  3. Param OFF: the onboarding modal never appears (page follows the normal
     auth-gate redirect to account.html) — proving the trigger is what shows it.

## Verification (all green)

- `node --check` on src/main.js, src/ui/onboardingDeckPicker.js + the full
  CLAUDE.md UI set (modalManager, boardRenderer, handRenderer, logRenderer,
  actionAnimations) — clean before every commit.
- `npm test` — 464 passed / 45 files (unchanged from 34-01; zero regressions).
- `npx playwright test tests/ui/onboarding-starter-deck.spec.js` — 3/3 passed
  (14.8s, visual project, real browser).
- No MP/quest/level logic touched -> simulation not required.

## Commits

| Commit  | Type | Content |
| ------- | ---- | ------- |
| 57b3ce6 | feat | onboardingDeckPicker + lobby #modal-root + board.css link |
| 903b5f5 | feat | 0-decks blocking trigger in lobby + testOnboarding hook |
| fb0e289 | test | Playwright spec: blocking flow, 5 duo options, no cancel, pick resolves |

## Deviations from Plan

**1. [Rule 3 - Blocking] Modal CSS lives in styles/board.css, not styles/main.css**
- **Found during:** Task 1
- **Issue:** The plan states "the modal CSS already lives in styles/main.css".
  Actually `.modal-root`, `.modal-root--open`, `.modal-backdrop` positioning and
  all `.modal-mosje-select-*` rules live in `styles/board.css`, which index.html
  did not load — the modal would have rendered unstyled/in-flow.
- **Fix:** Added `<link rel="stylesheet" href="styles/board.css" />` to
  index.html (between main.css and account.css, matching game.html's order).
  Verified board.css contains no global element selectors that could restyle
  the lobby (only a mobile-media `html, body { overflow: auto }`).
- **Commit:** 57b3ce6

**2. [Rule 2 - Missing guard] Onboarding gated on a clean deck load**
- **Found during:** Task 2
- **Issue:** `loadUserDecks` returns `[]` on a Firebase read error. Triggering
  onboarding on bare `length === 0` would trap an EXISTING account (with decks)
  in the blocking picker whenever the read fails, and the subsequent claim
  writes would likely fail too.
- **Fix:** Trigger condition is `customDecks.length === 0 && !getLastUserStoreError()`
  (the error flag is reset to null on every successful load, so genuine 0-deck
  users always pass). On read error the lobby behaves as before (console warn).
- **Commit:** 903b5f5

**3. [Structural, behavior-preserving] Auth handler extracted to a named function**
- The plan implied branching inline inside initLobbyPage. Wrapping the ~50-line
  inline `onAuthStateChanged(async user => ...)` in an else-block would have
  reindented the whole handler; instead it was moved verbatim to module-level
  `handleLobbyAuthChange(user)` and initLobbyPage calls
  `onAuthStateChanged(handleLobbyAuthChange)` in the non-test branch. No
  behavior change; also nudges main.js toward CLAUDE.md's small-units rule.
- **Commit:** 903b5f5

## TDD Gate Compliance

Plan type is `execute` (not tdd) — no RED/GREEN gates required. The spec's
param-off test permanently encodes the "trigger is what shows the modal" proof
(reproduce-first discipline per the plan).

## Known Stubs

- The `?testOnboarding=1` path intentionally stubs the claim (logs the pick, no
  Firebase writes). This is the plan-mandated, param-gated test hook (threat
  T-34-05, accepted) — it is unreachable in real play and does not block any
  plan goal. No other stubs; the real 0-decks path is fully wired to
  claimStarterDeck.

## Threat Flags

None — no new surface beyond the plan's threat model. T-34-04 mitigated as
specified (picker runs inside the auth handler, allowCancel:false, defensive
re-prompt loop); T-34-05 accepted as specified (param-gated stub, no writes).

## What 34-03 (lobby rewiring) needs to know

- **Claimed-deck duplicate in the dropdown:** after onboarding, the claimed duo
  deck is saved under `users/{uid}/decks` and therefore ALSO appears under the
  "── My Decks ──" section of the legacy `#deck-select` (which still lists the
  built-in DUO_ option above it). Intentionally left as-is per the plan ("34-03
  will replace that surface; here just don't break it") — 34-03's active-deck
  panel + hidden `#deck-select` resolves it.
- **Modal hosting is ready:** `#modal-root` + board.css are now in index.html;
  the deck-switcher modal can reuse
  `initModalManager(document.getElementById('modal-root'))` (that's what
  `promptStarterDeckPick()` in main.js does) and `showOptionSelect` with
  `allowCancel: true`.
- **`handleLobbyAuthChange(user)`** in main.js is now the single place lobby
  auth-dependent UI is set up — the natural seam for the active-deck panel
  rendering and guest-dropdown filtering.
- **metaLabel is raw HTML** in showOptionSelect (`${meta}` unescaped) — escape
  or entity-encode any user-derived text placed there (onboardingDeckPicker
  uses `&amp;` for its separator).
- The Playwright hook pattern (`blockFirebase(page)` + a param-gated main.js
  branch) is reusable for 34-03's switcher/panel specs; STATE.md was not
  updated (stale since Phase 32, gsd tooling absent) — phase tracking lives in
  these SUMMARYs.

## Self-Check: PASSED

- src/ui/onboardingDeckPicker.js, tests/ui/onboarding-starter-deck.spec.js
  exist; index.html contains `id="modal-root"`; main.js contains
  `claimStarterDeck(` and the picker contains `showOptionSelect(`.
- Commits 57b3ce6, 903b5f5, fb0e289 present on
  feature/phase-34-starter-deck-onboarding.
