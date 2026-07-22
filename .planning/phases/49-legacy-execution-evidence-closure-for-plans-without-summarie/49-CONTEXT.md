# Phase 49: Legacy Execution Evidence Closure - Context

**Gathered:** 2026-07-21
**Status:** Ready for planning
**Note:** Context authored directly from the Phase 47 reconciliation manifest under
delegated **archivist judgment** (the user authorized autonomous execution of this
housekeeping phase and asked not to be interrupted for it). No gameplay-design
decisions are involved — this phase records honest historical evidence only.

<domain>
## Phase Boundary

Close the **legacy execution-evidence debt** catalogued by Phase 47's
`47-RECONCILIATION-MANIFEST.md`: **9 historical plans that never got a SUMMARY.md**,
**9 off-roadmap phase directories** (+2 duplicate-directory routes), and the
**stale pending todos** whose work already shipped. Produce one honest closure
ledger that gives every item an evidence-backed disposition — **without fabricating
historical SUMMARY.md files** and **without deleting or renaming any legacy
directory**.

This phase **records evidence**; it does not build features, change runtime
behavior, or re-execute stale plans. In scope: an auditable Phase 49 closure
ledger mapping each legacy plan / off-roadmap directory / stale todo to its
current disposition + evidence; lightweight per-directory closure marker files
(NOT summaries) where they aid discoverability; recording delivered subsets of
partially-shipped todos. Out of scope: creating fake summaries, reopening shipped
mechanics, closing todos that are legitimately routed to still-open phases
(42/43/44/45), Phase 12 human UAT, and any `src/`/test change.

</domain>

<decisions>
## Implementation Decisions

**Locked on archivist judgment, derived from the Phase 47 manifest's already-accepted
routes (D-06/D-07/D-11 there). Never a silent or fabricated closure.**

### No fabricated history
- **D-01:** **Never manufacture a historical `SUMMARY.md`.** The manifest explicitly
  forbids inventing execution history. Closure is recorded in a dedicated Phase 49
  ledger (and optional `NN-CLOSURE.md` marker files that are clearly closure notes,
  not summaries), citing real git commits, live tests, and later-phase verification.
- **D-02:** **Preserve every legacy and off-roadmap directory — never delete or
  rename.** The duplicate Phase 02 (`02-design-decks` vs canonical `02-piecies`) and
  Phase 40 (long placeholder vs canonical short) directories stay in place; the
  ledger records the canonical route instead.

### Evidence tiers (three honest dispositions)
- **D-03:** Each legacy plan-without-summary gets exactly one of:
  **SUPERSEDED** (real git commit(s) + live tests + a later-phase verification chain
  prove the work shipped — record the chain, do not re-run the plan);
  **INSUFFICIENT-EVIDENCE-PRESERVED** (implementation artifacts exist but the
  original acceptance gate/human approval was never captured — record what exists and
  what is missing, do not paper over the gap);
  **GENUINELY-UNFINISHED** (the plan's promise was never fully met — record the delta
  and route it forward, do not silently close).

### The two judgment-call items (manifest flagged them for a Phase 49 decision)
- **D-04 (Phase 29 card-test-library):** **Formally SUPERSEDE the over-broad promise.**
  `29-01-PLAN.md` promised a registry covering *every* card + all 35 Mosje abilities;
  the live architecture (`CARD_REGISTRY` ~40 entries + `ABILITY_REGISTRY` ~8 + many
  specialized suites, all green in the 745-test run) is the accepted current design.
  Record supersession-of-scope with evidence; do **not** execute the stale
  complete-registry plan as new work.
- **D-05 (Phase 32 dice modal, `autonomous:false`):** **Preserve the missing
  human-approval distinction.** The planned DOM/hooks exist and later Playwright
  suites exercise them, so record current visual verification as sufficient for
  *ledger closure*, but explicitly note the original blocking **human visual
  approval was never captured** — flag it as a residual (routable to a
  `$gsd-verify-work 12`-style human pass), never silently marked approved.

### Todos
- **D-06:** **Only record closure for todos whose work fully shipped**; never close a
  todo routed to a still-open phase. Per manifest: alyssa-jisca-synergy (shipped in
  Phase 38) and coerts-caravan-binti-discount (shipped in Phase 41) get closure
  evidence; ability-text-reconciliation and remaining-mosje-synergies get their
  **delivered subsets** recorded while their remainders stay as backlog input for the
  open Phase 42; ts-bulldozer (45), full-game-audit (42), the-void (44), and
  dierenasiel (43) are **left untouched** as inputs to their open phases.

### Scope discipline
- **D-07:** **Docs/evidence-only — zero `src/` and zero test changes.** Unlike Phase 48
  (which added gap-fill tests), Phase 49 writes only closure documentation. A
  GENUINELY-UNFINISHED item is *recorded and routed*, not built here.
- **D-08:** **Primary deliverable = `49-VERIFICATION.md`**, a closure ledger with one
  row per legacy item (plan / off-roadmap dir / todo → disposition → evidence
  (commit/test/later-phase) → route), modeled on `48-VERIFICATION.md`. Optional
  `NN-CLOSURE.md` markers in the legacy phase dirs point back to it.

### Claude's Discretion
- Ledger column layout; whether to emit per-directory `NN-CLOSURE.md` markers or keep
  a single consolidated ledger; wave/plan batching across the ~20 items; whether to
  re-run `gsd-sdk query validate.health` as an appendix to show the honest
  before/after (health may legitimately remain "degraded" since fabricating summaries
  is forbidden — that is an acceptable, documented outcome, not a failure).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of truth for this phase
- `.planning/phases/47-milestone-planning-ledger-reconciliation-and-verification-ba/47-RECONCILIATION-MANIFEST.md`
  — the authoritative catalogue: "Plans Without Summaries" (9), "Off-Roadmap Phase
  Directories" (9 + duplicate routes), "Pending Todos", "Duplicate Directory Routes".
  Every disposition in this phase traces to a row there.
- `.planning/v1.0-v1.0-MILESTONE-AUDIT.md` — the audit that flagged the legacy ledger
  debt and set the Recommended Closure Order (Phase 49 is the evidence-closure item).

### Format model
- `.planning/phases/48-original-requirement-verification-backfill-for-phases-01-06-/48-VERIFICATION.md`
  — the traceability-ledger format to model `49-VERIFICATION.md` on.

### Evidence oracles (for confirming "superseded" claims)
- Git history (`git log --oneline --all --grep=...`) for the commits the manifest
  cites (e.g. `211703a`, `a284d68`, `e23424c`, `d9a3eda`, `53be62d`).
- Live tests named in the manifest: `tests/ui/simulation/chain-tests.spec.js`,
  `tests/engine/defeat-at-zero-mp.test.ts`, `tests/engine/mp-cap.test.ts`,
  `tests/ui/mechanics.spec.js`, `tests/ui/cards/alyssa-jisca-synergy.spec.js`,
  `tests/ui/cards/card-registry.js`.
- `CLAUDE.md` — never delete/rewrite history; honest recording over cosmetic green.

</canonical_refs>

<code_context>
## Existing Code Insights

### The 9 plans without summaries (manifest dispositions)
- `02-piecies/01-01` → SUPERSEDED (Phase 48 verified every Piecie IMPL requirement).
- `06-integration/01-01` → SUPERSEDED (`06-integration/02-COMPLETION.md`, later lobby/deck tests, Phase 46 705/705).
- `16-eendjes-voeren-place/16-01` → SUPERSEDED (commits `211703a`,`1171b60`; chain-tests).
- `28-visual-ui-tests/28-01` → INSUFFICIENT-EVIDENCE (map current `mechanics.spec.js` 11 tests to the old 10-test contract).
- `29-card-test-library/29-01` → GENUINELY-UNFINISHED → **supersede over-broad scope (D-04)**.
- `30-defeat-at-zero-mp/30-01` → SUPERSEDED (commit `a284d68`; `defeat-at-zero-mp.test.ts`; Phase 37).
- `31-mp-cap-invariant/31-01` → SUPERSEDED (commit `e23424c`; `mp-cap.test.ts`; Phase 46).
- `32-onfield-mosje-info-dice-modal/32-02` → INSUFFICIENT-EVIDENCE + **preserve missing human approval (D-05)**.
- `38-alyssa-jisca.../38-02` → SUPERSEDED (commits `d9a3eda`,`53be62d`; synergy tests).

### Off-roadmap directories to preserve + dispose
16, 17, 18, 19, 20, 21, 29, 33, 34, plus duplicate routes 02 (`02-design-decks`) and
40 (long placeholder). None re-added to the active roadmap.

### Integration Points
- `49-VERIFICATION.md` closure ledger written to the phase dir.
- Optional `NN-CLOSURE.md` markers in legacy phase dirs (closure notes, not summaries).
- No `.planning/REQUIREMENTS.md` ticks (those were Phase 48's scope).

</code_context>

<specifics>
## Specific Ideas

The milestone is non-archivable until this legacy ledger debt is honestly closed.
The archivist stance: prove "shipped" with a real commit + live test + later-phase
verification before writing SUPERSEDED; where the original gate (esp. human visual
approval on Phase 32) was never captured, say so plainly rather than inventing a
green; and never delete or rename a legacy directory — the durable record is a
ledger entry, not a tidy filesystem.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 12 human UAT** (Bagga of Greed, Welloe Force redirect, MP Adjuster) — a
  separate `$gsd-verify-work 12` activity; Phase 49 only notes the residual for
  Phase 32's un-captured human approval, it does not perform UAT.
- **Phases 42-45** (full-game audit, Dierenasiel, The Void, TS Bulldozer) — open
  design phases; their routed todos stay as inputs, not closed here.
- **Flipping `validate.health` to healthy** — not a goal; honest closure may leave it
  "degraded" because fabricating summaries is forbidden (D-01). Documented, not forced.

</deferred>

---

*Phase: 49-legacy-execution-evidence-closure-for-plans-without-summaries-and-off-roadmap-phase-artifacts*
*Context authored: 2026-07-21 (archivist judgment, from the Phase 47 manifest)*
