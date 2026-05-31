---
status: partial
phase: 12-unfinished-stubs
source: [12-VERIFICATION.md]
started: 2026-05-31T20:15:00Z
updated: 2026-05-31T20:15:00Z
---

## Current Test

Approved during Plan 04 browser checkpoint (2026-05-31).

## Tests

### 1. Bagga of Greed modal
expected: After activation, showCardChoice shows full hand; picking a card discards it; "Keep Both Cards" keeps all
result: approved (checkpoint 2026-05-31)

### 2. Welloe Force modal
expected: After activation, showOptionSelect shows opponent Mosje slots; selection stored as _welloeForceActive.targetSlotId for 3-turn redirect
result: approved (checkpoint 2026-05-31)

### 3. MP Adjuster modal
expected: showOptionSelect shows 20/40/60/80/100 MP options; chosen value set on Mosje; reverts at next turn start
result: approved (checkpoint 2026-05-31)

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
