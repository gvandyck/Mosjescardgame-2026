# Phase 57 - Validation Map

Gate after every plan: `for f in src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js; do node --check "$f"; done` (plus any new `src/ui/actions/*.js`), then `npm test` green. Never `npm run test:sim`. Playwright only headless via a temporary `playwright.headless.tmp.config.js` (copy of `playwright.config.js` with `headless: true`, deleted after the run).

| Req / test | What it proves | Test file | Command | Plan |
|---|---|---|---|---|
| E22 / TABLE-02 | Piecie not ready the round it is placed, ready on owner's next turn, 4th Piecie refused, Place never uses a slot | tests/engine/piecie-timing.test.ts | `npx vitest run tests/engine/piecie-timing.test.ts` | 57-01 |
| Activate bug | Own ready Piecie shows an Activate button headless | tests/ui/piecie-activate-headless.spec.js | `npx playwright test -c playwright.headless.tmp.config.js tests/ui/piecie-activate-headless.spec.js` | 57-01 |
| E25 / TABLE-02 | Stays card stays face-up in its slot until its end time, then discard; non-Stays discards at once | tests/engine/stays.test.ts | `npx vitest run tests/engine/stays.test.ts` | 57-02 |
| E23 / TABLE-03 | No Snelle with 3 slots full; Snelle uses a slot, resolves, goes to discard; Blensen! stays until end of turn; off-turn OK; cooldown blocked | tests/engine/snelle-slot.test.ts | `npx vitest run tests/engine/snelle-slot.test.ts` | 57-03 |
| TABLE-06 | Welloe pile separate, never shuffled back, only Reborn / Call take out, blocked under Welloe Graveyard | tests/engine/welloe-pile.test.ts | `npx vitest run tests/engine/welloe-pile.test.ts` | 57-03 |
| E24 / TABLE-05 | Second Place refused; works at once; destroyed -> owner's discard; fresh ignore; own turn only; no cooldown | tests/engine/place-play.test.ts | `npx vitest run tests/engine/place-play.test.ts` | 57-04 |
| TABLE-04 engine | Each of the 7 defender moments and the 3 acting-player moments opens a window only with eligible Snelle + free slot + Energy; pass/play resolves; no reopen | tests/engine/reaction-windows.test.ts | `npx vitest run tests/engine/reaction-windows.test.ts` | 57-05 |
| TABLE-04 data | Every Snelle has a `reactionMoments` array matching the Card List map | tests/data/snelle-reaction-moments.test.ts | `npx vitest run tests/data/snelle-reaction-moments.test.ts` | 57-05 |
| TABLE-04 bot | Bot plays a reaction only to prevent getemt / Welloe; bot-vs-bot games finish (no deadlock) | tests/bot/reaction-bot.test.ts, tests/bot/offlineGame.smoke.test.ts | `npx vitest run tests/bot` | 57-05 |
| U6 / TABLE-04 | Reaction Snelle offered on the bot's attack only with a free slot and Energy; Sleutelpuntje offered before the human's own Quest roll | tests/ui/snelle-reaction.spec.js | `npx playwright test -c playwright.headless.tmp.config.js tests/ui/snelle-reaction.spec.js` | 57-06 |
| U7 / TABLE-05 | Place from hand applies at once, second Place blocked, destroyer works | tests/ui/place-play.spec.js | `npx playwright test -c playwright.headless.tmp.config.js tests/ui/place-play.spec.js` | 57-06 |
| SHELL-04 | No V4 literal in src; every fixme/skip points at Phase 58-60 with a reason; VIS-01/08, chain-1/6 on 2.0 rules | tests/engine/v4-leftovers-removed.test.ts, tests/meta/fixme-reasons.test.ts, tests/ui/mechanics.spec.js, tests/ui/simulation/chain-tests.spec.js | `npm test` + headless run of the two specs | 57-07 |
</content>
</invoke>
<invoke name="Bash">
<parameter name="command">cd /c/Users/Gandoe/Documents/GitHub/Mosjescardgame-2026 && sed -n 1,40p .planning/phases/56-*/56-01-PLAN.md; ls tests/meta 2>/dev/null; grep -rn "test.fixme\|it.skip\|describe.skip\|test.skip" tests --include=*.ts --include=*.js | wc -l