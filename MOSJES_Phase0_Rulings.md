# MOSJES — Phase 0 Rulings Document

**Purpose:** Resolve every ambiguity from `ambiguities.md` and fix the spec bugs in `card-spec.md` before Phase 1 begins.

**How to use:** Paste this entire document into the VS Code AI along with the prompt at the bottom. The AI will update both files with the authoritative rulings.

---

## PART 1 — METADATA CONFLICT RESOLUTION

### Personal Quests are booster-only. Period.

Every card flagged `category: Quests/PERSONAL/*` must have `isBoosterOnly = true`. The file header is correct; the individual card data is wrong. Fix data to match header.

**Action:** Sweep all Personal Quest entries and set `isBoosterOnly: true`. None are to appear in starter decks.

---

## PART 2 — UNIVERSAL RULES (apply to many cards)

These resolve entire CATEGORIES of ambiguity in one pass. Any card whose ambiguity matches one of these rules uses the rule below — don't restate it per-card.

### U1 — Single-target selection on ATTACK Piecies
Applies to: Super Saiyan Mos, Te Hard Gaan, Momentum Diefje, Kleine Taks, Affoe, Continuous Assault, Snoeiertje, any Piecie with `target: opponent_active_mosje`.

- Target is chosen **at the moment of ACTIVATION** (not face-down placement, not resolution).
- Target locks in at activation. If target becomes invalid before resolution (sent to Welloe, swapped out), the effect **fizzles entirely** — no redirect.
- Multi-turn attacks (Continuous Assault, Kleine Taks): target locked for the full duration. If target becomes invalid, remaining ticks fizzle permanently.

### U2 — "Any deck" scope and visibility
Applies to: Martin The Historian, The Hacker, Mouse, any card referencing "any deck".

- "Any deck" = the activating player chooses: their own deck, OR any single opponent's deck.
- **Visibility rule:** only the activating player sees the revealed cards. Opponents do not see their own deck revealed. Rearrangements happen privately.

### U3 — Random selection from hand
Applies to: Binti The Sharp Tongue, any card with "random card" language.

- Uniform random selection from target's hand via RNG.
- Target player does NOT choose. Revealed face-up on discard.

### U4 — Restriction duration on "while this Mosje is active"
Applies to: Jeffrey The Strongman, Coert Kast-elein, all passive Mosje abilities.

- Effect lasts as long as the Mosje is on field (active or sidelined on the 2-slot row).
- Effect ends immediately when Mosje is sent to Welloe or removed from field.
- Effects do NOT stack with themselves if the same Mosje somehow ends up doubled (shouldn't happen, but for safety: dedupe by Mosje ID).

### U5 — Restriction duration on "X turns" buffs
Applies to: Synergy Field (3 turns), Mosje Shield (2 turns), Bowie & Stormey (2 turns), Gekke Vogels (2 turns), KatjeGang (2 turns), ViannaPoes (2 turns), Continuous Assault (4 turns), Kleine Taks (4 turns), Tikker (next turn lockout), Afblijven (until next turn).

- "X turns" counts the ACTIVATING PLAYER's turns. Activation turn = turn 0. Effect expires at END of turn X.
- Implementation: store `expires_on_turn = currentTurnCount + X` and check at each relevant event.
- At expiry: card self-destructs to discard pile. All flags it placed on Mosjes clear.

### U6 — Stacking order for MP modifiers (GLOBAL)
When multiple modifiers affect a single MP change, apply in this order:

1. Card printed base value
2. Card's own conditional synergy (e.g., Ronald Kip's +10 if Ronald on field → 60 base)
3. Active Mosje ability passives (e.g., Jeffrey's +10 Quest bonus)
4. Partner synergy buffs (e.g., Coert+Binti double food)
5. Place modifiers (e.g., Quest Haven +10, Drain Zone +10 extra drain)
6. Piecie buffs (e.g., MP Amplifier +50%)
7. Snelle Piecie adjustments (e.g., Sleutelpuntje ±15)

Each step uses the result of the previous step as its new base. This is the canonical order — bake it into the effect resolver and never deviate.

### U7 — Cost payment ≠ MP loss
Paying an MP cost to activate a card is NOT "losing MP from an effect". This matters for:
- The Void (blocks MP gain/loss from effects — costs still apply).
- Coert Kast-elein's damage reduction (reduces damage FROM effects, not voluntary costs).
- Drain Reversal (only reverses effect-based losses, not cost payments).

---

## PART 3 — CARD-BY-CARD RULINGS

Listed in the order of the original `ambiguities.md`.

### [Jeffrey] The Strongman — duration/stacking and quest scope
Duration: see U4 (permanent while active).
- "+10 MP Quest bonus" applies to ALL Quests Jeffrey completes (general, personal, mixed). Does NOT apply to the other active Mosje.
- Stacks additively with Quest Haven and all other flat Quest bonuses.
- "Cannot use MP-restoring Piecies" = Jeffrey himself cannot BE THE TARGET of a Piecie whose primary effect is `gain_mp`. The other active Mosje can still use them. Drain/steal effects still benefit Jeffrey because those are attacks, not restoration.

### [Ronald] The Master Chef — locked card behavior
Card text: "block that card's activation for the player's next turn".
- Ronald's player chooses ONE card from opponent's hand at resolution of Ronald's ability.
- Chosen card remains in opponent's hand but gets flag `blocked_until_turn_N` where N = opponent's next turn.
- If opponent attempts to play it during their next turn: activation fails silently. Card stays in hand.
- Flag clears at end of opponent's next turn.
- Does not prevent the card from being discarded by other effects.

### [Martin] The Historian — "any deck"
See U2.

### [The Hacker] — "any deck"
See U2.

### [The Hacker] — cooldown start
"Once every 5 turns" cooldown:
- Counter starts at END of the turn it was used.
- Available again at START of player's turn 6 (counting only their own turns, not opponents').

### [FPS Coert] — single target selection timing
- On Quest completion, roll first.
- If roll = 6: NOW choose target opponent's active Mosje. Apply -15 MP.
- Target is NOT pre-selected.

### [Ronald] The Mastermind — zone after resolution
Card activated from discard goes back to DISCARD after resolution (not banished). Eligible for future revival effects.

### [Binti] The Sharp Tongue — random selection
See U3.

### [Coert] Kast-elein — stacking/restrictions
- "-20 flat MP loss reduction" is permanent while Kast-elein is active (see U4).
- "50+ damage from single source reduced to 25" applies AFTER the -20 reduction. Example: 70 MP incoming → -20 = 50 → 50+ trigger fires → final 25.
- Castle token: persistent, not a turn-based buff. Damage counter toward destroying Castle resets between opponent turns. Opponent must deal 70+ cumulative MP damage to it IN A SINGLE TURN to destroy.
- Castle token does not benefit from Kast-elein's own reduction (otherwise infinite loop).

### Ronald Kip — base value for doubling
Follow U6 stacking order:
- Base 50.
- Ronald synergy bumps to 60 (step 2).
- Coert+Binti double applies to step 2's result → 120.
- MP Amplifier +50% applies to 120 → 180.

### Single-target Attack Piecies
See U1. Applies to Super Saiyan Mos, Te Hard Gaan, Momentum Diefje, Kleine Taks, Affoe.

### TemPiecie — cannot play this turn
- Retrieved card gets flag `retrieved_this_turn`.
- Cannot be placed face-down, activated, or otherwise moved from hand until START of player's next turn.
- Flag clears at start of next turn.

### Mosje Shield — duration
See U5 (2 turns).
- Effect: flag target Mosje as `shielded_from_welloe_until_turn_N`. Any effect that would send them to Welloe is cancelled (the elimination effect fizzles — no second chance unless resurrected).

### Perfect Setup — exact value selection and ordering
- Player CHOOSES exact MP value from 60 to 90 inclusive at activation.
- Implementation: creates a `quest_mp_override` on the Mosje, NOT a real MP change.
- For Quest requirement checks this turn: Mosje's MP reads as the override value.
- For all OTHER purposes (leveling up, gaining MP, taking damage): real MP is used.
- Override clears at end of turn. Real MP is unchanged.
- This lets you hit Perfect Timing (exact 75 MP) without sacrificing actual progress.

### Tikker — restriction duration
- Flag `quest_locked_next_turn` on activating Mosje.
- Next turn's Quest Phase is skipped for that Mosje.
- Flag clears at end of next turn.
- If the Mosje swaps out / swaps in, flag stays on the Mosje (not the slot).

### Continuous Assault — single target
See U1 and U5. Target locked at activation, 4 ticks at end of each of TARGET's turns. If target goes to Welloe, remaining ticks fizzle.

### Jammertje Gepakt — "random" is a misread
Not actually random. Ruling:
- Cancels the targeted Piecie activation.
- That Piecie goes to BOTTOM of its owner's DECK face-down (not hand, not discard).
- If Mental ★★★: activator also draws 1.

### Gevalletje Klakkeloos — copy semantics
- Trigger: opponent gains MP from any source.
- Response window: Gevalletje player may play this Snelle instantly (free cost).
- Effect: pick ONE of your own Mosjes. That Mosje gains EXACTLY the amount the opponent gained.
- Limit: once per trigger event, not once per turn. Multiple triggers = multiple Klakkeloos chances (if you have copies).
- Does NOT copy secondary effects (draws, buffs, etc.) — only the MP amount.
- If the triggering gain is modified later in a chain (MP Amplifier etc.), Klakkeloos uses the FINAL amount post-modifiers.

### Skiffa — choice owner
- Reroll choice belongs to the player who OWNS the Mosje that rolled.
- "Digital loses 10 MP when activated" = triggers when a Digital-type Mosje ACTIVATES any Piecie (cost or free). -10 MP applied to that Mosje immediately.

### The Void — duration and scope
- Active while The Void is the active Place.
- Blocks ALL gain_mp and lose_mp from EFFECTS. Does NOT block cost payments (U7).
- Quests roll and succeed/fail mechanically, but reward = 0 and failure penalty = 0. Success/failure still counts for "completed a quest this turn" triggers.
- Leveling: impossible under The Void. Any Mosje at 100 MP when Void enters stays frozen.
- Removal: destroy The Void via Slecht Gezet, Bong Hit Demolition, Shhh popo komt, Huisbaas, or replacing Place by effect.

### Perfect Setup — (duplicate in ambiguities) 
Already covered above. Player choice of value 60-90.

### Emergency Swap — copy rules
- Emergency Swap grants ONE single use of target's ability.
- Does NOT count against target's own use quotas (once-per-game, once-per-turn).
- One-time copy, consumed on use. No exploits possible.
- You pay any activation costs of the copied ability (as printed).
- Synergy bonuses/pet synergies: do NOT transfer. The ability copies in its BASE form.

### Synergy Chamber — bidirectional/stacking
- Applies to ALL Mosjes on field regardless of owner.
- Bidirectional synergies (both partners benefit when both on field): yes, bilateral.
- Chamber's flat bonuses (+1 die, -5 MP cost, +1 turn duration) are separate from synergy bonuses — they do NOT double synergy buffs.
- Duration extension (+1 turn) applies to piecies/buffs PLACED while Chamber is active. Does not retroactively extend existing buffs.
- If Chamber is destroyed mid-buff: extended duration holds (already granted).

### Momentum Stabilizer — single-effect cap
- Blocks `set_mp` and `adjust_mp_by_exact_X` primitives specifically. These fizzle.
- Blocked cards: Perfect Setup, MP Adjuster, Placeholder 1 Tactician's MP Manipulation, Sleutelpuntje.
- Normal `gain_mp` / `lose_mp` from rewards, attacks, pieces = NOT blocked. Those flow normally.
- Multi-tick effects: each tick evaluated independently. If a tick would set_mp, that tick fizzles.
- Auto-succeed MP-requirement Quests: any Quest whose requirement is "have exactly X MP" or "have between X-Y MP" auto-succeeds while Stabilizer is active.

### Call of the Welloes — summoned Mosje state
- Mosje enters play at Level 1, 0 MP. No progress restored.
- Can act normally while summoned: gain MP, attempt Quests, use abilities.
- When Call of the Welloes leaves field (destroyed, resolved, timed out): Mosje returns to Welloe pile. Any progress during summon is lost.
- Cannot be revived again through Call of the Welloes same game.

### Harde Didde / Klaar Met Jou — elimination timing
- Threshold check (0-40 for Harde Didde, 0-30 for Klaar Met Jou) at MOMENT OF ACTIVATION.
- After activation declared: opponent has a priority window to play a Snelle Piecie (Not Today, Bijna Welloe, etc.).
- Bijna Welloe: negates the elimination effect entirely AND sets your MP to 5 (or 15 with Resilient ★★★). No re-check of threshold.
- Not Today: negates the elimination effect entirely. No MP change.
- If nothing is played in the priority window: elimination resolves.

### Drain Reversal — multi-source amounts
- Reverses the NEXT single incoming MP loss from an effect targeting you.
- Multi-tick: reverses ONE tick. Subsequent ticks resolve normally.
- Multi-target (Dikke Taks): each affected player may play their own Drain Reversal independently, each reverses their own share only.

### Frenssen / Blensen chain — priority and max chain
- Chain max depth: 3 (Jensen → Frenssen → Blensen). No card counters Blensen.
- Priority: each card must be played in the priority window opened after the previous card enters the chain.
- If Blensen played with nothing on stack: cost becomes 50 MP as printed; grants immunity to effects targeting you this turn.
- If Jensen/Frenssen played with nothing appropriate on stack: the card fizzles (wasted).
- Resolve chain top-down (last played resolves first).

---

## PART 4 — SPEC BUGS SPOTTED (fix card-spec.md too)

The Phase 0 audit produced some rows where the atomic effect doesn't match the card text. Fix these before Phase 1.

### Row 3 — [Gandoe] The Unpredictable Wizard
Current spec treats gain_mp(20) as primary and lose_mp(10) as secondary — this is wrong. Chaos Roll is a three-branch conditional:
```
roll = 1 or 2: lose_mp(self, 10)
roll = 3 or 4: nothing
roll = 5 or 6: gain_mp(self, 20) + draw(self, 1)
```
Rewrite as `effect_ref(ability_gandoe_wizard_chaos_roll)` with the branching logic defined in the effect file.

### Row 5 — [Alyssa] The Bulldozer
Missing effect: "When Alyssa loses 30 MP or more in one turn, Alyssa regains 25 MP." Spec shows only +10 MP from Quest attempts. Add as a separate passive trigger:
```
trigger: on_mp_loss_accumulated
condition: cumulative_loss_this_turn >= 30
effect: gain_mp(self, 25), once per turn
```

### Row 48 — Super Saiyan Mos
Current spec shows `drain_mp(opponent, self, 25)` as immediate. Card actually says "Your NEXT Quest drains 25 MP from target opponent". It's a delayed trigger, not immediate.
```
effect: apply_buff(self, "next_quest_drains_25_from_target", duration: until_next_quest)
```

### Row 55 — Affoe
Current spec only shows `gain_mp(self, 10)`. Missing: target opponent loses 15 MP.
```
primary: lose_mp(opponent_active_mosje, 15)
secondary: gain_mp(self_active_mosje, 10)
```

### Row 102 — Klaar Met Jou
Current spec shows only `draw(self, 1)`. Completely missing the elimination effect.
```
primary: send_to_welloe(opponent_active_mosje) if mp(opponent) in [0, 30]
secondary: draw(self, 1)
```

### Row 115 — Bijna Welloe
Current spec shows `gain_mp(self, 20)`. Card actually negates elimination and sets MP to 5 (or 15 with Resilient ★★★).
```
trigger: response_to_welloe_effect
effect: negate(last_effect); set_mp(self_active_mosje, 5)
modifier: if trait(self, Resilient, 3): set_mp to 15 instead
```

### Row 116 — Jantje Jantje... Jantje?
Current spec shows `drain_mp(opponent, self, 30)`. Card actually says: "When Bank is active Place: discard 1 card, ignore one targeted card effect". Completely different.
```
cost: discard(1) + combo_req(place == bank_chilling)
effect: negate(target_effect)
```

### Row 122 — The Gym
Current spec shows gain+lose for self_active_mosje. But The Gym is a universal Place effect: EVERY Mosje loses 10/turn, Fighting types gain 25/turn, Physical ★★★ gain 35/turn. Needs a fan-out structure:
```
trigger: turn_end (for each active Mosje)
for each mosje:
  if trait(mosje, physical, 3): gain_mp(mosje, 35)
  else if type(mosje) == fighting: gain_mp(mosje, 25)
  else: lose_mp(mosje, 10)
```

### Rows with "text_defined" in Synergy Partners column
These are flagged but unresolved. Do a second pass and fill in actual partner IDs from the card text. The column exists to drive synergy checks — leaving it as "text_defined" means Phase 8 will fail on those cards.

Cards to fix: Kannetje Melk, Broodje Döner, Ronald Kip (Ronald synergy), Chef's Special, Varkenspootjes (Binti), Bowie & Stormey, Keyboard/Mouse/Controller (Digital type check), Those Eyelashes Tho, F1 Telemetry, Shhh popo komt, Call of the Welloes, Synergy Chamber, Iron Will.

---

## PART 5 — PASTE-READY PROMPT FOR VS CODE AI

Copy everything below into VS Code AI:

```
Apply the rulings in MOSJES_Phase0_Rulings.md to our project. Do this in 4 passes:

PASS 1 — METADATA FIX:
Open the Personal Quest data file. Set isBoosterOnly = true for every card tagged
Quests/PERSONAL/*. Run the data validation tests. Confirm all Personal Quests are
now booster-only.

PASS 2 — SPEC BUG FIX:
Open card-spec.md and apply every correction in "PART 4 — SPEC BUGS SPOTTED".
For each corrected row, update the Primary Effect and Secondary Effect columns to
match the card text. Do not change card text — only correct the atomic mapping.
Fill in actual synergy partner IDs for every row showing "text_defined".

PASS 3 — RULINGS INTEGRATION:
Create /src/rules/universal-rules.js exporting the 7 universal rules (U1-U7) from
Part 2 as named constants and helper functions. These will be imported by primitives
in Phase 2. Examples:
  - U1_singleTargetAttackResolution(cardActivationContext)
  - U2_anyDeckScopeCheck(player, chosenDeck)
  - U6_MP_MODIFIER_ORDER (enum)
  - U7_isCostPayment(changeSource) (boolean)

Create /src/rules/card-specific-rulings.md as a developer reference matching every
Part 3 ruling to its card ID. This is documentation, not code — but every Phase 4+
implementation must be checked against it.

PASS 4 — VALIDATION:
Re-read card-spec.md after fixes. Produce a diff report showing:
 - Cards whose spec changed
 - Cards whose ambiguity is now resolved by universal rules
 - Cards still unresolved (should be zero — flag if any remain)

Output: phase0-validation-report.md

DO NOT proceed to Phase 1 until the diff report shows zero unresolved ambiguities.

One function per file. Tests for all helper functions in universal-rules.js.
Commit after each pass with message: "phase0: pass N — <summary>".
```

---

## Summary of what this doc resolves

- **37 ambiguities** → all resolved (7 via universal rules, 30 via card-specific rulings).
- **Metadata conflict** → resolved (all Personal Quests are booster-only).
- **8 spec bugs in card-spec.md** → listed with corrections.
- **1 paste-in prompt** → ready for VS Code AI to execute the fixes.

After VS Code AI runs the 4 passes, Phase 0 is truly complete and Phase 1 can start.
