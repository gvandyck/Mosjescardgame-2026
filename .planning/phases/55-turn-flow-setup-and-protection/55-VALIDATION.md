# Phase 55 - Validation Map

Every plan ends with `npm test` green. Playwright runs headless only (temporary headless config, deleted after). `npm run test:sim` is never run.

| Requirement | Handoff test | Test file | Command | Plan |
|---|---|---|---|---|
| RULE-05 setup (starting Mosje free+fresh, 3 cards, 2 Energy, 3 face-up Quests, die) | E11 | `tests/engine/setup-2-0.test.ts` | `npx vitest run tests/engine/setup-2-0.test.ts` | 55-01 |
| RULE-05 R5 (P1 3 cards after first draw, P2 4) | **E11** | `tests/engine/setup-2-0.test.ts` | same | 55-01 |
| RULE-05 turn-step order, start/end triggers, "this turn" boosts expire, no trickle | — | `tests/engine/turn-steps.test.ts` | `npx vitest run tests/engine/turn-steps.test.ts` | 55-02 |
| RULE-06 empty field (R1) | **E9** | `tests/engine/empty-field-r1.test.ts` | `npx vitest run tests/engine/empty-field-r1.test.ts` | 55-02 |
| RULE-08 level-up protection flag set/clear | (E10 is Phase 56) | `tests/engine/turn-steps.test.ts` | as above | 55-02 |
| RULE-07 cooldown turn | **E21** | `tests/engine/cooldown-turn.test.ts`, rewritten `tests/engine/deck-out.test.ts`, `tests/deckout-event-marker.test.ts` | `npx vitest run tests/engine/cooldown-turn.test.ts tests/engine/deck-out.test.ts tests/deckout-event-marker.test.ts` | 55-03 |
| TABLE-01 summon cost, fresh, max 2 | **E2** | `tests/engine/summon-cost.test.ts` | `npx vitest run tests/engine/summon-cost.test.ts` | 55-03 |
| RULE-08 fresh: opponent can't hit/choose, AoE skip, ignores Places | — | `tests/engine/fresh-protection.test.ts`, `tests/engine/fresh-ignores-places.test.ts`, `tests/engine/entry-protection.test.ts` | `npx vitest run tests/engine/fresh-protection.test.ts tests/engine/fresh-ignores-places.test.ts tests/engine/entry-protection.test.ts` | 55-04 |
| RULE-10 Quest lock, 4th slot, MP cost, skip, trickle gone | — | `tests/engine/v4-leftovers-removed.test.ts` (static + behaviour) | `npx vitest run tests/engine/v4-leftovers-removed.test.ts` | 55-05 |
| RULE-10 "active Mosje" gone | — | `tests/engine/no-active-mosje.test.ts`, `tests/engine/own-target-choice.test.ts` | `npx vitest run tests/engine/no-active-mosje.test.ts tests/engine/own-target-choice.test.ts` | 55-06 |
| Bot keeps finishing (Example Decks) | — | `tests/bot/offlineGame.smoke.test.ts` | `npx vitest run tests/bot/offlineGame.smoke.test.ts` | every plan |
| Live board: setup, R5, cooldown, summon cost | E11/E21/E2 on board | `tests/ui/turn-flow-2-0.spec.js` + rewritten specs | `npx playwright test -c <temp headless config> tests/ui/turn-flow-2-0.spec.js` | 55-07 |
| Whole suite | — | all | `npm test` | every plan |
