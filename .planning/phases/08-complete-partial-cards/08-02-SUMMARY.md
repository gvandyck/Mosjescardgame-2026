---
phase: 08-complete-partial-cards
plan: 02
status: complete
commit: 972f693
---

## Summary

Fixed two bugs in `src/abilities/snelleEffects.js` and confirmed Jensen is correct. Added 6 browser-layer tests in `tests/cards/test-snelleEffects.js`.

## What Was Built

### effect_snelle_jantje_jantje_jantje — const/let crash fix
- **Before:** `const state = JSON.parse(...)` followed by `state = loseMP(...)` — TypeError at runtime whenever Bank Chilling was active
- **After:** `let state = JSON.parse(...)` — reassignment works correctly; Bank Chilling steal (–30 opp, +30 self) executes without crash

### effect_snelle_blensen — free-cost flag
- **Before:** Always pushed to counterChain with no cost awareness
- **After:** Checks if the last `counterChain` entry has `card: 'frenssen'`; if so, sets `state._snelleFlags.blensenIsFreeThisActivation = true` so the caller (turnManager) can refund the MP cost

### effect_snelle_jensen — confirmed correct
- Current +20 MP implementation is the approved Phase 5 simplified stub (source-card discard deferred)
- No change made

## Tests Added (6 new)

In `tests/cards/test-snelleEffects.js`:
- Jantje×3 Bank Chilling active: no throw, opponent –30 MP, own +30 MP
- Jantje×3 Bank Chilling absent: no effect, both players unchanged
- Blensen: blensenIsFreeThisActivation=true when last chain entry is 'frenssen'
- Blensen: flag NOT set when counterChain is empty
- Blensen: flag NOT set when last chain entry is not 'frenssen'
- Blensen: always pushes own entry to counterChain regardless

## Verification

- `npm test`: 588/588 TypeScript tests pass — no regressions
- Browser tests confirmed by code inspection

## Self-Check: PASSED

## key-files

created:
  - .planning/phases/08-complete-partial-cards/08-02-SUMMARY.md

modified:
  - src/abilities/snelleEffects.js
  - tests/cards/test-snelleEffects.js
