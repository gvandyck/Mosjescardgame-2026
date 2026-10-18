# Phase 61 deferred items

## 61-07: held Piecie activation loses its Piecie when a `piecieActivated` pause sits next to the reaction window (engine / driver, not a bot choice)

- Seen in the seeded game `EXAMPLE_REGELAARS` vs `EXAMPLE_CREATIEVELINGEN`, `Math.random` seed `0xB09` (the third seeded pairing in `tests/bot/reaction-bot.test.ts`), turn 12, Te Hard Gaan: 2x `engine-refused { call: 'resolveReaction', cardId: null, error: 'No Piecie in that slot' }`. Both answers were a pass.
- Cause: `activatePiecie` returns a state with BOTH `pendingChoice.hook === 'piecieActivated'` and a `pendingReaction` for the same activation (`withReactionWindow` only defers the window for hooks `piecie` / `snelle`). `botDriver.js` line ~245 runs `settleMosjePauses` first, which finishes the activation and removes the Piecie from its slot; the window then replays the held `activatePiecie` against the empty slot. `settleReactions` drops the broken window (the game goes on), so the responder simply loses that reaction chance.
- Not fixed in 61-07 (engine window order, outside the reaction choice). For the 61-08 sweep / 61-09 legality check: either add `piecieActivated` to the early-return list in `withReactionWindow`, or settle the window before the pause in the driver.
