---
phase: 26
slug: debug-logging-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-05
---

# Phase 26 — Validation Strategy

> All three requirements are browser-UI observability features. The existing test suite does not import main.js or logRenderer.js, so behavioral coverage is manual-only. Automated gates confirm syntax and regression safety only.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest via `npm test` |
| **Quick run command** | `node --check src/main.js src/ui/logRenderer.js src/ui/modalManager.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --check src/main.js src/ui/logRenderer.js src/ui/modalManager.js`
- **After each plan completes:** Run `npm test`
- **End of phase:** Manual in-game verification per UAT steps below

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Rationale |
|--------|----------|-----------|-------------------|-----------|
| DBLOG-01 | MP changes appear in log with source label | manual-only | `node --check` + `npm test` (regression gate) | Log panel is browser DOM — no test imports main.js |
| DBLOG-02 | Level-up log entry uses 'level' type with before/after | manual-only | `node --check` + `npm test` (regression gate) | Same — logStateOutcome is UI layer only |
| DBLOG-03 | Quest roll shows "Rolled X — needed Y+" in log | manual-only | `node --check` + `npm test` (regression gate) | showDiceRoll callback is browser modal |

---

## Wave 0 Gaps

None — no new test files required. Existing `npm test` serves as regression gate.

---

## Manual UAT Checklist (run after execution)

### DBLOG-01 — MP Source Logging
1. Start offline game, activate a Quest
2. When quest cost is deducted, confirm log shows: `Quest cost: −20 MP (Mosje Name) — [Quest Name]`
3. Succeed a quest, confirm log shows: `+N MP → Mosje Name (Quest: [Quest Name])`
4. Fail a quest, confirm log shows: `−N MP → Mosje Name (Quest: [Quest Name])`

### DBLOG-02 — Level-Up Logging
1. Play until a Mosje levels up
2. Confirm log panel shows a ⬆️ entry (level type): `Mosje Name levelled up! 1 → 2`
3. Confirm the entry is distinct from grey ℹ️ info entries

### DBLOG-03 — Quest Roll Logging
1. Attempt any quest and complete the dice roll
2. Confirm log shows: `Rolled 4 — needed 3+ → Success` (or equivalent for fail)
3. Confirm both threshold and actual roll number are visible
