---
phase: 11-bot-opponent
plan: 02
subsystem: ui
tags: [offline, bot, sessionStorage, lobby, javascript]

# Dependency graph
requires: []
provides:
  - "Offline checkbox in lobby form (index.html id='play-offline')"
  - "Offline submit branch in initLobbyPage() that writes mosjes:offline to sessionStorage"
  - "Navigation to game.html?offline=true&player=player_1 when offline checkbox checked"
affects: [11-03-offline-game-init, 11-04-bot-driver]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Offline branch short-circuits Firebase path in form submit handler by checking checkbox before any network code"
    - "Bot deck picked as random element from STARTER_DECKS filtered to exclude human's deckId"

key-files:
  created: []
  modified:
    - index.html
    - src/main.js

key-decisions:
  - "Offline branch placed before mode === 'join' guard so it short-circuits Firebase entirely"
  - "Bot deck selection: filter STARTER_DECKS by id !== humanDeckId, pick random; fallback to STARTER_DECKS[0]"
  - "sessionStorage key 'mosjes:offline' stores name, deckId, botDeckId, playerId='player_1'"

patterns-established:
  - "Pattern: offline mode entry always sets sessionStorage 'mosjes:offline' before navigation — game page reads this key to detect offline mode"

requirements-completed: [BOT-02, BOT-03]

# Metrics
duration: 8min
completed: 2026-05-31
---

# Phase 11 Plan 02: Offline Lobby Entry Point Summary

**Lobby form "Play Offline vs Bot" checkbox wired to sessionStorage + navigation bypass of Firebase**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-31T00:20:00Z
- **Completed:** 2026-05-31T00:28:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `<div class="lobby-offline">` with checkbox `id="play-offline"` between game-mode fieldset and room-code label in index.html
- Imported `STARTER_DECKS` into main.js and added offline submit branch in `initLobbyPage()` form submit handler
- Offline path: picks random bot deck different from human's deck, stores `mosjes:offline` in sessionStorage, navigates to `game.html?offline=true&player=player_1`
- Online create/join path completely unaffected — offline branch returns early before any Firebase code runs

## Task Commits

Each task was committed atomically:

1. **Task 1: Add offline checkbox to index.html** - `3429a88` (feat)
2. **Task 2: Wire offline submit branch in src/main.js** - `3273296` (feat)

**Plan metadata:** (to be added after docs commit)

## Files Created/Modified
- `index.html` - Added lobby-offline div with Play Offline vs Bot checkbox
- `src/main.js` - Added STARTER_DECKS import + offline branch in form submit handler

## Decisions Made
- Bot deck selection filters STARTER_DECKS to exclude human's deckId, then picks randomly from remaining candidates. Fallback to STARTER_DECKS[0] if all decks have the same id (impossible in current data but safe).
- The offline check runs before mode/roomCode validation — no need to validate room code when playing offline.
- sessionStorage key name `mosjes:offline` chosen to match the pattern of existing `mosjes:lobby` key for the online path.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. One minor note: `grep -c "play-offline" index.html` returns 1 (one line containing the string) rather than 2, because both `id="play-offline"` and `name="play-offline"` are on the same input element line. Both attributes are present and correct — the automated check in the plan was written assuming they might be on separate lines.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Lobby entry point complete. Plan 11-03 can now read `sessionStorage.getItem('mosjes:offline')` on game.html load to detect offline mode and initialize the game state without Firebase.
- The `botDeckId` stored in sessionStorage is ready for plan 11-03 to use when calling `createInitialGameState()`.

---
*Phase: 11-bot-opponent*
*Completed: 2026-05-31*
