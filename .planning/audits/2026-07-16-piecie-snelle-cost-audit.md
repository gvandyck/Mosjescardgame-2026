---
created: 2026-07-16
title: Piecie/Snelle Piecie mpCost ruling audit (audit round 2 — MP cost model)
branch: card/full-game-text-audit
scope: All 46 currently nonzero-mpCost Piecies (36) + Snelle Piecies (10), plus Personal Quest (6) and reverse-direction closure checks
sensitivity: cost/tribute language only (per 36-CONTEXT.md D-01/D-02) — not a full ability-text audit
---

# Piecie/Snelle Piecie mpCost ruling audit

Method: read every nonzero-`mpCost` Piecie/Snelle Piecie's `description` text (source: full
verbatim text captured in `36-RESEARCH.md`'s "Code Examples" section, re-verified against the
live `src/data/piecies.js`/`src/data/snellePiecies.js` this session) and applied the same
"text wins" standard as the 2026-07-14 Places audit (D-01/D-02): a card only keeps a nonzero
`mpCost` if its own text contains first-person self-payment language ("pay," "costs you," "lose
X to activate," etc.) describing the cost of playing/activating the card itself — not an effect
the card deals to a target, an opponent, or a resource it gains.

## Legend
- 🔴 **Keep nonzero** — text explicitly states a self-paid activation cost
- 🟡 **Judgment call** — text implies but never states a self-paid cost; ruled explicitly, not silently
- ✅ **Correct to 0** — no self-payment language; effect describes only board-state changes (damage dealt, MP gained, cards drawn, protection granted)

---

## Ruling table — Piecies (36 nonzero today)

| # | id | current mpCost | ruling | rationale |
|---|----|----|--------|-----------|
| 1 | piecie_chefs_special | 10 | ✅ 0 | "look at opponent's hand, gain 30 MP..." — describes a gain, no self-payment |
| 2 | piecie_super_saiyan_mos | 15 | ✅ 0 | "Your next Quest drains 25 MP from a target opponent" — effect on opponent, not a cost |
| 3 | piecie_te_hard_gaan | 15 | ✅ 0 | "Target opponent loses 25 MP" — no self-payment |
| 4 | piecie_momentum_diefje | 20 | ✅ 0 | "Steal 20 MP from target opponent" — no self-payment |
| 5 | piecie_jantje_jantje | 10 | ✅ 0 | "Correct: opponent -50 MP. Wrong: you -30 MP" — the -30 is a conditional gameplay penalty on a wrong guess, not a stated activation cost |
| 6 | piecie_dikke_taks | 25 | ✅ 0 | "All opponents lose 35 MP... Draw 2 cards" — no self-payment |
| 7 | piecie_kleine_taks | 15 | ✅ 0 | "Target opponent loses 10 MP per turn for 4 turns" — no self-payment |
| 8 | piecie_affoe | 5 | ✅ 0 | "Target opponent loses 15 MP. You gain 10 MP" — a gain, not a cost |
| 9 | piecie_bong_hit_demolition | 10 | ✅ 0 | "Destroy the active Place card. Draw 2 cards" — no MP language at all |
| 10 | piecie_redbull | 20 | ✅ 0 | "Your active Mosje's unique ability triggers TWICE" — no MP language |
| 11 | piecie_tweede_kans | 5 | ✅ 0 | "Reroll any 1 die result this turn" — no MP language |
| 12 | piecie_dubbele_ding | 25 | ✅ 0 | "Activate 2 Piecies from your hand immediately" — no MP language |
| 13 | piecie_tempiecie | 15 | ✅ 0 | "Retrieve any 1 card from your Graveyard to hand" — no MP language |
| 14 | piecie_quest_prep | 10 | ✅ 0 | "Your next Quest roll this turn gets +2" — no MP language |
| 15 | piecie_mp_amplifier | 10 | ✅ 0 | "Your next MP gain this turn is increased by 50%" — describes a gain bonus, not a cost |
| 16 | piecie_afblijven | 10 | ✅ 0 | "Active Mosje cannot lose MP from opponent effects" — protection, no cost |
| 17 | piecie_laat_me_chillen | 10 | ✅ 0 | "reduce that loss by 20 (one-time)" — protection, no self-payment |
| 18 | piecie_synergy_field | 15 | ✅ 0 | "all Mosje restore abilities give +10 additional MP" — a bonus, no cost |
| 19 | piecie_mosje_shield | 15 | ✅ 0 | "target Mosje cannot be sent to Welloe pile" — protection, no cost |
| 20 | piecie_battle_concert | 25 | ✅ 0 | "Redirect Alyssa's next Quest failure damage to an opponent" — no self-payment |
| 21 | piecie_stookerino | 10 | ✅ 0 | "Gain MP = that card's cost" — this refers to the *discarded opponent card's* `mpCost` as a gain formula input, not a self-paid cost for playing Stookerino itself |
| 22 | piecie_those_eyelashes | 15 | ✅ 0 | "all opponents discard 1, you gain 20 MP" — a gain, no cost |
| 23 | piecie_f1_telemetry | 10 | ✅ 0 | "gain 40 MP, draw 2... Otherwise: gain 15 MP" — a gain, no cost |
| 24 | piecie_mp_adjuster | 10 | ✅ 0 | "Set active Mosje's MP to any value (20-100)" — no self-payment |
| 25 | piecie_chain_reaction | 20 | ✅ 0 | "activate one more from hand for free (once)" — explicitly says "free," no cost |
| 26 | piecie_double_trigger | 25 | ✅ 0 | "Target Mosje (yours) activates their unique ability TWICE" — no MP language |
| 27 | **piecie_welloe_force** | **40** | 🔴 **keep 40** | "**Pay** 40 MP. For 3 turns, all damage your Mosje would take is redirected..." — the ONLY card in the entire pool with explicit first-person self-payment language ("Pay 40 MP"). Tribute mechanism (payer picker + affordability gate) built in Plan 36-02 (COST-05/COST-06). |
| 28 | piecie_bowie_stormey | 15 | ✅ 0 | "GANDOE/DJ/TUK/MICHELLE Mosjes reduce MP loss by 50%" — protection, no cost |
| 29 | piecie_tony | 15 | ✅ 0 | same protection text as Bowie & Stormey — no cost |
| 30 | piecie_gekke_vogels | 15 | ✅ 0 | "Jisca reduces MP loss by 50%" — protection, no cost |
| 31 | piecie_katjegang | 15 | ✅ 0 | "Alyssa Mosjes reduce MP loss by 50%" — protection, no cost |
| 32 | piecie_vianna_poes | 15 | ✅ 0 | "Cless-tagged Mosjes reduce MP loss by 50%" — protection, no cost |
| 33 | piecie_continuous_assault | 20 | ✅ 0 | "target opponent loses 10 MP per turn" — no self-payment |
| 34 | piecie_harde_didde | 40 | ✅ 0 | "Send target Mosje (0-40 MP) to Welloe pile permanently" — the "(0-40 MP)" is the TARGET's eligible MP range, not a self-paid cost |
| 35 | piecie_mp_hemorrhage | 25 | ✅ 0 | "Target loses 15 MP now and another 15 MP..." — no self-payment |
| 36 | piecie_klaar_met_jou | 25 | ✅ 0 | "Send target Mosje (0-30 MP) to Welloe pile permanently. Draw 1" — same target-range pattern as Harde Didde, no self-payment |

**Result: 35 of 36 Piecies correct to `mpCost: 0`. `piecie_welloe_force` is the sole exception, keeping `mpCost: 40`.**

## Ruling table — Snelle Piecies (10 nonzero today)

| # | id | current mpCost | ruling | rationale |
|---|----|----|--------|-----------|
| 1 | snelle_counter_strikka | 15 | ✅ 0 | "Play after opponent activates a Piecie: negate its effect. Requires Mental ★★+" — a trait requirement, not an MP cost |
| 2 | snelle_perfect_dodge | 20 | ✅ 0 | "negate it and gain 15 MP. Physical ★★+" — a gain + trait requirement, no self-payment |
| 3 | snelle_jammertje_gepakt | 20 | ✅ 0 | "negate + reveal 1 random card. Mental ★★★" — trait requirement, no self-payment |
| 4 | snelle_negate_elimination | 20 | ✅ 0 | "Mosje stays at 5 MP instead" — describes the saved Mosje's resulting MP floor, not a cost paid to play the card |
| 5 | snelle_drain_reversal | 15 | ✅ 0 | "return that amount to you and deal equal damage instead" — a gain/redirect, no self-payment |
| 6 | snelle_jeweetniet | 10 | ✅ 0 | "they must reroll the dice. No MP change" — text explicitly says "No MP change" |
| 7 | snelle_sleutelpuntje | 5 | ✅ 0 | "gain +1 on the dice roll this Quest only" — no MP language |
| 8 | snelle_dubbele_temminks | 20 | ✅ 0 | "its effect triggers a second time. Level 1+" — a level requirement, no self-payment |
| 9 | snelle_frenssen | 15 | ✅ 0 | "Counter a Snelle Piecie with this card. Can itself be countered" — no MP language at all |
| 10 | **snelle_blensen** | 50 | 🟡 **0 (flagged judgment call)** | See dedicated rationale below |

**Result: all 10 Snelle Piecies correct to `mpCost: 0`.**

### snelle_blensen — explicit rationale (flagged, not silently resolved)

Text: *"Ultimate counter-chain card. Counters any Snelle Piecie. Free if countering a Frenssen."*

This is the one card in the entire 46-card pool besides Welloe Force whose text implies any
cost concept at all — but it never states what that cost is, nor does it use first-person
payment language ("pay," "costs you," "lose X to activate"). Applying the exact same strict
standard used uniformly across all other 45 cards (D-01/D-02: only explicit self-payment
language keeps a nonzero cost), "Free if countering a Frenssen" does not itself state a
self-paid cost — it is a conditional discount clause with no stated base price anywhere in the
card's own text.

**Ruling: `mpCost: 0`.** The "Free if countering a Frenssen" clause is treated as pre-existing
flavor text that becomes trivially always-true once the base cost is 0 (countering a Frenssen is
"free," and now so is countering anything else — the clause loses its distinguishing meaning but
introduces no functional inconsistency, since "free" was never contradicted by a stated price).

**Flagged explicitly for Gandoe:** if the original design intent was that Blensen normally costs
50 MP and is only free against a Frenssen, that intent is not recoverable from the card's current
printed text alone — the card text would need to be rewritten to say something like "Pay 50 MP.
Free if countering a Frenssen." to support that ruling under this project's "text wins"
convention. As printed today, the text does not support a kept nonzero cost. This ruling can be
revisited if Gandoe confirms the original intended pricing.

---

## Personal Quest audit (COST-03)

Re-ran the sanity check this session against `src/data/quests.js` for all 6
`questType: "PERSONAL"` quests — grepped `description` and `requirementDescription` fields for
`cost|pay|tribute|sacrific|spend` (case-insensitive):

| Personal Quest ID | Mosje requirement | Cost/tribute language found? |
|---|---|---|
| quest_west_perfect_read | Martin Señor West | None |
| quest_personal_iron_will | Jeffrey | None |
| quest_personal_perfect_sync | Martin Señor West + Coert Tech Savant both active | None |
| quest_personal_lucky_crescendo | DJ 80/20 + Skiffa Place | None |
| quest_personal_winston_tijd | Binti + Tesla Place | None |
| quest_personal_kickboxing_bootcamp | Gandoe or Michelle (perMosjeConfig) | None |

**Zero matches across all 6 cards, both `description` and `requirementDescription` fields.**
This confirms 36-RESEARCH.md's Critical Finding 2: Personal Quests have no `mpCost` data field
at all today, and no card's printed text implies one should be added. All 6 quests describe
requirements (Mosje/Place presence, dice-roll thresholds, prior-damage conditions) and
success/failure MP outcomes — never a self-paid activation cost.

**Closure: Personal Quest audit is CLOSED. No tribute anywhere. No code change needed.**

---

## Reverse-direction check (RESEARCH.md Open Question 3)

Spot-checked currently-`mpCost: 0` Piecies and Snelle Piecies for any text implying an unstated
cost (i.e., checking the opposite direction — does any "free" card's text actually suggest it
should cost something?).

### Piecies (5 checked, all `mpCost: 0` today)

| id | description | Implies unstated cost? |
|---|---|---|
| piecie_kannetje_melk | "Gain 25 MP to your active Mosje." | No |
| piecie_broodje_doner | "Gain 35 MP. (Level 1+ only)" | No |
| piecie_ronald_kip | "Gain 50 MP. Ronald synergy: gain 60 MP + draw 1." | No |
| piecie_warm_kannetje_melk | "Lose 10 MP. Draw 2 cards." | No — the "Lose 10 MP" here is already an explicit self-inflicted MP loss that IS charged at `mpCost: 0` in data but is actually part of the card's *effect* (a self-damage effect, distinct from an activation cost); this is a pre-existing engine mechanic (the card deals damage to its own Mosje as its effect) rather than a "pay to activate" tribute, so it correctly stays outside this audit's scope per D-04's abilityCost/cost-vs-effect distinction. No change needed. |
| piecie_slecht_gezet | "Your active Place: return it to your hand. Opponent's active Place: destroy it." | No |

### Snelle Piecies (5 checked, all `mpCost: 0` today)

| id | description | Implies unstated cost? |
|---|---|---|
| snelle_jensen | "Gain 20 MP. (Free, usable any time as interrupt)" | No — explicitly says "Free" |
| snelle_emergency_healings | "When active Mosje would reach 0 MP: restore to 30 MP. Play as interrupt." | No |
| snelle_the_protector | "reduce that loss by 30 this once. Free. Deck limit 1." | No — explicitly says "Free" |
| snelle_bijna_welloe | "gain 20 MP. Free." | No — explicitly says "Free" |
| snelle_jantje_jantje_jantje | "Only when Bank Chilling is active: steal 30 MP from opponent. Free." | No — explicitly says "Free" |

**Outcome: none found.** No zero-cost card's text implies an unstated activation cost. This
confirms RESEARCH.md's A4 assumption (no card needs a NEW tribute added beyond the 46 already
audited above) holds under this spot-check. Full exhaustive re-read of all remaining zero-cost
Piecies/Snelle Piecies was not performed (out of this audit's scope — the phase's premise is
correcting overstated costs, not discovering understated ones), consistent with 36-CONTEXT.md's
framing.

---

## Closing note — Delluft/Dierenasiel (COST-04, not resolved by this doc)

This audit confirms 36-RESEARCH.md's Critical Finding 3 prediction: `piecie_affoe` (Delluft's
referenced SUBSTANCE Piecie) and all 5 PET-tagged Piecies (Dierenasiel's reference) all rule to
`mpCost: 0` above, alongside `piecie_bong_hit_demolition` (Delluft's other SUBSTANCE Piecie).
This means Delluft's "SUBSTANCE Piecies cost 0 MP this turn" and Dierenasiel's "All PET Piecies
cost 0 MP" promises become unconditionally true regardless of whether either Place is active,
once this audit's `mpCost` corrections land. **This ruling table does NOT decide what to do
about that** — whether to leave Delluft/Dierenasiel's text as harmless-but-vacuous flavor text,
or rewrite it to describe something still meaningful, is Plan 36-03's `checkpoint:decision`
question for Gandoe, per 36-CONTEXT.md's D-09/COST-04 framing. This audit only supplies the
finished Piecie ruling that Plan 36-03's decision depends on.

---

## Ruling status: ALL 46 RULED (2026-07-16, this session — 44 mechanical "text wins" rulings + 2 explicit judgment-call rulings: `snelle_blensen`, and confirming the Personal Quest closure). Ready to implement (Task 2/3 of Plan 36-01).
