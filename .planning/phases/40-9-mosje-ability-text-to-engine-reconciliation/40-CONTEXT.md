# Phase 40: Deck Mosje Ability Reconciliation - Context

**Gathered:** 2026-07-18
**Status:** Ready for execution

## Phase Boundary

Verify and close the three player-facing deck items from the wider ability-text
reconciliation backlog:

1. Chris All-Rounder - Perfect Setup
2. Jisca - Perfect Combo
3. Coert KasteLuck - Morning Luck

The remaining non-deck cards from the original todo stay deferred under the Deck
Completion Track.

## Discovery

The roadmap was created from the stale status line in
`.planning/todos/pending/2026-07-12-ability-text-engine-reconciliation.md`, which
still says implementation had not started. Git history and the current live JS
engine show that all three deck items were already implemented and committed on
2026-07-13:

- `56fc3b4` - Chris Perfect Setup
- `1de1ee5` - Jisca Perfect Combo
- `a28edce` - Coert KasteLuck Morning Luck

Phase 40 therefore does not re-implement or revert these cards. It verifies the
existing engine, UI, data, and regression coverage; synchronizes the card
reference; and records the phase as complete if the validation gates pass.

## Settled Requirements

- **D-01 Chris:** Once per turn, with 3+ face-down Piecies on field, choose one
  and activate it for free. No +15 MP.
- **D-02 Jisca:** Once per turn roll 1d6. Rolls 1-4 have no effect. Rolls 5-6
  let the player choose any field Piecie, face-down or active, and activate or
  re-trigger it for free.
- **D-03 Coert KasteLuck:** Passive turn-start roll. On 4-6, the next Piecie
  played that turn may activate immediately; the allowance is consumed once.
- **D-04 Live path:** Each card must be covered through the real browser game,
  not only a direct engine test.
- **D-05 Closeout:** Card reference, roadmap, state, and summary must describe
  the verified behavior and the pre-existing implementation commits accurately.

## Existing Coverage

- `tests/abilities/ability-text-reconciliation.test.ts`
  - Chris gate, selected slot, bot fallback, no MP gain, data text.
  - Jisca low/high roll branches, face-down unlock, active re-trigger, selected
    slot, empty field, data text.
- `tests/engine/coert-kasteluck-morning-luck.test.ts`
  - Turn-start success/failure rolls, absent-card guard, one-shot consumption,
    normal wait fallback, passive/no-manual data contract.
- `tests/ui/cards/card-chains.spec.js`
  - Chris free activation through the live UI.
  - Jisca roll-6 face-down activation through the live UI.
  - Coert turn-start grant through placement and same-turn activation.

## Guardrails

- Live JS engine is the source of truth; do not use `/_archive/`.
- Preserve all Phase 39 and user-authored working-tree changes.
- No commit, push, merge, rebase, or `main` update without explicit user approval.
- Run focused tests first, then the repository validation and simulation gates.

