---
phase: 62-2-0-card-faces
plan: 07
requirements-completed: [UI-04, TEST-04]
commits: [bdbeb68, 6466b14, d5e5386]
---
# Phase 62 Plan 07: Phase sweep Summary
**A10 Playwright spec at 1920x1080 (9 screenshots `a10-*.png`), a 183-card collision sweep (faces 230 / 120 px, tiles 240 / 120 px), a pixel-sampled 4.5:1 contrast check, and a "Card faces (Phase 62)" docs section; UI-04 and TEST-04 are proved and ticked.**
- Results (headless): a10 5/5 and sweep 4/4 green first run (test-only plan, no red phase); card-face suite 112/112; full `tests/ui/cards/` 429 passed / 2 failed (30.5 min); `npm test` 179 files / 2256 tests; `node --check` clean per file. Contrast over pure white art, measured pixels: text box 8.32:1, dim level rows (.55) 6.26:1, boxed Piecie box 19.68:1. Sweep: 0 collisions at all four sizes, only `piecie_bowie_stormey` clamps (known).
- Criteria: 1 cost + frosted box = cardv1-* specs + sweep + a10 contrast; 2 Mosje full art / foil / rows = `card-face-2-0-a10.test.ts` + cardv1-mosje + a10 Mosje (L1, L2, detail, hand) + sweep (3 rows at 230, 1 at 120); 3 Piecie / Snelle / Place = cardv1-piecie / snelle / place + a10 Place and Piecie; 4 Quests = cardv1-quest (38) + a10 Quest + quest-card-tiers; 5 = the a10 unit file (tier, foil, tag-first, cost 0) + a10 spec. The A10 Fresh / Protected badge item stays in Phase 63 (62-CONTEXT).
- RED, honestly: `hand-animation-perf` p95 66.7 ms vs < 25 = KNOWN GAP. Green on 907734c (p95 16.7), already red on 0355d80 (p95 50.1: hover dock + 150% hand, before any Phase 62 face); the frosted `backdrop-filter` adds on top. Attribution at HEAD, p95: no blur 50.0, no dock 50.0, neither 16.7 (headless software rendering). Blur is locked D-05 and the dock is approved, so it is a design call for Gandalf; test untouched.
- `place_skiffa` reroll = known flake (todo): red in the full run and one re-run, then 5 of 8 green alone (3 red). Baseline-red cinema `modal-preview` and `arena-hover` fail as before (no 4th hand card; `body` intercepts the hand click). No face-caused failure is left otherwise.
- Gandalf, please look: dim rows .55 vs "about 45%"; no cost on Piecie / Snelle / Place tiles. Settled 2026-10-20, listed only: single-success Quests "4+", Synergy short names, Blensen! STAYS, Jantje Jantje... Jantje? has no Needs line. Still open from earlier plans: Bowie & Stormey clamps, hover panel overlays the hand, 7 Quests have an empty text band.
- Other KNOWN GAPs: `deck-builder.js` still enforces V4 copy limits (Phase 64); Quest stacks and `tempMp` on the board are Phase 63. No deviations from the plan's code.
- Cleanup: baseline worktree and scratch spec removed, `pw-62.tmp.config.js` and `test-results/` removed with `rm -r`; the two Phase 50 shot PNGs, `_perf.out` (the perf spec rewrites it) and other untracked files left alone. Self-Check: PASSED.
