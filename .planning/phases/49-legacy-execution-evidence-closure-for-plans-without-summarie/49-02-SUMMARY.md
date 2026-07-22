---
phase: 49-legacy-execution-evidence-closure-for-plans-without-summarie
plan: 02
subsystem: planning-docs
tags: [legacy-closure, discoverability-markers, todo-hygiene, health-snapshot, archivist]

# Dependency graph
requires:
  - phase: 49-01
    provides: 49-VERIFICATION.md — the authoritative closure ledger the markers point back to
provides:
  - 9 {plan}-CLOSURE.md discoverability markers in the legacy plan-without-summary dirs
  - Honest todo hygiene — 2 shipped todos closed to completed/, 2 partials subset-annotated in place, 4 open-phase todos left byte-unchanged
  - Post-closure health snapshot (still degraded, accepted) recorded in this summary
affects: [milestone-archivability, v1.0-legacy-ledger-debt]

# Tech tracking
tech-stack:
  added: []
  patterns: [closure-note-not-summary (D-01), preserve-open-phase-todos (D-06), git-mv-to-completed]

key-files:
  created:
    - .planning/phases/02-piecies/01-01-CLOSURE.md
    - .planning/phases/06-integration/01-01-CLOSURE.md
    - .planning/phases/16-eendjes-voeren-place/16-01-CLOSURE.md
    - .planning/phases/28-visual-ui-tests/28-01-CLOSURE.md
    - .planning/phases/29-card-test-library/29-01-CLOSURE.md
    - .planning/phases/30-defeat-at-zero-mp/30-01-CLOSURE.md
    - .planning/phases/31-mp-cap-invariant/31-01-CLOSURE.md
    - .planning/phases/32-onfield-mosje-info-dice-modal/32-02-CLOSURE.md
    - .planning/phases/38-alyssa-jisca-synergy-design-and-implementation-design-wire-t/38-02-CLOSURE.md
  moved:
    - .planning/todos/pending/2026-07-12-alyssa-jisca-synergy-design.md → completed/
    - .planning/todos/pending/2026-07-13-coerts-caravan-binti-discount-mismatch.md → completed/
  modified:
    - .planning/todos/pending/2026-07-12-ability-text-engine-reconciliation.md (DELIVERED-SUBSET annotation)
    - .planning/todos/pending/2026-07-15-remaining-mosje-synergies-and-cless-teacher-fix.md (DELIVERED-SUBSET annotation)

key-decisions:
  - "Every marker is named *-CLOSURE.md and opens by declaring itself a closure note (not a summary), so validate.health's I001 'no SUMMARY.md' check deliberately still fires for all 9 legacy plans — proving no historical execution history was fabricated (D-01)."
  - "Only the 2 fully-shipped todos moved to completed/; the 4 todos routed to still-open phases (ts-bulldozer/45, full-game-audit/42, the-void/44, dierenasiel/43) were left byte-unchanged in pending/ (git diff --quiet HEAD passes) — closing them would emit a false 'done' signal (D-06)."
  - "Degraded health is the accepted, expected end state — the durable closure record is the ledger + markers, not a green health status. No repair, summary fabrication, or directory rename was attempted to flip it."

# Verification
verification:
  - "Task 1 gate: all 9 {plan}-CLOSURE.md markers exist and name 49-VERIFICATION.md; 32-02 carries the D-05 residual — NINE_MARKERS_OK"
  - "Task 2 gate: 2 shipped todos in completed/ + annotated, gone from pending/; 2 partials subset-annotated in pending/; 4 open-phase todos byte-unchanged — TODO_HYGIENE_OK"
  - "Task 3 gate: validate.health still degraded; all 9 legacy I001 'no SUMMARY.md' warnings intact; git diff --quiet HEAD -- src tests passes — HEALTH_HONESTLY_DEGRADED_NO_CODE_CHANGE"
---

# Plan 49-02 Summary: Discoverability Markers + Todo Hygiene

Completed the legacy-closure phase with lightweight discoverability and honest hygiene on
top of Plan 49-01's ledger — without fabricating a single summary or touching any `src/`
or test file.

## What was delivered

- **9 `{plan}-CLOSURE.md` markers** — one in each legacy dir whose plan never got a summary
  (`02-piecies/01-01`, `06-integration/01-01`, `16-01`, `28-01`, `29-01`, `30-01`, `31-01`,
  `32-02`, `38-02`). Each is a 5–10 line closure note that declares itself NOT a summary,
  echoes the ledger disposition, lists the real evidence, and points to
  `49-VERIFICATION.md` as the full record. `32-02-CLOSURE.md` carries the D-05 residual
  (un-captured human visual approval, routed to a `$gsd-verify-work 12`-style pass, never
  marked approved). No markers were placed in the self-complete off-roadmap dirs
  (17/18/19/20/21/33/34) or duplicate-route dirs — those have no missing-summary gap.
- **Todo hygiene (D-06):** the 2 fully-shipped todos (alyssa-jisca → Phase 38;
  coerts-caravan → Phase 41) were closure-annotated and `git mv`'d to
  `.planning/todos/completed/`. The 2 partial todos (ability-text-reconciliation;
  remaining-mosje-synergies) got a DELIVERED-SUBSET annotation in place and stay in
  `pending/`, remainder routed to OPEN Phase 42. The 4 open-phase todos (ts-bulldozer/45,
  full-game-audit/42, the-void/44, dierenasiel/43) are byte-unchanged.

## Appendix — Post-Closure Health

`gsd-sdk query validate.health` was re-run as the closing step:

- **`"status": "degraded"`** — unchanged, and the correct, accepted outcome for this phase.
- **`I001` "…has no SUMMARY.md"** still fires for all **9** legacy plans. This is
  deliberate: D-01 forbids fabricating summaries, and the closure markers are named
  `*-CLOSURE.md` (not `*-SUMMARY.md`) precisely so they do NOT clear the I001 checks. A
  persisting I001 for each legacy plan is the honest proof that no execution history was
  invented. (Plan 49-02's own summary lands with this commit and clears its own transient
  I001; 49-01's already cleared.)
- **`W007` "…exists on disk but not in ROADMAP.md"** still fires for all **9** off-roadmap
  directories (16, 17, 18, 19, 20, 21, 29, 33, 34) — D-02 forbids deleting or renaming
  them, so these warnings also legitimately persist.

`git diff --quiet HEAD -- src tests` passes: **zero `src/` and zero test changes across the
entire phase (D-07).** The durable closure record for the milestone's legacy ledger debt is
the evidence ledger (`49-VERIFICATION.md`) plus these markers — not a green health status.
