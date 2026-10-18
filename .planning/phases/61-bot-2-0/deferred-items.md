# Phase 61 deferred items

## 61-07: held Piecie activation loses its Piecie when a `piecieActivated` pause sits next to the reaction window (engine / driver, not a bot choice)

- Seen in the seeded game `EXAMPLE_REGELAARS` vs `EXAMPLE_CREATIEVELINGEN`, `Math.random` seed `0xB09` (the third seeded pairing in `tests/bot/reaction-bot.test.ts`), turn 12, Te Hard Gaan: 2x `engine-refused { call: 'resolveReaction', cardId: null, error: 'No Piecie in that slot' }`. Both answers were a pass.
- Cause: `activatePiecie` returns a state with BOTH `pendingChoice.hook === 'piecieActivated'` and a `pendingReaction` for the same activation (`withReactionWindow` only defers the window for hooks `piecie` / `snelle`). `botDriver.js` line ~245 runs `settleMosjePauses` first, which finishes the activation and removes the Piecie from its slot; the window then replays the held `activatePiecie` against the empty slot. `settleReactions` drops the broken window (the game goes on), so the responder simply loses that reaction chance.
- Not fixed in 61-07 (engine window order, outside the reaction choice). For the 61-08 sweep / 61-09 legality check: either add `piecieActivated` to the early-return list in `withReactionWindow`, or settle the window before the pause in the driver.

**RESOLVED in 61-08 (9f905be):** `settle()` in `botDriver.js` now also answers the Mosje pause a held replay leaves behind (and any window that pause opens), so the next engine call never sees an unanswered `piecieActivated` pause. The `withReactionWindow` early-return list was left alone: it would skip the opponent's window for those activations, and `resolvePendingChoice` only reopens windows for hooks `piecie` / `snelle`. Guard: `tests/bot/bot-hand-cards.test.ts` "a Piecie answered through a reaction window leaves no unanswered Mosje pause".

## 61-08: open engine gaps found by the 1800-game sweep (not in the 12 seeded games)

- Drain Reversal: the rider ("one opponent Mosje loses 10 MP") can send the attacker sideways, so the held attack replays with "This Mosje cannot act" and `resolveReaction` refuses the whole card (9 of 1800 games, e.g. seed 0xB00E CREATIEVELINGEN vs REGELAARS).
- Perfect Dodge: with a sideways 0 MP Level 1 target the window state already holds `_pendingWelloe`; playing the Snelle sweeps the Mosje to the Welloe pile and the held attack fails with "Invalid attack target" (1 of 1800, seed 50349 TAKSEN vs CREATIEVELINGEN). `applyGetemt` sets the flag; likely the window's dry run touches the live slot.

## 61-09: status of the two open engine gaps

Still OPEN for Gandalf to decide (not worked around in the bot). Neither occurs in the 15 seeded games of `tests/bot/bot-legality.test.ts` (0 engine-refused there); they only show in wider sweeps. Also open, not a refusal: the bot never uses draw-step abilities (Coert Tech, Martin Historian).
