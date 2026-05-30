# Project State

**Last updated:** 2026-05-31
**Current phase:** Phase 11 — Bot Opponent (plan 01 + 02 of 5 complete)
**Branch:** feature/phase-11-bot-opponent

## Phase 11 Progress

### 11-01: Bot Driver — driveBotTurn (COMPLETE)
- Created src/bot/botDriver.js — pure 7-step heuristic bot turn driver
- Imports only engine and data — zero multiplayer imports
- 8 unit tests in tests/bot/botDriver.test.ts; 661 total tests passing

### 11-02: Offline Lobby Entry Point (COMPLETE)
- Added "Play Offline vs Bot" checkbox to lobby form (index.html)
- Wired offline submit branch in initLobbyPage() — writes mosjes:offline to sessionStorage, navigates to game.html?offline=true&player=player_1
- Bot deck: random STARTER_DECKS element with id != human's deckId
- Online create/join path completely unaffected

### Decisions
- Offline mode entry: checkbox short-circuits Firebase, stores sessionStorage 'mosjes:offline' with name/deckId/botDeckId/playerId='player_1'
- Bot deck selection filters STARTER_DECKS, fallback to STARTER_DECKS[0]
- driveBotTurn is a pure function: follows 7 priority steps, calls same turnManager.js functions as human
- Test file uses .ts extension (vitest only picks up tests/**/*.ts per vitest.config.js)

## Phase 10 Complete (prior)

All 5 balance plans executed and verified (BAL-01 through BAL-05):
- BAL-01: Digital Equipment MP scaling (Keyboard/Mouse/Controller — 15/25/40 MP by Mosje level + DIGITAL subtype)
- BAL-02: Physical Force SUBSTANCE fallback (Grammetje Pieter + Tikker; Tikker fixed flat +40 MP + QUEST_BLOCKED)
- BAL-03: Artistic Rhythm SUBSTANCE fallback (Larry Zegeltje + Grammetje Pieter)
- BAL-04: Quest economy (all successMP +20, all failMP capped at -20 max)
- BAL-05: Deck-out reshuffle rule (empty deck → reshuffle discard, draw 1, skip next turn)

653 tests passing. 0 simulation crashes. 0 timeouts.
