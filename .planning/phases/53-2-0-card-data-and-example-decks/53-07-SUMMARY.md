---
phase: 53-2-0-card-data-and-example-decks
plan: 07
subsystem: data
tags: [obby-2.0, example-decks, deck-surfaces, e30]
requires: [53-06]
provides:
  - EXAMPLE_DECKS (Taksen, Regelaars, Creatievelingen) as 30-card decks in src/data/exampleDecks.js
  - 8 old decks (5 duo + 3 originals) disabled, data kept
  - getPlayerFacingDecks() returns only the 3 Example Decks (lobby, onboarding, bot picker)
  - E30 test: deck rules + agreement with the Example Decks doc
affects: [54, 61, 64]
key-files:
  created:
    - src/data/exampleDecks.js
    - tests/data/example-decks-2-0.test.ts
  modified:
    - src/data/starterDecks.js
    - src/data/playerFacingDecks.js
    - src/bot/pickBotDeck.js
    - src/main.js
    - tests/data/player-facing-decks.test.ts
    - tests/data/duo-deck-validity.test.ts
    - tests/bot/pick-bot-deck.test.ts
    - tests/bot/offlineGame.smoke.test.ts
    - tests/effects/thematic-piecies.test.ts
    - tests/multiplayer/expand-deck-to-card-ids.test.ts
    - tests/ui/onboarding-starter-deck.spec.js
    - tests/ui/active-deck-lobby.spec.js
    - tests/ui/cinema/starter-deck-onboarding-cinema.spec.js
    - playwright.config.js
key-decisions:
  - "Example Decks carry kind + startingMosje; STARTER_DECKS stays raw/unfiltered for the engine"
requirements-completed: [DATA-06, DATA-07]
completed: 2026-10-10
---

# Phase 53 Plan 07: Example Decks Summary

Three 30-card Example Decks ship as data and are the only decks offered to players and the bot; the 8 old decks are disabled but kept.

## Tasks

| Task | Commit | Result |
|------|--------|--------|
| 1. Example Decks data + E30 | c434a3b | E30 written first, red (15 failed), then green (19 tests: 30 cards, per-id copies vs doc, copy limits, no disabled, start Mosje, doc cost/tag columns, buildDeck = 30) |
| 2. Deck surfaces + tests + V4 smoke | f5f34f9 | whitelist + `!disabled`, main.js fallback -> EXAMPLE_TAKSEN, 2 Example Deck smoke games (no throw, activeSlots arrays; no FINISHED assertion) |
| 3. Playwright constants | fea6ecb | DUO ids -> Example ids in 3 specs; also commits the orchestrator's playwright.config.js window-position edit |

## Verification (actual)

- `node --check` list clean. `npm test`: 93 files / 968 tests pass.
- Playwright `onboarding-starter-deck` + `active-deck-lobby` (visual project): 7/7 passed. The cinema spec was edited (ids/counts/text) but NOT run.
- `git diff` on src/engine, src/abilities, src/bot/strategy: empty.
- Example Decks run on `DEFAULT_BOT_PROFILE` (src/bot/strategy/botProfiles.js); per-deck profiles come in Phase 61 (Bot 2.0).

## Sim gate: NOT completed (honest report)

`npm run test:sim` was stopped by the orchestrator after about 2 hours and was not restarted. It ran the old disabled V4 duo/original decks under V4 rules (the sim specs sim-30-games, sim-botvsbot and sim-deck-matrix still use the old deck ids), so its numbers say nothing about 2.0. Any sim numbers are V4 rules with 2.0 cards, are NOT comparable to earlier runs, and the bots used DEFAULT_BOT_PROFILE.

What I can report before the stop: 0 engine crashes in the sim-30-games (27 games recorded) and sim-botvsbot (18 recorded) reports; roughly 20 sim tests passed in the captured output tail; 7 sim tests had failed and left test-results folders (reward-overlay waitForSelector timeouts in sim-30-games and sim-botvsbot, setup failures in sim-deck-matrix). The deck-matrix report at one point showed 5 of 100 games completed, so a large share of games were failing in the harness. I did not determine whether these failures predate this plan (no baseline run). The partial sim-deck-matrix-results.md was reverted. The Example-Deck bot-vs-bot smoke in `npm test` is the Phase 53 guard. DATA-06/07 ticked on the basis of npm test green; the sim part of the plan's acceptance criteria is unmet.

## Deviations from Plan

- [Rule 1] `tests/effects/thematic-piecies.test.ts`: Boosterpackkie is in the Regelaars deck per the doc, so the "no thematic Piecie in a starter deck" check now allows exactly `EXAMPLE_REGELAARS` for it and still demands none for the other three.
- [Rule 1] `tests/multiplayer/expand-deck-to-card-ids.test.ts`: player-facing decks now expand to 30 (was 19).
- Spec text/counts also updated (deck names Taksen/Regelaars, 5 -> 3 options), not only ids.
- playwright.config.js edit by the orchestrator committed in fea6ecb (visual window position). Remaining Playwright runs after the request: only the headless sim.

## Phase-level notes

- Field mapping: hidden -> `disabled`, abilityText -> `abilityDescription`, synergyText -> `synergyEffect`, text -> `description`, frameTier -> `getFrameTier()`.
- Open rules questions for Gandalf at Phase 59: givesMP for MP Amplifier / Synergy Field = false; stays Tikker / MP Hemorrhage = null (all marked `// TODO(phase 59): confirm`).
- Deferred: V4 field removal (54-57); 4 cut General Quests still in the V4 Quest pile (55/56); bot profiles for Example Decks (61); renderers on getFrameTier + editor foil toggle (62); card-registry hidden cards (60); re-point the sim specs (and cinema spec run) to the Example Decks (64).

## Known Stubs

None.

## Self-Check: PASSED (commits c434a3b, f5f34f9, fea6ecb exist; files present)
