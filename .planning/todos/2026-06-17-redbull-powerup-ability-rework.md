---
created: 2026-06-17
title: Redbull as a true "powerup" — re-fire abilities within bounds (per-Mosje rework)
area: abilities
files:
  - src/engine/turnManager.js:41 (NO_DOUBLE_ABILITIES set)
  - src/engine/turnManager.js:1077 (Redbull echo block in useMosjeAbility)
  - src/main.js:1898 (battle-log surface for _redbullEchoFizzled)
  - src/abilities/mosjeAbilities.js (per-ability bodies)
  - tests/ui/simulation/redbull-coert.spec.js (repro + regression)
  - tests/ui/cinema/redbull-abilities-cinema.spec.js (cinema demos)
---

## Where we left off (DONE this session)

Fixed the reported bug: Redbull + Coert drew only 1 card. Root cause: Coert was on
`NO_DOUBLE_ABILITIES`, so the echo was skipped and the flag silently consumed.

Shipped (NOT yet committed — on branch feature/phase-32-onfield-mosje-info-dice-modal):
1. Removed Coert (`ability_coert_extra_resources` + `_tech_` alias) from
   `NO_DOUBLE_ABILITIES`. Coert self-charges its 10 MP cost inside the ability fn,
   so a plain re-run = "pay 10 again, draw again" = true triggers-twice.
2. Echo now only CONSUMES the Redbull flag when it actually fires. On an
   unaffordable echo (e.g. Coert at 15 MP) it keeps the flag armed (Redbull
   persists to end of turn) + sets `state._redbullEchoFizzled`.
   main.js:1898 surfaces that as a battle-log line.
3. Repro spec tests/ui/simulation/redbull-coert.spec.js — fails on old code
   (Δ1/-10), passes on fix (Δ2/-20); plus the 15 MP fizzle-stays-armed case.
4. Cinema demos tests/ui/cinema/redbull-abilities-cinema.spec.js (Coert x2, Binti).
5. Verified: node --check clean, npm test 415/415, chain-5 (cost-free echo) green.

Rulings locked with the user:
- Coert: pay-again (true twice).
- Failed/unaffordable echo: KEEP flag armed + log (don't silently waste Redbull).
- **NEW (this is tomorrow's work):** Redbull is a *powerup* — abilities that need
  card selection / wager / dice / top-card / quest selection SHOULD re-fire too.
  The ONLY brakes are once-per-turn cooldown and once-per-game cap.

## Systemic problem to solve FIRST

The echo (turnManager.js:1077) is a *headless engine re-run*: it calls
`fn(state, playerId, mosjeId)` again. Under the new ruling that breaks two ways:
1. **Bypasses the per-turn brake** — `abilityUsedThisTurn` is set at line 1070,
   BEFORE the echo, and the echo calls fn directly, so it sails past. Any
   once-per-turn ability not on the exclusion list doubles when it shouldn't.
2. **Reuses stale input** — the echo reads the SAME `_pendingTargets` from the
   first activation. A real re-fire (Binti/Martin/Tuk) must re-prompt the UI.

So Group A needs the echo reworked into a *real second activation* (re-prompt +
re-charge + respect internal limits), not just removing names from the set.

## Group A — should now RE-FIRE — ✅ MOSTLY DONE 2026-06-17

Mechanism shipped: engine adds REPROMPT_DOUBLE_ABILITIES set + sets
state._redbullAwaitingReprompt (no echo, flag NOT consumed) for input abilities;
main.js handleUseAbility is now a thin wrapper around runAbilityActivation that, on
the marker, resets abilityUsedThisTurn, consumes the Redbull flag, and re-runs the
activation flow once with FRESH prompts. (turnManager.js + main.js.)

- [Jeffrey] Silent Gambler — High Stakes — ✅ DONE: self-contained (fixed 30 bet +
  fresh roll), removed from NO_DOUBLE, headless echo. Test redbull-gambler.spec.js (+60).
- [Martin] Senor West — Calculated Guess — ✅ DONE + e2e tested (re-prompts twice).
  Test redbull-reprompt.spec.js.
- [FPS West] — Tactical Analysis — ✅ DONE + e2e tested (two guess rounds).
  redbull-reprompt.spec.js. ±70/-20 swing doubles.
- [Tuk] Architect — Perfect Placement — ✅ DONE + e2e tested (two placement rounds).
  redbull-reprompt.spec.js.
- [Youri] Speedrunner — Speed Activate — ✅ DONE + e2e tested. In REPROMPT set; pays
  20 + picks a face-down Piecie each fire. The 3/game cap (enforced in the fn) denies
  the second cast when only 1 use remains: at 2 prior uses, fire 1 = 3rd use (OK),
  Redbull 2nd fire = denied. Tests in redbull-youri.spec.js (uses 0→2; and 2→3 cap).

✅ GROUP A COMPLETE. All 9 Redbull sim specs green; npm test 415/415.

Note: when a 2nd cast is denied by the cap (or by deck-empty etc.), the wrapper has
already consumed the Redbull flag (spent). Matches "deny the triggering". If we later
want "don't waste Redbull on a denied 2nd cast" (cf. Coert-at-15MP keep-armed ruling),
the wrapper would need runAbilityActivation to report 2nd-cast success — not done.

KNOWN QUIRK found while testing Tuk Architect: Perfect Placement filters the 2nd-pick
options by cardId (`top5.filter(c => c.cardId !== first.cardId)`), so if top5 has
DUPLICATE cardIds you only get one pick modal — but the engine fn still takes 2 of the
same card (`chosen.includes(c.cardId)` matches both). UI/engine mismatch; cosmetic but
worth fixing (let the player pick 2 distinct slots, or pick by slot index not cardId).

## Group B — should STAY SINGLE but currently LEAK — ✅ DONE 2026-06-17

Added all six to NO_DOUBLE_ABILITIES (turnManager.js:60). Repro-first: proved the
leak live (Tuk Healer +30 instead of +15) in
tests/ui/simulation/redbull-once-per-turn.spec.js, then fixed → +15.
npm test 415/415 green; Coert specs still pass.
- [Chris] All-Rounder — Perfect Setup (once/turn) ✅ excluded
- [Tuk] Healing Spirit — Healing Presence (once/turn) ✅ excluded
- [Placeholder 1] Tactician — MP Manipulation (once/turn) ✅ excluded
- [The Hacker] — System Hack (once/5 turns) ✅ excluded — NOTE cooldown still never implemented in fn
- [Martin] Historian — Time Control (once/turn) ✅ excluded
- [Placeholder 3] Amplifier — Power Boost (2/game) ✅ excluded — NOTE cap never implemented; Redbull×"trigger twice" still needs its own ruling

Still open from B: actually IMPLEMENT the Hacker cooldown and Amplifier 2/game cap
inside their fns (right now nothing stops repeated manual use across turns). Folded
into the side-finding below.

## Group C — no change

- Correct already: Coert Tech (fixed), Alyssa Fissa, Alyssa Bulldozer.
- Correctly stay excluded: Gandoe Destroyer & Ronald Mastermind (once/game);
  Ronald Chef (self-guards via strategicInsightCooldown); Ming Predictor &
  Binti Sharp Tongue (once/turn); Michelle & Jeffrey Strongman (passive).
- Passive/triggered (echo never reaches): Gandoe Wizard, AZN Cless, Parkour West,
  Ming Natural, Drainer, FPS Coert, Jisca, DJ 80/20, Coert KasteLuck,
  Cless Teacher, Martin Driver, Coert Kastelein, Chris DDR.

## Card-text reconciliation — ✅ ALL 5 DONE 2026-06-17 (case-by-case, user-approved)

- Tactician: CODE→TEXT — desc rewritten to match the ≤20 MP transfer code.
- Martin Historian: CODE→TEXT — desc rewritten to "return top discard card to hand".
- Amplifier: TEXT→CODE — pay 30, arm abilityDoubleTrigger (your active Mosje's next
  ability fires twice), 2/game cap. Reuses Redbull flag. Tests: amplifier-hacker-rework.test.ts.
- Hacker: TEXT→CODE (sane) — +10 MP, draw 1, real 5-turn cooldown (systemHackCooldown,
  ticked in startTurn). Fixed the old "helps opponent" bug. Same test file.
- Binti Creator: TEXT→CODE (lightened) — discard 2 FOOD (handles duplicate ids) → search
  deck for any card → add to HAND (not field). In REPROMPT_DOUBLE_ABILITIES. Tests:
  binti-creator-quick-sketch.test.ts (engine) + tests/ui/simulation/binti-creator.spec.js (e2e).

Engine note: useMosjeAbility now captures hadDoubleTrigger BEFORE the fn runs, so an
ability that ARMS the flag (Amplifier) doesn't consume its own grant.

ALSO this session: MP 5-grid rule (see [[mp-five-grid-rule]] memory) + seeded the flaky
offline-deckout smoke test (mulberry32). npm test 428 green.

## STATUS — effectively COMPLETE (2026-06-17)

- Redbull Group A (re-fire input abilities): ✅ Coert, Jeffrey Gambler, Martin Senor
  West, FPS West, Tuk Architect, Youri — all done + tested.
- Redbull Group B (once/turn leaks): ✅ all 6 excluded + tested.
- Card-text reconciliation: ✅ all 5 done + tested.
- MP 5-grid rule + flaky smoke test seeding: ✅ done.

All work is on branch feature/phase-32-onfield-mosje-info-dice-modal and is UNCOMMITTED
(mixed working tree includes pre-existing unrelated changes). npm test 428 green.

REMAINING: only committing. Stage the Redbull/MP/card/test files into a clean commit
(leave pre-existing unrelated changes alone) when ready.
