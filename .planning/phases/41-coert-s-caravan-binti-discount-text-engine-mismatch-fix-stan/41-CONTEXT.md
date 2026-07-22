# Phase 41: Coert's Caravan Redesign - Context

**Gathered:** 2026-07-18
**Status:** Implemented after discussion correction

## Phase Boundary

Resolve the standalone Coert's Caravan Place-card mismatch discovered during the
deck-completion audit. The original Phase 41 prompt mentioned a stale
Binti-discount text/engine mismatch, but discussion clarified that the old
discount should not be resurrected.

The phase is limited to Coert's Caravan behavior, text, focused regression
coverage, and card-reference bookkeeping.

## Discussion Notes

The following points were settled in discussion before accepting the final card
direction:

- The old Binti discount is stale design and should not return.
- Tesla, Winston Jaaa, and Varkenspootjes have stronger combo/chase-card
  potential and should remain booster-side rather than being folded into the
  base Coert/Binti deck through Caravan.
- Coert's Caravan should keep a Coert-flavored defensive identity instead of
  draining friendly Mosjes.
- Final accepted ruling from Gandoe: while this place is active, Coert Mosjes
  are immune to Quest damage up to 40 MP per turn.

## Settled Requirements

- **D-01 Passive place:** Coert's Caravan is passive while active; it is not an
  end-phase drain card.
- **D-02 Coert-only shield:** Only Coert-family Mosjes are protected.
- **D-03 Quest damage cap:** Prevent up to 40 MP of Quest damage per protected
  Mosje per turn.
- **D-04 Costs remain costs:** Quest attempt costs are not prevented by the
  shield.
- **D-05 Narrow damage source:** Non-Quest drains or other MP loss sources are
  not prevented.
- **D-06 Documentation:** Card data and `docs/card-reference.md` must describe
  the new passive effect honestly.

## Implementation Notes

Quest damage is routed through `loseMP`, so the shield belongs centrally in
`src/engine/mpManager.js` instead of as an end-phase place callback. The
`effect_coerts_caravan` function remains as a harmless passive marker for the
place effect registry.

## Guardrails

- Live JS engine is the source of truth; do not use `/_archive/`.
- Preserve existing user and previous-agent working-tree changes.
- No commit, push, merge, rebase, branch deletion, PR, or `main` update without
  explicit user approval.
