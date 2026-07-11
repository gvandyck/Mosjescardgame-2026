# Bot Strategy Layer

Decision-making for the bot, separated from execution. `botDriver.js` runs the
turn through the real engine functions (`turnManager.js`, `questLogic.js`);
everything in this directory only *chooses* — it never mutates game state.

**No cheating:** every module reads only information a human in the same seat
could see (own hand, both boards, public counters). No opponent hand or deck
peeking.

## Files

| File | Role |
|---|---|
| `botProfiles.js` | Per-duo-deck personality: `riskTolerance`, `comboPatience`, `preferAttack`. Resolved via `player.deckId`; unknown decks get the balanced default. |
| `comboTags.js` | Card role tags (`multiplier`, `mp-gain`, `quest-prep`, `attack`, `payoff`, …) that drive play/activation ordering. Tuning data, not rules. |
| `planPiecieActivations.js` | Orders ready Piecie activations: multipliers → MP gains → quest-prep → attacks → rest. Skips quest-prep when no quest follows (the bonus resets at end of turn); patient profiles hold lone `payoff` cards. |
| `questOdds.js` | Success-chance estimate mirroring the human roll: `d6 + diceBonus >= getQuestDiceThreshold(...)`, plus requirement gates (Speed Run, Chain Master, Momentum Master, …). |
| `assessQuestRisk.js` | Attempt-or-skip decision. Classifies failure severity (`none/safe/regress/defeat/fatal`), demands higher confidence for worse downsides, leans in when success levels up or wins, shifts by profile `riskTolerance`. Also owns `QUEST_ATTEMPT_COST` (20 MP, same as the human UI). |
| `rollBotQuestDice.js` | The actual roll, identical to the human path: threshold + snelle/prep/Synergy-Chamber bonuses, consumes one-shot flags, spends Skiffa/Tweede-Kans rerolls on failures. |
| `abilityTiming.js` | When each Mosje ability is worth firing: `early` (Coert KasteLuck, Jisca), `preQuest` (Chris, Youri), `late` (default), `skip` (auto-abilities like Michelle). |
| `emitBotMetric.js` | `[BOT] METRIC {json}` console lines. Parsed by `tests/ui/simulation/game-collector.js` into the deck-matrix report's **Bot quality** section. |

## Parity fixes over the pre-2026-07-08 bot

- Quest rolls use the **real trait/star thresholds** (was a flat `d6 >= 4`).
- The bot **pays the 20 MP quest attempt cost** like the human UI (it never did).
- Personal Quests follow the human **place-then-activate** flow and are actually
  rolled + resolved (they used to be discarded with no effect).
- The bot can pick **which Mosje quests** (best odds/safest MP), not always slot 0.
- Both Mosjes may use abilities in a turn (was: only the first slot, ever) — this
  was dead code until 2026-07-12 below, since a second Mosje never existed.
- **2026-07-12: the bot plays a 2nd Mosje from hand** (`botDriver.js` Phase 0,
  `playMosje` from `turnManager.js`) whenever a field slot is free. Before this,
  `botDriver.js` had no `playMosje` call anywhere — the bot only ever fielded its
  single random starting Mosje for the whole game. Every "both Mosjes active"
  synergy (West+Cless's Physical-quest bonus, GM's Kickboxing Bootcamp
  both-active bonus, the "both may use abilities" fix above) was **structurally
  unreachable** in bot-vs-bot simulation until this landed — confirmed by direct
  measurement: wiring the West+Cless synergy alone moved WC's 100-game win rate
  by 0%. Watch the **2nd Mosje/game** column in the deck-matrix report's Bot
  quality table — 0 there for any deck means its duo synergy still can't fire.

## Tuning

Balance-flavor knobs live in `botProfiles.js` and `comboTags.js` — both pure
data. Tests: `tests/bot/strategy.test.ts` (deterministic decision tests) and
the deck-matrix sim (`npm run test:sim -- tests/ui/simulation/sim-deck-matrix.spec.js`).
