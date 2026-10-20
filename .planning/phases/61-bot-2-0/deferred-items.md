# Phase 61 deferred items

## 61-07: held Piecie activation loses its Piecie when a `piecieActivated` pause sits next to the reaction window (engine / driver, not a bot choice)

- Seen in the seeded game `EXAMPLE_REGELAARS` vs `EXAMPLE_CREATIEVELINGEN`, `Math.random` seed `0xB09` (the third seeded pairing in `tests/bot/reaction-bot.test.ts`), turn 12, Te Hard Gaan: 2x `engine-refused { call: 'resolveReaction', cardId: null, error: 'No Piecie in that slot' }`. Both answers were a pass.
- Cause: `activatePiecie` returns a state with BOTH `pendingChoice.hook === 'piecieActivated'` and a `pendingReaction` for the same activation (`withReactionWindow` only defers the window for hooks `piecie` / `snelle`). `botDriver.js` line ~245 runs `settleMosjePauses` first, which finishes the activation and removes the Piecie from its slot; the window then replays the held `activatePiecie` against the empty slot. `settleReactions` drops the broken window (the game goes on), so the responder simply loses that reaction chance.
- Not fixed in 61-07 (engine window order, outside the reaction choice). For the 61-08 sweep / 61-09 legality check: either add `piecieActivated` to the early-return list in `withReactionWindow`, or settle the window before the pause in the driver.

**RESOLVED in 61-08 (9f905be):** `settle()` in `botDriver.js` now also answers the Mosje pause a held replay leaves behind (and any window that pause opens), so the next engine call never sees an unanswered `piecieActivated` pause. The `withReactionWindow` early-return list was left alone: it would skip the opponent's window for those activations, and `resolvePendingChoice` only reopens windows for hooks `piecie` / `snelle`. Guard: `tests/bot/bot-hand-cards.test.ts` "a Piecie answered through a reaction window leaves no unanswered Mosje pause".

## 61-08: open engine gaps found by the 1800-game sweep (not in the 12 seeded games)

- Drain Reversal: the rider ("one opponent Mosje loses 10 MP") can send the attacker sideways, so the held attack replays with "This Mosje cannot act" and `resolveReaction` refuses the whole card (9 of 1800 games, e.g. seed 0xB00E CREATIEVELINGEN vs REGELAARS).
- Perfect Dodge: with a sideways 0 MP Level 1 target the window state already holds `_pendingWelloe`; playing the Snelle sweeps the Mosje to the Welloe pile and the held attack fails with "Invalid attack target" (1 of 1800, seed 50349 TAKSEN vs CREATIEVELINGEN). `applyGetemt` sets the flag; likely the window's dry run touches the live slot.

**RESOLVED in Phase 61.1:** Drain Reversal (61.1-01): `replayHeldAttack` fizzles the held attack when the rider sidelined the attacker (Card List ruling 2026-10-18), so the reaction is no longer refused; seed 0xB00E has 0 refused engine calls. Perfect Dodge (61.1-02): the same fizzle also covers a target that is no longer a valid attack target, and `resolvePendingChoice` no longer leaves a stale `_pendingWelloe` flag after a resumed trigger pick; seed 50349 has 0 refused engine calls. Guards: `tests/bot/reaction-replay-seeds.test.ts`, `tests/engine/reaction-replay-fizzle.test.ts`.

## 61-09: status of the two open engine gaps

Still OPEN for Gandalf to decide (not worked around in the bot). Neither occurs in the 15 seeded games of `tests/bot/bot-legality.test.ts` (0 engine-refused there); they only show in wider sweeps. Also open, not a refusal: the bot never uses draw-step abilities (Coert Tech, Martin Historian).

**RESOLVED in Phase 61.1:** both engine gaps are fixed (61.1-01, 61.1-02, see above). The verifier's hardening warnings W1-W3 are done: W1 and W2 (61.1-03: fizzle count per seeded game, `engine-refused` also on `settleMosjePauses` and the second `settleReactions` failure) and W3 (61.1-04: BOT-04 guard extended to `botDriver.js`, `settleReactions.js`, `settleMosjePauses.js`, `pickBotDeck.js`, proven by two planted reads). The draw-step abilities item stays open.
