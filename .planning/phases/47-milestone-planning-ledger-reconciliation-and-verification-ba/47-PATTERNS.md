# Phase 47: Planning Metadata Patterns

**Mapped:** 2026-07-19

## File Classification

| Target | Role | Closest analog | Pattern to preserve |
|--------|------|----------------|---------------------|
| `47-RECONCILIATION-MANIFEST.md` | Evidence ledger | `.planning/v1.0-v1.0-MILESTONE-AUDIT.md` | Frontmatter-free durable report, verdict first, evidence tables, explicit routing order |
| `.planning/ROADMAP.md` | Phase routing | `~/.codex/get-shit-done/workflows/add-phase.md` | Mutate through `gsd-sdk query phase.add`; accept returned number/directory |
| `.planning/STATE.md` | Session/progress routing | `~/.codex/get-shit-done/bin/lib/state-command-router.cjs` | Use registered `state.patch`, `state.update-progress`, and `state.record-session` handlers |
| `47-01-SUMMARY.md` | Execution handoff | `.planning/phases/46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load/46-03-SUMMARY.md` | Exact commands/results, deviations, no-commit statement, next-phase readiness |

## Data Flow

1. Registered read queries and preserved artifacts produce baseline evidence.
2. The reconciliation manifest classifies evidence and defines routes.
3. Two `phase.add` calls materialize only the approved follow-up routes.
4. Registered state handlers remove false milestone-complete routing.
5. The same read queries and a file inventory validate the final ledger.

## Shared Patterns

### Evidence before mutation

Capture query output and exact ROADMAP/STATE diffs before invoking a mutating
handler. Inspect after every single mutation rather than batching changes.

### Handler-owned formatting

Never reproduce ROADMAP or STATE formatting in handwritten patches. Let the
registered handler own its mutation and preserve its output unless it touches
an unexpected region.

### Honest legacy classification

Use the audit's evidence-table style: identify the artifact, state the
classification, cite evidence, and give a follow-up route. Absence of evidence
stays `insufficient evidence`; it never becomes a fictional completion record.

### Dirty-worktree preservation

Use before/after inventories and changed-path deltas attributable to Phase 47.
Do not treat pre-existing Phase 46 modifications as Phase 47 output and do not
clean or restore them.

## No Analog Found

There is no existing reconciliation-manifest artifact in this repository. Use
the structure specified in `47-RESEARCH.md` and the evidence-table conventions
from the milestone audit.

## PATTERN MAPPING COMPLETE

