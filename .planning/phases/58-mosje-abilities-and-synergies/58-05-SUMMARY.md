---
phase: 58-mosje-abilities-and-synergies
plan: 05
subsystem: engine/mosje-abilities
requirements-completed: []
commits: [087d4b8]
---
# Phase 58 Plan 05: Example Deck 2 Digital Mosjes Summary

Coert Tech (draw-step option, 1 Energy per extra card, max 2), The Hacker (1 Energy, top 3 of either deck reordered, +10 MP, cooldown gone), Chris All-Rounder (3 face-down Piecies -> free activation via activatePiecieFree + 15 MP), FPS Coert (Physical/Technical win, die 6 -> +30 and owner-chosen non-fresh opponent -15), FPS West (guess stored on his slot, settled by the opponent's next card from hand: +20 / -10) and The Drainer (owner-chosen opponent Mosje, MP > 0, not fresh, -5 at each opponent turn start) run on the 2.0 registry. EFX-01 stays unticked (5 of 12 plans).

## Engine changes
- `runMosjeTriggers`: new `onOpponent` entry flag (runs for the players who did not act), jobs now built entry-major; FPS West is registered on `cardPlayedFromHand` and `endOfTurn`.
- New `fpsWestRevealHand` (holder text, free, once per turn, `state.revealedHandTo`); V4 FPS Coert block in questLogic, Drainer DRAIN status, systemHackCooldown and its tick are gone.
- Coert has no Activate button (V4 function now refuses); rule gets an `extra` number input.

## Deviations
- [Rule 1] The bot did not settle the reaction window opened by Chris's free activation (random bot-vs-bot test failure, ~5%): `chrisPerfectSetup` passes `reactionPending` through, `botDriver` settles it. Gain is applied BEFORE the activation so a replayed window keeps it.
- One commit for both tasks (shared registry file), as in 58-04.

## Ruling flags (flip in one place)
- Chris "free": no Energy AND no readiness wait (`IGNORE_READINESS` in chrisPerfectSetup.js).
- FPS West: first card the opponent puts from hand (any type incl. Snelle on the owner's turn) decides it; none by the end of their next turn = wrong (-10). Guess dies with FPS West.

## Not built / open
- No UI yet: showing the opponent hand (`revealedHandTo`) for FPS West / reveal button, and a Coert draw-step "how many extra" prompt beyond the generic number input. Hidden-info UI = Phase 60 (EFX-07).
- FPS West holder text's second sentence (both gain 10 on a Quest win) was already in questLogic; unchanged.

## Test changes (no test weakened)
- Rewritten to the Card List: fps-west-guess (+70/-20 -> +20/-10), Hacker cases in amplifier-hacker-rework, Chris cases in ability-text-reconciliation (4-slot fakes -> real 3-slot Piecies), Coert Energy-ability probes (getemt, mosje-triggers, place-synergy-chamber, stub-engine-wiring) moved to the draw step / FPS West.
- New: mosjes-deck2 (FPS Coert, Drainer, reveal hand, wiring), coert-tech-draw-step. `npm test` 1311 pass / 4 skipped; node --check clean on the 6 UI files and touched src.

## Self-Check: PASSED
