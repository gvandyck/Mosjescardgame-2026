# Phase 4A Report - Simple MP Piecies

## Status
- Step 0 to Step 5 completed.
- Full suite is green: 33 test files, 198 tests.
- Phase 4B has not been started.

## New Card File Tree

```text
src/cards/piecies/
  index.ts
  momentum-gaining/
    index.ts
    kannetje-melk.ts
    broodje-doner.ts
    shoettoe.ts
    nature-s-gift.ts
    momentum-boost.ts
    warm-kannetje-melk.ts
    momentum-rush.ts
    gun-een-piece.ts
    ronald-kip.ts
    varkenspootjes.ts
    chefs-special.ts
    dikke-jonko.ts
  attack/
    index.ts
    te-hard-gaan.ts
    snoeiertje.ts
    affoe.ts
    super-saiyan-mos.ts
    momentum-diefje.ts
    slecht-gezet.ts
  utility/
    index.ts
    bagga-of-greed.ts
    zie-je-die-dingetjes.ts
    bong-hit-demolition.ts
    tweede-kans.ts
```

## Infrastructure Added During 4A
- `forEachTarget` primitive added and registered.
- `for_each_completed` event added.
- Typed `ModifierSource` enum added and wired into U6 gain/loss modifier reads.
- `resolveEffectExpression` extended with:
  - `$currentTurn`
  - `$currentTurn +/- N`
  - deferred `$target` and `$targetPlayer` in `forEachTarget.effect`
  - `$choice:key` lookup from `CardInvocation.playerChoices`
- `executeCard` now validates cost gates (`levelRequirement` and trait requirements).
- `endTurn` now applies `buff:end_of_turn_mp_loss` before buff cleanup.

## Coverage (Step 5 run)
- All files: 97.76% statements, 92.66% branches, 100% functions.
- cards/executor: 94.60% statements, 94.87% branches.
- cards/piecies/attack: 100% statements, 100% branches.
- cards/piecies/momentum-gaining: 100% statements, 100% branches.
- cards/piecies/utility: 100% statements, 100% branches.
- effects (registry aggregate): 100% statements, 100% branches.

## Fully Implemented Cards (22)
1. kannetje-melk
2. broodje-doner
3. shoettoe
4. nature-s-gift
5. momentum-boost
6. warm-kannetje-melk
7. momentum-rush
8. gun-een-piece
9. ronald-kip
10. varkenspootjes
11. chefs-special
12. dikke-jonko
13. te-hard-gaan
14. snoeiertje
15. affoe
16. super-saiyan-mos
17. momentum-diefje
18. slecht-gezet
19. bagga-of-greed
20. zie-je-die-dingetjes
21. bong-hit-demolition
22. tweede-kans

## Flagged Questions (from phase4-questions.md)
- Q1: Chef's Special per-Piecie multiplier requires counting and category filtering over opponent hand; simplified to flat +30.
- Q2: Opponent reveal targeting lacks a dedicated `$opponent` placeholder; current implementation reveals via `forEachTarget all_opponents`.
- Q3: Zie Je Die Dingetjes choose-1-of-top-3 remains pending; current implementation is reveal top 3 then draw top 1.

## Deviations and Justification
- Chef's Special multiplayer reveal: implemented with `forEachTarget` over all opponents to avoid inventing a new primitive or non-data card logic.
- Chef's Special per-Piecie scaling: not implemented because existing primitives do not support count-and-multiply by card category in hand.
- Zie Je Die Dingetjes full pick flow: deferred until choose/top-deck selection wiring exists.
- Broodje Doner level rejection branch: card cost uses level requirement 1 as specified; runtime rejection branch is only possible with invalid state data below level 1.
