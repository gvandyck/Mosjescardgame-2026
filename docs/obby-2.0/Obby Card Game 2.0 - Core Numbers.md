# Obby Card Game 2.0 — Core Numbers (Phase 0 output)

Locked 2026-10-09. Every later phase uses these numbers. Change a number here first, then the cards.

## 1. Rulings from the open questions
| Question | Ruling |
|---|---|
| Summoning a Mosje | Costs its printed Energy. The first Mosje at setup is free. |
| Getemt | Keeps the name **Getemt** (attacking is "taksen"; being knocked down is "getemt"). |
| Level-up MP | Reaching 100 MP levels you up and MP resets to **0**: L1 at 100 → L2 at 0; L2 at 100 → L3 at 0, then hold L3 until the start of your next turn to win. Dropping a level (getemt) lands on **50**. |
| Turn order | Highest die goes first. Both players start with 2 Energy and gain +1 per turn like normal. Phase 5: player 1 skips their first draw (see below). |
| Deck | **Minimum 30 cards.** Deck empty → shuffle your discard pile into a new deck, and that turn is a **cooldown turn** (see §1a). Welloe pile is never shuffled back. |
| Quest traits | One main trait per Mosje type (see §6). Mental/Social/Resilient are optional side requirements, filled out in Phase 2. |
| MP → Energy | Rounded, gentle table (see §5). |
| Shields (Phase 3) | Cards reduce MP loss ("loses X less"), they never stop it. A loss reduced to 0 is no loss: no getemt, also at 0 MP. |
| Fresh Mosje (Phase 3) | Off-limits to all opponent cards, Quest jabs and abilities until the start of its owner's next turn, not only to attacks. |
| Snelle slot (Phase 3) | A Snelle needs a free Piecie slot: it goes into the slot, resolves, then goes to the discard pile. |
| Playing a Place (Phase 4) | On your turn, from your hand, only when no Place is in play: pay its cost (2–4 Energy) and put it in the middle. It works at once and needs no slot. It stays until destroyed and belongs to whoever played it. |
| Places and fresh Mosjes (Phase 4) | A Place's text applies to every Mosje on the table, except fresh Mosjes: they ignore Places (good and bad side) until the start of their owner's next turn. |
| Power floor (Phase 4) | Power never goes below 0. An attack with 0 Power does nothing. |
| Empty field (Phase 5) | At the start of your turn, if you have no Mosje on your field, put the cheapest Mosje from your hand or deck on your field for free (it is fresh), then shuffle your deck if you searched it. You **lose** when you have no Mosje left outside the Welloe pile. |
| Level 3 MP (Phase 6) | At Level 3, MP can't go above 95 (there is no Level 4). |
| Level-up protection (Phase 5) | A Mosje that levelled up this turn can't be taksed until the start of its owner's next turn. Cards, jabs and Places still affect it. |
| Player 1 (Phase 5) | Player 1 skips their draw on their first turn. Replaces "no compensation". |

### 1a. Cooldown turn (deck-out)
When you must draw and your deck is empty: shuffle your discard pile into a new deck, draw as normal, and that whole turn is a cooldown turn:
- you still get your +1 Energy;
- you may only **place** cards (face-down Piecies, into free slots);
- you may **not** attempt Quests, attack, summon a Mosje, activate a Place or activate any card (also no Snelle until your next turn begins).

## 2. The numbers at a glance
| Thing | Value |
|---|---|
| Energy pool | start 2 (both players), +1 each turn, max 6, carries over |
| Level bar | 100 MP per level; 1 → 2 → 3 |
| MP grid | Always a multiple of **5** |
| Power | multiple of 10 |
| Trait stars | 1–3. Quest dice = 1 per star of the tested trait, **minimum 1 die**, max 4 (with a Place/Piecie bonus) |
| Field | 2 Mosjes, 3 Piecies per player; 1 Place; 3 Quests |

Energy by turn (assuming you gain +1 at the start of turn 1): both players have 3, 4, 5, 6 on their turns 1–4 if nothing is spent.

## 3. Energy cost curve (non-Mosje cards)
| Rarity | Cost | What it buys |
|---|---|---|
| ★ | 0–1 | small tricks, dodges |
| ★★ | 1–2 | solid utility, small attacks |
| ★★★ | 2–3 | strong effects, +20 Power attacks |
| ★★★★ | 3–4 | game-changers |
| ★★★★★ | 4 (5 for one-off finishers) | limited, 1 per deck |

**Effect budget rule of thumb:** an effect is worth about `25 + 12 × Energy` MP. Examples: 0 Energy ≈ +25 MP; 2 Energy ≈ +45 MP or +20 Power; 4 Energy ≈ +70 MP. Value yardsticks: draw 1 card ≈ 15 MP, +10 Power this turn ≈ 10 MP, 1 Energy refunded ≈ 12 MP.
Piecies also pay a "slot tax" (one of 3 slots, 1 turn wait), so a 0-Energy Piecie may carry the full 25 MP; Snelle cost the same value minus ~10 MP because they are instant.

## 4. Mosje stat ranges
| Summon cost | Power (LVL 1) | Starting MP | Ability strength |
|---|---|---|---|
| 2 | 0–10 | 20–40 | light (small passive, once-per-turn trick) |
| 3 | 10 | 10–30 | medium |
| 4 | 20 | 0–20 | strong or game-warping |

Phase 5 (R3): every Mosje lost 10 Power on every level, because attacks beat Quests too easily. A Mosje with Power 0 at Level 1 can't hurt anyone until it levels up; it is a Quester.

- Power goes **+10 per level** (LVL 2 = +10, LVL 3 = +10 again). LVL 3 is the win condition; Power there only matters if you attack while holding.
- Rule: High Power or strong ability ⇒ low starting MP. Never both a high start MP and Power 20 (was 30 before Phase 5).
- Each level row prints traits (★–★★★) + Power. Traits grow by levelling only; typical path: one trait goes up one star per level.
- Rarity guide for Mosjes: ★ → cost 2, ★★ → 2–3, ★★★ → 3, ★★★★ → 3–4, ★★★★★ → 4.
- Pace check: one Mosje needs 200 MP to go L1 → L3, and acts once per turn, so the fastest legal game is ~7 turns even with free MP Piecies; expect 8–10.

## 5. Old MP cost → Energy
| Old cost | Energy |
|---|---|
| Free / None | 0 |
| 5–10 MP | 1 |
| 15–20 MP | 2 |
| 25–30 MP | 3 |
| 35+ MP | 4 |
| Single finishers over 40 MP (Harde Didde, Klaar Met Jou) | 4, plus a requirement or limit 1/deck instead of a 5th Energy |
| Exceptions | Cards that cost "50 MP" like Blensen: 4 or Free (keep its two-way trick) |

Gentle by design: nothing in the base game costs more than 4, so a full pool of 6 always leaves room for a 2nd card.

## 6. Quests
### 6a. Trait map (decided: one main trait per type)
| Quest stack | Main trait (dice) | Optional side requirements (Phase 2) |
|---|---|---|
| Fighting | Physical | Resilient (damage taken, food Piecies) |
| Digital | Technical | Mental (look at deck, card counts) |
| Artistic | Creative | Social (give/take cards, opponent choices) |

About two-thirds of each stack tests the main trait; the rest use a side trait or a pure Piecie/Energy/board requirement. A Mosje may attempt any Quest; own type is just best.
**Gap to fix in Phase 2:** Social, Mental and Resilient have few dice-Quests. Add or rework Quests in the typed stacks so Mosjes built on those traits still have something good to try (as agreed).

### 6b. Dice odds (d6, per-die hit chance)
| Need | 1 die | 2 dice | 3 dice | 4 dice |
|---|---|---|---|---|
| one 4+ | 50% | 75% | 88% | 94% |
| two 4+ | 0% | 25% | 50% | 69% |
| three 4+ | 0% | 0% | 13% | 31% |
| one 5+ | 33% | 56% | 70% | 80% |
| two 5+ | 0% | 11% | 26% | 41% |

### 6c. Reward bands
Fail MP is about 0.5–0.75 × success MP. Success 25–60, fail 15–40, never worse than −40.

| Band | Requirement | ★ (1 die) | ★★ | ★★★ | +Place (4 dice) | Success / Fail |
|---|---|---|---|---|---|---|
| Steady | one 4+ | 50% | 75% | 88% | 94% | +25 / −15 |
| Skilled | two 4+ | 0% | 25% | 50% | 69% | +40 / −30 |
| Heroic | two 5+ | 0% | 11% | 26% | 41% | +60 / −25 |
| Prepared | discard/pay a Piecie or Energy, then one 4+ | 50% | 75% | 88% | 94% | +50 / −30 |
| Gated | board state (e.g. 3 face-down Piecies) + one 4+ | 50% | 75% | 88% | 94% | +35 / −20 |
| Coin flip | no trait, one 4+ | 50% | 50% | 50% | 50% | +50 / −25 |

Expected MP of each attempt (success% × S − fail% × F):
| Band | ★ | ★★ | ★★★ | 4 dice |
|---|---|---|---|---|
| Steady | +5 | +15 | +20 | +22 |
| Skilled | −30 | −13 | +5 | +18 |
| Heroic | −25 | −16 | −3 | +10 |
| Prepared | +10 | +30 | +39 | +43 |
| Gated | +8 | +21 | +28 | +32 |

How to read it: Skilled and Heroic are bad bets until you have stars or a Place helping, which is the point. Prepared is strongest on purpose; it costs a card.
Target mix per 10-Quest stack: 3 Steady, 2 Skilled, 1–2 Heroic, 2 Prepared, 1 Gated or Coin flip; at least 1/3 must need a Piecie or Place.

## 7. Balance flags (watch in Phase 5)
1. **Levelling leaves you at 0 MP.** Any hit drops you a level. Level 3 can only be held if the opponent can't or won't taksen you. **Fixed in Phase 5:** level-up protection (§1).
2. **Minimum 1 die** means a no-star Mosje still has a 50% shot at a Steady Quest. Intended, but check Quests that care about "no stars".
3. **Prepared band EV (+30–43)** is high. If Quests start dominating attacks, lower to +45 / −30.
4. **Going first with no compensation** may favour player 1. **Phase 5:** the desk test showed ~65% for seat 1; player 1 now skips their first draw (§1). Keep tracking it on paper.
5. **Cooldown turn** (§1a) may hit too hard or too soft. Check how often it triggers in Phase 5.
