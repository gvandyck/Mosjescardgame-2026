---
phase: 34-account-starter-deck-onboarding
plan: 01
type: execute
status: complete
requirements: [ONBOARD-02, ONBOARD-03, ONBOARD-04]
files_created:
  - src/data/playerFacingDecks.js
  - src/multiplayer/expandDeckToCardIds.js
  - src/multiplayer/resolveActiveDeck.js
  - src/multiplayer/claimStarterDeck.js
  - tests/data/duo-deck-validity.test.ts
  - tests/data/player-facing-decks.test.ts
  - tests/multiplayer/expand-deck-to-card-ids.test.ts
  - tests/multiplayer/resolve-active-deck.test.ts
  - tests/multiplayer/claim-starter-deck.test.ts
files_modified:
  - src/multiplayer/userStore.js
  - src/multiplayer/accountSetup.js
---

# Phase 34 Plan 01: Starter-Deck Data + Storage Foundation Summary

**One-liner:** Player-facing duo-deck accessor, pure multiset expander/resolver,
claimStarterDeck (save + setActive + exact-count grant), activeDeckId accessors in
userStore, and removal of the stale Digital Control auto-seed — all unit-tested, no UI.

## What was built

The complete data + storage layer the onboarding modal (34-02) and lobby rewiring
(34-03) will sit on:

- **src/data/playerFacingDecks.js** — `getPlayerFacingDecks()`, THE single source of
  truth for decks players may see. Explicit whitelist of the 5 duo ids
  (`DUO_COERT_BINTI`, `DUO_GANDOE_MICHELLE`, `DUO_CHRIS_YOURI`, `DUO_JISCA_ALYSSA`,
  `DUO_WEST_CLESS`) filtering `STARTER_DECKS` — NOT a prefix match. The 3 originals
  stay in `starterDecks.js` untouched (bot/test fixtures) and are never returned.
- **src/multiplayer/expandDeckToCardIds.js** — pure: deck def → flat cardIds[] multiset
  (mosjes + piecies + snellePiecies + places + quests, in that order), duplicates
  PRESERVED, `?? []` guards on missing sub-arrays. Every duo deck expands to 19 cards.
- **src/multiplayer/resolveActiveDeck.js** — pure: `(decks, activeDeckId)` → matching
  deck, else `decks[0]` (migration-safe default), else `null` when no decks.
- **src/multiplayer/claimStarterDeck.js** — `claimStarterDeck(uid, deck)` runs, in
  order: `saveDeck` → `setActiveDeckId(deck.id)` → `addCardsToCollection(exact multiset)`.
  Fails fast (later steps skipped) if an earlier step fails. Uses
  `addCardsToCollection` (exact counts), NEVER `seedCollection`.
- **src/multiplayer/userStore.js** — added `getActiveDeckId(uid)` (null when
  absent/not-ready) and `setActiveDeckId(uid, deckId)` (merge-`update` on
  `users/{uid}/profile` so displayName/lastSeen stay intact; never `set`s the whole
  profile). Same guard/try-catch/logUserStoreError style as the existing exports.
- **src/multiplayer/accountSetup.js** — deleted the stale
  `DIGITAL_CONTROL_STARTER_CARDS` constant (28 stale ids, e.g. `mosje_martin_historian`)
  and the `seedCollection` import + call. New accounts now receive NO cards on first
  login. Wallet seeding (0 Munten), displayName write, and setup-complete flag are
  byte-for-byte unchanged.

## Tests (TDD, fail-first proven per task)

433 tests / 40 files before → **464 tests / 45 files after** (+31 tests, all green).

1. `tests/data/duo-deck-validity.test.ts` (6) — every card id in all 5 duo decks
   resolves against MOSJES/PIECIES/SNELLE_PIECIES/PLACES/QUESTS. Guard proven: a
   temporary bogus id in DUO_COERT_BINTI made it fail; restored → green.
2. `tests/data/player-facing-decks.test.ts` (6) — exactly 5 decks, all `DUO_`, the
   exact expected id set, never the 3 originals, STARTER_DECKS order, full deck defs.
3. `tests/multiplayer/expand-deck-to-card-ids.test.ts` (6) — length 19,
   3x `piecie_kannetje_melk` for DUO_COERT_BINTI, concat order, all 5 duo decks = 19,
   missing sub-arrays, no mutation.
4. `tests/multiplayer/resolve-active-deck.test.ts` (6) — match / null-id→first /
   unknown-id→first / empty→null / null-decks→null.
5. `tests/multiplayer/claim-starter-deck.test.ts` (7) — `vi.mock`s userStore +
   collectionStore (no real Firebase): exact 19-card multiset with 3x Kannetje, strict
   saveDeck→setActiveDeckId→addCardsToCollection call order, `{success:true}`,
   fail-fast when saveDeck fails, guards on missing uid/deck.

## Verification (all green)

- `node --check` on all 6 changed/new src .js files — clean.
- `npm test` — 464 passed (45 files), zero regressions; the existing
  PHYSICAL_FORCE/DIGITAL_CONTROL/ARTISTIC_RHYTHM tests (deck-balance.test.ts etc.)
  untouched and passing.
- No simulation run needed (no MP/quest/level logic touched).

## Commits

| Commit | Type | Content |
| ------ | ---- | ------- |
| 2601ddf | test | failing tests: player-facing accessor + duo-deck validity |
| 5bc7a8f | feat | getPlayerFacingDecks() whitelist accessor |
| a8fe7fc | test | failing tests: expander + resolver |
| 00197b2 | feat | expandDeckToCardIds + resolveActiveDeck (pure) |
| ebaa286 | test | failing test: claimStarterDeck via mocked stores |
| 6c82ba0 | feat | claimStarterDeck + get/setActiveDeckId + auto-seed removal |

## Deviations from Plan

None — plan executed exactly as written. (Note: `userStore.js` grew past the ~80-line
guideline, but the plan explicitly directed adding both accessors to the existing
store module to follow its established multi-export pattern.)

## TDD Gate Compliance

All three tasks: RED commit (failing test) → GREEN commit (implementation). No
refactor commits needed.

## What 34-02 (onboarding modal) and 34-03 (lobby) need to know

- Import `getPlayerFacingDecks()` from `src/data/playerFacingDecks.js` for EVERY
  player-facing deck list (onboarding picker, guest dropdown, bot pool). Never filter
  STARTER_DECKS directly.
- On pick: `await claimStarterDeck(uid, deck)` → `{ success, error? }`. It already
  does save + setActive + exact grant; the modal only needs the 0-saved-decks trigger
  gate and UI.
- Lobby active-deck resolution: `resolveActiveDeck(await loadUserDecks(uid), await
  getActiveDeckId(uid))` — handles the missing-activeDeckId migration case (returns
  first deck) and returns null for deckless users (the onboarding trigger condition).
- `setActiveDeckId(uid, deckId)` returns `{ success }` like `saveDeck` — the deck
  switcher can await + surface errors.
- The live activeDeckId persistence round-trip (Firebase write → reflected at game
  start) is deliberately NOT unit-tested (stores are mocked project-wide); 34-03's
  Playwright switcher spec must prove it.
- `seedCollection` still exists in collectionStore.js but now has zero callers in src;
  it remains available for tests/tools. Do not use it for grants.

## Known Stubs

None — all new functions are fully wired; no placeholder data paths.

## Threat Flags

None — no new network endpoints or trust-boundary surface beyond the plan's threat
model (client writes under own uid, covered by T-34-01/02/03 dispositions).

## Self-Check: PASSED

All 10 created/claimed files exist on disk; all 6 task commits present in git log.
