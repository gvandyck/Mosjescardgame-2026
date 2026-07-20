# Phase 48: Original Requirement Verification Backfill (Phases 01-06 and 09) - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce honest, evidence-backed traceability for the **64 original milestone
requirements** — 28 `IMPL-PF-*`, 27 `IMPL-AR-*`, 4 cross-cutting `IMPL-*`, and 5
Phase-9 `BUG-*` — which today read **0/64 satisfied** in the milestone audit
purely because no VERIFICATION.md references them (an evidence gap, not a claim
the mechanics are broken; `npm run validate` passes 705/705).

This phase **verifies and records**; it does not add game features. In scope:
mapping each requirement to its current card and to real passing test evidence,
writing focused tests only where a live requirement has none, and recording the
result in a durable traceability matrix + the requirements ledger. Out of scope:
changing any runtime game behavior, fixing defects a test uncovers (flag them),
backfilling the other ~28 phases' VERIFICATION.md, Phase 12 human UAT, and
Phases 42-45 product work.

</domain>

<decisions>
## Implementation Decisions

**The user delegated these to experienced-tester judgment ("pick for me, think
as an experienced tester"). Decisions below are locked on that basis.**

### Evidence bar — what counts as "verified"
- **D-01:** A requirement is **VERIFIED only when an automated test exercises its
  behavior with a real assertion that would fail if the mechanic broke.** Use the
  strongest evidence available, tiered: **(T1)** a dedicated unit test
  (`tests/effects/`, `tests/abilities/`, `tests/engine/`) or browser card test
  (`tests/ui/cards/`) asserting the observable effect; **(T2)** coverage by an
  integration/simulation test that makes a real behavioral assertion. **Code
  presence / registry wiring alone is NOT verification** — that is a gap (T3).
- **D-02:** **No tautological or smoke-only evidence.** The cited test must assert
  the effect's outcome (MP delta, lifecycle flag, guard, quest result, etc.), not
  merely that the card loads or exists. Actively guard against false-green: if the
  only "test" would still pass with the effect deleted, it does not count.

### Whether Phase 48 writes missing tests
- **D-03:** **Map-first, then fill the gaps.** First map all 64 requirements to
  existing passing evidence (the 705-test suite likely already covers a large
  share). Only requirements with **no qualifying evidence** get a **new focused
  test**, written with the existing patterns (card-test-library / effect unit
  tests). This makes the traceability real, not cosmetic — retire the debt, don't
  just document it.
- **D-04:** **Tests-only — no runtime/game-logic changes.** Phase 48 must not alter
  `src/` card/effect/engine behavior. If a new test reveals a **real defect**,
  follow CLAUDE.md's reproduce-first rule and record it as a **FINDING for a
  separate fix phase** — never silently patch game logic inside this verification
  phase. A verification phase that quietly changes behavior is not a verification.

### Output / traceability form
- **D-05:** **Primary deliverable = a consolidated Phase 48 traceability matrix**
  (`48-VERIFICATION.md`, modeled on the existing VERIFICATION.md format) with one
  row per requirement: `requirement id → current card id → evidence (test
  file::test name | "gap → new test added" | honest disposition) → status`. Tick
  the matching `REQUIREMENTS.md` checkbox **only** when real passing evidence
  exists, and annotate each ticked box with its evidence pointer.
- **D-06:** **Backfill a dedicated Phase 09 `VERIFICATION.md` for BUG-01..05** (the
  audit explicitly flags "Phase 09 verification is missing"). For Phases 01-06,
  **cite the consolidated matrix rather than manufacturing six separate legacy
  VERIFICATION.md files** — do not invent per-phase historical reports (consistent
  with Phase 47's D-04: never fabricate execution history).

### Stale / diverged requirements
- **D-07:** **ID normalization is expected and must be recorded.** The 2026-05
  requirement slugs map to current card ids via hyphen→underscore plus a card-type
  prefix (confirmed in scout: `broodje-doner` → `piecie_broodje_doner`,
  `warm-kannetje-melk` → `piecie_warm_kannetje_melk`). Record the explicit
  old-slug → current-id mapping in the matrix for **every** requirement, so the
  trace is reproducible.
- **D-08:** **Three honest dispositions, never a silent tick.** **VERIFIED**
  (mapped to a live card + a qualifying passing test); **SUPERSEDED** (card
  reworked/renamed/merged in a later phase 35-46 — verify the *current* behavior
  that fulfills the requirement's intent and cite the phase); **GAP/DESCOPED** (no
  live player-facing card, or no obtainable evidence — recorded with reason, never
  ticked). **BUG-01 specifically** must gain a real regression test asserting the
  correct quest-roll-threshold behavior; its ledger note only mentions a debug log
  added, so if no behavioral assertion exists it is a GAP, not verified.

### Claude's Discretion
- Exact matrix columns and formatting; per-requirement choice of unit vs browser
  test when a gap must be filled; batching/wave structure across the 64 rows;
  which cheap card-test-library rows to group. The planner/executor decide these.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirement source of truth
- `.planning/REQUIREMENTS.md` — the 64 requirement ids (`IMPL-PF-*`, `IMPL-AR-*`,
  cross-cutting `IMPL-*`, `BUG-01..05`); the checkboxes this phase ticks.
- `.planning/v1.0-v1.0-MILESTONE-AUDIT.md` — the 0/64 strict-traceability finding,
  requirement grouping (28/27/4/5), and Recommended Closure Order (item 2 = this
  phase).
- `.planning/phases/47-milestone-planning-ledger-reconciliation-and-verification-ba/47-RECONCILIATION-MANIFEST.md`
  — the Verification Debt section routing all IMPL + BUG-* traceability to Phase 48.

### Current card behavior (mapping + verification targets)
- `docs/card-reference.md` — current card behavior, the mapping/verification oracle.
- `src/data/piecies.js`, `src/data/snellePiecies.js`, `src/data/places.js`,
  `src/data/mosjes.js`, `src/data/quests.js` — current card ids/definitions.
- `docs/phase0-rulings.md` — canonical rules, for judging correct behavior.

### Format models + process
- `.planning/phases/46-thematic-piecie-cards-for-specific-mosjes-add-jeffrey-s-load/46-VERIFICATION.md`
  and `.planning/phases/36-.../36-VERIFICATION.md` — VERIFICATION.md format to model
  `48-VERIFICATION.md` on.
- `CLAUDE.md` — reproduce-first rule (D-04), tests-only discipline, the full
  verification sequence (`node --check`, `npm test`, Ronald Kip stacking, sim).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/ui/cards/card-registry.js` + `card-test-runner.js` — the data-driven
  browser card-test-library; cheap per-card behavioral tests (the primary tool for
  filling gaps on player-facing cards).
- `tests/effects/*.test.ts`, `tests/abilities/*.test.ts` — unit effect tests
  (MP deltas, lifecycle, guards); the pattern for engine-level gap-fills.
- `tests/engine/` — MP/quest/turn/level assertions; `tests/data/` — definition
  validity. 112 test files already exist; most requirements likely already map here.

### Established Patterns
- **ID normalization:** requirement slug (hyphen) → current card id
  (underscore + `piecie_`/`snelle_`/`place_`/`mosje_`/`quest_` prefix).
- **"Text wins" / current-behavior convention:** where a card was reworked in a
  later phase, the *current* behavior is authoritative — verify intent against it.
- **Strongest-available evidence tiering** (D-01) and honest three-way disposition
  (D-08).

### Integration Points
- `48-VERIFICATION.md` (traceability matrix) written to the phase dir.
- `REQUIREMENTS.md` checkbox ticks with evidence annotations.
- New `.planning/phases/09-*/09-VERIFICATION.md` for BUG-01..05 (D-06).
- Any new tests land in the existing `tests/` tree so `npm test` catches them.

</code_context>

<specifics>
## Specific Ideas

The live game is already healthy (705/705 tests, sim 152/160 timeout-only, 0
crashes) — this phase's value is **honest traceability**, not fixing mechanics.
The tester stance: never mark a requirement passed without a test that would fail
if the mechanic broke; map old slugs to live cards explicitly; and when a card
diverged, verify the current behavior rather than pretending the 2026-05 form
still exists.

</specifics>

<deferred>
## Deferred Ideas

- **Backfilling VERIFICATION.md for the other ~28 roadmap phases** (the audit's
  "9/37 phases verified") — a separate Nyquist/verification effort, not this phase.
- **Fixing any real defect a new test uncovers** — separate fix phase, reproduce-first
  per CLAUDE.md (this phase flags, does not fix).
- **Phase 49** (legacy plan-without-summary evidence closure), **Phase 12** human
  UAT, **Phases 42-45** product work — separate routed phases per the Phase 47
  manifest's follow-up order.

### Reviewed Todos (not folded)
The 8 pending todos matched by keyword all belong to already-routed phases
(42-45 / 43) per the Phase 47 reconciliation manifest; none are verification-backfill
work. Not folded.

</deferred>

---

*Phase: 48-original-requirement-verification-backfill-for-phases-01-06-and-09*
*Context gathered: 2026-07-20*
