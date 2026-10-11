# Phase 56: Attacking and Quests - Validation map

| Requirement | Handoff test | Test file | Command | Plan |
|---|---|---|---|---|
| PLAY-02 attack by Power, Power 0 nothing, fresh attacker refused, fresh/protected target refused, sideways target allowed | **E12**, E10 (attack side) | `tests/engine/attack.test.ts` | `npx vitest run tests/engine/attack.test.ts` | 56-01 |
| PLAY-02 attack triggers (Unstoppable, Flow, Welloe Force, Diefje, Hemorrhage, Zo is Natuur, Momentum Stabilizer) | — | `tests/engine/attack-triggers.test.ts` | `npx vitest run tests/engine/attack-triggers.test.ts` | 56-01 |
| PLAY-04 dice = stars, min 1, max 4, +1 die Place and Piecie | **E15** | `tests/engine/quest-dice.test.ts` | `npx vitest run tests/engine/quest-dice.test.ts` | 56-02 |
| PLAY-04 band need + win/lose, seeded dice | **E16** | `tests/engine/quest-bands.test.ts` | `npx vitest run tests/engine/quest-bands.test.ts` | 56-02 |
| PLAY-06 tokens, replace, reshuffle own discards | **E17** | `tests/engine/quest-stacks.test.ts` (unit) + `tests/engine/quest-attempt.test.ts` (2 fails by different players) | `npx vitest run tests/engine/quest-stacks.test.ts tests/engine/quest-attempt.test.ts` | 56-02, 56-03 |
| PLAY-01 one action per Mosje, `canMosjeAct` gate, cooldown | **E13** | `tests/engine/one-action.test.ts`, `tests/engine/cooldown-turn.test.ts` | `npx vitest run tests/engine/one-action.test.ts tests/engine/cooldown-turn.test.ts` | 56-03 |
| PLAY-03 any Mosje, any of the 3 face-up Quests; Trained | **E18** | `tests/engine/quest-attempt.test.ts` | `npx vitest run tests/engine/quest-attempt.test.ts` | 56-03 |
| PLAY-05 cost before roll, never refunded, hand-or-ready | **E20** | `tests/engine/quest-costs.test.ts` | `npx vitest run tests/engine/quest-costs.test.ts` | 56-03 |
| PLAY-07 jab 10, getemt at 0, never fresh, hits level-up protected | **E19**, E10 (jab side) | `tests/engine/quest-jab.test.ts` | `npx vitest run tests/engine/quest-jab.test.ts` | 56-04 |
| PLAY-07 named bonuses, +1 die rules, Vraag Aad, Cheat code, Debug System, Parkeren Delft, Form Alliance | — | `tests/engine/quest-extras.test.ts` | `npx vitest run tests/engine/quest-extras.test.ts` | 56-04 |
| PLAY-01 bot attacks/Quests legally, games finish | — | `tests/bot/bot-actions-2-0.test.ts`, `tests/bot/offlineGame.smoke.test.ts` | `npx vitest run tests/bot` | 56-05 |
| PLAY-03 human sees 3 face-up Quests, picks Mosje -> Attack/Quest | — | `tests/ui/attack-and-quest-2-0.spec.js` (headless) | `npx playwright test -c playwright.headless.tmp.config.js tests/ui/attack-and-quest-2-0.spec.js` | 56-06 (UI), 56-09 (spec) |
| V4 Quest system gone (shared deck, Personal, thresholds, successMP/failMP, getFirstActiveMosje) | — | `tests/engine/v4-leftovers-removed.test.ts` (static) | `npx vitest run tests/engine/v4-leftovers-removed.test.ts` | 56-08 |
| Syntax of UI files | — | — | `for f in src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js; do node --check "$f"; done` | every plan touching UI |
| Whole suite | — | all | `npm test` | every plan |

Never: `npm run test:sim`, headed Playwright.
