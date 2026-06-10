---
created: 2026-06-10
title: Enforce MP 0–100 cap (never exceed 100; only Quests level up)
area: engine
files:
  - src/abilities/piecieEffects.js (applyMPGain + direct .mp +=)
  - src/abilities/mosjeAbilities.js (direct .mp +=)
  - src/abilities/placeEffects.js (direct .mp +=)
  - src/abilities/snelleEffects.js (direct .mp +=)
  - src/engine/mpManager.js (gainMP / checkLevelUp = the quest level path)
  - tests/ui/cards/card-chains.spec.js (piecie MP gain caps at 100 — expected-failure)
---

## Problem

Game rule (confirmed by owner, now in phase0-rulings.md): a Mosje's MP is ALWAYS
clamped to **0–100**. It must never exceed 100. Only **Quests** permanently level
up a Mosje (reaching 100 via a Quest reward → Level +1, MP resets to 0).
Piecies/Places/abilities NEVER permanently level up — their gains cap at 100.
(Some abilities/piecies may TEMPORARILY raise Level, reverting after.)

Today the engine violates the cap: piecie `applyMPGain` (piecieEffects.js) and the
many direct `slot.mp += X` sites in abilities/places/snelle add MP without clamping
to 100, so a Mosje can sit at e.g. 105. Confirmed by card-chains.spec.js
"piecie MP gain caps at 100" (test.fail): Lv0/80 + Kannetje +25 → 105, should be 100.

The below-0 floor + defeat is already correct (Phase 30). This todo is the UPPER
bound (and the quest-only-leveling distinction).

## Solution

Enforce the 0–100 invariant on every NON-quest MP gain (clamp to 100), while
keeping the Quest path (gainMP → checkLevelUp) as the ONLY permanent level-up:
- Cap in `applyMPGain` (3 copies: piecie/mosje/place effects) → `mp = Math.min(100, mp + total)`.
- Audit + cap the direct `slot.mp += X` gain sites in mosjeAbilities.js / placeEffects.js /
  snelleEffects.js (gandoe wizard, tuk healer, amplifier, martin driver, jisca, etc.).
- Confirm `gainMP`/`checkLevelUp` (quest path) still converts ≥100 into a Level (so
  it never *sits* above 100) and that NON-quest gains never reach checkLevelUp.
- Decide whether any ability that currently uses `gainMP` should level up — per the
  rule only Quests level, so non-quest gainMP callers may need to switch to the
  capped path.
- Flip the card-chains "piecie MP gain caps at 100" test from test.fail() to passing.

Big impact (touches all MP-gain sites + the level path) → likely its own GSD plan.
Per CLAUDE.md: re-run the Ronald Kip stacking test + full simulation after.
Also (separate, optional): the "temporary level up" mechanic for specific
abilities/piecies isn't built yet — add only if a card needs it.
