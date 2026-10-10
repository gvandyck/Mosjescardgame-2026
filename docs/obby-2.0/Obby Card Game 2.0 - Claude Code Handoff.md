# Obby Card Game 2.0 — Claude Code Handoff (web game)

Phase 6 output, 2026-10-10. This is a **spec** for the engine milestone that turns the web game into 2.0. Phase 6 changed no engine code; the work starts in its own milestone. Written for Claude Code; Gandalf isn't a coder, so the setup steps that need him are marked **(Gandalf)**.

## 0. Sources of truth (read in this order)
1. `Obby Card Game 2.0 - Card List.md`: every card's 2.0 text. **It replaces every text in `src/data/*.js`.** If a phase doc disagrees, the Card List wins.
2. `Obby Card Game 2.0 - Core Numbers.md`: the rules and numbers (§1 rulings, §1a cooldown turn, §2 numbers).
3. `Obby Card Game 2.0 - Rules and Decisions.md`: the 17 base rules, card-face layout and board layout. Where it differs, Core Numbers wins (Getemt keeps its name, level-up resets to 0, R1–R6).
4. `Obby Card Game 2.0 - Example Decks.md`: the 3 decks that ship.
5. `tools/obby_desk_sim.py`: a Python bot simulation of the 2.0 rules. It's a working reference for turn order, getemt and the bot's attack-or-Quest choice. It's not engine code; don't import it.
6. The phase docs (Phase 1–5) explain *why*. Read them only when a card's intent is unclear.

The repo `CLAUDE.md` rules still apply on the 2.0 branch: one `.js` engine (no `.ts`, never `/_archive/`), Playwright tests against the real game, reproduce bugs before fixing them, and the 3-step verification before every commit.

## 1. Where 2.0 lives (decided 2026-10-10)
Gandalf's call: **keep V4 exactly as it is, online too, until 2.0 replaces it.**

| What | V4 (today) | 2.0 |
|---|---|---|
| Branch | `main` | long-lived **`obby-2.0`**, branched from `main`; feature branches merge into it, not into `main` |
| URL | eightytwenty.nl/cardgame2026 | **eightytwenty.nl/obbycardgame2** |
| Deploy | `.github/workflows/deploy.yml` on push to `main` | a second workflow that runs **only on push to `obby-2.0`** and FTPs to `/domains/eightytwenty.nl/public_html/obbycardgame2/` (same FTP secrets) |
| Firebase | current project, secret `FIREBASE_CONFIG` | **a second Firebase project** (e.g. "obbycardgame2"), secret `FIREBASE_CONFIG_2`. V4 accounts, collections, wallets and leaderboard are never touched |
| Version | `src/version.js` `APP_VERSION` | same file, values start with `2.0-` so the two sites are easy to tell apart |

- **One engine per branch.** On `obby-2.0` the V4 rules are *replaced in place*. There is no V4/2.0 switch in the code (that would bring back the double-maintenance we removed with the TS engine).
- When 2.0 plays end to end and Gandalf says so, `obby-2.0` merges into `main` and replaces V4. That's his call, not part of this milestone.
- Keep `main` deployable: never merge `obby-2.0` into `main` early. Pull `main` into `obby-2.0` now and then for shared fixes.

**(Gandalf) before the deploy step works:** create the Firebase project in the Firebase console and paste its web config into a new GitHub secret `FIREBASE_CONFIG_2`. Claude Code can walk you through it. The FTP folder is created by the first deploy.

### Suggested slices (not a GSD roadmap yet)
| Slice | Contents | Firebase |
|---|---|---|
| 2.0-A | Full 2.0 rules on one table vs the bot, offline. The 3 Example Decks, free for everyone. | not needed |
| 2.0-B | Online rooms (P2P) with the same 3 decks. | new project (rooms only) |
| 2.0-C | Accounts, collections, boosters, deck builder, leaderboard. | new project |

## 2. Rule changes (web today → 2.0)
"Where" points at today's files; expect most of them to be rewritten.

### 2a. The three numbers
| Area | Web today | 2.0 | Where |
|---|---|---|---|
| Paying | Cards cost MP (`mpCost`, U7 cost rule, Welloe Force pays MP) | **Energy pool per player:** start 2, +1 at the start of each own turn, max 6, unspent Energy carries over. Pays for summoning, activating Piecies, Snelle, Places and activated abilities. **MP is never a currency.** | `gameState` (new `player.energy`), `turnManager`, `universal-rules.js` U7, every `mpCost` |
| Power | doesn't exist | Each Mosje level row has a Power (multiple of 10). Boosts last "this turn" unless the card says Stays. **Power never goes below 0.** | new; Mosje data `levels[]` |
| MP | Score + currency; Level 0–3; 100 caps non-Quest gains | Health and XP only. Always a multiple of 5 (keep `roundToFive`). **Any** MP gain can level up (not only Quests). Negative MP never persists (floor 0). | `mpManager.js` |

### 2b. Levels, getemt and winning
| Area | Web today | 2.0 |
|---|---|---|
| Starting level | Level 0 | **Level 1** at the Mosje's starting MP. There is no Level 0 anywhere. |
| Level-up | 100+ → level up, leftover MP carries over (`checkLevelUp`) | Reaching 100 MP: level +1, **MP resets to 0** (no carry-over). L1 → L2 → L3. Leipe Swap is never a gain; the Tactician's 10–75 can never reach 100. |
| Level 3 | win at Level 3 | **Hold Level 3 until the start of your next turn** to win. |
| Getemt | MP below 0 → lose a level, remainder carried into 100 MP | After any MP loss (attack, card, own ability or cost, failed Quest, Quest jab, Place) whose final amount is more than 0 and leaves the Mosje at **0 MP or less**: **Level 2–3:** level −1, MP = 50. **Level 1:** MP = 0, the card turns **sideways** and skips its owner's next turn (upright at the end of that turn). **Getemt again while sideways → Welloe pile** (out of the game). |
| No loss | — | **A loss reduced to 0 is no loss:** no getemt, also at 0 MP. |
| Level-up protection (R2) | — | A Mosje that levelled up this turn **can't be taksed** until the start of its owner's next turn. Cards, jabs and Places still affect it. |
| Losing | — | You **lose** when you have no Mosje left outside your Welloe pile (field, hand and deck all empty of Mosjes). |
| Empty field (R1) | — | At the start of your turn, if your field has no Mosje: put the **cheapest** Mosje from your hand or deck on your field for free (fresh); shuffle your deck if you searched it. |

### 2c. Turn structure
| Step | 2.0 |
|---|---|
| Setup | The deck's starting Mosje goes on the field (free, fresh). Shuffle, **draw 3** (web: 6). 2 Energy each. Turn the top card of each of the 3 Quest stacks face-up. Highest die goes first. |
| Start of turn | +1 Energy (max 6), draw 1. **Player 1 skips the draw on their first turn (R5).** Then R1 (empty field), start-of-turn triggers (Chaos Roll, Morning Luck, Drainer, The Gym, Bank Chilling, pets, Eendjes Voeren), fresh flags clear for this player's Mosjes. |
| Main | In any order: place Piecies face-down (free), activate ready Piecies, play Snelle, play a Place, summon a Mosje (pay its cost), use abilities. **Each Mosje may do one action: attack OR Quest** (or nothing). |
| End of turn | End-of-turn triggers (Te Hard Gaan, Snoeiertje, Kleine Taks, Risk & Reward, Tactician snap-back), "this turn" boosts expire, sideways Mosjes that skipped this turn stand up. |
| Win check | First thing at the start of a player's turn: if one of their Mosjes is at Level 3 (it got there on an earlier turn and is still there), **they win**. |
| Deck-out | Must draw with an empty deck: shuffle the discard pile into a new deck (never the Welloe pile), draw, and that whole turn is a **cooldown turn**: +1 Energy still; only place face-down Piecies; no Quests, attacks, summons, Places, activations or Snelle. |

Remove: the first-turn General Quest lock, "Quest Haven allows 2 Quests a turn", the 4th Piecie slot, the 6-card opening hand, the "active Mosje" concept (every "you/your Mosje" card asks which of your Mosjes).

### 2d. Attacking (new action, "taksen")
- A Mosje that isn't fresh and isn't sideways chooses one opponent Mosje that isn't fresh and didn't level up this turn. The target loses MP equal to the attacker's **current Power** (level row + Place + boosts, min 0). Power 0 = nothing happens.
- That is the attacker's one action this turn. Sideways Mosjes can be attacked.
- Triggers on attacks: Unstoppable (30+ in one turn), Flow, Welloe Force thorns, Momentum Diefje, MP Hemorrhage, Perfect Dodge / Drain Reversal / Emergency Healings / The Protector reactions, Zo is Natuur, Momentum Stabilizer.

### 2e. Quests
| Area | Web today | 2.0 |
|---|---|---|
| Decks | 1 shared GENERAL deck + PERSONAL Quests in player decks | **3 typed stacks** (Fighting 13 / Digital 13 / Artistic 12), one face-up from each. No Personal Quests. |
| Who | General: any Mosje | Any Mosje may try any of the 3; it uses its one action. |
| Roll | per-trait thresholds (`thresholds: {1: 5, 2: 3, 3: 2}`) | **1 d6 per ★** of the Quest's trait (at least 1, at most 4). Each Quest has a **band** (Steady, Skilled, Heroic, Prepared, Gated, Coin flip, Trained) that sets the need and win/lose MP (Card List table). |
| Cost | — | "First you must…" is paid before the roll, never refunded. Three Quests discard "from your hand or a ready one" (Endurance Test, Dutch courage, Larry Temmen Niemand Zeggen). |
| Fail tokens | — | Each failed attempt puts a token on the Quest. **Won, or 2 tokens → replace it** with the next card of that stack (discard the old one to a Quest discard pile; reshuffle it if a stack runs out). |
| Jab | — | On a win, one non-fresh opponent Mosje (your choice) loses 10 MP. It's MP loss, so it can getemt. Not an attack. |
| Reward | MP, some Quests did more | MP only, plus the Card List extras (Cheat code draws 1, Debug System looks at 5, Parkeren Delft removes 3 cards, named +10s). |

### 2f. Cards on the table
| Card | 2.0 rule |
|---|---|
| Mosje | Max 2 per field. Summon from hand on your turn for its cost; it's **fresh**. |
| Fresh | Until the start of its owner's next turn: can't attack; **no opponent card, ability or Quest jab can choose or hit it** (extend today's U8 `entryProtected`, which covers attacks/targeting); and it **ignores Places**, good and bad side. In target pickers, show fresh Mosjes as disabled. "Each opponent Mosje" effects skip them. |
| Piecie | Max **3** slots per player. Placed face-down for free; ready from the owner's next turn; pay its cost to activate. Then it goes to the discard pile, unless it **Stays** (face-up in its slot, still using it, until the time it says). |
| Snelle | Played from hand at any time, also on the opponent's turn, with saved Energy. **Needs a free Piecie slot**: it goes into the slot, resolves, then to the discard pile (Blensen! stays until end of turn). Not on a cooldown turn. |
| Place | From hand on your turn, **only when no Place is in play**, pay its cost, works at once, no slot. Stays until destroyed; belongs to its player; destroyed → that player's discard pile. Not on a cooldown turn. Today's `activatePlace(slotIndex)` (Places in slots) goes away. |
| Welloe pile | Out of the game; separate from the discard pile; never shuffled back. Only Mosje Reborn and Call of the Welloes take Mosjes out (not while Welloe Graveyard is the Place). |

### 2g. Smaller rules
- **Tags:** exactly four gameplay tags, one per card at most: `food` (7), `pet` (5), `substance` (9), `gear` (6). Today's `DIGITAL-EQUIPMENT` and `PHYSICAL-EQUIPMENT` become `gear`. Functional tags like `ATTACK` or `RESTORE` may stay as internal metadata but never drive card rules. Dingetje toch?! counts as any tag.
- **Synergy:** a Mosje has a label `Synergy: <names>`; the named card holds the text "While <partner> is also on your field: …" (existing test-guarded convention). Synergy Chamber makes those texts work without the partner. Keep today's `synergyResolver` approach but re-wire to the 2.0 pairs (Card List).
- **Chains:** a Piecie that another card activates for free never starts another chain roll or Teaching Moment roll. Copies aren't activations. Coert's Caravan's 0-Energy activation is a normal one.
- **Shields reduce, never stop.** Suggested order for one loss (flag it if a card needs another order): base amount → reductions (pets, Afblijven!, Laat me chillen!, Zo is Natuur, Flow, reaction Snelle) → Momentum Stabilizer's 30 cap → round to 5, floor 0 → if 0: no loss. Emergency Healings adds MP *before* the loss.
- **Tactician:** sets any Mosje's MP to 10–75 until end of turn (decided 2026-10-10). Store the real MP; at end of turn, real MP + this turn's gains and losses. Getemt works normally during the turn.
- **Limits:** ★★★★★ = 1 per deck; also The Protector and Mosje Reborn. Deck = 30 cards, max 2 copies.
- **Gates:** only Harde Didde, Klaar Met Jou and Dikke Taks need "one of your Mosjes at Level 2+". All "Level 1+" requirements disappear.

## 3. Card data changes
### 3a. ID policy
- **Keep every existing card `id`**, even when the name changes, so saved decks, tests and art paths don't break. Only names and texts change.
- New ids: `quest_dutch_courage`, `quest_cheat_code`.
- Renames to apply (id stays): `piecie_eendjes_voeren` → **Nature's Gift** (the Place `place_eendjes_voeren` keeps "Eendjes Voeren"); `snelle_lucky_coin` → **Lucky Cóin**; Quest names to the Card List spelling (`Calculate the Odds` → Calculate Odds, `Debug the System` → Debug System, `Hack the Mainframe` → Hack Mainframe, `Build a Gadget` → Build Gadget, `Inspire the Crowd` → Inspire Crowd, `Form an Alliance` → Form Alliance, `Improvise` → Improvise!, `Create a Masterpiece` → Create Masterpiecie, `Survive the Storm` → Survive Storm, `Endure the Pain` → Endure Pain, `Tough it Out` → Tough It Out, `De Regelaar` → Regelaar, `Larry Temmen` → Larry Temmen Niemand Zeggen, `Geen raad? Vraag Aad!` → Geen Raad? Vraag Aad!, `Parkeren in Delft` → Parkeren Delft). Mosje names drop the `[Name]` brackets: "Gandoe, The Unpredictable Wizard".
- **Hide, keep the data** (Gandalf's call): add a hidden flag and keep these out of decks, boosters, the deck builder and the bot. Mosjes `mosje_binti_creator`, `mosje_amplifier`, `mosje_coert_kastelein`; Piecie `piecie_mp_adjuster`; Place `place_momentum_factory`; Quests `quest_precision_work`, `quest_the_gauntlet`, `quest_elimination_challenge`, `quest_chain_master` and all 6 `quest_personal_*` / `quest_west_perfect_read`; the 5 duo decks and the 3 old starter decks.
- **Unhide** `place_drain_zone` and `place_the_void` (`playerFacingPlaces.js` `HIDDEN_PLACE_IDS`).
- Buurvrouw doesn't exist in the web data; nothing to do.

### 3b. Fields (proposal: adjust names to the codebase)
| Card | Fields |
|---|---|
| Mosje | `cost`, `rarity`, `startMP`, `levels: [{ power, traits }, ×3]` (traits per level, e.g. `{ physical: 3, resilient: 2 }`), `abilityId`, `abilityText`, `synergyLabel: [ids]`, `synergyText` (holder only), `limitPerDeck` |
| Piecie / Snelle | `cost` (Energy, or `"4 or free"` handled by Blensen!'s effect), `rarity`, `tag` (`food` \| `pet` \| `substance` \| `gear` \| null), `stays` (none \| `endOfNextTurn` \| `startOfNextTurn` \| custom), `levelGate` (2 or null), `limitPerDeck`, `text`, `effectId`. Plus a `givesMP` flag for Jeffrey's Brute Force and The Void. |
| Quest | `stack` (`FIGHTING` \| `DIGITAL` \| `ARTISTIC`), `band`, `rollTrait` (`physical`… \| `best` \| `none`), `costId` (the "First you must…"), `win`, `lose`, `extras` (jab, +1 die rule, named bonus, Vraag Aad, draw) |
| Place | `cost`, `rarity`, `text`, `effectId`, `goodFor`, `badFor`, `limitPerDeck` |

Drop: `mpCost`, `requirement: "level1"`, `questType`, `requiredMosjeId`, `roll.thresholds`, `successMP` / `failMP` (replaced by band values), `difficulty`.

### 3c. Effects
Every ability, Piecie, Snelle and Place effect is rewritten against the Card List text. The biggest shifts to plan for:
- **MP attacks → Power boosts:** Snoeiertje, Te Hard Gaan, Super Saiyan Mos, Momentum Diefje, Jantje Jantje..., Continuous Assault, MP Hemorrhage, Dikke Taks, Boxing Gloves, Gandoe's Chaos Roll, Unstoppable, Boxing Ring, De Box, Drain Zone, Skiffa / Arcade / Bank Chilling penalties.
- **Full shields → reductions:** all pets, Afblijven!, Laat me chillen!, The Protector, Perfect Dodge, Drain Reversal, Je Weet Niet (now a forced reroll), Blensen! (cards only, attacks still hit), Welloe Force (thorns).
- **Quest boosts → dice:** "+X to the roll" becomes "+1 die" (max 4) and sometimes a reroll.
- **MP costs → Energy:** every activated ability (Ronald, Ming Predictor, Coert, Hacker, Jeffrey Gambler, Youri, Tactician, FPS West, Master Plan, Tuk's Healing Hands, Binti, Pit Stop, Perfect Placement, Gandoe Destroyer).
- **Reaction Snelle** need response windows: "when an opponent's card targets", "when it would lose MP", "when attacked", "when about to go to the Welloe pile", "right after a Quest roll", "right after a Piecie is activated", "when a Jensen! is played". The engine must pause and offer the defending player (or bot) a Snelle, only if they have a free slot and enough Energy.
- **Hidden-info cards** (Ronald, FPS West, Stookerino, Jantje, Chef's Special, Those Eyelashes) must work in online rooms without leaking the hand to the wrong client.

## 4. Board layout
From the Rules doc ("Board (web UI)" and "Card face layout"). Design references: board mockups https://claude.ai/artifact/KeJ62aYvTc96MooGKpWiD5 and the card frame sheet https://claude.ai/artifact/MpeFz61Zf4Cfrvc21MsT2T (Tiers 7 + 8 = final style).
- Felt table, wood rim, stitched seam.
- **Per player, one row:** 3 Piecie slots + 2 Mosjes. Field Mosje cards 180×132; face-down Piecies 88×132; Stays cards face-up in their slot.
- **Middle:** the Place on the left; the 3 face-up Quests, each with its own stack and fail-token count, in the centre; End Turn on the right.
- **Hand** at the bottom with real card frames (3 cards at the start).
- **Energy:** 6 crystals per player, filled = available.
- **Mosje tile:** Power bottom-left, LVL chip + type centre, MP bottom-right (field mode drops the cost). Sideways = rotated 90°. Badges for fresh and level-up protected. The Tactician shows the temporary MP with the real MP small next to it.
- **Card faces:** cost top-left with label "COST", name next to it; frosted description box; few colours (black, white, one type colour).
- Judge the UI at **1920×1080 or larger**. The unmerged UI branches (`ui/arena-hover-spotlight`, `ui/card-frame-v1`, `ui/rarity-tiers`) hold frame and hover work that 2.0 can build on; decide per branch whether to merge it into `obby-2.0` first.

## 5. Bot
- New decision: **attack or Quest** per Mosje. The desk sim's bot (pick the action with the best expected MP swing, finish a getemt when possible, protect a Level 3) is a good starting point; port its ideas into `src/bot/strategy/`, not its code.
- The bot must also: pay Energy, keep a slot free when it holds a reaction Snelle, answer reaction windows, and respect fresh / level-up protection.
- The bot shouldn't see hidden information it wouldn't have on a real table.

## 6. Tests to add
All in the normal suites so `npm test` / Playwright run them. Engine tests import the real `.js` modules; UI tests use `seedOfflineSession` + `GAME_URL_TEST` + `window.__testHooks` (add hooks as needed, gated by `testMode=true`). Existing tests that encode V4 rules (Level 0, MP costs, General/Personal Quests, 4 slots, first-turn Quest lock, overflow regression) are **rewritten or deleted on the 2.0 branch**, never left failing.

### 6a. Engine unit tests
| # | Rule | Test |
|---|---|---|
| E1 | Energy | starts at 2; +1 at turn start; caps at 6; carries over; can't pay more than you have |
| E2 | Summon cost | summon deducts the Mosje's cost; setup Mosje is free |
| E3 | Level-up | 95 + 10 → Level +1 at 0 MP (no carry-over); works from a Piecie gain, not only a Quest |
| E4 | Getemt L2/L3 | a loss to ≤ 0 → level −1, MP 50 |
| E5 | Getemt L1 | a loss to ≤ 0 → sideways, MP 0, skips next turn, upright at the end of it; a second getemt → Welloe pile |
| E6 | No loss | a loss reduced to 0 by a shield → no getemt at 0 MP |
| E7 | Win | Level 3 reached → no win yet; still Level 3 at the start of the owner's next turn → win |
| E8 | Lose | last Mosje to the Welloe pile with none in hand or deck → that player loses |
| E9 | Empty field (R1) | no Mosje on field at turn start → cheapest from hand/deck placed free and fresh; deck shuffled after a search |
| E10 | Level-up protection (R2) | a just-levelled Mosje can't be attacked until its owner's next turn; a jab still hits it |
| E11 | Player 1 draw (R5) | player 1 has 3 cards after their first draw step; player 2 has 4 |
| E12 | Attack | target loses attacker's Power; Power 0 does nothing; fresh attacker can't attack; fresh / protected target can't be chosen |
| E13 | One action | a Mosje that attacked can't Quest that turn, and the other way around |
| E14 | Power floor | −10 Power on a Power 0 Mosje stays 0 |
| E15 | Quest dice | dice = stars, min 1, max 4 (also with +1 die from a Place and a Piecie) |
| E16 | Bands | each band's need and win/lose MP, with seeded dice |
| E17 | Fail tokens | 2 failed attempts (any players) replace the Quest; a win replaces it at once |
| E18 | Trained | ★ Mosje can't try it; ★★ wins +25 with no roll |
| E19 | Jab | win jabs one opponent Mosje for 10; can getemt at 0; never a fresh one |
| E20 | Quest costs | cost paid before the roll and not refunded; "hand or ready" discard accepts both |
| E21 | Cooldown turn | empty deck → discard shuffled in, draw, then only face-down placing is legal; Welloe pile not shuffled in |
| E22 | Piecie timing | not ready the turn it's placed; ready the next turn; 3-slot limit |
| E23 | Snelle slot | no Snelle with 3 slots full; a Snelle uses a slot, then goes to discard |
| E24 | Place | can't play a second Place; works at once; destroyed → owner's discard; fresh Mosjes ignore it |
| E25 | Stays | a Stays card stays face-up in its slot until its end time, then is discarded |
| E26 | Tactician | set 10–75 only; snap-back = real MP + this turn's changes; getemt during the turn works |
| E27 | MP grid | every MP value stays a multiple of 5 after gains, losses, halves and doubles |
| E28 | Tags | each tag has its Card List count (food 7, pet 5, substance 9, gear 6); no card has two |
| E29 | Data | every Card List card exists with the right cost, rarity and fields; hidden cards are excluded from decks, boosters and the bot |
| E30 | Decks | each Example Deck has 30 cards, max 2 copies, ★★★★★ max 1, its starting Mosje inside |

### 6b. Card tests (card-test-library, `tests/ui/cards/`)
Every card in the Card List gets an entry: one effect test that boots the real game, sets the board with test hooks and asserts the on-screen MP / Power / Energy / hand result. Priority order: the cards in the 3 Example Decks first, then the rest. Must-have edge cases:
- Ronald Kip with Ronald, The Master Chef (60 + draw) and Ronald Kip + MP Amplifier (the old "Ronald Kip stacking test" becomes this).
- Harde Didde / Klaar Met Jou: Level 2 gate, MP limit, answered by Not Today! and Jensen!.
- Jensen! → Frenssen! → Blensen! (Blensen! free after a Jensen!).
- Chains: Jisca + DDR Chris on one activation; the free Piecie doesn't chain again.
- Leipe Swap: no level-up and no getemt from the swap.
- Momentum Stabilizer caps a 40 hit at 30.
- Synergy Chamber makes a holder text work without its partner.

### 6c. Playwright UI specs (`tests/ui/`)
| # | Spec | What it shows |
|---|---|---|
| U1 | `energy-pool.spec.js` | crystals fill each turn, drop on payment, cap at 6 |
| U2 | `attack-action.spec.js` | pick attacker → target → MP drops by Power; fresh targets disabled |
| U3 | `getemt-sideways.spec.js` | L1 getemt turns the tile sideways, skips a turn, a second hit sends it to the Welloe pile |
| U4 | `level-up-protection.spec.js` | a Mosje that just levelled can't be attacked |
| U5 | `quest-stacks.spec.js` | 3 face-up Quests, dice count shown, fail tokens appear, Quest replaced after a win or 2 fails |
| U6 | `snelle-reaction.spec.js` | a reaction Snelle is offered on the opponent's attack only with a free slot and Energy |
| U7 | `place-play.spec.js` | Place from hand, applies at once, second Place blocked, destroyer works |
| U8 | `cooldown-turn.spec.js` | deck-out shows the cooldown banner and blocks everything but placing |
| U9 | `empty-field-summon.spec.js` | the last Mosje lost → the cheapest Mosje appears fresh at turn start |
| U10 | `win-hold-level3.spec.js` | Level 3 shown as "hold"; win only at the start of the next turn |
| U11 | `full-game-2.0.spec.js` | bot vs bot with each pairing of the 3 decks plays to an end with no console errors |
| U12 | `board-layout-2.0.spec.js` | 3 slots + 2 Mosjes per row, Place / Quests / End Turn in the middle, at 1920×1080 |

### 6d. Simulation
Update the engine sim (`npm run test:sim`) to the 2.0 rules and the 3 Example Decks. Pass: **0 crashes, timeout rate under 25%**. As a sanity check (direction only), the desk sim with R1–R6 gave a median of 15 rounds, ~74% attacks, seat 1 ~55%. Big differences point to a rules bug, not a balance question; balancing is parked (Gandalf's call).

## 7. Docs to update on the 2.0 branch
`docs/phase0-rulings.md`, `docs/card-reference.md`, `docs/developer-handoff.md` and `src/rules/card-specific-rulings.md` describe V4. On `obby-2.0`, rewrite them to point at the 2.0 docs (or replace their content), so the repo `CLAUDE.md` "read these first" list stays true for that branch. The memories about V4 rules (defeat-at-zero, MP cost model, first-turn Quest lock, entry protection U8) are V4-only from then on.

## 8. Open items for the engine milestone
1. **MP above 100 at Level 3:** nothing says what happens. Recommendation: stop at 95 (the desk sim did this; there's no Level 4). Ask Gandalf.
2. **Modifier order** (§2g): a proposal. Confirm when a card disagrees.
3. **Quest stack runs out:** reshuffle that stack's discarded Quests (proposal, §2e).
4. **Names owed:** The Hacker, The Tactician, The Drainer still have placeholder names.
5. **Balancing is parked:** game length (target 8–10 rounds), attack share, Fighting strong / Digital weak. Levers for later: Quest wins +10, or start MP +10. Don't tune numbers in the engine milestone without Gandalf.
6. **Art:** new cards (Dutch courage, Cheat code) and the Places without art; Phase 7 (visual production) handles frames and print sheets.
