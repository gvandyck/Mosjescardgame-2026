---
phase: 07-leaderboard
plan: 02
status: complete
---

## Completed

**leaderboard.html** — created following store.html pattern: header with ← Lobby back button, status paragraph for loading/empty/error states, table with rank/player/wins/losses/win-rate/streak columns, tbody rendered by JS. Script tag loads `src/leaderboard.js`.

**styles/leaderboard.css** — created using CSS variables (`--mosje-gold`, `--board-bg`). Top-3 ranks highlighted in gold. Win column green, loss column red. Under 80 lines.

**src/leaderboard.js** — auth gate (redirect unauthenticated → account.html, anonymous → index.html), calls `fetchLeaderboard()`, handles loading/empty/error states, renders table rows with `escapeHtml()` on all RTDB-sourced strings (XSS mitigation T-07-06).

**index.html** — added `<a href="./leaderboard.html" class="btn-secondary btn-leaderboard">Leaderboard</a>` after the Store link inside `#lobby-form`.

## Verification

All 588 tests pass. No regressions.
