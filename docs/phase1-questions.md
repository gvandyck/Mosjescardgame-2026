# Phase 1 Questions

1. check-victory signature conflict:
- Spec requires `checkVictory(state): { winnerId; reason }` (pure return value), but also states it should emit `game_won` event.
- Current implementation keeps `checkVictory` pure and event emission is expected to be done by caller reducers.

2. Quest completion source of truth:
- `PlayerState` does not include a dedicated `questsCompleted` field in Phase 1 types.
- Current implementation reads `flags.quests_completed_total` as numeric source for quest-master condition.

3. Snelle activation classification in scaffolding:
- No typed card catalog exists in Phase 1 core for determining whether a card is Snelle.
- Current reducer action for `activatePiecie` accepts explicit `isSnelle` boolean input from caller.
