---
phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede
plan: "03"
subsystem: docs
tags: [checkpoint-decision, places, card-text]

requires:
  - phase: 36-01
    provides: "Full mpCost audit ruling confirming piecie_affoe/piecie_bong_hit_demolition (Delluft's SUBSTANCE Piecies) and all 5 PET Piecies (Dierenasiel's) are unconditionally mpCost:0"
provides:
  - "Explicit, recorded ruling on Delluft/Dierenasiel's now-vacuous Place text, for Plan 36-04 to implement"
affects: [36-04]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "Selected: trim-and-defer-todo — trim the now-vacuous clause from both cards' text (Delluft keeps its real draw-1 function; Dierenasiel's text becomes an honest statement of no current effect) AND file a new pending todo flagging that Dierenasiel needs a real passive mechanic designed in a future phase."

patterns-established: []

requirements-completed: [COST-04]

duration: 3min
completed: 2026-07-16
---

# Phase 36-03: Delluft/Dierenasiel Place-Text Fate — Checkpoint Decision Summary

**Gandoe ruled: trim the now-vacuous cost-0 clauses from both cards' text, and file a new pending todo for a future Dierenasiel passive-mechanic redesign.**

## Performance

- **Duration:** ~3 min (single checkpoint decision, no code changes)
- **Tasks:** 1/1 completed (checkpoint:decision)
- **Files modified:** 0 (this plan records the decision only; implementation is Plan 36-04's job)

## Accomplishments
- Surfaced 36-RESEARCH.md's Open Question 2 / Critical Finding 3 to Gandoe via AskUserQuestion, exactly as the plan specified, with all 3 options (`trim-text`, `leave-as-is`, `trim-and-defer-todo`) presented verbatim.
- Gandoe selected **`trim-and-defer-todo`** (the plan's own recommended option).

## Task Commits

This plan makes no code/data changes — decision-only, per the plan's explicit instruction ("Do NOT implement any code/data change in this task"). This SUMMARY.md is the sole artifact.

## Decision Recorded

**Selected option: `trim-and-defer-todo`**

Rationale (from the plan's own framing, which Gandoe accepted): once Plan 36-01's mpCost corrections land, Delluft's "SUBSTANCE Piecies cost 0 MP this turn" and Dierenasiel's "All PET Piecies cost 0 MP" text describe something now true unconditionally, everywhere, regardless of either Place being active — not a special power these Places grant. Dierenasiel in particular has zero other function today (its +25% protection clause was already removed as dead code in Phase 35), so trimming its vacuous clause leaves it with no remaining function. Rather than ship the vacuous promise (which would reintroduce the exact "text says X, reality says something else" bug class this project has spent two phases reconciling), or leave the "Dierenasiel does nothing" gap untracked, this option keeps the text honest now AND files a todo so a future phase can deliberately design Dierenasiel a real passive mechanic — designing that mechanic itself is out of Phase 36's scope (36-CONTEXT.md D-10).

**What Plan 36-04 must implement:**
1. Edit `place_delluft`'s `description` (`src/data/places.js:234`) to drop the now-vacuous SUBSTANCE clause, keeping its real draw-1 function untouched: `"End Phase: All players draw 1 card."`
2. Edit `place_dierenasiel`'s `description` (`src/data/places.js:249`) to an honest statement of no current effect: `"Passive: currently no mechanical effect."`
3. Create `.planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md` documenting: what `effect_dierenasiel` currently does (nothing — full no-op, confirmed by Phase 35's + Phase 36's research), why (its only two clauses — the +25% protection typo-bug and the PET cost-0 clause — were each independently removed as dead/vacuous across Phase 35 and Phase 36), and that a future phase should design a real passive mechanic for this Place.

## Deviations from Plan

None - plan executed exactly as written (checkpoint presented via AskUserQuestion with the 3 options exactly as specified; decision recorded; no code touched).

## Issues Encountered

None.

## Next Phase Readiness

Plan 36-04 (wave 3, depends on 36-01 + 36-02 + 36-03) can now proceed — it has this plan's unambiguous instruction, Plan 36-01's finished mpCost corrections, and Plan 36-02's Welloe Force rework all as inputs. No blockers.

---
*Phase: 36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede*
*Completed: 2026-07-16*
