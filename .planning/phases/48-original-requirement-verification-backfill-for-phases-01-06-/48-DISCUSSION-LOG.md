# Phase 48: Original Requirement Verification Backfill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 48-original-requirement-verification-backfill-for-phases-01-06-and-09
**Areas discussed:** Evidence bar, Write missing tests, Output form, Stale/diverged requirements

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence bar | What counts as "verified" for a requirement | ✓ |
| Write missing tests? | Whether Phase 48 writes tests or stays read-only | ✓ |
| Output form | REQUIREMENTS.md checkboxes + matrix vs per-phase VERIFICATION.md | ✓ |
| Stale/diverged reqs | How to handle reworked/removed cards honestly | ✓ |

**User's choice:** "pick for me, make sure to think as an experienced tester" —
delegated all four decisions to experienced-tester judgment.

---

## Evidence bar (D-01, D-02)

Resolved as tester: verified = an automated test with a real behavioral assertion
that would fail if the mechanic broke (unit or browser). Code/registry presence
alone is a gap. No tautological/smoke evidence — actively guard against false-green.

## Write missing tests (D-03, D-04)

Resolved: map-first against the existing 705-test suite, then write focused tests
only for genuine gaps on live cards. Tests-only — no runtime/game-logic changes;
a defect a test uncovers is flagged as a finding for a separate fix phase
(reproduce-first per CLAUDE.md), never silently patched here.

## Output form (D-05, D-06)

Resolved: consolidated `48-VERIFICATION.md` traceability matrix (req → current
card id → evidence → status) + REQUIREMENTS.md checkbox ticks with evidence
pointers. Backfill a dedicated Phase 09 VERIFICATION.md for BUG-01..05 (audit
flags it missing); for Phases 01-06, cite the matrix rather than fabricating six
legacy per-phase reports.

## Stale/diverged requirements (D-07, D-08)

Resolved: record explicit old-slug → current-id mapping (hyphen→underscore + type
prefix, confirmed in scout). Three honest dispositions — VERIFIED / SUPERSEDED
(verify current behavior, cite phase) / GAP-DESCOPED (never ticked). BUG-01 must
gain a real regression test or be recorded as a gap.

---

## Claude's Discretion

Exact matrix columns/format; unit vs browser test choice per gap; wave/batch
structure across the 64 rows; grouping of cheap card-test-library rows.

## Deferred Ideas

- Backfilling VERIFICATION.md for the other ~28 roadmap phases (separate effort).
- Fixing any defect a new test uncovers (separate fix phase, reproduce-first).
- Phase 49, Phase 12 human UAT, Phases 42-45 (separate routed phases).
- 8 keyword-matched pending todos — all belong to already-routed phases (42-45/43); not folded.
