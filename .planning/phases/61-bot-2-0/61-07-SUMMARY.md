---
phase: 61-bot-2-0
plan: 07
requirements: [BOT-03]
commits: [20d8dc0, a57670d, 8a6071e, 3424f36]
---
# Phase 61 Plan 07: The bot answers reaction windows with the right Snelle (BOT-03)

- `pickDefensiveSnelle`: Not Today! at a Welloe move; otherwise only for a Mosje in danger (getemt, Level 3, loss worth 20+): the cheapest Snelle after which it survives, else the biggest cut (Card List order breaks ties); Emergency Healings dropped under The Void; cost via `canBotAfford` (Delluft fee). Cut amounts in `cardAmounts.js`.
- Beyond the plan, same intent: a preview loss stops at the Mosje's MP (L1 at 40 hit for 70 shows 40), so a getemt hit is read as max(preview, MP, attacker Power); a Mosje a card sends straight to the Welloe pile gets no reducer (only Jensen! / Counter Strikka / Blensen! count); Counter Strikka needs a second own Mosje. A real-window test checks the choice against `resolveReaction` (Protector alone dies, Emergency Healings Resilient 2 lives).
- `pickCounterSnelle`: Frenssen! (else a free Blensen!) after a Jensen!; Jammertje Gepakt! on cost 2+ / attack / Power / five-star Piecies, Gevalletje Klakkeloos on gain / draw Piecies (not five-star, only when `isUsefulActivation`); a winning opponent roll: DJ / Piecie reroll, Je Weet Niet, Lucky Coin (never on a trained Quest). The Piecie is read through `heldPiecieDef` on the table view.
- `chooseReaction` is now a dispatcher: own windows Energy-checked (Sleutelpuntje, DJ / Piecie rerolls, Lucky Coin) plus Dubbele Temminks after an own gain / draw Piecie (never five-star), then defender, then counter; the answer is always in `eligible`. `settleReactions` emits `reaction-played { deck, responderId, cardId, moments }` only when the engine accepts the card.
- Test change named: `reaction-bot.test.ts` "defender: ..." keeps both scenarios; the Welloe attack now expects `snelle_negate_elimination` (was only "in eligible") and the 20 MP hit on a 50 MP Mosje expects `snelle_perfect_dodge` (was null; 20 is the "worth a card" line). Title updated.
- Tests: 33 in `reaction-bot.test.ts` (defender, counter, own windows, metric, 3 seeded bot-vs-bot games), trap entries + presence check + a scrambled-hidden-info invariance case in `no-hidden-info.test.ts`. 9 seeded games (3 seeds x 3 pairings): 40 reactions played (Dodge, Drain Reversal, Emergency Healings, Not Today!, Jammertje, Lucky Coin, Sleutelpuntje, DJ rerolls). 10 mutations (Power term, Void, direct Welloe, Counter Strikka guard, five-star, Jammertje rule, affordability, losing roll, usefulness, refused-pick metric) each fail a test.
- Finding, not fixed (`deferred-items.md`, for 61-08 / 61-09): seed 0xB09 REGELAARS vs CREATIEVELINGEN turn 12 gives 2x `engine-refused resolveReaction "No Piecie in that slot"` on a pass: Te Hard Gaan returns a `piecieActivated` pause AND a reaction window; botDriver settles the pause first, the Piecie leaves its slot, the held replay fails. Engine window order, not a bot choice.
- `npm test` 162 files / 2008 green; `node --check` clean per file; `tests/ui/snelle-reaction.spec.js` 5/5 green headless (1920x1080, temp config deleted). No sim. BOT-03 stays unticked (61-09 ticks it). No KNOWN GAPs. The plan's executor line names "Claude Opus 5.5" in the trailer; the orchestrator's rule (Sonnet 5.5) was used.

## Self-Check: PASSED
