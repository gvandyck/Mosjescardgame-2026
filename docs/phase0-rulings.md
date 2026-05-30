# MOSJES Card Game — Phase 0 Rulings
**Canonical game rules and ambiguity resolutions. This is the source of truth.**
Last updated: Phase 11 complete.

> ⚠️ If you find a conflict between this document and the source code, this document wins. Fix the code, not this file. If you find a conflict between this document and card text, add it to `ambiguities.md` and stop — do not guess.

---

## Table of Contents
1. [Core Game Overview](#core-game-overview)
2. [Game Setup](#game-setup)
3. [Turn Structure](#turn-structure)
4. [Momentum Points & Leveling](#momentum-points--leveling)
5. [Victory Conditions](#victory-conditions)
6. [Universal Rules (U1–U7)](#universal-rules-u1u7)
7. [Card Type Rules](#card-type-rules)
8. [Welloe Mosje System](#welloe-mosje-system)
9. [Card-Specific Rulings](#card-specific-rulings)
10. [Known Spec Bugs (Fixed)](#known-spec-bugs-fixed)

---

## Core Game Overview

MOSJES is a 2–6 player card game where each player builds a deck around character cards (Mosjes) based on real people. Players race to Level 3 by earning Momentum Points (MP) through Quests.

**Card categories:**
- **Mosjes** — character cards, your heroes on the field (Fighting / Digital / Artistic types)
- **Piecies** — item/action cards, placed face-down before activation (Standard and Snelle subtypes)
- **Snelle Piecies** — instant Piecies, can be played at any time including during opponent's turn
- **Places** — battlefield cards that apply passive effects each turn
- **Quests (General)** — drawn from shared Quest deck, completed for MP
- **Quests (Personal)** — booster-only cards, shuffled into your personal deck

**Deck construction:**
- 40–60 cards per deck
- 2–4 Mosje cards in your deck
- Up to 5 Legendary cards
- Personal Quests are booster-only (`isBoosterOnly: true`)

---

## Game Setup

1. Each player shuffles their deck face-down.
2. Each player picks one Mosje at random from their Mosje cards (face-down selection — no peeking). This becomes their first active Mosje on the field.
3. Each player draws **6 cards**. On their first turn they draw 1 more (normal Draw Phase), giving 7 cards total in hand during play.
4. Decide starting player (e.g. dice roll, youngest goes first).
5. Place the shared Quest deck in the center of the table.
6. Each player has **2 Mosje slots** on their side of the field. The second slot is empty at game start.

---

## Turn Structure

Each turn has four phases in this exact order:

### 1. Draw Phase
- Draw 1 card from your personal deck.
- Some card effects may allow drawing additional cards.
- If your deck is empty, shuffle your discard pile to form a new deck.

### 2. Main Phase
- Play any number of Piecies face-down into your Piecie slots (max 5 slots).
- Activate face-down Piecies that have been on the field for at least 1 full turn.
- Play a Place card (replaces the current Place if one is already active).
- Spend MP to activate Mosje special abilities.
- Switch your active Mosje (swap between your two field slots if both are occupied).
- **Snelle Piecies** can also be played during this phase (or at any time — see Snelle rules).

### 3. Quest Phase
- You may attempt **1 Quest** per turn from the Quest deck.
- Reveal the top Quest card and attempt it.
- **Success** — gain MP as stated on the Quest card.
- **Failure** — some Quests apply a penalty; discard the Quest card.
- Completed Quests go to your personal Quest discard.

### 4. End Phase
- Apply any Place card end-of-turn effects.
- Resolve end-of-turn Mosje passive abilities.
- Discard down to hand limit if applicable.
- Pass turn to the next player.

---

## Momentum Points & Leveling

### Gaining MP
- Complete a Quest → earn +10 to +30 MP (stated on card)
- Piecie card effects → stated on card
- Mosje abilities → stated on card

### Spending MP
- Pay costs for Piecie activations with MP costs
- Activate Mosje special abilities with MP costs
- Note: **Cost payments are not the same as MP loss** (see U7)

### Leveling
| Threshold | Result |
|---|---|
| 0 → 100 MP | Level Up to Level 2 |
| 0 → 100 MP | Level Up to Level 3 → **WIN** |

- MP **resets to 0** after each level-up.
- Leveling up grants: stronger abilities, +5 MP bonus on Quest completion, access to higher-tier Piecies (where stated on card).

### Losing MP
- Opponent card effects that drain or steal MP
- Quest failure penalties (where stated on card)
- Paying MP costs for abilities
- Place card effects (where stated on card)
- **Defeat at 0 MP**: When a Mosje reaches 0 or below MP from any non-cost-payment effect (Quest failure damage, Piecie effects, Place effects, Snelle Piecies, Mosje abilities), that Mosje is immediately sent to the player's discard pile. The `in_welloe` flag is set on the Mosje instance.
- **Cost payments can go negative**: Paying an MP cost (see U7) can bring a Mosje below 0 MP without triggering defeat. A Mosje with negative MP from cost payment **cannot attempt Quests** until back at 0 or above.

---

## Victory Conditions

| Condition | Description |
|---|---|
| **Level 3** | First player to reach Level 3 on any of their Mosjes wins immediately |
| **Knockout** | Defeat both of an opponent's Mosjes (send both to the Welloe pile) |
| **Quest Master** | Complete 7 total Quests across all your Mosjes |
| **Momentum Domination** | Have 250+ combined MP across all your Mosjes at the start of your turn |

---

## Universal Rules (U1–U7)

These seven rules resolve the majority of edge cases. They were established in Phase 0 after reviewing all 200+ cards. **They cannot be overridden by individual card text unless the card explicitly says so.**

---

### U1 — Target Lock on Activation
> Attack targets are locked in at the moment of **activation**, not at placement and not at resolution.

- If a Mosje is moved, defeated, or otherwise becomes an invalid target between activation and resolution, the effect **fizzles** — it does nothing.
- **No redirect.** The attacking player does not get to choose a new target.
- Applies to all targeted Piecie effects and Mosje abilities.

---

### U2 — Face-Down Piecie Timing
> A Piecie placed face-down cannot be activated on the same turn it was placed, unless the card text explicitly states otherwise.

- "Placed this turn" means it was placed in the current player's current Main Phase.
- Snelle Piecies are exempt — they are played and resolved immediately.

---

### U3 — Place Card Replacement
> Only one Place card can be active at a time. Playing a new Place immediately replaces the current one.

- The old Place's effects stop immediately when replaced.
- Any "while this Place is active" effects end the moment the card leaves the field.
- Replaced Place cards go to the playing player's discard pile.

---

### U4 — Welloe Mosje Recovery
> A Mosje sent to the Welloe pile loses ALL Level progress and ALL MP.

- It does not retain any buffs, debuffs, counters, or status effects.
- Revival cards (e.g. Mosje Reborn) bring the Mosje back at **Level 1, 0 MP**.
- Exception: if a revival card explicitly states it restores a specific Level or MP amount, that card text takes precedence.

---

### U5 — Two Active Mosje Rule
> Each player can have a maximum of 2 Mosjes on the field at any time.

- You may switch which Mosje is "active" (the one taking actions / being targeted by default) during your Main Phase.
- If both Mosje slots are filled and an opponent's card forces you to add a Mosje, the card fizzles unless it specifies which slot is replaced.

---

### U6 — Canonical MP Modifier Stack Order
> When multiple effects modify the same MP calculation, they apply in this exact order:

```
1. Base MP value (stated on card)
2. Card-synergy bonus (stated on the triggering card)
3. Mosje passive bonus (from active Mosje's traits/level)
4. Partner-synergy bonus (from synergy partner being on field)
5. Place modifier (from active Place card)
6. Piecie buff modifier (from active face-down Piecie effects)
7. Snelle modifier (from any Snelle Piecie played in response)
```

- Each step modifies the result of the previous step.
- This order is deterministic — it is baked into the engine's MP resolver.
- **The Ronald Kip stacking test covers this.** Any change to MP calculation must pass that test.

---

### U7 — Cost Payment vs. MP Loss
> Paying an MP cost to activate a card or ability is NOT the same as losing MP due to an effect.

This distinction matters for several cards:

- Cards that trigger on "MP loss" (e.g. The Void, Drain Reversal) do **not** trigger when a player pays an MP cost.
- Cards that say "cannot lose MP" do **not** prevent a player from paying MP costs.
- Cards that steal MP from a player during "MP loss" do **not** steal MP during cost payment.

If a card says "pay X MP", that is a cost. If a card says "lose X MP" or "drain X MP", that is an effect. They are different code paths.

---

## Deck Construction

- Maximum deck size: **60 cards** (Mosjes + Piecies + Snelle Piecies + Places + Quests combined).
- Only the 60-card cap applies. No per-card-type limits (as of Phase 10).

---

## Card Type Rules

### Snelle Piecies
- Can be played at any time — during your turn or during an opponent's turn.
- Do not need to be placed face-down first. They are played and resolved immediately.
- Can be played in response to another card being activated (forming a chain/stack).
- Frenssen and Blensen chains: last-in first-resolved (LIFO stack). See effect stack in state shape.

### Place Cards
- One active Place at a time (see U3).
- Passive effects apply at the stated trigger point (turn start, turn end, on event).
- "While this Place is active" effects end the moment the Place is replaced or destroyed.

### Quest Cards
- General Quests are drawn from a shared central deck.
- Personal Quests (`isBoosterOnly: true`) are shuffled into a player's personal deck and can be drawn like any other card.
- When the Quest deck runs out, shuffle the Quest discard pile to form a new Quest deck.

### Mosje Cards
- Fighting / Digital / Artistic — type matters for Place cards, Piecie requirements, and some abilities.
- Each Mosje has a starting level (Common: Level 1, Rare: Level 1 with bonus ability, Legendary: Level 2).
- Mosje abilities with "once per turn" reset at the start of that player's Draw Phase.

---

## Welloe Mosje System

- When a Mosje is defeated by reaching 0 MP from a non-cost effect, it is sent to the player's **regular discard pile** and marked with the `in_welloe` flag.
- When a card explicitly says "send to Welloe" or "defeat", the Mosje goes to the **Welloe Mosje Pile** (a separate face-up area) and is also marked with the `in_welloe` flag.
- In both cases, the `in_welloe` flag is the authoritative indicator that a Mosje is out of play. The knockout victory condition checks this flag.
- Defeated Mosje loses all Level progress and MP (see U4).
- If a player has no Mosjes on the field and no Mosjes in hand or deck, they are eliminated (in multiplayer) or lose (in 1v1).
- Revival via **Mosje Reborn**: returns target Mosje from your Welloe pile to your field at Level 1, 0 MP.
- Revival via **Call of the Welloes**: summons target Mosje from a Welloe pile to that player's field at Level 1, 0 MP. Call of the Welloes remains linked to that Mosje; if the Piecie leaves play, the summoned Mosje returns to Welloe. (This is intentionally weaker than Mosje Reborn — it does not give the opponent a Level bonus.)

---

## Card-Specific Rulings

These rulings cover cards where the text was ambiguous or where the obvious reading conflicts with design intent.

| Card | Ruling |
|---|---|
| **Gandoe Wizard's Chaos Roll** | The dice roll happens at activation, not at placement. The effect that triggers (1–2, 3–4, or 5–6) is locked in at roll time, even if the board state changes before resolution. |
| **Alyssa "Bulldozer" — damage heal** | The +20 HP (2 stones) trigger fires once per turn maximum, even if Alyssa takes 30+ damage from multiple sources in the same turn. |
| **Quest Haven** | Quest limit is tracked via `questsAttemptedThisTurn` counter (integer), not a boolean. Normal limit is 1. Quest Haven raises `maxQuestsThisTurn` to 2. All UI quest gates (general quest button, personal quest button, QUEST card play) must read the counter, not a boolean. Backwards-compat fallback: if `questsAttemptedThisTurn` is absent on a state object, read the old boolean. |
| **Geen Raad / Aad Recovery** | After Geen Raad resolves, the engine compares before/after MP for each player's first active Mosje. Any player who lost MP and has cards in hand is offered a `showConfirm` prompt, then a `showCardChoice` picker. Accepted: chosen card moves from hand to discard, player gains +40 MP. Declined or empty hand: skips silently. Players are offered in turn order (active player first, then opponent). |
| **Bijna Welloe** | "Defeat" means send to Welloe pile (see U4). Does not trigger "on MP loss" effects — it is a defeat, not a drain. |
| **Jantje Jantje Jantje** | Effect resolves once per activation regardless of how many Jantje cards are in play. Does not chain with itself. |
| **Emergency Swap** | Marked advanced. Creates a one-time copy of the target Mosje's ability that does not count against the target's own once-per-turn limits. The copy is discarded after use. |
| **Call of the Welloes** | Revived Mosje enters at Level 1, 0 MP — intentionally weaker than Mosje Reborn. Does not restore level or stored MP. This is a linked field effect: if Call of the Welloes leaves play, the summoned Mosje returns to Welloe; if the summoned Mosje leaves the field first, Call of the Welloes is discarded/cleared. |
| **Perfect Setup** | Creates a quest-MP-override for the current Quest attempt only. Does not permanently change the player's MP. Useful for hitting exact Quest thresholds without losing real progress. |
| **Drain Reversal** | Only triggers on effect-based MP loss (see U7). Does not trigger when an opponent pays MP costs. |
| **The Void** | Only triggers on effect-based MP loss (see U7). Does not trigger when an opponent pays MP costs. |
| **Kast-elein** | Cost payment is not MP loss (see U7). Kast-elein's drain effect does not redirect cost payments. |
| **Frenssen / Blensen** | These form a counter-chain. Resolution is LIFO (last in, first resolved). The engine's effect stack handles this — do not implement custom ordering. See `src/engine/resolve-effect-stack.ts`. |
| **Mosje Reborn** | Targets your own Welloe pile only. Revived Mosje enters at Level 1, 0 MP. Buffs and debuffs are cleared (see U4). |
| **snelle_frenssen** | When played as a response, `targetRef` is auto-resolved by the engine from `pendingEffect.source.playerId`. The UI/caller does not need to set `targetRef` manually. |

---

## Buff Stacking Rules

Sourced from `docs/buff-stacking-rules.md`. These apply to all buff/debuff effects engine-wide.

- Buff keys are stored under `flags` using the format `buff:<buffId>`.
- Applying the same `buffId` again **overwrites** the previous payload — it does not stack.
- Unless a buff's own data contract explicitly says otherwise, duplicate buffs do not stack.
- Buff expiry is evaluated by `clearExpiredBuffs` using `expiryTurn <= current turnCount`.

---

## Known Spec Bugs (Fixed)

These were errors discovered during Phase 0 card audit where the card spec incorrectly described behavior. They are fixed in the codebase. Listed here so they are not re-introduced.

| Card | Bug | Fix |
|---|---|---|
| **Gandoe Wizard's Chaos Roll** | Spec described the roll happening at placement | Corrected: roll happens at activation |
| **Alyssa "Bulldozer"** | Spec did not specify once-per-turn cap on damage-heal | Corrected: cap is once per turn |
| **Bijna Welloe** | Spec was ambiguous about whether this triggers MP loss hooks | Corrected: it is a defeat, not a drain |
| **Jantje Jantje Jantje** | Spec implied infinite chain potential | Corrected: resolves once per activation |
| **Klaar Met Jou** | Spec described targeting any Mosje including your own | Corrected: opponent Mosjes only |
| **The Gym** | Spec listed duplicate effect lines | Corrected: effect applies once |
| **Affoe** | Spec was missing cost specification | Corrected: cost added per design intent |
| **Super Saiyan Mos** | Spec described stacking with itself across turns | Corrected: overwrites previous buff (see buff stacking rules) |

---

## Simulation Baseline (Phase 10 → 11)

Current engine performance from `docs/simulation-report.md`. Claude Code should use these numbers as the target baseline — do not merge anything that makes these worse.

| Metric | Value | Target |
|---|---|---|
| Crashes | 0 | 0 ✅ |
| Timeout rate | 28% | < 25% ⚠️ not yet met |
| Never-played cards | 21 | < 15 |
| Avg game length | 27.6 turns | — |
| Tests passing | 536 | all green ✅ |

**Known balance flags (do not fix without a dedicated branch + simulation run):**
- Artistic Rhythm wins 69.7% vs Digital Control — suspected imbalance
- `level_3` win condition dominates at 72% of all decisive games
- Several cards played in ≤ 2 games out of 100: `redbull`, `snelle_negate_elimination`, `place_coerts_caravan`, `place_bank_chilling`
- 21 cards with 0 plays — see full list in `docs/simulation-report.md`

---

## Deferred Mechanics (Do Not Implement Without a Ticket)

These mechanics are intentionally stubbed. Do not implement them as part of unrelated work. Each needs its own branch, spec, and regression test.

**Priority 1 — Core gaps (many cards affected):**
- `retargetPendingEffect` — true re-targeting behavior
- `activateFromDiscard` and `activatePiecie` slot-target primitives
- `discardRandom` and robust discard-cost choice enforcement
- `searchDeck` primitive for Mosje tutor effects

**Priority 2 — Combat and protection:**
- Exact threshold-based MP mitigation checks
- Full `mp_loss_immune` flag path (currently approximated)
- Castle/token persistent object model with destruction checks

**Priority 3 — Hidden information:**
- `checkGuess` condition support
- `revealHand` and named-card/typed prediction contracts
- Better caller contracts for interactive target/choice collection

**Priority 4 — Quest completeness:**
- Native OR requirement composition
- Event-log-this-turn query primitives for quests
- Complex interactive/multi-player quest offers

Full list with affected cards in `docs/developer-handoff.md`.
