# Phase 36: Piecie/Snelle Piecie/Place/Personal Quest MP Cost Model Redesign - Research

**Researched:** 2026-07-16
**Domain:** Internal game-engine reconciliation (imperative `.js` engine, no external libraries)
**Confidence:** HIGH (every claim below is verified by direct file read or live `node --input-type=module` introspection of the actual data arrays on the current branch — not sampled, not assumed, unless explicitly marked `[ASSUMED]`)

## Summary

This phase's own premise needs one important correction before planning: **Places and
Personal Quests do not have an `mpCost` data field at all** — zero of 21 Places and zero of 6
Personal Quests carry any `mpCost`/cost field today (confirmed by direct introspection, not
grep-miss). The phase description's "every Piecie/Snelle Piecie/Place/Personal Quest has an
`mpCost` field" is true only for **Piecies (36 of 70 non-zero) and Snelle Piecies (10 of 20
non-zero)**. Places' and Personal Quests' role in this phase is different in kind, not degree:
two Places' own *card text* (Delluft, Dierenasiel) makes a promise about *other cards'*
(SUBSTANCE/PET Piecies') cost — that promise is what Phase 35 folded into this phase (D-09) —
and Personal Quests, on inspection, contain **zero** textual mentions of cost/pay/tribute
anywhere across all 6 cards. This reframes the phase's real scope: it is fundamentally a
**Piecie + Snelle Piecie text audit** (46 cards with a nonzero data value to re-rule), with a
narrow, already-scoped Place interaction (2 cards) and an all-but-certain **no-op** Personal
Quest audit (documented as "confirmed none require tribute," not "build something").

The second major finding reframes the architecture question the phase brief asked to resolve.
Reading the actual text of all 46 non-zero-cost cards (not just checking for the `mpCost` data
value), **exactly one card explicitly states it pays its own cost**: `piecie_welloe_force`
("Pay 40 MP..."). One more (`snelle_blensen`) implies an assumed cost via a conditional waiver
("Free if countering a Frenssen") without ever stating the cost itself in its own text — an
edge case for the audit to rule explicitly, not a second confirmed hit. **Every other one of
the 44 remaining non-zero-mpCost cards describes only its effect on the board (damage dealt,
MP gained, cards drawn, protection granted) — none of them contain first-person payment
language.** Under this project's own "text wins" convention (D-01/D-02, identical to the Places
audit precedent), the expected outcome of the full audit is **~44 of 46 cards correcting to
`mpCost: 0`**, not a ~35-card tribute system. This changes the recommended architecture
decisively: **do not build a generic engine-level cost-enforcement hook** (that would be
solving for a scale of ~35 cards that the evidence says won't materialize) — **extend the
existing per-card self-charge idiom** (Welloe Force's pattern), but fix the one genuine gap in
that idiom: it has no player-facing payer picker and no affordability gate, both of which are
now mandatory (D-05/D-06). Welloe Force itself currently violates both new rules and needs
reworking as part of this phase, not just as a template for others.

**Primary recommendation:** Treat this phase as (1) a full text audit across 70 Piecies + 20
Snelle Piecies + the 2 Delluft/Dierenasiel Place text promises + 6 Personal Quests (expect the
Personal Quest and ~44-of-46-nonzero-cost audit rows to close as "no tribute — correct to 0"),
(2) build ONE new reusable "pick a Mosje to pay tribute" modal helper (generalizing the
existing `showMosjeSelect` pattern) with an affordability gate that blocks the action entirely
when no Mosje can afford it (D-06), (3) rework Welloe Force to use it (fixing its current
missing-payer-choice and missing-affordability-check bugs), and (4) apply the same helper to
whatever small number of additional cards the audit confirms (expected: 0-2 more, pending the
`snelle_blensen` ruling and a careful full read — this research read all 46 non-zero-cost card
texts and found no others, but a second holistic pass during the audit is still the right
process per D-03).

## Architectural Responsibility Map

Single-tier project (no browser/server split — client-side prototype, one game loop). All
capabilities in this phase live in the same tier:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tribute charge (deduct MP from chosen Mosje) | Engine (`src/abilities/piecieEffects.js`, `src/abilities/snelleEffects.js`) | — | Per-card effect function self-charges, matching the existing Welloe Force idiom |
| Payer selection (which on-field Mosje pays) | UI (`src/ui/modalManager.js`) | Engine (reads the choice back into state) | New player-facing decision (D-05) — needs a modal, same as every other "choose a Mosje" flow in this codebase |
| Affordability gate (block if nobody can pay) | Engine (pre-check before `activatePiecie`/`playSnellie` calls the effect fn, or inside the effect fn before charging) | UI (disables ineligible options in the picker) | D-06 is a hard block, not a UI nicety — must be enforced engine-side even though the UI also visually disables it |
| Card text (`description`, `mpCost`) | Data (`src/data/piecies.js`, `src/data/snellePiecies.js`) | — | Pure data, no logic (per CLAUDE.md) |
| Cost-chip display ("Free"/"N MP") | UI (`src/ui/modalManager.js:467`, `src/main.js:704`, `src/ui/packOpeningOverlay.js:122`, `src/deck-builder.js:291`) | — | Already reads `mpCost` correctly today — becomes accurate once D-08 corrects the data, no code change needed here |
| Full-audit ruling record | Docs (`.planning/audits/`) | — | Same precedent as the Places audit — a ruling table precedes any code change (D-03) |

<phase_requirements>
## Phase Requirements

No requirement IDs were assigned before this research (first planning pass for Phase 36). The
table below is a **proposed** requirement set for the planner to adopt, split, or rename —
grounded in what this research actually found, not the phase description's original assumed
scope.

| Proposed ID | Description | Research Support |
|----|-------------|------------------|
| COST-01 | Full text audit — all 70 Piecies, ruling table (same format as `2026-07-14-places-text-audit.md`) | Full description text for all 36 non-zero-mpCost Piecies is captured verbatim in "Per-Card Audit Data" below — starting point for the ruling pass |
| COST-02 | Full text audit — all 20 Snelle Piecies, ruling table | Full description text for all 10 non-zero-mpCost Snelle Piecies captured below |
| COST-03 | Confirm/close Personal Quest audit — expected outcome "no tribute anywhere, document and close" | All 6 Personal Quests read; zero cost/pay/tribute language found (see Critical Finding 2) |
| COST-04 | Resolve Delluft/Dierenasiel's Place-text dependency on the Piecie-cost model (D-09 fold-in) | Critical Finding 3 — their "cost 0" clauses reference SUBSTANCE/PET Piecies, which the COST-01 audit will almost certainly rule to 0 anyway, making these 2 Places' own text redundant-but-harmless or needing a rewrite |
| COST-05 | Build the reusable tribute-payer-picker + affordability-gate helper | Critical Finding 4 + Code Examples below — generalizes `showMosjeSelect` (`modalManager.js:733-765`) |
| COST-06 | Rework Welloe Force (`piecie_welloe_force`) to use the new picker + affordability gate | Critical Finding 4 — current implementation hardcodes the first active slot as payer (violates D-05) and never checks affordability before charging (violates D-06, and risks defeating the paying Mosje — see Common Pitfall 1) |
| COST-07 | Wire tribute into any additional cards the full audit confirms need it | Expected 0-2 cards beyond Welloe Force (see `snelle_blensen` edge case in Critical Finding 1) |
| COST-08 | Correct every Piecie/Snelle Piecie `mpCost` field to match the final ruling | D-08 — expected: ~44 of 46 non-zero fields become 0, 1-3 keep a nonzero value matching their text |
| COST-09 | Full sim + Ronald Kip stacking test re-run after data corrections land | CLAUDE.md's MP-touching-change protocol; this phase touches MP data across dozens of cards simultaneously |
</phase_requirements>

## Standard Stack

Not applicable — this phase touches only project-owned code (`src/data/*.js`,
`src/abilities/*.js`, `src/engine/*.js`, `src/ui/*.js`). No new external library, framework, or
package is needed. No Context7/WebSearch/WebFetch lookups were performed for this reason — same
as Phase 35's research, this is 100% internal codebase investigation.

## Package Legitimacy Audit

Not applicable — no external packages are introduced by this phase.

## Architecture Patterns

### Recommended Project Structure
No new files needed. Changes land in the existing files:
```
src/data/piecies.js              — mpCost corrections (D-08)
src/data/snellePiecies.js        — mpCost corrections (D-08)
src/data/places.js               — no mpCost field exists or is needed; Delluft/Dierenasiel
                                    description text may need a follow-up edit (COST-04)
src/abilities/piecieEffects.js   — Welloe Force rework + any newly-ruled tribute Piecies
src/abilities/snelleEffects.js   — any newly-ruled tribute Snelle Piecies
src/ui/modalManager.js           — new generalized tribute-payer-picker function
src/engine/turnManager.js        — no structural change expected (single dispatch point per
                                    card type already exists — see Critical Finding 4); at most
                                    a one-line affordability pre-check if the team prefers an
                                    engine-side pre-check over an effect-fn-side one
```

### Pattern 1: Self-charge inside the card's own effect function (existing precedent, extend — don't replace)
**What:** the paying card's own effect function (`piecieEffects.js` / `snelleEffects.js`)
deducts the tribute MP from the chosen Mosje, exactly like `effect_welloe_force` does today.
**When to use:** every card the audit rules to require tribute (expected: Welloe Force + 0-2
more).
**Why not a generic engine-level hook instead:** `activatePiecie` (`turnManager.js:781-943`)
and `playSnellie` (`turnManager.js:958-1031`) each have exactly **one** dispatch call site
(`const effectFn = piecieEffects[knownCardDef.effectId]; state = effectFn(state, playerId);`
at `turnManager.js:878-881`, and the equivalent at `turnManager.js:1005-1007` for Snelle
Piecies). A hypothetical generic hook reading `cardDef.mpCost` and auto-charging before this
call would, for the very first time in this game's history, start actually charging **every one
of the ~44 currently-uncharged non-zero-mpCost cards** the instant their audit rules them to
stay at their current (soon-to-be-corrected-to-0) value during any transitional window, and
would need a bypass/waiver mechanism from day one for the ~44 that the audit will rule free.
Given the audit is expected to leave only 1-3 cards with a real cost, a generic hook is solving
for a scale that the evidence does not support — the decentralized self-charge idiom (already
proven, already tested for Welloe Force's shape) is simpler and lower-risk.

```javascript
// Source: src/abilities/piecieEffects.js:804-816 (existing live code) — the ONLY current
// self-charge precedent, and the template to extend, NOT to leave as-is (see Common Pitfall 1)
export function effect_welloe_force(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);   // <-- BUG per D-05: hardcodes first slot,
	if (si < 0) return state;                     //     player is never asked which Mosje pays
	// Pay 40 MP activation cost from active Mosje
	applyDamage(player.activeSlots[si], 40);      // <-- BUG per D-06: no affordability check
	state._welloeForceActive = { ownerId: playerId, turnsRemaining: 3, targetSlotId: null };
	return state;
}
```

### Pattern 2: Generalize the existing Mosje-picker for tribute payment
**What:** `showMosjeSelect` (`src/ui/modalManager.js:733-765`) already implements almost exactly
what D-05/D-06 need — it renders one button per on-field Mosje, disables any Mosje that can't
afford a cost, and resolves with the chosen slot index. **Its one limitation:** the "cost" is a
hardcoded `const questCost = 20;` local constant baked in for the Quest-attempt use case — it is
not parameterized. Generalizing this (accept an `amount` parameter instead of the hardcoded 20)
is the natural, minimal-footprint way to reuse it for tribute payment, per CLAUDE.md's
"build once, reuse everywhere" rule (D-05 explicitly calls this out).
**When to use:** every ruled tribute card, at the moment of activation, before charging.

```javascript
// Source: src/ui/modalManager.js:733-765 (existing live code) — the reuse template.
// Currently: hardcoded `questCost = 20`. Generalize to accept `amount` as a parameter,
// or add a sibling function (e.g. showTributePayerSelect) that shares the same body shape:
function showMosjeSelect(mosjeSlots, onSelected, questDef, overrides = {}) {
	const isQuestAttempt = Boolean(questDef);
	const questCost = 20;   // <-- generalize this to a passed-in `amount`
	// ...disables any mosjeSlot where mp < amount...
	// ...resolves via the shared showOptionSelect(...) primitive (line 648)...
}
```

### Pattern 3: Affordability gate must precede the charge, not follow it
**What:** `applyDamage(mosje, amount)` (local helper, duplicated in `piecieEffects.js:29`,
`placeEffects.js:13`, `mosjeAbilities.js:22`) has a defeat-at-0 path: if the payer's `mp` would
go below 0 while at `level === 0`, it sets `mp = 0` **and flags the Mosje for defeat**
(`mosje._pendingDefeat = true`, swept by `checkVictory`). This is correct behavior for combat
damage but is the wrong behavior for a tribute payment under D-06 ("the action cannot be played/
activated" if unaffordable — the Mosje must never even attempt the payment). **The fix is not
to change `applyDamage`** (combat damage should still defeat Mosjes at 0) — **it is to never
call it with an amount the payer can't afford**, by gating on `mosje.mp >= amount` before the
picker is even shown (disable ineligible Mosjes) and again before `applyDamage` fires (in case
of a race/stale-state read), returning `{ success: false, error: '...' }` if no eligible payer
exists.
**When to use:** every tribute-charging call site.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Player picks which of their Mosjes pays a cost" | A new bespoke tribute modal | Generalized `showMosjeSelect` (parameterize the hardcoded `questCost`) | Already builds the exact disabled/enabled-by-affordability list this phase needs; matches CLAUDE.md's reusable-UI rule verbatim |
| "Charge MP from a Mosje, handle overflow/defeat" | A new charge-application function | Existing `applyDamage(mosje, amount)` local helper — already used by Welloe Force | Already handles level-regression and the 0-floor correctly; the bug is the missing affordability pre-check, not the charge mechanics themselves |
| Ruling-table format for the audit | A new document structure | `.planning/audits/2026-07-14-places-text-audit.md`'s exact format (🔴/🟡/✅ legend, divergence table, RULINGS section) | Explicit precedent named in CONTEXT.md's discretion note; proven, already used twice |
| Generic "charge every card's mpCost automatically" engine hook | A new cost-enforcement middleware in `activatePiecie`/`playSnellie` | Nothing — don't build this at all | The evidence (44 of 46 non-zero-cost cards have no payment language in their text) shows this would be solving for a scale of tribute cards that doesn't exist in this game's actual card pool |

**Key insight:** this phase's biggest risk is over-building. The phase description assumed a
large-scale ("~35+ affected cards") tribute system; the actual card text says otherwise. Building
a generic engine-level charge-everything mechanism to match the assumed scale would introduce a
behavior change to ~44 cards that the audit is about to rule "should stay free" — exactly
backwards from the phase's stated goal.

## Common Pitfalls

### Pitfall 1: Applying Welloe Force's pattern verbatim to new tribute cards (carries 2 latent bugs forward)
**What goes wrong:** copying `effect_welloe_force`'s exact shape (`getFirstActiveSlotIndex` +
unconditional `applyDamage`) into a new card reproduces its two bugs: no player choice of payer,
no affordability check.
**Why it happens:** it's the only existing precedent, and "copy the nearest existing pattern"
is normally the right call in this codebase (see Phase 35 research's identical framing) — but
here the precedent itself predates D-05/D-06 and needs updating, not copying as-is.
**How to avoid:** treat Welloe Force's rework (COST-06) as a prerequisite task before or
alongside any newly-ruled tribute card, so both use the corrected pattern from the start.
**Warning signs:** a new effect function that charges MP without first showing a picker, or
without a `mp >= amount` guard before calling `applyDamage`.

### Pitfall 2: Assuming the "44 of 46 correct to 0" prediction means the audit can be skipped
**What goes wrong:** treating this research's text read as a substitute for the full,
card-by-card audit D-03 requires, and skipping straight to "set everything to 0 except Welloe
Force."
**Why it happens:** the prediction is strong (every one of the 44 was read this session and
none contain first-person payment language), but it is this research's reading, not an
interactive Gandoe-confirmed ruling — the Places audit precedent (`2026-07-14-places-text-audit.md`)
was itself an interactive back-and-forth, not a single-pass read. `snelle_blensen`'s "Free if
countering a Frenssen" phrasing is a concrete example of a card whose ruling isn't a mechanical
keyword match — it needs a judgment call (does "free if X" imply a real cost otherwise, or is
it just flavor text describing an already-free card's occasional discount from nothing?).
**How to avoid:** run the full interactive audit (D-03) as planned; use this research's data as
the starting draft, not the final ruling.
**Warning signs:** a plan that skips straight to bulk-editing `mpCost` values without a
committed ruling table first.

### Pitfall 3: Forgetting Delluft/Dierenasiel's text becomes self-referentially odd once the audit lands
**What goes wrong:** shipping the corrected `mpCost: 0` values for SUBSTANCE/PET Piecies
(likely outcome for all 7 of them — 2 SUBSTANCE + 5 PET, none of which mention paying in their
own text) without revisiting Delluft ("SUBSTANCE Piecies cost 0 MP **this turn**") and
Dierenasiel ("All PET Piecies cost 0 MP") — both Places' headline promise becomes **always true,
everywhere, regardless of whether the Place is active**, once those Piecies' base `mpCost` is
corrected to 0. The conditional framing ("this turn," implying "otherwise they cost something")
becomes misleading flavor text.
**Why it happens:** Delluft/Dierenasiel's tasks (COST-04) may get planned as "just wire the
waiver, same as any other card" without connecting it to COST-01's expected outcome for those
same 7 Piecies.
**How to avoid:** sequence COST-01 (Piecie audit) before COST-04 (Place text resolution) so the
Place-text decision is made with full knowledge of what the Piecies are actually going to cost.
**Warning signs:** Delluft/Dierenasiel implementation tasks written before the Piecie audit
ruling table is finalized.

### Pitfall 4: Reusing `applyDamage` for tribute without pre-checking affordability (Mosje death-by-payment)
**What goes wrong:** a tribute payment call defeats the paying Mosje instead of being blocked,
because `applyDamage`'s existing defeat-at-0 logic (`mosje.level === 0` + `mp < 0` →
`_pendingDefeat = true`) fires exactly the same way for a self-inflicted cost as it does for
opponent damage.
**Why it happens:** `applyDamage` has no concept of "this MP loss is a cost, not damage" — it's
a generic MP-subtraction primitive.
**How to avoid:** gate every tribute charge on `mp >= amount` before ever calling `applyDamage`
— either by disabling ineligible Mosjes in the picker (D-06's UI requirement) or, if no Mosje
qualifies, returning a blocked/failed action before the picker is even shown.
**Warning signs:** a tribute-payment test that only exercises the "can afford" path — the
"nobody can afford it, action blocked" path (D-06) needs its own explicit test.

## Code Examples

### Full text of every Piecie with a nonzero `mpCost` today (36 cards — the COST-01 audit's raw material)
```
// Source: src/data/piecies.js, read directly this session via node introspection
// Format: id (mpCost, tags) :: description

piecie_chefs_special (10, [FOOD]) :: "Ronald on field: look at opponent's hand, gain 30 MP per Piecie there. Otherwise: gain 15 MP."
piecie_super_saiyan_mos (15, [ATTACK]) :: "Your next Quest drains 25 MP from a target opponent on success."
piecie_te_hard_gaan (15, [ATTACK]) :: "Target opponent loses 25 MP."
piecie_momentum_diefje (20, [ATTACK,STEAL]) :: "Steal 20 MP from target opponent. Add to your active Mosje."
piecie_jantje_jantje (10, [ATTACK,REVEAL]) :: "Name a card. Reveal opponent's hand. Correct: opponent -50 MP. Wrong: you -30 MP."
piecie_dikke_taks (25, [ATTACK,AOE]) :: "All opponents lose 35 MP (40 MP if 3+ opponents). Draw 2 cards."
piecie_kleine_taks (15, [ATTACK,DOT]) :: "Target opponent loses 10 MP per turn for 4 turns. Ticks at end of opponent's turn."
piecie_affoe (5, [SUBSTANCE,ATTACK,TARGETING]) :: "Target opponent loses 15 MP. You gain 10 MP."
piecie_bong_hit_demolition (10, [DESTROY,DRAW,SUBSTANCE]) :: "Destroy the active Place card. Draw 2 cards."
piecie_redbull (20, [ABILITY-BOOST]) :: "Your active Mosje's unique ability triggers TWICE this turn."
piecie_tweede_kans (5, [DICE]) :: "Reroll any 1 die result this turn."
piecie_dubbele_ding (25, [CHAIN]) :: "Activate 2 Piecies from your hand immediately, bypassing face-down rule."
piecie_tempiecie (15, [RECOVERY]) :: "Retrieve any 1 card from your Graveyard to hand. Cannot play it this turn."
piecie_quest_prep (10, [QUEST-BOOST]) :: "Your next Quest roll this turn gets +2 added to the dice result."
piecie_mp_amplifier (10, [MP-BOOST]) :: "Your next MP gain this turn is increased by 50%."
piecie_afblijven (10, [PROTECT]) :: "Active Mosje cannot lose MP from opponent effects until your next turn."
piecie_laat_me_chillen (10, [PROTECT]) :: "Next time active Mosje would lose MP: reduce that loss by 20 (one-time)."
piecie_synergy_field (15, [FIELD-EFFECT]) :: "Persistent 3 turns: all Mosje restore abilities give +10 additional MP."
piecie_mosje_shield (15, [PROTECT,FIELD-EFFECT]) :: "Persistent 2 turns: target Mosje cannot be sent to Welloe pile."
piecie_battle_concert (25, [REDIRECT,ALYSSA]) :: "Redirect Alyssa's next Quest failure damage to an opponent. She still triggers Unstoppable."
piecie_stookerino (10, [REVEAL,DISCARD]) :: "Reveal opponent's hand, discard 1 card of your choice. Gain MP = that card's cost."   // NOTE: "cost" here = the DISCARDED card's mpCost as a gain amount, not a self-payment
piecie_those_eyelashes (15, [MARTIN,WEST,AOE]) :: "Martin/West on field: all opponents discard 1, you gain 20 MP, block opponent Snelles."
piecie_f1_telemetry (10, [MARTIN,WEST,QUEST-BOOST]) :: "Martin/West on field: gain 40 MP, draw 2, next Quest +20 MP. Otherwise: gain 15 MP, draw 1."
piecie_mp_adjuster (10, [MP-SET]) :: "Set active Mosje's MP to any value (20-100). Reverts at start of your next turn."
piecie_chain_reaction (20, [CHAIN]) :: "After you activate any Piecie this turn, activate one more from hand for free (once)."
piecie_double_trigger (25, [ABILITY-BOOST]) :: "Target Mosje (yours) activates their unique ability TWICE this turn."
piecie_welloe_force (40, [REDIRECT]) :: "Pay 40 MP. For 3 turns, all damage your Mosje would take is redirected to a chosen opponent Mosje instead."   // <-- ONLY confirmed self-payment text in the whole pool
piecie_bowie_stormey (15, [PET,PROTECT]) :: "Persistent 2 turns: GANDOE/DJ/TUK/MICHELLE Mosjes reduce MP loss by 50% (75% with synergy)."
piecie_tony (15, [PET,PROTECT]) :: "Persistent 2 turns: GANDOE/DJ/TUK/MICHELLE Mosjes reduce MP loss by 50% (75% with synergy)."
piecie_gekke_vogels (15, [PET,PROTECT,JISCA]) :: "Persistent 2 turns: Jisca reduces MP loss by 50% (80% with Alyssa + both pets)."
piecie_katjegang (15, [PET,PROTECT,ALYSSA]) :: "Persistent 2 turns: Alyssa Mosjes reduce MP loss by 50% (80% with Jisca + both pets)."
piecie_vianna_poes (15, [PET,PROTECT,CLESS]) :: "Persistent 2 turns: Cless-tagged Mosjes reduce MP loss by 50%."
piecie_continuous_assault (20, [ATTACK,DOT,FIELD-EFFECT]) :: "Persistent 4 turns: target opponent loses 10 MP per turn."
piecie_harde_didde (40, [ATTACK,ELIMINATION]) :: "Send target Mosje (0-40 MP) to Welloe pile permanently."
piecie_mp_hemorrhage (25, [ATTACK,DOT]) :: "Target loses 15 MP now and another 15 MP at start of their next turn."
piecie_klaar_met_jou (25, [ATTACK,ELIMINATION]) :: "Send target Mosje (0-30 MP) to Welloe pile permanently. Draw 1 card."
```

### Full text of every Snelle Piecie with a nonzero `mpCost` today (10 cards)
```
// Source: src/data/snellePiecies.js, read directly this session
snelle_counter_strikka (15, [COUNTER]) :: "Play after opponent activates a Piecie: negate its effect. Requires Mental ★★+."
snelle_perfect_dodge (20, [DODGE]) :: "Play when targeted by an ATTACK Piecie: negate it and gain 15 MP. Physical ★★+."
snelle_jammertje_gepakt (20, [COUNTER,REVEAL]) :: "Play when opponent searches their deck or hand: negate + reveal 1 random card. Mental ★★★."
snelle_negate_elimination (20, [PROTECT,COUNTER]) :: "Play when your Mosje would be sent to the graveyard: negate. Mosje stays at 5 MP instead."
snelle_drain_reversal (15, [COUNTER,RESTORE]) :: "Play when opponent drains your MP: return that amount to you and deal equal damage instead."
snelle_jeweetniet (10, [COUNTER]) :: "Interrupt any opponent's Quest attempt: they must reroll the dice. No MP change."
snelle_sleutelpuntje (5, [QUEST-BOOST]) :: "Play right before a Quest: gain +1 on the dice roll this Quest only."
snelle_dubbele_temminks (20, [CHAIN]) :: "Play after any Piecie activates: its effect triggers a second time. Level 1+."
snelle_frenssen (15, [COUNTER-CHAIN]) :: "Counter a Snelle Piecie with this card. Can itself be countered."
snelle_blensen (50, [COUNTER-CHAIN]) :: "Ultimate counter-chain card. Counters any Snelle Piecie. Free if countering a Frenssen."   // <-- edge case: implies an assumed cost via a conditional waiver, but never states it directly
```

### Places' actual "cost" text (only 2 of 21 — both reference OTHER cards, not their own cost)
```
// Source: src/data/places.js, confirmed via introspection — 0 of 21 Places have an mpCost field
place_delluft :: "End Phase: All players draw 1 card. SUBSTANCE Piecies cost 0 MP this turn."
place_dierenasiel :: "Passive: All PET Piecies cost 0 MP."
```

### Personal Quests — full inventory, zero cost/pay/tribute language found
```
// Source: src/data/quests.js — 6 of 46 total quests are questType: "PERSONAL"; none have an
// mpCost field; a full-text scan for cost|pay|tribute|sacrific|spend across every quest's
// description AND requirementDescription returned zero matches (General or Personal).
quest_west_perfect_read           — requiredMosjeId: mosje_martin_senor_west
quest_personal_iron_will          — requiredMosjeId: mosje_jeffrey
quest_personal_perfect_sync       — requiredMosjeId: mosje_martin_senor_west
quest_personal_lucky_crescendo    — requiredMosjeId: mosje_dj_8020
quest_personal_winston_tijd       — requiredMosjeId: mosje_binti
quest_personal_kickboxing_bootcamp — requiredMosjeId: null (per-Mosje config: gandoe/michelle)
```

## Critical Finding 1 — Only 1 of 46 non-zero-`mpCost` cards states self-payment in its text; 1 more is an edge case

**Confidence: HIGH — every one of the 46 card descriptions was read in full this session (see
Code Examples above for the complete verbatim list), not sampled or grepped for keywords alone.**

`piecie_welloe_force` ("Pay 40 MP. For 3 turns...") is the only card whose text unambiguously
states it pays its own cost. `snelle_blensen` ("Free if countering a Frenssen") is the sole edge
case — its text implies the card normally has a real cost (why else would a specific condition
make it "free"?) without ever stating what that cost is or that the player pays it — this needs
an explicit ruling during the audit (does "Free if X" retroactively mean "otherwise costs 50
MP, self-paid"? Or is it flavor text on an already-free card describing a discount from
nothing, which would be nonsensical and thus itself evidence the card *should* cost something
normally?). **Recommendation: rule this one explicitly with Gandoe during the audit rather than
guess** — it's exactly the kind of "holistic read vs. exact keyword match" question CONTEXT.md's
discretion note anticipates.

Every other one of the 44 remaining cards (35 Piecies + 9 Snelle Piecies) describes only an
effect on the board state (MP transferred to/from an opponent, cards drawn, protection/buffs
granted, dice manipulation) — none contain first-person payment language ("I pay," "costs you,"
"lose X to activate this," etc.). Under D-01/D-02 ("text wins," identical to the Places audit
precedent), the expected outcome is these 44 correct to `mpCost: 0`.

**Consequence for planning:** the phase description's assumption of "~35+ affected cards"
needing a tribute mechanism does not match what the card text actually says. Plan for a small
tribute system (1-3 cards), not a large one. This directly answers the phase brief's Open
Question 1 (architecture: shared hook vs. self-charge idiom) — see Architecture Patterns above.

## Critical Finding 2 — Places and Personal Quests have zero `mpCost` fields; the phase's framing needs adjusting for both

**Confidence: HIGH — verified by direct `node --input-type=module` introspection of the live
`PLACES` and `QUESTS` arrays (`Object.keys` check for the `mpCost` field), not just grep.**

- **Places:** `PLACES.filter(p => 'mpCost' in p)` returns 0 of 21. Places have never had a cost
  field, so there is nothing to "correct... to match the final ruling" (D-08) for Places
  themselves. The only "cost" language anywhere in `places.js`'s 21 descriptions is Delluft's
  and Dierenasiel's promise about *other cards'* (SUBSTANCE/PET Piecies') cost — this is the
  same finding Phase 35's research already surfaced as Critical Finding 1 and folded into this
  phase via D-09. There is no separate "Place mpCost audit" to perform.
- **Personal Quests:** `QUESTS.filter(q => q.questType === 'PERSONAL')` returns exactly 6 (of 46
  total quests, General + Personal combined); none have an `mpCost` field, and a full-text
  regex scan (`/cost|pay|tribute|sacrific|spend/i`) across every quest's `description` AND
  `requirementDescription` — General and Personal alike, all 46 — returned **zero matches**.
  There is no card in this category whose printed text asks the player to pay anything.

**Consequence for planning:** the Personal Quest portion of this phase (COST-03) is realistically
a documentation/closure task ("audited, confirmed none require tribute, no code change"), not an
implementation task. Don't plan implementation work for a category where the evidence says
there's nothing to implement — but do still run the audit interactively (per D-03) rather than
skip it based solely on this research's pass, since a future Personal Quest could be added or a
subtler cost-implying phrase could be missed by keyword search alone (mirrors Common Pitfall 2).

## Critical Finding 3 — Delluft/Dierenasiel's own "cost 0" clauses will likely become universally true once the Piecie audit lands (not just "while the Place is active")

**Confidence: HIGH — derived directly from Critical Finding 1's per-card text read.**

Delluft's SUBSTANCE Piecies are `piecie_affoe` (mpCost 5) and `piecie_bong_hit_demolition`
(mpCost 10) — the only 2 of 8 SUBSTANCE-tagged Piecies with a nonzero cost today (the other 6
are already `mpCost: 0`). Neither card's text states self-payment (see Code Examples). Under
D-01/D-02, both are expected to correct to `mpCost: 0` regardless of Delluft.

Dierenasiel's PET Piecies are all 5 PET-tagged Piecies in the game (`piecie_bowie_stormey`,
`piecie_tony`, `piecie_gekke_vogels`, `piecie_katjegang`, `piecie_vianna_poes`), all currently
`mpCost: 15`, none mentioning self-payment. Under the same rule, all 5 are expected to correct
to `mpCost: 0` regardless of Dierenasiel.

**Consequence for planning:** if the audit rules as this research predicts, Delluft's "SUBSTANCE
Piecies cost 0 MP **this turn**" and Dierenasiel's "**All** PET Piecies cost 0 MP" become
statements that are true unconditionally, everywhere, all the time — the conditional framing
("this turn," implying "otherwise they'd cost something") becomes misleading flavor text once
the base data is corrected. This is a genuine design decision the phase needs to surface to
Gandoe (not silently resolve): either (a) leave the text as harmless-but-vacuous flavor text
once the Piecie audit lands, or (b) rewrite Delluft/Dierenasiel's own card text once the final
Piecie ruling is known, to describe something these Places still meaningfully do. **Recommend
sequencing COST-01 (Piecie/Snelle audit) to complete before COST-04 (Place text decision) is
finalized**, so the Place-text choice is made with the actual ruling in hand, not a prediction.

## Critical Finding 4 — Welloe Force (the sole confirmed tribute card) currently violates both D-05 and D-06

**Confidence: HIGH — verified by direct read of `effect_welloe_force` (`piecieEffects.js:804-816`)
and `applyDamage` (`piecieEffects.js:29-42`).**

`effect_welloe_force` charges its 40 MP cost via `applyDamage(player.activeSlots[si], 40)`
where `si = getFirstActiveSlotIndex(player)` — the player's **first** active Mosje slot,
hardcoded, not a choice (violates D-05: "the player picks which of their on-field Mosjes pays").
It also never checks `mosje.mp >= 40` before charging (violates D-06: "if the chosen payer can't
afford the tribute... the card cannot be played/activated"). Because `applyDamage` has a
defeat-at-0 path for Level-0 Mosjes (see Common Pitfall 4), a player activating Welloe Force
with a Level-0, sub-40-MP Mosje as their only active slot today would have that Mosje **defeated
by its own activation cost** — a real, currently-shippable bug, not a hypothetical.

There is also zero existing test coverage for Welloe Force anywhere in
`tests/ui/cards/card-registry.js` (confirmed by grep — `piecie_affoe`, `piecie_bowie_stormey`,
`piecie_bong_hit_demolition` all have entries; `piecie_welloe_force` has none), so this bug has
no regression guard today.

**Consequence for planning:** Welloe Force's rework (COST-06) is not optional cleanup — it is a
required part of implementing D-05/D-06 correctly, since it's the one card guaranteed to need
the new tribute mechanism. Plan it as a first-class task, with its own card-registry test entry
(closing the existing Wave-0 gap) covering both the "can afford" and "nobody can afford, action
blocked" paths.

## Runtime State Inventory

Not applicable — this phase does not rename, refactor, or migrate any existing identifier,
key, or stored record. It corrects data field values (`mpCost`) and adds new gameplay logic;
no persisted game state format changes, no ids are renamed. Skipped per the trigger condition
in the output format (rename/refactor/migration phases only).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | This research's single-pass text read (no first-person payment language found in 44 of 46 cards) will hold up under the full interactive audit (D-03) | Critical Finding 1, Summary | If a card's holistic effect implies self-payment in a way this pass's literal reading missed (e.g. an ability described as "spending" a resource without the word "cost"), the audit could rule a few more cards to keep a tribute — low risk, since the full audit is still required by D-03 regardless of this prediction |
| A2 | `snelle_blensen`'s "Free if countering a Frenssen" implies a real, otherwise-charged cost (i.e. should rule to keep a nonzero `mpCost`) rather than being vacuous flavor text on an already-free card | Critical Finding 1 | If ruled the other way (kept at 0, "Free if..." reinterpreted as flavor), no functional harm, but the card's text becomes internally inconsistent ("Free if X" implying "not free otherwise" when it always is) — same class of issue as Critical Finding 3 |
| A3 | Delluft/Dierenasiel's own card text will need a follow-up decision (rewrite vs. accept as vacuous-but-harmless) once the Piecie audit corrects their referenced Piecies to 0 | Critical Finding 3 | If not surfaced explicitly, the phase could ship "text wins" corrections everywhere except these 2 Places, leaving an inconsistency the phase was specifically designed to eliminate |
| A4 | No card outside the 46 already-nonzero-`mpCost` Piecies/Snelle Piecies needs new tribute language added (i.e. no currently-`mpCost:0` card's text implies it should have a cost) | Critical Finding 1 (implicit) | This research only deep-read the 46 nonzero-cost cards' text for a self-payment signal; it did not exhaustively re-read all 24 already-zero Piecies + 10 already-zero Snelle Piecies for a "should this actually cost something per its own text" signal in the reverse direction. Low risk (the phase's framing is about correcting overstated costs, not discovering understated ones) but worth a quick pass during the audit for completeness |

**If this table is empty:** N/A — see rows above.

## Open Questions

1. **Does `snelle_blensen`'s "Free if countering a Frenssen" phrasing rule as a real, self-paid
   cost or as vacuous flavor text?**
   - What we know: it's the only card besides Welloe Force whose text implies any cost concept
     at all; no other card in the 46-card nonzero pool has comparable conditional-cost language.
   - What's unclear: whether "Free if X" is meant to imply "and otherwise costs `mpCost` (50),
     self-paid" or is leftover flavor text from before this project's cost model existed at all.
   - Recommendation: rule this explicitly and interactively during the audit (D-03), same as the
     Places audit's per-card interactive rulings — don't let the planner guess.

2. **Should Delluft/Dierenasiel's own card text be rewritten once the Piecie audit lands, given
   their headline promise will likely become unconditionally true?**
   - What we know: both Places' "cost 0" clauses reference Piecie families (SUBSTANCE, PET)
     that the audit is very likely to rule fully free regardless of the Place being active.
   - What's unclear: whether Gandoe wants these 2 Places' text left as-is (harmless but
     logically vacuous once corrected) or rewritten to describe a different, still-meaningful
     effect.
   - Recommendation: raise this after COST-01's ruling table is final, not before — the decision
     is easier to make with the actual Piecie rulings in hand rather than this research's
     prediction of them.

3. **Does the audit need to check the reverse direction (currently-`mpCost:0` cards whose text
   might imply an *unstated* cost)?**
   - What we know: this research focused on the 46 cards with a nonzero data value; it did not
     exhaustively re-read all currently-zero-cost cards' text for implied-but-unstated payment.
   - What's unclear: whether any exist (a spot-check of a few zero-cost SUBSTANCE Piecies during
     this research found no such language, but it wasn't exhaustive across all 24 zero-cost
     Piecies + 10 zero-cost Snelle Piecies).
   - Recommendation: include a quick reverse-direction pass as part of COST-01/COST-02's audit
     for completeness, even though the expected finding is "none."

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.4 (unit) + Playwright (browser/card-behavior/sim) |
| Config file | `vitest.config.js` (unit), `playwright.config.*` (browser projects: `visual`, `sim`, `cards`) |
| Quick run command | `npm test` (vitest, unit-level) |
| Card-behavior run | `npm run test:cards` (Playwright `cards` project, workers=1) |
| Full suite / sim command | `npm run test:sim` (Playwright `sim` project, workers=1) |

**⚠ CLAUDE.md's `node --loader ts-node/esm src/simulation/run-once.ts` command does not exist**
(removed in the SSOT migration, per Phase 35's research) — use `npm run test:sim` instead.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COST-01/02 | Audit ruling table produced (no code yet) | N/A — docs only | N/A | N/A |
| COST-03 | Personal Quest audit confirms no tribute | N/A — docs only | N/A | N/A |
| COST-04 | Delluft/Dierenasiel text decision | N/A — docs, possibly a data edit | `npm test` | ❌ Wave 0 if data edit lands |
| COST-05 | New tribute-payer-picker helper (`showMosjeSelect` generalized) | UI unit / manual | Existing `modalManager.js` has no dedicated unit test file today (browser-DOM modal awaits are documented in `card-reference.md`/CLAUDE.md as accepted-untested per Phase 12 precedent) | ❌ Wave 0 — no existing modalManager unit test file to extend |
| COST-06 | Welloe Force rework — picker + affordability gate | card-registry (browser-driven) | `npm run test:cards` | ❌ Wave 0 — `piecie_welloe_force` has zero entries in `card-registry.js` today (confirmed by grep) |
| COST-07 | Any newly-ruled tribute card(s) | card-registry or engine unit | `npm run test:cards` / `npm test` | ❌ Wave 0 — depends on which card(s) the audit confirms |
| COST-08 | `mpCost` data corrections across ~46 cards | data/unit — a "no card silently regressed a real behavior" check | `npm test` (existing `tests/data/deck-balance.test.ts`-style static checks) | Partial — static deck-composition checks exist; no test currently asserts `mpCost` values match description text (would be a new, valuable regression guard) |
| COST-09 | Full sim + Ronald Kip stacking re-run | full suite | `npm run test:cards` (Ronald Kip entry, `card-registry.js:164-168`) + `npm run test:sim` | ✅ exists already |

### Sampling Rate
- **Per task commit:** `node --check` on touched files (extend CLAUDE.md's list to include
  `src/data/piecies.js`, `src/data/snellePiecies.js`, `src/abilities/piecieEffects.js`,
  `src/abilities/snelleEffects.js`, `src/ui/modalManager.js`) + `npm test`.
- **Per MP-touching card (any `mpCost` data change, any tribute charge):** additionally
  `npm run test:cards` (Ronald Kip stacking entry, plus new entries for any reworked/newly-ruled
  card) + `npm run test:sim`.
- **Phase gate:** full `npm test` + `npm run test:cards` + `npm run test:sim` green before
  `/gsd:verify-work` — this phase touches MP data across ~44-46 cards simultaneously, more than
  any single Phase 35 wave, so the full-suite gate matters more than usual here.

### Wave 0 Gaps
- [ ] No `card-registry.js` entry exists for `piecie_welloe_force` — needed to regression-guard
      both the "can afford" and "blocked, nobody can afford" paths (closes Critical Finding 4's
      test gap).
- [ ] No test currently asserts that a card's `mpCost` data value matches what its `description`
      text says about payment — the audit's whole point is to fix this exact class of drift, so
      a new static/data test (`mpCost > 0` implies the description contains payment language, or
      vice versa) would be a durable regression guard against this bug recurring for future cards.
- [ ] `src/ui/modalManager.js` has no dedicated unit test file — the new tribute-picker function
      will be covered the same (accepted, documented) way Phase 12's UI-gated interactions were:
      browser-DOM modal awaits verified via Playwright `test:cards`/manual checkpoint, not vitest.

## Security Domain

Not applicable — this phase touches only internal game-state transform functions in a
client-side prototype with no new user input, auth, session, or network surface. Same
conclusion as Phase 35's research.

## Project Constraints (from CLAUDE.md)

- **Single source of truth**: only `src/data/*.js`, `src/abilities/*.js`, `src/engine/*.js`,
  `src/ui/*.js` are live. Never read/scan/edit `/_archive/`.
- **"When in doubt, stop and ask"**: this research surfaced 3 genuine open questions (Blensen's
  ruling, Delluft/Dierenasiel's text fate, the reverse-direction audit check) — do not let the
  planner or executor silently resolve these.
- **TDD required**: failing test → implement → `node --check` + `npm test` → commit, per card.
- **Full verification sequence before every commit**: `node --check` on the CLAUDE.md file list
  (extended per Validation Architecture above), `npm test`, and for MP-touching changes, the
  Ronald Kip stacking test + full sim.
- **MP five-grid rule**: every `mpCost` value in the current data (5/10/15/20/25/40/50) is
  already a multiple of 5; any newly-ruled tribute amount must stay on this grid.
- **Negative MP never persists**: directly implicated by Common Pitfall 4/Critical Finding 4 —
  a tribute payment must never be allowed to push a Mosje negative; D-06's "block entirely if
  unaffordable" is this project's existing ruling applied to a new mechanic, not a new rule.
- **Discard pile / Graveyard rule**: not directly implicated — no card in scope moves cards to
  the graveyard as part of its cost payment.
- **One function per file / small files**: not directly applicable — `piecieEffects.js`
  (1000+ lines) and `snelleEffects.js` are existing large multi-function files that are this
  project's established convention for this card type; follow the existing per-card function
  idiom rather than splitting into new files.
- **Card definitions are pure data**: `mpCost`/`description` edits in `piecies.js`/
  `snellePiecies.js` must stay data-only; all charging logic belongs in the `abilities/` files.
- **Build reusable UI components once**: directly actionable here — generalize `showMosjeSelect`
  rather than building a bespoke tribute modal (D-05, Architecture Pattern 2 above).

## Sources

### Primary (HIGH confidence — direct code read/introspection, this session)
- `src/data/piecies.js` — full file read + live `node --input-type=module` introspection (70
  total cards, 36 non-zero `mpCost`, full description text extracted for all 36)
- `src/data/snellePiecies.js` — full file read + introspection (20 total, 10 non-zero `mpCost`)
- `src/data/places.js` — full file read + introspection (21 total, 0 have an `mpCost` field;
  confirmed only Delluft/Dierenasiel mention any cost language, both about other cards)
- `src/data/quests.js` — full-file grep + introspection (46 total quests, 6 `questType:
  "PERSONAL"`, 0 have an `mpCost` field, 0 matches for cost/pay/tribute/sacrifice/spend across
  every quest's `description` and `requirementDescription`)
- `src/abilities/piecieEffects.js` — `effect_welloe_force` (lines 804-816), local `applyDamage`
  helper (lines 29-42), full-file structural read
- `src/engine/turnManager.js` — `playPiecie` (559-627), `playPersonalQuest` (634-668),
  `activatePersonalQuest` (675+), `activatePiecie` (781-943, full read, including the single
  effect-fn dispatch point at 878-881), `playSnellie` (958-1031, full read, dispatch point at
  1005-1007), `useMosjeAbility`'s no-generic-cost-enforcement comment (now at lines 1147-1149 —
  drifted from the 1133-1135 line number cited in `36-CONTEXT.md`/Phase 35 research, due to
  Phase 35's own commits landing on this branch since; the comment's content is unchanged)
- `src/ui/modalManager.js` — `showOptionSelect` (648-689), `showMosjeSelect` (733-765, the reuse
  template for D-05), Welloe Force's existing target-picker call site (2816-2845)
- `src/engine/roundToFive.js` — full file read (confirms the exact `Math.round(n/5)*5` rounding
  rule referenced in CLAUDE.md)
- `.planning/phases/36-piecie-snelle-piecie-place-personal-quest-mp-cost-model-rede/36-CONTEXT.md`
  — read in full, all decisions/discretion/deferred sections
- `.planning/phases/35-places-text-reconciliation/35-RESEARCH.md` — read in full, Critical
  Finding 1 (the direct origin of this phase) + the Welloe Force precedent details
- `.planning/audits/2026-07-14-places-text-audit.md` — read in full, the ruling-table format
  precedent this phase's audit should follow
- `.planning/phases/35-places-text-reconciliation/35-CONTEXT.md` — grepped to confirm D-09's
  "action required" (updating PLACE-06/07 to drop the mpCost self-charge clause) was already
  completed in a later session, not still pending as `36-CONTEXT.md`'s D-09 note suggests
- `.planning/ROADMAP.md` — grepped, confirms the same D-09 update landed (Phase 35's PLACE-06/07
  rows explicitly say "mpCost clause moved to Phase 36")
- `.planning/STATE.md` — read in full, confirms Phase 35 is fully COMPLETE (8/8 waves) and
  Phase 36 is next, context-locked, 0 plans executed
- `.planning/REQUIREMENTS.md` — read in full; contains only earlier-phase (Phase 9/pre-9)
  requirement rows, nothing yet for Phase 36
- `tests/ui/cards/card-registry.js` — grepped for `welloe_force`/`affoe`/`bowie_stormey`/
  `bong_hit_demolition` to confirm the Wave 0 test-coverage gap for Welloe Force specifically
- `package.json` — confirmed live npm scripts (`test`, `test:cards`, `test:sim`)
- `.planning/config.json` — does not exist; `nyquist_validation` and `security_enforcement`
  therefore treated as enabled (absent = enabled, per instructions)

No Context7/WebSearch/WebFetch lookups were performed — this phase has zero external library or
framework surface; all research was internal codebase investigation, identical in kind to
Phase 35's research approach.

## Metadata

**Confidence breakdown:**
- Standard stack / architecture: N/A (no external stack — internal engine only)
- Card inventory + text (Critical Findings 1-3): HIGH — every count and every quoted description
  was pulled directly from the live data arrays this session via `node --input-type=module`
  introspection, not estimated or sampled
- Welloe Force bug findings (Critical Finding 4): HIGH — verified by direct code read of both
  the effect function and the `applyDamage` helper it calls
- Open Questions (Blensen ruling, Delluft/Dierenasiel text fate, reverse-direction check): these
  are genuine judgment calls the audit process (D-03) is designed to make interactively — flagged
  rather than guessed, per CLAUDE.md's "stop and ask" directive

**Research date:** 2026-07-16
**Valid until:** Until this branch's code changes further — this research is tied to the exact
current state of `card/full-game-text-audit` (post-Phase-35-completion). If any Piecie/Snelle
Piecie/Place/Quest data changes land before COST-01/02 execute, re-verify the counts and text
quotes above before trusting them literally; the described *methodology and architecture
recommendation* will remain valid regardless of any such drift.
