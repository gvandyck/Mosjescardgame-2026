# Phase 47: Milestone Planning Ledger Reconciliation and Verification Backfill Routing - Research

**Researched:** 2026-07-19
**Domain:** GSD planning metadata reconciliation
**Confidence:** High

## Summary

Phase 47 should be implemented as a non-destructive evidence and routing pass,
not as a historical cleanup. The live game is already well tested, while the
planning ledger mixes legacy formats, missing summaries, duplicate phase
directories, roadmap omissions, stale todos, and a STATE.md frontmatter that
incorrectly declares the milestone complete.

The safest implementation is:

1. capture deterministic before-state projections from registered GSD queries;
2. write a durable reconciliation manifest classifying every known anomaly;
3. use only narrow registered mutations for safe follow-up routing and state
   repair;
4. rerun the same projections and assert that no artifact was deleted, moved,
   renamed, or fictionalized.

No runtime source, tests, card data, or game documentation belongs in this
phase.

## User Decisions

The accepted `47-CONTEXT.md` locks the following:

- Phase 47 is metadata-only.
- Existing planning artifacts must be preserved in place.
- Missing summaries are classified, never invented.
- Phase 02 canonical implementation routing points to `02-piecies`; the
  `02-design-decks` directory remains a preserved legacy ambiguity.
- The shorter Phase 40 directory is canonical; the longer empty directory
  remains a preserved placeholder.
- Original-requirement verification backfill is a separate later phase.
- Historical incomplete execution, Phase 12 human UAT, and Phases 42-45 remain
  separate work.
- ROADMAP.md and STATE.md mutations use registered SDK handlers or supported
  legacy handlers only; unsafe legacy mismatches are recorded instead.

## Live Ledger Findings

### State and roadmap disagree

`gsd-sdk query state.json` currently reports:

- `current_phase: 46`
- `status: milestone_complete`
- 40 total phases, 85 total plans, and 57% progress

`gsd-sdk query roadmap.analyze` currently reports:

- 38 roadmap phases
- 84 plans and 78 summaries
- 23 phases with complete plan/summary counts
- Phase 6 as current and Phase 2 as next
- Phase 47 as discussed but unplanned

These are incompatible projections of the same milestone. The raw STATE.md
frontmatter must not be treated as authoritative until reconciliation.

### Duplicate and ambiguous phase routing

`gsd-sdk query phases.list` returns 49 directories for 38 roadmap phases.
Important duplicates:

- Phase 02: `02-design-decks` and `02-piecies`
- Phase 40: a short completed directory and a longer empty placeholder

`gsd-sdk query find-phase 02` currently selects `02-design-decks`, even though
the accepted decision designates `02-piecies` as the canonical implementation
directory. `find-phase 40` selects the accepted short completed directory.

The SDK's first-match behavior means deletion or renaming would appear tempting,
but D-02 forbids it. The manifest must record canonical routing explicitly and
follow-up work must not rely on ambiguous `find-phase 02` resolution.

### Plans without summaries

`gsd-sdk query validate.health` reports nine plans without matching summaries:

- `02-piecies/01-01-PLAN.md`
- `06-integration/01-01-PLAN.md`
- `16-eendjes-voeren-place/16-01-PLAN.md`
- `28-visual-ui-tests/28-01-PLAN.md`
- `29-card-test-library/29-01-PLAN.md`
- `30-defeat-at-zero-mp/30-01-PLAN.md`
- `31-mp-cap-invariant/31-01-PLAN.md`
- `32-onfield-mosje-info-dice-modal/32-02-PLAN.md`
- `38-alyssa-jisca-synergy-design-and-implementation-design-wire-t/38-02-PLAN.md`

The milestone audit highlights the roadmap-bearing subset (06, 28, 30, 31,
32, and 38), while health also exposes legacy/off-roadmap cases (02, 16, 29).
The reconciliation manifest should cover all nine so later tooling does not
silently lose the broader health evidence.

Classification should use, in order:

1. matching implementation/test evidence and later verification;
2. matching later plan/summary or roadmap phase that supersedes the work;
3. Git history where available;
4. `insufficient evidence` when none of the above proves completion.

### Roadmap omissions and legacy directories

Health reports nine directories present on disk but absent from ROADMAP.md:
16-21, 29, 33, and 34. These may represent shipped historical work, but their
mere existence is not enough to add them back to the active roadmap. Record
their evidence and route any necessary verification separately.

### Verification debt

The milestone audit's strict requirement score is 0/64 because none of the
original IMPL or BUG requirements are linked through modern verification
artifacts. This is traceability debt, not evidence that all mechanics are
broken.

`gsd-sdk query audit-uat` also identifies three Phase 12 human-only checks:
Bagga of Greed, Welloe Force redirect, and MP Adjuster. These remain a separate
verification activity.

## Supported Tooling Boundaries

### Read-only registered queries

Use these before and after any mutation:

- `gsd-sdk query roadmap.analyze`
- `gsd-sdk query roadmap.get-phase <N>`
- `gsd-sdk query state.json`
- `gsd-sdk query phases.list`
- `gsd-sdk query find-phase <N>`
- `gsd-sdk query validate.health`
- `gsd-sdk query audit-uat`

### Narrow registered mutations

The installed SDK/router exposes:

- `gsd-sdk query phase.add "<description>"` to append one integer phase and
  create its directory;
- `gsd-sdk query state.patch ...` for named state fields;
- `gsd-sdk query state.update-progress` to rebuild progress from disk;
- `gsd-sdk query state.record-session ...` for continuity;
- `gsd-sdk query state.planned-phase ...` for normal plan-phase bookkeeping;
- `gsd-sdk query roadmap.update-plan-progress <phase>`;
- `gsd-sdk query roadmap.annotate-dependencies <phase>`.

There is no registered arbitrary `roadmap.update` handler. Do not assume one
exists. If Phase 47 execution needs a roadmap change beyond `phase.add` or the
narrow roadmap handlers, it must use a documented supported legacy handler or
record the limitation rather than editing ROADMAP.md directly.

### Mutation ordering

For each SDK mutation:

1. capture `git diff -- .planning/ROADMAP.md .planning/STATE.md`;
2. run the single mutation;
3. inspect the exact diff immediately;
4. run the read-only projection that should reflect the mutation;
5. stop and restore nothing automatically if the handler touches an unexpected
   region—preserve the diff and report it for human review.

The repository forbids automatic commits and destructive rollback, so planning
must not depend on Git commits as transactional checkpoints.

## Recommended Artifact

Create `47-RECONCILIATION-MANIFEST.md` in the Phase 47 directory with stable
tables for:

- state/roadmap projection disagreement;
- duplicate phase directories and canonical routing;
- all plans without summaries;
- off-roadmap phase directories;
- pending todos and their corresponding roadmap/follow-up route;
- missing requirement/verification coverage;
- Phase 12 human UAT;
- required follow-up phases and ordering.

Each row should contain:

- identifier/path;
- classification;
- evidence;
- canonical interpretation;
- recommended route;
- whether Phase 47 mutated anything for it.

This manifest is the durable truth produced by Phase 47. ROADMAP.md and
STATE.md should contain only the minimum routing information that supported
handlers can safely represent.

## Suggested Plan Shape

One plan is sufficient because all work targets a shared metadata ledger and
should be executed serially:

1. baseline inventory and reconciliation manifest;
2. safe follow-up routing through registered handlers;
3. state synchronization and post-mutation verification.

Splitting these into parallel plans would risk both plans mutating ROADMAP.md or
STATE.md from stale assumptions.

## Common Pitfalls

- Treating `roadmap.analyze` progress as proof that historical work executed.
- Treating missing SUMMARY.md files as permission to create summaries.
- Letting `find-phase 02` choose the wrong duplicate directory.
- Adding all off-roadmap directories back into the active milestone without
  evidence.
- Folding the 64-requirement backfill into the reconciliation phase.
- Direct-editing ROADMAP.md or STATE.md because a desired mutation handler is
  absent.
- Using `state.sync` without inspecting its exact diff against this legacy
  STATE.md structure.
- Running runtime tests for a metadata-only change while failing to validate
  the metadata projections themselves.

## Validation Architecture

### Framework

Validation is command-driven and artifact-based. No new test framework is
needed.

Quick checks:

- `git diff --check`
- `gsd-sdk query roadmap.get-phase 47`
- `gsd-sdk query state.validate`

Full checks:

- `gsd-sdk query roadmap.analyze`
- `gsd-sdk query state.json`
- `gsd-sdk query validate.health`
- `gsd-sdk query audit-uat`
- filesystem comparison proving no planning artifact was deleted, moved, or
  renamed
- targeted inspection of ROADMAP.md and STATE.md diffs

### Requirement-to-check map

| Decision | Automated evidence |
|----------|--------------------|
| D-01 | `git diff --name-only` contains no runtime, test, card-data, or game-doc path |
| D-02 | before/after phase-file inventory has no removed or renamed path |
| D-03 | mutation log in manifest names only registered/supported handlers |
| D-04 | all nine missing-summary plans have a classification row; no new SUMMARY.md is created |
| D-05 | reconciliation manifest contains all required anomaly tables |
| D-06 | Phase 02 canonical/legacy rows match the accepted decision |
| D-07 | Phase 40 canonical/placeholder rows match the accepted decision |
| D-08 | verification backfill is routed to a separate phase |
| D-09 | historical plans are classified but not executed or closed |
| D-10 | Phase 12 and Phases 42-45 remain separate routes |
| D-11 | Dierenasiel remains routed to Phase 43 |

### Sampling

- After each manifest task: run `git diff --check` and inspect changed paths.
- After each SDK mutation: inspect the exact ROADMAP/STATE diff and rerun its
  relevant projection.
- At plan completion: run the full command set and compare before/after
  inventories.

### Wave 0

No test scaffolding is required. Existing SDK projections and Git/file
inventory commands cover the metadata contract.

## Security Domain

This phase does not change authentication, authorization, secrets, network
boundaries, or runtime input handling. Its relevant integrity threats are:

- destructive planning-artifact mutation;
- falsified historical completion evidence;
- ambiguous phase routing;
- a stale milestone-complete state causing unsafe archival.

Mitigations belong directly in the plan's threat model and verification steps.

## Sources

Primary repository evidence:

- `.planning/phases/47-milestone-planning-ledger-reconciliation-and-verification-ba/47-CONTEXT.md`
- `.planning/v1.0-v1.0-MILESTONE-AUDIT.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
- `AGENTS.md`
- `CODEX.md`

Installed GSD evidence:

- registered query outputs listed above
- `~/.codex/get-shit-done/workflows/add-phase.md`
- `~/.codex/get-shit-done/bin/lib/state-command-router.cjs`
- `~/.codex/get-shit-done/bin/lib/roadmap-command-router.cjs`

## RESEARCH COMPLETE

