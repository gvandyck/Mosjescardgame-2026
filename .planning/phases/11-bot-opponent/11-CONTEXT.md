---
phase: 11
name: Bot Opponent
status: context-captured
date: 2026-05-31
---

# Phase 11 — Bot Opponent: Context

## Domain

Add a basic AI (heuristic bot) opponent so players can play a full game offline against the computer. The bot calls the same engine action functions (`playPiecie`, `activatePiecie`, `attemptGeneralQuest`, `activatePlace`, `useMosjeAbility`, `endTurn`) that a human player calls. No ML, no tree search — simple priority-based heuristics. Offline mode bypasses Firebase entirely; the game runs as a local state machine in the browser.

---

## Canonical Refs

- `src/engine/turnManager.js` — All action functions the bot calls; also `canPlayerActNow`, `startTurn`, `endTurn`, `phaseDrawCard`
- `src/multiplayer/syncManager.js` — Online sync; offline mode must not call pushState
- `src/multiplayer/roomManager.js` — createRoom/joinRoom; offline bypasses these
- `src/main.js` — Lobby form (create/join room); "Play Offline" checkbox goes here
- `src/abilities/questLogic.js` — `canAttemptGeneralQuest`, `canAttemptPersonalQuest` — bot uses these to guard quest attempts
- `docs/developer-handoff.md` — Architecture overview
- `docs/phase0-rulings.md` — Canonical game rules

---

## Decisions

### 1. Offline mode entry point

**Decision:** Add a "Play Offline vs Bot" checkbox to the lobby form in `src/main.js`. When checked, clicking "Create Room" skips Firebase entirely and navigates directly to `game.html` with a special URL param (`?offline=true&player=player_1`). The game page detects this param and initialises a local game state without touching syncManager.

### 2. Bot player identity

**Decision:** Bot is always `player_2`. It picks a random starter deck (from `STARTER_DECKS`). Its name is "Bot". The human is always `player_1`. Game state is initialised the same way as a multiplayer game — same `createInitialState()` call — just never pushed to Firebase.

### 3. Bot turn driver

**Decision:** After the human calls `endTurn`, the game page detects that `activePlayerId === 'player_2'` and `offlineMode === true`, then runs `driveBotTurn(gameState)` after a 600ms delay (so the human can see the board before the bot acts). `driveBotTurn` is a pure function in `src/bot/botDriver.js` that runs the bot's full turn synchronously and returns the final state.

### 4. Bot heuristic logic (priority order)

**Decision:** Bot follows this priority order each turn:
1. **Play a Piecie from hand** — if hand contains Piecie cards and Piecie slots are available, play the first one (face-down)
2. **Activate a Piecie already on the field** — if a Piecie has been on the field for ≥1 turn (can be activated), activate it
3. **Attempt a Quest** — if `canAttemptGeneralQuest` returns true for any available quest, attempt the first one; also attempt Personal Quest if available
4. **Play a Place card** — if hand contains a Place card, play it
5. **Use Mosje ability** — if `abilityUsedThisTurn` is false and the active Mosje has an ability, use it
6. **End turn** — always ends turn after exhausting the above

Bot does NOT: play Snelle Piecies (deferred), manage hand size strategically, or read opponent state for decisions.

### 5. Bot file location

**Decision:** `src/bot/botDriver.js` — a single pure function file. Takes `gameState` and returns a new `gameState` after the bot's full turn. No imports from multiplayer code. Imports engine functions from `turnManager.js`.

### 6. Offline game state management

**Decision:** The game page (`game.html` / its JS) holds the game state in a local variable instead of listening to Firebase. After each action (human or bot), it re-renders the UI from the local state. The syncManager is not initialised in offline mode.

### 7. Win condition and result screen

**Decision:** After every state mutation (human action or bot turn), check `state.status === 'GAME_OVER'` and `state.winnerId`. If the game is over, show the existing result screen (or a simple alert if the result screen doesn't exist yet). No leaderboard update in offline mode.

---

## Deferred Ideas

- **Bot difficulty levels** — easy/medium/hard heuristics (deferred; start with one level)
- **Bot plays Snelle Piecies** — interrupt logic is complex; bot ignores Snelle Piecies for now
- **Bot deck selection UI** — player picks bot's deck; deferred, bot always uses a random starter deck
- **Animated bot "thinking"** — visual delay / typing indicator; deferred, a flat 600ms delay is enough
- **Bot vs Bot simulation** — useful for testing; can be added to the simulation runner separately

---

## Code Context — Reusable Assets

- `createInitialState(players, decks)` in `turnManager.js` — existing factory for initial game state
- `startTurn(state)`, `phaseDrawCard(state, pid)`, `endTurn(state)` — human and bot use same functions
- `playPiecie(state, pid, cardRef, cardDef)` — bot calls this to play a Piecie
- `activatePiecie(state, pid, slotIndex)` — bot calls this to activate a face-down Piecie
- `attemptGeneralQuest(state)`, `attemptPersonalQuest(state, pid, questId)` — bot uses these
- `activatePlace(state, pid, slotIndex)` — bot calls this to activate a Place
- `useMosjeAbility(state, pid, mosjeId)` — bot calls this for Mosje ability
- `canAttemptGeneralQuest(quest, state, pid)` in `questLogic.js` — guards bot quest attempt
- `STARTER_DECKS` in `starterDecks.js` — bot picks random deck from here
