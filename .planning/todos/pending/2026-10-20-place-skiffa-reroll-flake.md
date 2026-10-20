# place_skiffa reroll card case is flaky

**Filed:** 2026-10-20 (Phase 61.1 plan 04, found by the full headless card run)

## Symptom
The `place_skiffa` reroll case in the card-test-library (`tests/ui/cards/`) gives a different MP result per run
(0, 20 or 90 instead of the expected 75). Run alone it failed 2 of 12 on the Phase 61.1 code and 11 of 24 on the
pre-phase commit 6c5b363, so it is NOT caused by Phase 61.1.

## Guess (not investigated)
Randomness in the test setup (dice / reroll / deck order not pinned). Pin the RNG or seed the reroll in the case,
the same way VIS-02 was stabilised by pinning the bot hand.

## Rules
Reproduce in a live browser first (CLAUDE.md bug rule); never weaken the assertion.
