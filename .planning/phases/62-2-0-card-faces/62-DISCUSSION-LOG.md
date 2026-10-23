# Phase 62: 2.0 Card Faces - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-20
**Phase:** 62-2-0-card-faces
**Areas discussed:** Branches, Tight sizes, Needs line

---

## Branches

Finding: `ui/card-frame-v1`, `ui/arena-hover-spotlight`, `ui/rarity-tiers` are already ancestors of `obby-2.0` (and `main`); the memory notes calling them unmerged were stale.

| Option | Description | Selected |
|--------|-------------|----------|
| None now | Faces need nothing from it; graveyard-clickable-cards is modal/board UI, decide in Phase 63 | ✓ |
| Bring in graveyard-clickable-cards now | Merge 1 commit so the graveyard preview shows 2.0 faces | |

**User's choice:** None now (Recommended)

---

## Tight sizes

| Option | Description | Selected |
|--------|-------------|----------|
| Clamp the text, keep 3 rows | 3 rows at hand size and up; text shrinks to a floor then clamps; rows collapse to the lit one below ~150 px | ✓ |
| Synergy text becomes a label | Synergy holders show a label in hand and smaller; full text in detail view | |
| Rows collapse earlier | Below ~300 px only the lit row | |

**User's choice:** Clamp the text, keep 3 rows (Recommended)

---

## Needs line

| Option | Description | Selected |
|--------|-------------|----------|
| New `needsText` data field | One string per card from the Card List; face prints it and drops the sentence from the text box; guard test | ✓ |
| Parse it from the description | Lift the leading sentence at render time | |

**User's choice:** New `needsText` data field (Recommended)

---

## Claude's Discretion

Live-state input for the builders; V4 coexistence switch and V4-string test rewrites; contrast by construction; test evidence (assertions + review screenshots, no pixel baselines); Quest dice-need derivation; plan order.

## Deferred Ideas

graveyard-clickable-cards (Phase 63); tile pixel size, live-state badges and Place-coloured felt (Phase 63); Quest art; phone layout (Phase 65).
