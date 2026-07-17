# Dierenasiel needs a real passive mechanic

**Filed:** 2026-07-16 (Phase 36 Plan 36-04, per Plan 36-03's `trim-and-defer-todo` decision)

## Current state

`place_dierenasiel`'s `effectId` (`effect_dierenasiel` in `src/abilities/placeEffects.js`) is a
confirmed **full no-op** — it does nothing at all when Dierenasiel is active on the field. Its
card text now honestly reads `"Passive: currently no mechanical effect."`

## Why it's a no-op

Dierenasiel originally had two clauses, and both were independently removed as dead/vacuous
across two different phases:

1. **+25% PET-protection clause** — removed in Phase 35 (`35-03`, commit `8fabd5d`). It was
   permanently inert due to a setter/reader typo mismatch (`dienasielActive` vs
   `dierenasielActive` never matched), so it never actually fired even before removal.
2. **"All PET Piecies cost 0 MP" clause** — removed in this plan (Phase 36, `36-04`), after
   Phase 36's mpCost audit (`36-01`) confirmed all 5 PET Piecies this clause referenced are
   already unconditionally `mpCost: 0` regardless of whether Dierenasiel is active. The clause
   described something universally true, not a special power this Place granted — keeping the
   text would have shipped a vacuous promise.

With both clauses gone, `effect_dierenasiel` has no remaining function. The Place still exists in
the data (`src/data/places.js`), can still be played, but produces zero observable effect on the
game.

## What's needed

A future phase should design a real passive mechanic for Dierenasiel from scratch — something
that fits its "PET" theming (animal shelter) and gives it an actual reason to be picked over other
Places. This is explicitly out of scope for Phase 36 (per `36-CONTEXT.md` D-10) — Phase 36 is a
cost-model correction pass, not a place-design pass.

## Suggested next step

When picking this up: start from Dierenasiel's PET tag list and flavour (shelter/rescue theme),
and consider what the 5 PET Piecies already do before designing a synergy that complements rather
than duplicates their individual effects.
