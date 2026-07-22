---
phase: 47
slug: milestone-planning-ledger-reconciliation-and-verification-backfill-routing
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-19
---

# Phase 47 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | GSD registered queries + Git/file integrity checks |
| **Config file** | `.planning/config.json` |
| **Quick run command** | `git diff --check` |
| **Full suite command** | `gsd-sdk query validate.health` plus roadmap/state/UAT projections |
| **Estimated runtime** | under 15 seconds |

## Sampling Rate

- **After every task:** Run `git diff --check` and inspect changed paths.
- **After every SDK mutation:** Inspect the exact ROADMAP.md/STATE.md diff and
  rerun the affected registered projection.
- **After the plan:** Run the complete projection set and compare planning-file
  inventories.
- **Max feedback latency:** 15 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 47-01-01 | 01 | 1 | D-01–D-07 | T-47-01, T-47-02 | Preserve artifacts and classify evidence honestly | integrity | `git diff --check` + inventory comparison | ✅ | ⬜ pending |
| 47-01-02 | 01 | 1 | D-08–D-11 | T-47-03 | Add only explicit follow-up routes with supported handlers | projection | `gsd-sdk query roadmap.analyze` | ✅ | ⬜ pending |
| 47-01-03 | 01 | 1 | D-03, D-05 | T-47-04 | State no longer falsely routes milestone archival | projection | `gsd-sdk query state.json; gsd-sdk query state.validate` | ✅ | ⬜ pending |

## Wave 0 Requirements

Existing SDK projections and Git/file-integrity commands cover all Phase 47
requirements. No scaffolding is required.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Exact semantic correctness of historical classifications | D-04–D-07 | Evidence requires human-readable judgment across legacy artifacts | Review every manifest row against its cited path and accepted context decision |
| Safety of each ROADMAP/STATE mutation | D-03 | Legacy document shape may produce a syntactically valid but semantically surprising diff | Inspect each handler-produced diff before proceeding |

## Validation Sign-Off

- [x] All planned tasks have automated verification.
- [x] Sampling continuity has no three-task gap.
- [x] No Wave 0 references are missing.
- [x] No watch-mode flags are used.
- [x] Feedback latency is under 15 seconds.
- [x] `nyquist_compliant: true` is set.

**Approval:** pending plan verification

