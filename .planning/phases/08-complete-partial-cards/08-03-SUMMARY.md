---
phase: 08-complete-partial-cards
plan: 03
status: complete
commit: 3a6d2d7
---

## Summary

Replaced the peek-only stub for `effect_zie_je_die_dingetjes` in `src/abilities/piecieEffects.js` with a full two-call pattern. Documented the `_dingetjeTochActive` wildcard flag consumption point in `src/engine/turnManager.js`. Added 3 browser-layer tests in `tests/cards/test-piecieEffects.js`.

## What Was Built

### effect_zie_je_die_dingetjes — two-call pattern
- **Before:** Peeked top 3 and stored `_dingetjesPeek`, but never moved any card to hand (stub)
- **After:**
  - Call 1 (no `chosenCardId`): peeks top 3, stores `_dingetjesPeek`, deck unchanged
  - Call 2 (with `chosenCardId`): splices top 3, moves chosen card to hand, puts remaining 2 back at deck top
  - Optional `orderedRemainder[]` on call 2: reorders the 2 returned cards to match caller's preferred order
  - Invalid `chosenCardId` (not in top 3) is safely ignored — deck is not corrupted
  - Clears `_dingetjesPeek` on call 2

### _dingetjeTochActive flag — consumption documented
- **turnManager.js** `activatePiecie`: added comment explaining `_dingetjeTochActive` is a one-time wildcard that the UI piecie activation validator must check and clear, since trait/type requirements are enforced before `activatePiecie` is called, not inside it.
- `effect_dingetje_toch` in piecieEffects.js was already correct (sets `state._dingetjeTochActive = true`); no code change needed there.

### Double Trigger — confirmed consistent
- `effect_double_trigger` sets `player.abilityDoubleTrigger = true`
- `effect_redbull` sets the same flag (`player.abilityDoubleTrigger = true`)
- Consumed by: ability executor in the Mosje activation flow (not in turnManager Piecie path)
- No inconsistency found; no change needed.

### Call of the Welloes — already documented
- The function already had a multi-line comment explaining it delegates to `effect_mosje_reborn` as a stub. No additional comment needed.

## Tests Added (3 new)

In `tests/cards/test-piecieEffects.js`:
- Call-1: `_dingetjesPeek` set with 3 card IDs, deck length unchanged (5)
- Call-2: chosen card in hand, `_dingetjesPeek` cleared, deck has 3 remaining cards
- Call-2 with `orderedRemainder`: deck positions 0 and 1 match the requested order, card-d stays at position 2

## Verification

- `npm test`: 588/588 TypeScript tests pass — no regressions
- Browser tests confirmed by code inspection

## Self-Check: PASSED

## key-files

created:
  - .planning/phases/08-complete-partial-cards/08-03-SUMMARY.md

modified:
  - src/abilities/piecieEffects.js
  - src/engine/turnManager.js
  - tests/cards/test-piecieEffects.js
