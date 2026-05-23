---
phase: 07-leaderboard
plan: 01
status: complete
---

## Completed

**statsStore.js** — created with `updateStats(uid, outcome)` (runTransaction), `getStats(uid)`, `getAllStats()`.

**leaderboardStore.js** — created with `fetchLeaderboard()` that fetches full users node, skips entries without stats or displayName, computes winRate (1 decimal), sorts by wins desc / winRate desc.

**matchRewards.js** — added `import { updateStats }` and `await updateStats(uid, outcome)` call after wallet deduction inside `claimMatchReward`.

**accountSetup.js** — changed signature to `initNewAccount(uid, displayName = '')`, writes `users/{uid}/profile/displayName` on every call (before the early-return so it refreshes on every login).

**main.js, store.js, deck-builder.js** — all three `initNewAccount` call sites updated to pass `user.displayName || ''`.

**database.rules.json** — added `stats: { ".read": "auth != null" }` and `profile: { ".read": "auth != null" }` child overrides so any authenticated user can read leaderboard data cross-uid. Write remains owner-only.

## Verification

All 588 tests pass. No regressions.
