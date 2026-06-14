---
phase: 32-onfield-mosje-info-dice-modal
plan: 01
status: awaiting-human-verify
completed: 2026-06-15
requirements:
  - ONFIELD-01
  - ONFIELD-02
  - ONFIELD-03
  - ONFIELD-04
  - ONFIELD-05
---

# 32-01 Summary — On-field own-Mosje meta layer + detail-modal Level chip

## One-liner
Own on-field Mosjes now show Level (1-based) + trait star-pips + a clamped ability snippet + active-only synergy directly on the board card; opponent Mosjes stay minimal; "Active on field" text removed; detail modal gained a Level chip. Pure UI — no engine/MP/quest changes.

## Tasks completed (all auto-tasks; atomic commits)
1. **Remove "Active on field"** — `src/main.js` `toMosjeCards`: active branch description set to `''` (kept `'Defeated'`). `grep "Active on field"` → 0.
2. **Meta layer + threaded options + 1-based level** — `src/ui/cardRenderer.js`: `renderCard` now passes `options` into `buildUnifiedCardHTML(card, options)`; new `buildOnFieldMosjeMeta(card, options)` renders trait pips, ⚡ ability snippet, and 🔗 synergy only when `getOwnedActiveMosjeIds` contains a partner; `mpBadge` level label now `(Number(card.level)||0)+1`; `footText` guard keeps opponent on-field Mosjes minimal (no abilityDescription leak). `src/ui/boardRenderer.js`: own/bottom render call gains `owned: true` (opponent/top loop untouched).
3. **CSS** — `styles/cards.css`: appended `.uc-meta/.uc-traits/.uc-trait/.uc-ability/.uc-synergy` compact, `-webkit-line-clamp` clamped styles (gold token w/ `#e8b94f` fallback).
4. **Detail-modal Level chip** — `src/ui/modalManager.js` `showCardPreview` MOSJE branch: prepends `Level N` (1-based) + `N MP` chips.

## Verification
- `node --check` on all six touched/listed UI files: clean.
- All plan acceptance greps pass (buildOnFieldMosjeMeta×2, options threading, 1-based level, footText guard, owned:true×1, opponent untouched×1, Level chip×1).
- `npm test`: 414/415. The single failure is `tests/bot/offlineGame.smoke.test.ts` "repeatedly deck-out" — a **pre-existing flaky** randomized smoke test. It imports only engine/bot (`gameState.js`, `turnManager.js`, `botDriver.js`) — none of the files this plan changed — and intermittently fails because its `sawSkipFlag` assertion needs an unseeded random game to happen to hit a deck-out skip (observed 1/5 fail on branch, 0/6 on main = sampling noise). Not a regression from this plan.

## Key decisions / notes
- Opponent-minimal guard (`footText = isOnFieldMosje ? card.description : desc`) is load-bearing: without it, `hydrateCard`-merged `abilityDescription` would leak onto opponent on-field cards via the old `desc` fallback, breaking ONFIELD-04.
- 1-based level display unified across on-field badge and detail modal (internal 0/1/2 → shown Level 1/2/3).

## Checkpoint
Blocking human-verify checkpoint — **awaiting user browser approval** (own enriched / opponent minimal / synergy active-only / no "Active on field" / detail-modal Level chip / no overflow / no console errors). Wave 2 (32-02 dice modal) not started — it shares `modalManager.js`, so it begins only after this is approved.
