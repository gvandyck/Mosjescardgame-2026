# Phase 47: Milestone Planning Ledger Reconciliation and Verification Backfill Routing - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Reconcile and classify the milestone's planning metadata so GSD can route
reliably. This phase may inspect source and tests as evidence, but it does not
change game behavior, backfill the 64 original requirements, execute historical
plans, perform human UAT, or archive the milestone.

</domain>

<decisions>
## Implementation Decisions

### Scope and safety
- **D-01:** Phase 47 is metadata-only. Do not edit runtime source, card data,
  tests, or game documentation.
- **D-02:** Preserve every existing planning artifact. Do not delete, rename,
  move, or archive phase directories and do not manufacture historical commits.
- **D-03:** Use only registered `gsd-sdk query` or supported legacy
  `gsd-tools.cjs` handlers for ROADMAP.md and STATE.md mutations. If a legacy
  format cannot be safely updated, record the mismatch instead of direct-editing
  those two files.

### Historical artifact classification
- **D-04:** Classify each plan without a summary as `genuinely unfinished`,
  `superseded by later verified work`, or `insufficient evidence`. Never invent
  a SUMMARY.md merely to improve counts.
- **D-05:** Produce a durable reconciliation manifest that records evidence and
  the recommended follow-up route for duplicate directories, orphaned
  directories, incomplete plans, stale todos, and state/roadmap disagreement.
- **D-06:** Treat `.planning/phases/02-piecies/` as the canonical Phase 02
  implementation directory because it matches ROADMAP's "Implement Piecies";
  record `02-design-decks/` as a preserved legacy ambiguity.
- **D-07:** Treat the shorter
  `.planning/phases/40-9-mosje-ability-text-to-engine-reconciliation/` directory
  as canonical because it contains the completed plan/summary; preserve the
  longer empty Phase 40 directory as a legacy placeholder.

### Follow-up routing
- **D-08:** Do not fold the 64-requirement verification backfill into Phase 47.
  Route it to a separate follow-up phase after the ledger is trustworthy.
- **D-09:** Do not execute or close Phases 06, 28, 30, 31, 32, or 38 here.
  Classify their missing summaries and recommend explicit follow-up actions.
- **D-10:** Keep Phase 12's three human checks and Phases 42–45 as separate work.
  Phase 47 only makes their status and ordering unambiguous.
- **D-11:** The Dierenasiel todo match is a keyword false positive and remains
  deferred to Phase 43; it is not folded into this metadata phase.

### Codex's Discretion
- Exact manifest/table format, evidence citations, and concise classification
  wording.
- Whether one or several follow-up phases are recommended, provided no
  follow-up phase is silently executed as part of Phase 47.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone authority
- `.planning/v1.0-v1.0-MILESTONE-AUDIT.md` — authoritative gap inventory and
  recommended closure order.
- `.planning/ROADMAP.md` — milestone phase definitions and declared dependency
  relationships.
- `.planning/STATE.md` — legacy persisted state whose divergence must be
  classified, not trusted blindly.
- `.planning/REQUIREMENTS.md` — original 64 open requirement IDs; backfill is
  explicitly deferred from this phase.
- `.planning/PROJECT.md` — original milestone purpose and success criteria.

### Repository process
- `AGENTS.md` — repository safety, Git, source-of-truth, and GSD rules.
- `CODEX.md` — Codex continuation and preservation guidance.
- `.planning/phases/46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load/46-VERIFICATION.md`
  — most recent verified phase and evidence for the correct Phase 46 endpoint.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gsd-sdk query roadmap.analyze`: structured roadmap phase, plan, and summary
  counts.
- `gsd-sdk query state.json`: disk-derived state view that exposes stale cached
  frontmatter without requiring direct mutation.
- `gsd-sdk query find-phase <N>` and `phases.list`: directory resolution and
  duplicate-phase evidence.
- `gsd-sdk query validate.health` and `audit-uat`: planning health and
  outstanding verification-debt evidence.

### Established Patterns
- ROADMAP.md and STATE.md mutations must go through registered handlers.
- A plan is not complete without a matching SUMMARY.md; missing summaries are
  evidence gaps, not permission to create fictional execution records.
- Existing/user planning changes are preserved and no commits occur without an
  explicit request.

### Integration Points
- Phase 47 writes a reconciliation artifact inside its own phase directory.
- Follow-up routing may add phases through `gsd-sdk query phase.add`, but does
  not execute them.
- Milestone audit is rerun only after routed closure work is completed.

</code_context>

<specifics>
## Specific Ideas

The user accepted the recommended bundle as presented: metadata-only,
non-destructive classification; separate verification backfill; and no
directory deletion or rename.

</specifics>

<deferred>
## Deferred Ideas

- Backfill verification for the 64 original requirements — separate follow-up
  phase.
- Execute or formally supersede historical plans without summaries — routed
  follow-up work.
- Complete Phase 12 human UAT — separate verification activity.
- Discuss/plan/execute Phases 42–45 — existing roadmap work.
- Archive milestone v1.0 — blocked until a later milestone audit passes.

### Reviewed Todos (not folded)
- `.planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md` —
  belongs to Phase 43 and matched Phase 47 only through generic words.

</deferred>

---

*Phase: 47-milestone-planning-ledger-reconciliation-and-verification-backfill-routing*
*Context gathered: 2026-07-19*
