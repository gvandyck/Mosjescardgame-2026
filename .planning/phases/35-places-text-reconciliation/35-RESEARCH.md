# Phase 35: Places Text-vs-Engine Reconciliation (Round 1) - Research

**Researched:** 2026-07-14
**Domain:** Internal game-engine reconciliation (imperative `.js` engine, no external libraries)
**Confidence:** HIGH (all findings verified by direct code read + exhaustive grep against the live `.js` engine; no external/library research was needed — this phase touches only project-owned code)

## Summary

This is a 12-card, mostly-mechanical reconciliation batch. Every target behavior is already
fully specified in `.planning/audits/2026-07-14-places-text-audit.md` (the RULINGS section) —
this research's job was to pinpoint exact current code, confirm the ruling record's premises
against the live engine, and surface anything the audit missed. Three things the audit missed
are important enough to change how the planner sequences and scopes tasks:

1. **PLACE-06/PLACE-07's "hook mpCost" premise is false.** There is no generic MP-cost-charging
   mechanism for Piecies anywhere in the engine. `mpCost` is a pure UI display field (chip text:
   "Free" / "N MP") — it is never deducted when a Piecie is played or activated. The one Piecie
   that narratively "pays a cost" (Welloe Force, 40 MP) does so via a hardcoded `applyDamage`
   call inside its own effect function, not by reading `cardDef.mpCost`. Implementing "SUBSTANCE/PET
   Piecies cost 0 MP" as a waiver of an existing charge is not possible, because nothing is
   currently charged. See **Critical Finding 1**.

2. **Bank Chilling and Coert's Caravan currently never fire in the live game**, independent of
   the audit's "loop all slots" / "+15 Coert works" findings. Their data `trigger` field is
   `"TURN_START"`, but the only turn-start dispatch call in the engine
   (`applyPlaceEffectsOnStart`) always passes `'START_PHASE'` — a string that never matches
   `'TURN_START'`. `resolvePlaceEffect`'s trigger guard silently no-ops both cards every turn.
   No live test exercises this end-to-end (only a static deck-composition check exists), which
   is why nobody noticed. See **Critical Finding 2**.

3. **Skiffa has a third, wholly undocumented behavior the audit never found**: a dice-reroll
   grant (`getSkiffaRerolls` in `main.js`) for ARTISTIC Mosjes with `creative >= 3` while Skiffa
   is active, completely unrelated to the discard/-15 theme the audit reviewed. Since D-10
   reworks Skiffa into a Social-quest dice-bonus card, this pre-existing (and separately
   undocumented) quest-dice mechanic will sit right next to the new one and needs an explicit
   keep/replace decision. See **Critical Finding 3**.

None of these findings block planning — they just mean PLACE-01 needs one extra one-line fix
(trigger string), PLACE-06/07 need a scoping decision before implementation (flagged as an
Assumption/Open Question below, not silently resolved), and PLACE-10 needs one extra
old-code disposition decision. Everything else in the ruling record checks out exactly as
written: all cited file:line references in the audit and CONTEXT.md were verified against the
current file state and are accurate (with the two exceptions noted: `turnManager.js:97` does
not exist as described — see Finding 1 — and the trigger-string bug in Finding 2 is new
information the audit didn't have).

**Primary recommendation:** Implement in the ruling record's suggested order (bugs → text-wins
→ reworks → Void last), but insert a trigger-string fix into PLACE-01's task, and route
PLACE-06/PLACE-07 through a scoping checkpoint with Gandoe before writing their tasks (see
Assumptions Log A1). All other 10 cards can be planned directly from the ruling record + the
per-card sections below.

## Architectural Responsibility Map

Single-tier project (no browser/server split — this is a client-side prototype with one game
loop). All capabilities in this phase live in the same tier:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Place effect logic (MP gain/loss, dice bonus, cost waiver) | Engine (`src/abilities/placeEffects.js`, `src/engine/*.js`) | — | Pure state-transform functions; UI never computes game logic |
| Place trigger dispatch (when an effect fires) | Engine (`src/engine/turnManager.js` `applyPlaceEffectsOn*` + `resolvePlaceEffect`) | — | Central dispatcher; single source of truth for "when" |
| Card text (`description` field) | Data (`src/data/places.js`) | — | Pure data, no logic (per CLAUDE.md) |
| Per-card behavior tests | Test (`tests/ui/cards/` card-test-library, `tests/engine/`) | — | TDD gate before each commit |
| Any new player-facing action (e.g. Synergy Chamber waiver trigger) | UI (`src/main.js`, `src/ui/modalManager.js`) | Engine | Only needed for PLACE-11 — a genuinely new player action, not a passive tick |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLACE-01 | Bank Chilling — loop all active slots, +15 Social ★★+ | See Critical Finding 2 (trigger dispatch bug — must also fix `trigger` field) + Card 1 below |
| PLACE-02 | Obby #1 — loop all active slots, +20/-10 Physical/Resilient ★★+ | Card 2 below — trigger dispatch confirmed correct (`ON_QUEST`) |
| PLACE-03 | Arcade — loop all active slots, +15 Technical ★★+ on success | Card 3 below — trigger dispatch confirmed correct (`ON_QUEST`) |
| PLACE-04 | De Box — extend +15 to Michelle/Tuk via `id.includes('tuk')`, both-together bonus, fix "Toennoe" logs | Card 4 below |
| PLACE-05 | Drain Zone — implement ATTACK +10 damage, remove untexted +5-all-gains | Card 5 below |
| PLACE-06 | Delluft — implement "SUBSTANCE Piecies cost 0 MP this turn" | Card 6 below — **Critical Finding 1 blocks literal "hook mpCost" implementation; needs scoping decision** |
| PLACE-07 | Dierenasiel — implement "PET Piecies cost 0 MP", drop +25% clause | Card 7 below — **same Critical Finding 1 blocker** |
| PLACE-08 | Coert's Caravan — REPLACE, trigger → END_PHASE, all Mosjes -10 except Coert | Card 8 below — trigger change incidentally fixes Critical Finding 2's dead-dispatch bug |
| PLACE-09 | Digital Gaming Stop — DIGITAL-EQUIPMENT Piecies +10 MP while active | Card 9 below |
| PLACE-10 | Skiffa — REWORK, trigger → ON_QUEST, Social quests +2 dice | Card 10 below — **Critical Finding 3: disposition `getSkiffaRerolls` in main.js** |
| PLACE-11 | Synergy Chamber — REWORK, once/turn synergy-without-partner waiver | Card 11 below — full partner-gated-consumer enumeration included |
| PLACE-12 | The Void — NEW MECHANIC, one-card-activation-per-turn cap | Card 12 below — full play/activate path enumeration included |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 Bank Chilling** — loop ALL active slots; every Social ★★+ Mosje +15 (was first-slot only).
- **D-02 Obby #1** — loop ALL active slots; every Physical/Resilient ★★+ Mosje +20 success / -10 fail.
- **D-03 Arcade** — loop ALL active slots; every Technical ★★+ Mosje +15 on success.
- **D-04 De Box** — extend +15 to any `id.includes('michelle')||id.includes('tuk')` (`mosje_michelle`/Iron Tuk, `mosje_tuk_healer`, `mosje_tuk_architect`); extend the both-together +10 bonus accordingly; fix cosmetic "Toennoe" logs.
- **D-05 Drain Zone** — keep lowest -10; implement "ATTACK Piecies deal +10 damage"; REMOVE the untexted +5-to-all-gains (`mpManager.js:38`).
- **D-06 Delluft** — keep draw-1; implement "SUBSTANCE Piecies cost 0 MP this turn" (hook `mpCost`).
- **D-07 Dierenasiel** — implement "PET Piecies cost 0 MP" (hook `mpCost`); DROP the +25% protection clause AND its typo'd inert code (`dienasielActive` vs `dierenasielActive`, `mpManager.js:198`).
- **D-08 Coert's Caravan** — REPLACE. Trigger `TURN_START`→`END_PHASE`. New: "End of turn, all Mosjes lose 10 MP except Coert variants" (immune = `id.includes('coert')`). Drop the +15 buff and the inert `freePiecieActivationAvailable` write.
- **D-09 Digital Gaming Stop** — REWORK (booster-only). New: "DIGITAL-EQUIPMENT Piecies give +10 MP while active." Drop auto-succeed + dead `questAutoSuccess`.
- **D-10 Skiffa** — NEW DESIGN. Trigger `END_PHASE`→`ON_QUEST`. New: "Social quests: all players get +2 to the dice roll." Drop the SUBSTANCE/discard/-15 theme.
- **D-11 Synergy Chamber** — REWORK. New: "Once per turn, activate a Mosje's synergy ability without its partner on field." Drop the 3 undocumented bonuses (cost-5/dice+1/duration+1) + their consumers.
- **D-12 The Void** — NEW MECHANIC. New: "While active, each player may activate only ONE card per turn (Snelle/Piecie/Personal Quest/Place/Mosje)." Remove the -15 drain + the untexted quest-MP-nullify (`questLogic.js:338`). **Highest risk — implement LAST.**

### Claude's Discretion
- Exact test shapes; per-card commit granularity; internal helper naming — follow existing effect-file idioms.
- Whether a shared "affect all qualifying Mosjes" helper is worth extracting for D-01/02/03 (they share the loop-all pattern).

### Process (locked)
- One card at a time, TDD: failing test → implement → `node --check` + `npm test` → commit per card (reconciliation-todo precedent).
- MP-touching cards (D-01,02,03,04,05,08,09) → re-run Ronald Kip stacking test + full sim.
- Suggested order: bugs (D-01→04) → text-wins (D-05→07) → reworks (D-08→11) → The Void (D-12) last.

### Deferred Ideas (OUT OF SCOPE)
- Full audit rounds 2+: Piecies, Snelle Piecies, remaining Mosjes (`2026-07-13-full-game-ability-text-audit.md`).
- Alyssa↔Jisca synergy design (`2026-07-12-alyssa-jisca-synergy-design.md`).
</user_constraints>

## Project Constraints (from CLAUDE.md)

- **Single source of truth**: only `src/data/*.js`, `src/abilities/*.js`, `src/engine/*.js`,
  `src/ui/*.js` are live. Never read/scan/edit `/_archive/` (dead declarative TS engine).
- **TDD required**: failing test → implement → `node --check` + `npm test` → commit, per card.
- **Full verification sequence before every commit**: (1) `node --check` on the touched UI/main
  files list in CLAUDE.md, (2) `npm test`, (3) for MP-touching changes, re-run the Ronald Kip
  stacking test + full sim.
- **⚠ Stale CLAUDE.md instruction**: CLAUDE.md's simulation command
  (`node --loader ts-node/esm src/simulation/run-once.ts`) **no longer exists** —
  `src/simulation/` was removed in the SSOT migration. The live equivalent is
  `npm run test:sim` (Playwright `sim` project — see Validation Architecture below). Use this
  instead; do not attempt the CLAUDE.md command.
- **Discard pile rule**: not applicable to this phase (no card leaves play as part of any of
  the 12 rulings).
- **MP five-grid rule**: all target MP values in the ruling record (10/15/20/25) are already
  multiples of 5. The one place-file percentage scaling in scope (Dierenasiel's +25%) is being
  **removed**, not added — no new `roundToFive` call sites are needed by this phase.
- **One function per file / small files**: not directly applicable — `placeEffects.js` is an
  existing large multi-function file (683 lines) that is the established convention for this
  card type; follow its existing per-card function idiom rather than splitting into new files.
- **Card definitions are pure data**: `description`/`trigger`/`tags` edits in `places.js` must
  stay data-only; all logic changes belong in `placeEffects.js`.

## Critical Finding 1 — `mpCost` on Piecies is never charged anywhere (blocks literal "hook mpCost")

**Confidence: HIGH — verified by exhaustive grep across `src/**/*.js` for every read site of `mpCost`.**

All non-display usages of `mpCost` were enumerated:

| File | Line(s) | What it does |
|------|---------|--------------|
| `src/data/piecies.js` / `snellePiecies.js` | (data) | Declares `mpCost` per card — 0 for most, non-zero for ~35 cards |
| `src/main.js:704` | display | `metaLabel: Cost: ${def.mpCost} MP — ...` (discard-choice modal chip text) |
| `src/ui/modalManager.js:467` | display | `'Free'` / `'${card.mpCost} MP'` chip |
| `src/ui/packOpeningOverlay.js:122` | display | same chip pattern |
| `src/deck-builder.js:291` | display | same chip pattern |
| `src/abilities/piecieEffects.js:633` | refund | `discarded.mpCost` refunded to a Mosje when a card is force-discarded (Bagga of Greed-style flow) — a bonus, not a payment |

**No file — not `turnManager.js` (`playPiecie`, `activatePiecie`, `useMosjeAbility`), not
`mpManager.js` — ever deducts `mpCost` from a Mosje's MP when a Piecie is played or activated.**
`useMosjeAbility`'s own code comment confirms this pattern is by design for Mosje *ability* costs
too: *"the engine does NOT enforce abilityCost before calling fn(). Each individual ability
function is responsible for checking/deducting its own cost."* (`turnManager.js:1133-1135`).
Individual effect functions that narratively "cost" MP self-implement it with a hardcoded
`applyDamage()` call matching their own card's stated cost — e.g. `effect_welloe_force`
(`piecieEffects.js:804-816`) calls `applyDamage(player.activeSlots[si], 40)` to "pay" its
40 MP cost. This is a per-card idiom, not a generic engine hook.

Checked specifically for the two card families this phase needs to zero out:
- **PET Piecies** (Bowie & Stormey, Tony, Gekke Vogels, KatjeGang, ViannaPoes — all `mpCost: 15`):
  their effect functions (`piecieEffects.js:839-900`) only push a `MP_LOSS_HALVED` status effect.
  None of them call `applyDamage` for their own cost. **No cost is ever paid by these cards today.**
- **SUBSTANCE Piecies**: most are `mpCost: 0` already (Grammetje Pieter, Dikke Jonko, Stripje
  Bennies, Tikker, Straffoe, Larry/Zegeltje). Affoe (`mpCost: 5`) and Bong Hit Demolition
  (`mpCost: 10`) are the only non-zero ones, and neither self-charges in its effect body either.

**Consequence for planning:** the ruling record's parenthetical "(hook `mpCost`)" for PLACE-06
and PLACE-07 describes a mechanism that does not exist. There is no generic charge to waive.
Two honest paths forward, neither of which is "just hook the existing thing":

1. **Build a new, scoped cost-charging step** inside `activatePiecie` (and/or `playPiecie`,
   depending on when "cost" should apply) that charges `mpCost` for every Piecie henceforth,
   then exempt SUBSTANCE (Delluft active) / PET (Dierenasiel active) from it. This is a genuine
   behavior change for **every other Piecie in the game** (all ~35 non-zero-cost Piecies would
   start actually costing MP for the first time), which is explicitly bigger than the "small,
   mostly-independent surgical changes" scope this phase is meant to be, and would need its own
   balance-impact sim pass across every deck, not just the 2 touched Places.
2. **Scope it down to only the interaction with these 2 Places**: introduce a narrow
   `pieciesCostFreeThisTurn` guard that only matters if/when a future phase adds real Piecie
   costs, i.e. implement the *flag* (state field + the "would exempt" logic) but accept it has
   no observable effect today since nothing charges anything. This satisfies "text wins"
   literally but produces a card that is currently a no-op in practice — arguably worse than
   the current bug, since a player reading "SUBSTANCE Piecies cost 0 MP this turn" would
   reasonably expect *other* Piecies to cost MP, which none of them do.

**Recommendation:** this needs a scoping decision from Gandoe before PLACE-06/PLACE-07 tasks are
written — do not have the planner silently pick option 1 or 2. See Assumptions Log A1 and Open
Questions.

## Critical Finding 2 — Bank Chilling and Coert's Caravan never fire (trigger-string dispatch bug)

**Confidence: HIGH — verified by exhaustive grep of every call site of `resolvePlaceEffect` and every literal use of `'TURN_START'` in `src/`.**

`resolvePlaceEffect(gameState, triggerPhase, context)` (`placeEffects.js:564`) only runs a
Place's effect function when `placeDef.trigger === triggerPhase` (strict equality,
`placeEffects.js:571`). The only call site that fires at the start of a turn is:

```js
// turnManager.js:1308-1312
export function applyPlaceEffectsOnStart(gameState, playerId) {
  let state = gameState;
  state = placeEffects.resolvePlaceEffect(state, 'START_PHASE', { playerId });
  ...
}
```

This is called from `startTurn` at `turnManager.js:278`. **`'TURN_START'` is never passed as a
`triggerPhase` argument anywhere in the live `src/` tree** — the only occurrences of the string
`'TURN_START'` in live code are the two data declarations themselves:

- `place_bank_chilling` — `trigger: "TURN_START"` (`places.js:31`)
- `place_coerts_caravan` — `trigger: "TURN_START"` (`places.js:156`)

Both therefore fail the `placeDef.trigger !== triggerPhase` guard every single turn and their
effect functions (`effect_bank_chilling`, `effect_coerts_caravan`) **never execute in the live
game.** Two other Places that also want a "start of turn" hook (`place_boxing_ring`,
`place_tesla`) correctly use `trigger: "START_PHASE"` and fire normally — this is the
established-and-working string for this trigger point, confirmed by their own comments
("Turn Start (START_PHASE)").

No live test exercises this end-to-end: `tests/data/deck-balance.test.ts:259-260` only checks
that `place_bank_chilling` is present in a deck's card list (static data check), not that its
effect fires. This is why the bug went unnoticed by both the original implementation and the
2026-07-14 audit (which read the effect function bodies but did not runtime-trace the dispatch
path).

**Consequence for planning:**
- **PLACE-01 (Bank Chilling)** must include, in addition to the "loop all slots" fix, changing
  `trigger: "TURN_START"` → `trigger: "START_PHASE"` in `places.js:31`. Without this the
  loop-all-slots fix will pass a unit test that calls `effect_bank_chilling` directly (bypassing
  the dispatcher) but will remain invisible in actual play — a false-green test. The task must
  test through `resolvePlaceEffect`/`startTurn`, not just the raw effect function, to catch this
  class of bug in the future.
- **PLACE-08 (Coert's Caravan)** is unaffected by this bug going forward, because the ruling
  already changes its trigger to `END_PHASE` (which correctly dispatches via
  `applyPlaceEffectsOnEnd` → `resolvePlaceEffect(state, 'END_PHASE')`, `turnManager.js:1298-1301`).
  Worth noting for risk-assessment: the audit's "Coert +15 ✓" claim was **not actually true in
  live play** — the old bonus was dead code same as Bank Chilling's. This makes PLACE-08 lower
  regression-risk than the ruling record implies (there was no working behavior to preserve;
  only the data/description needs to change, no live behavior is being "replaced" from a
  player's perspective).

## Critical Finding 3 — Skiffa has an undocumented third mechanic not in the audit

**Confidence: HIGH — verified by direct code read.**

`getSkiffaRerolls(gameState, playerId)` (`main.js:3338-3346`) is consumed at 4 call sites in
`main.js` (~1252, ~1474, ~2489, ~2642) as part of the quest-dice-roll bonus stack alongside
`questPrepBonus` and `placeDiceBonus`. It grants 1-2 rerolls to ARTISTIC Mosjes with
`traits.creative >= 3` while `place_skiffa` is the active Place — entirely independent of the
discard/-15-MP theme the audit reviewed (`effect_skiffa` in `placeEffects.js`). This function
was not mentioned anywhere in the audit's Skiffa row.

D-10's rework ("Social quests: all players get +2 to the dice roll") is a *different* dice-bonus
shape (flat +2 for any player attempting a Social quest, vs. this function's creative-Mosje
reroll grant). Since the ruling doesn't mention `getSkiffaRerolls`, the planner must decide its
disposition explicitly:
- **Remove it** (cleanest — matches "drop the SUBSTANCE/discard/-15 theme entirely" in spirit,
  since this was also part of the pre-rework Skiffa design even though untexted), or
- **Keep it alongside** the new +2 dice bonus (a player could get both a reroll AND +2, which
  the new card text doesn't mention and may be unintended stacking).

**Recommendation:** remove `getSkiffaRerolls` and its 4 call sites as part of PLACE-10 — it's an
untexted mechanic exactly like the other "requires UI validation, never wired to card text"
problems this whole phase exists to clean up, and keeping it would silently violate the new
card's own "all players get +2" text (implies a flat, universal bonus — not creative-Mosje-gated
rerolls layered on top).

---

## Per-Card Implementation Detail

Each section gives: exact current function + line, exact target behavior, and reuse notes. Full
rationale for each ruling is in `.planning/audits/2026-07-14-places-text-audit.md` — this table
is a pointer into the file, not a replacement for reading it.

### Card 1 — PLACE-01 Bank Chilling
- **Data:** `places.js:27-41`. `trigger: "TURN_START"` **must change to `"START_PHASE"`** (Critical Finding 2).
- **Effect fn:** `effect_bank_chilling(gameState, playerId)`, `placeEffects.js:95-113`. Currently: `findIndex(first active slot)` → single Mosje, `social >= 2` → `+15`.
- **Target:** loop every active slot for the player (`for (const mosje of player.activeSlots)`), apply `+15` to each with `social >= 2`.
- **Reuse:** copy the loop shape from `effect_the_gym` (`placeEffects.js:34-60`) or `effect_zo_is_natuur` (`placeEffects.js:189-201`) — both already do `for (const playerId of Object.keys(state.players)) { for (const mosje of player.activeSlots) { ... } }`. Note Bank Chilling is single-player-scoped (`effect_bank_chilling(gameState, playerId)` takes a specific `playerId`, unlike the two END_PHASE examples which loop `Object.keys(state.players)`) — only the inner slot loop needs to change, not the outer structure.
- **Test through the dispatcher**, not just the raw function, to prove the trigger fix actually surfaces the fix in play (see Critical Finding 2).

### Card 2 — PLACE-02 Obby #1
- **Data:** `places.js:77-91`, `trigger: "ON_QUEST"` — dispatch confirmed correct (`applyPlaceEffectsOnQuest` → `resolvePlaceEffect(state, 'ON_QUEST', ...)`, `turnManager.js:1322-1335`).
- **Effect fn:** `effect_obby_1(gameState, questCard, didSucceed)`, `placeEffects.js:141-162`. Currently: single `findIndex(first active slot)`.
- **Target:** loop every active slot; for each with `physical >= 2 || resilient >= 2`: `+20` on success, `-10` (via `applyDamage`) on failure.
- **Reuse:** same loop-all pattern as Card 1.

### Card 3 — PLACE-03 Arcade
- **Data:** `places.js:92-106`, `trigger: "ON_QUEST"` — dispatch confirmed correct.
- **Effect fn:** `effect_arcade(gameState, questCard, didSucceed)`, `placeEffects.js:168-183`. Currently: single `findIndex(first active slot)`.
- **Target:** loop every active slot; for each with `technical >= 2 && didSucceed`: `+15`.
- **Reuse:** same loop-all pattern as Cards 1-2.

**Discretion note (D-01/02/03 shared helper):** CONTEXT.md leaves it to discretion whether a
shared "affect all qualifying Mosjes" helper is worth extracting. Given all three effect
functions have slightly different qualifying conditions (single-trait-threshold, dual-trait-OR,
success/fail branching) and different bonus amounts, a literal shared helper would need a
predicate + amount callback — reasonable to extract but not required; `effect_the_gym`'s inline
loop is the project's established idiom for "loop and branch per Mosje," so inlining is
consistent with existing style even without extraction.

### Card 4 — PLACE-04 De Box
- **Data:** `places.js:319-333`, `trigger: "END_PHASE"` — dispatch confirmed correct.
- **Effect fn:** `effect_de_box(gameState)`, `placeEffects.js:492-518`. Currently: `id.includes('gandoe')` → `+20`; `id.includes('michelle')` → `+15`; both-together → `+10` each; **log text says "Toennoe" (cosmetic bug, should say "De Box")**.
- **Target:** extend the michelle branch condition to `id.includes('michelle') || id.includes('tuk')` (matches `mosje_michelle`, `mosje_tuk_healer`, `mosje_tuk_architect` — verified these are the only 3 live IDs matching `'michelle'` or `'tuk'` via grep of `mosjes.js`); both-together bonus already triggers off the same `gandoeSlot`/`michelleSlot` local variables so it extends automatically once the condition above is widened (no separate change needed — just rename the local var if desired for clarity, e.g. `michelleSlot` → `bonusSlot`). Fix both `console.log('[ABILITY] Toennoe: ...')` strings (lines 504, 508, 514) to say `'De Box'`.
- **GANDOE ids confirmed:** `mosje_gandoe_wizard`, `mosje_gandoe_destroyer` (both match `includes('gandoe')`).

### Card 5 — PLACE-05 Drain Zone
- **Data:** `places.js:197-211`, `trigger: "END_PHASE"` — dispatch confirmed correct.
- **Effect fn:** `effect_drain_zone(gameState)`, `placeEffects.js:347-373`. Currently: finds lowest-MP Mosje across all players, `-10` via `applyDamage`. No ATTACK-Piecie bonus exists anywhere.
- **Untexted extra to remove:** `mpManager.js:37-40` — inside `gainMP`, `if (placeId === 'place_drain_zone') { gainAmount += 5; }` — applies to ALL MP gains while Drain Zone is active, completely unrelated to card text. Delete this block.
- **Target — new "ATTACK Piecies deal +10 damage" implementation:** the natural hook point is `activatePiecie` in `turnManager.js` (~lines 832-861), which already has `const isAttack = knownCardDef.tags?.includes('ATTACK');` computed for the Perfect Dodge/Counter Strikka negation checks. An ATTACK Piecie's actual damage is applied inside its own effect function (e.g. `effect_affoe` — opponent `-15`), not by a generic "ATTACK deals damage" engine step, so **the +10 bonus cannot be added generically in `activatePiecie`** — it has to be added inside each ATTACK-tagged Piecie's effect function (e.g. `effect_affoe`, `effect_super_saiyan_mos`, `effect_te_hard_gaan`, `effect_momentum_diefje`, `effect_dikke_taks`, `effect_kleine_taks`, `effect_jantje_jantje...`, `effect_continuous_assault`, `effect_harde_didde`, `effect_mp_hemorrhage`, `effect_klaar_met_jou` — the full `subtype: "ATTACK"` list in `piecies.js`), each adding `+10` to its own `applyDamage(...)` call when `state.activePlace === 'place_drain_zone'`. **This is out of the stated "small, mostly-independent" scope of a single Place card** — it touches ~11 separate Piecie effect functions across `piecieEffects.js`, all outside `placeEffects.js`. Flag this as a scope note for the planner (see Open Questions) — it may be reasonable to implement as a single shared helper (`applyAttackDamage(mosje, baseAmount, gameState)` that adds the Drain Zone +10 internally) called from all ATTACK effect functions, rather than 11 inline `if` checks, but that touches Round-2-scope files (Piecies are explicitly out of scope for this phase per CONTEXT.md). **Recommend confirming with Gandoe whether PLACE-05's ATTACK bonus is truly in-scope for a Places-only phase**, since its implementation necessarily edits Piecie effect code.
- MP-touching → re-run Ronald Kip stacking test + sim (already required by ruling).

### Card 6 — PLACE-06 Delluft
- **Data:** `places.js:227-241`, `trigger: "END_PHASE"` — dispatch confirmed correct.
- **Effect fn:** `effect_delluft(gameState)`, `placeEffects.js:391-404`. Draw-1 already correct; SUBSTANCE cost-0 clause is an unimplemented comment only.
- **Blocked by Critical Finding 1** — see above. Needs scoping decision before task-writing.

### Card 7 — PLACE-07 Dierenasiel
- **Data:** `places.js:242-256`, `trigger: "PASSIVE"` — dispatches once on activation via `activatePlace` (`turnManager.js:748-751`, `if (cardDef.trigger === 'PASSIVE') { state = placeEffects.resolvePlaceEffect(state, 'PASSIVE'); }`).
- **Effect fn:** `effect_dierenasiel(gameState)`, `placeEffects.js:411-416`. Sets `state.dienasielActive = true` (typo — note the missing "r").
- **Consumer with the typo mismatch:** `mpManager.js:198` reads `state.dierenasielActive` (correct spelling) inside `loseMP`, applying a `* 0.75` reduction via `roundToFive`. Because the setter (`dienasielActive`) and reader (`dierenasielActive`) are spelled differently, this 25%-loss-reduction consumer **never actually triggers today** — confirms the audit's "entirely inert" finding independently.
- **Also touches:** `turnManager.js:1154`, inside `useMosjeAbility` — `const dierenasielWaiver = gameState.dierenasielActive === true;` (correct spelling, also dead due to the same typo) — currently only logs a message, does not gate anything (per the code comment: "STUB-09: engine-level guard documented here. UI ... must also check ... before displaying the disabled state" — this was Phase 12's placeholder, never completed).
- **Target:** drop the +25% clause and its typo'd dead code entirely (both the `dienasielActive` setter and the `mpManager.js:198` / `turnManager.js:1154` readers). Implement "PET Piecies cost 0 MP" — **blocked by Critical Finding 1**, same as Card 6.

### Card 8 — PLACE-08 Coert's Caravan
- **Data:** `places.js:152-166`. Change `trigger: "TURN_START"` → `trigger: "END_PHASE"` per ruling (this single change also resolves Critical Finding 2's dead-dispatch bug for this card — no separate fix needed, unlike Card 1).
- **Effect fn:** `effect_coerts_caravan(gameState)`, `placeEffects.js:249-273`. Currently: per-player loop, `id.includes('coert')` → `+15`; if any Coert present, sets `player.freePiecieActivationAvailable = true` (unrelated inert-ish flag — actually IS consumed once, at `turnManager.js:797-804` inside `activatePiecie`, to skip... nothing meaningful; the ruling calls it "inert" and directs removal regardless).
- **Target:** replace entirely. New body: loop `Object.keys(state.players)` (this now needs to become an all-players loop since it moves to END_PHASE, matching the shape of `effect_the_gym`/`effect_zo_is_natuur`/`effect_skiffa`/`effect_the_void`/`effect_drain_zone`/`effect_delluft` — all END_PHASE effects loop every player). For each active Mosje: `-10` via `applyDamage`, except when `id.includes('coert')` (immune). Confirmed live Coert ids matching this check: `mosje_fps_coert` *(referenced in CONTEXT.md but not found by exact-id grep — verify this id exists in `mosjes.js` before writing the task; the 3 confirmed-present Coert ids are `mosje_coert_tech`, `mosje_coert_kasteluck`, `mosje_coert_kastelein`)*, plus any future Coert variant automatically via the substring match.
- **Reuse:** loop shape from `effect_the_void` (`placeEffects.js:207-219`) is the closest existing precedent — same "all Mosjes lose N MP" shape, just add the immunity branch.
- MP-touching → re-run Ronald Kip stacking test + sim.

### Card 9 — PLACE-09 Digital Gaming Stop
- **Data:** `places.js:257-271`, `trigger: "ON_QUEST"` — unchanged, dispatch confirmed correct. `isBoosterOnly: true` (booster-only, unaffected).
- **Effect fn:** `effect_digital_gaming_stop(gameState, questCard, mosje)`, `placeEffects.js:423-436`. Currently: `isDigital = mosje?.traits?.digital >= 2` + non-physical quest → returns `{ ...state, questAutoSuccess: true }` (dead flag, never consumed anywhere — confirmed by grep, `questAutoSuccess` has zero read sites in `src/`).
- **Target:** drop the auto-succeed branch and the dead flag entirely. Implement "DIGITAL-EQUIPMENT Piecies give +10 MP while active" — since this effect already fires `ON_QUEST` with `questCard`/`mosje` in scope, check the questing player's `piecieSlots` for any `activated === true` slot whose card def has `subtype === 'DIGITAL-EQUIPMENT'` (the 3 live cards: `piecie_keyboard`, `piecie_mouse`, `piecie_controller` — confirmed via grep of `piecies.js`), and if found, `+10` to the questing Mosje. Needs the player context — `resolvePlaceEffect`'s `ON_QUEST` case already threads `playerId` via `context` (`placeEffects.js:580`, destructured from context) but `effect_digital_gaming_stop`'s current signature doesn't receive `playerId` — will need to be added to both the function signature and the dispatcher call site (`placeEffects.js:651-653`).
- MP-touching → re-run Ronald Kip stacking test + sim.

### Card 10 — PLACE-10 Skiffa
- **Data:** `places.js:62-76`. Change `trigger: "END_PHASE"` → `trigger: "ON_QUEST"`.
- **Effect fn:** `effect_skiffa(gameState)`, `placeEffects.js:120-136`. Currently: loops all players, `-15` unless `substance >= 1`. The "discard OR lose 15" choice was never built (code comment admits it: "Requires player choice (UI prompt)... For now, all non-SUBSTANCE Mosjes lose 15 MP").
- **Also disposition (Critical Finding 3):** `getSkiffaRerolls` in `main.js:3338-3346` + its 4 consumption sites (~1252, ~1474, ~2489, ~2642) — recommend removing entirely as part of this task (see Critical Finding 3 rationale).
- **Target:** replace `effect_skiffa` entirely with a Social-quest dice-bonus. Reuse the exact pattern already live for Synergy Chamber's quest dice bonus: `placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;` inlined in `main.js` at both quest-attempt call sites (~1251, ~2488). The new Skiffa bonus needs an additional condition — `questDef.category === 'Social'` — before granting `+2`. Since this lives in `main.js` (UI-layer dice computation, not `questLogic.js`), the Skiffa version should follow the same inline pattern at the same two call sites, changed to something like: `(gameState.activePlace === 'place_synergy_chamber' ? 1 : 0) + (gameState.activePlace === 'place_skiffa' && questDef.category === 'Social' ? 2 : 0)`. Confirm quest `category` field is available at both call sites (it is — `questDef` is already in scope at both, since `getQuestDiceThreshold(questDef, activeMosje)` is called just above at line 1240).

### Card 11 — PLACE-11 Synergy Chamber
- **Data:** `places.js:167-181`, `trigger: "PASSIVE"` — fires once on activation.
- **Effect fn:** `effect_synergy_chamber(gameState)`, `placeEffects.js:280-286`. Sets `state.synergyChamberActive = true` (also dead — nothing reads this flag; the 3 real consumers all check `gameState?.activePlace === 'place_synergy_chamber'` directly instead).
- **3 undocumented bonuses to remove, with their consumers:**
  1. `getSynergyChambercostReduction(gameState)` (`placeEffects.js:294-296`) — consumed at `turnManager.js:1179-1186` inside `useMosjeAbility`: pre-adjusts the acting Mosje's MP by `+5` before dispatching the ability function, refunding the discount.
  2. `getSynergyChamberDiceBonus(gameState)` (`placeEffects.js:304-306`) — consumed at `questLogic.js:981` inside `quest_req_perfect_timing` (note: called with `questCard?.gameState || null`, which is very likely always `null` since `questCard` objects don't carry a `gameState` property — this consumer may already be effectively dead; verify with a quick check/test before assuming removal changes any observable behavior) AND separately inlined directly in `main.js` at `placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0` (lines ~1251, ~2488) — **this second usage must also be removed**, it's a duplicate/independent consumer not mentioned in the audit's file:line list.
  3. `getSynergyChamberDurationBonus(gameState)` (`placeEffects.js:314-316`) — audit/CONTEXT.md say this is unconsumed (comment says "Callers: applyBuff in effects layer" but no such call site was found by name in this research pass — verify via a targeted grep for `getSynergyChamberDurationBonus` call sites before removing, to confirm it truly has zero consumers).
- **New headline mechanic — "once per turn, activate a synergy ability without its partner on field":** partner-gating is `synergyResolver.js:39` (`if (activeMosjeIds.includes(partnerId))` inside `getActiveSynergies`). This is consumed by exactly 2 real mechanics in the live engine (confirmed by exhaustive grep of `hasSynergy`/`hasFoodDoubleSynergy`/`getActiveSynergies` call sites):
  1. `hasFoodDoubleSynergy` (`synergyResolver.js:84-88`, consumed in `piecieEffects.js:97,110,125` — Binti+any-Coert FOOD-Piecie doubling)
  2. `getPartnerSynergyQuestBonus` (`questLogic.js:56-67`, data-driven `PARTNER_QUEST_SYNERGIES` table — currently only Martin/Señor West + AZN Cless, "+15 Physical Quest bonus")
  A third, separate, non-generic synergy check exists (`hasBothChrisAndYouri`, `turnManager.js:24-30`) but is a bespoke same-turn-activation check, not part of the `synergyWith`/`synergyResolver.js` system, and is unlikely to be what "activate a Mosje's synergy ability" refers to (it's not an "ability," it's a placement-timing rule).
  **This is a genuinely new player-facing action**, not a passive formula tweak: the ruling implies the player chooses to invoke the waiver ("you may activate"), which needs a UI trigger point (button/prompt), a per-turn-consumed flag (reset in `startTurn`, following the exact existing idiom of `player.freePiecieActivationAvailable`/`player.kasteLuckSameTurnActivation`, both booleans reset at `turnManager.js:210`/`212`), and a decision about **which** partner-gated mechanic(s) the waiver applies to (both of the 2 above, or player's choice of which Mosje). Recommend the planner treat this as the highest-complexity non-Void card in the batch and scope it narrowly (e.g. "waives the check for whichever of the 2 mechanics is relevant to the player's currently-active Mosjes" rather than building a general-purpose "pick any synergy" UI).

### Card 12 — PLACE-12 The Void
**Highest risk — implement LAST**, per ruling.

- **Data:** `places.js:122-136`, `trigger: "END_PHASE"` — unchanged.
- **Effect fn:** `effect_the_void(gameState)`, `placeEffects.js:207-219`. Currently: loops all players, `-15` via `applyDamage`. RESTORE/FOOD Piecie block already exists separately at `turnManager.js:806-813` inside `activatePiecie` (`if (state.activePlace === 'place_the_void') { const blocked = ['RESTORE', 'FOOD']; if (knownCardDef.tags?.some(t => blocked.includes(t))) return error; }`) — **this restriction is already correctly wired**, contrary to the audit's "unimplemented" note; re-verify before assuming it needs building (it may just need to be left alone, or the ruling's "remove -15 drain" doesn't touch this block at all since it's a different mechanic).
- **Untexted extra to remove:** `questLogic.js:338` — `const baseQuestMpBlocked = state.activePlace === 'place_the_void';` — consumed through the rest of `resolveQuest` (lines 349, 367, 393 seen in this research pass, likely more below) to skip all direct Quest MP gain/loss while Void is active. Remove this gate along with the `-15` drain.
- **New mechanic — one card-activation per turn while Void is active.** Full enumeration of every play/activate entry point in `turnManager.js` (verified by grepping all `^export function (play|activate|use)`):

| Function | Line | What it does | Candidate for the cap? |
|----------|------|---------------|------------------------|
| `playPiecie` | 558 | places a Piecie **face-down** (not yet usable) | Ambiguous — "play" vs "activate" |
| `playPersonalQuest` | 633 | places a Personal Quest **face-down** | Ambiguous |
| `activatePersonalQuest` | 674 | attempts a placed Personal Quest (the real "activation") | Likely yes ("Personal Quest" in ruling text) |
| `activatePlace` | 712 | makes a placed Place card the active Place | Likely yes ("Place" in ruling text) |
| `activatePiecie` | 758 | flips a face-down Piecie face-up and resolves its effect (the real "activation") | Likely yes ("Piecie" in ruling text) |
| `playSnellie` | 944 | plays + immediately resolves a Snelle Piecie (play = activate for this type) | Likely yes ("Snelle" in ruling text) |
| `playMosje` | 1062 | plays a Mosje onto the field | Likely yes ("Mosje" in ruling text — but is placing a Mosje an "activation"?) |
| `useMosjeAbility` | 1137 | activates an on-field Mosje's ability | Ambiguous — could also be "the Mosje action" instead of/as well as `playMosje` |
| `playPlace` | 1360 | places a Place card face-down onto a Piecie/Place slot | Ambiguous, parallel to `playPiecie` |

  **This ambiguity is not resolvable from the code alone** — the ruling text lists 5 categories
  ("Snelle / Piecie / Personal Quest / Place / Mosje") but the engine has both a "play" (face-down
  placement) and separate "activate" (face-up resolution) step for 3 of those 5 categories
  (Piecie, Personal Quest, Place), and Mosje has neither a "play vs activate" split (playing IS
  the only action) nor is it clear whether `useMosjeAbility` should also count. **Flag this as
  an Open Question requiring an explicit ruling before PLACE-12 is planned** — do not let the
  planner silently guess which of the 9 functions gate.
- **Reusable counter/gate pattern already in the codebase:** `player.actionsThisTurn` (array,
  reset to `[]` in `startTurn` at `turnManager.js:209`) is currently written (only) inside
  `activatePiecie` at lines 892-897 (`if (!actions.includes('PIECIE_ACTIVATED')) { ...push... }`)
  but **is never read anywhere** — confirmed by grep, zero consumer sites. This is an existing,
  unused scaffold that matches the shape The Void needs almost exactly: extend it to be pushed
  from every "counts" function identified in the ruling above (e.g. `'PIECIE_ACTIVATED'`,
  `'MOSJE_PLAYED'`, `'SNELLE_PLAYED'`, `'QUEST_ACTIVATED'`, `'PLACE_ACTIVATED'`), then add one
  guard at the top of each: `if (gameState.activePlace === 'place_the_void' && (player.actionsThisTurn?.length || 0) >= 1) return { state, success: false, error: '...' }`. This avoids inventing a new state field.
- **Reference precedent for a `checkVictory`-adjacent structural change touching this many
  functions:** none directly comparable in this codebase — this is genuinely the largest,
  most cross-cutting change in the batch, consistent with "implement LAST."

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| "Loop every active Mosje and branch on trait" | A new generic trait-loop utility | Inline `for` loop matching `effect_the_gym`/`effect_zo_is_natuur` idiom | Matches established per-effect-file convention; a generic utility would be the first of its kind in this file and isn't requested by CONTEXT.md's discretion note |
| "Once per turn" flag | A new generic cooldown/counter system | `player.actionsThisTurn` (existing, unused) or the `freePiecieActivationAvailable`/`kasteLuckSameTurnActivation` boolean-flag idiom, both reset in `startTurn` | Both patterns already exist and are the project's established idiom for this exact shape |
| Quest dice bonus | A new bonus-stacking abstraction | The existing inline `diceBonus + questPrepBonus + placeDiceBonus` sum pattern in `main.js` (~1251, ~2488) | This is literally how Synergy Chamber's dice bonus already works; Skiffa's new bonus is one more term in the same sum |

**Key insight:** every mechanic this phase needs (loop-all-Mosjes, once-per-turn flag, dice-bonus
stacking, cost self-charge) already has a working precedent elsewhere in the same files. The
correct approach throughout is "copy the nearest existing pattern," not "design something new" —
consistent with CONTEXT.md's explicit non-goal of new architecture.

## Common Pitfalls

### Pitfall 1: Testing the raw effect function instead of the dispatcher
**What goes wrong:** A TDD test calls `effect_bank_chilling(state, playerId)` directly, passes,
and the commit ships — but the trigger-string bug (Critical Finding 2) means the function is
never actually called by `startTurn` in real play.
**Why it happens:** `placeEffects.js`'s exported functions are easy to unit-test in isolation;
the dispatcher (`resolvePlaceEffect`) that gates them is a separate hop most tests skip.
**How to avoid:** for every card whose `trigger` field is part of the change (PLACE-01, PLACE-08,
PLACE-10), add at least one test that goes through `resolvePlaceEffect` or the higher-level
`startTurn`/`endTurn`/`applyPlaceEffectsOnQuest`, not just the raw effect function.
**Warning signs:** a passing test with zero assertions on `gameState.activePlace` or on which
`triggerPhase` string was passed.

### Pitfall 2: Assuming `mpCost` means something it doesn't
**What goes wrong:** implementing "SUBSTANCE/PET Piecies cost 0 MP" as if `mpCost` were already
being charged somewhere, producing a change with no observable effect (see Critical Finding 1).
**How to avoid:** get the scoping decision (Assumptions Log A1) before writing PLACE-06/07 tasks.

### Pitfall 3: `id.includes()` substring collisions
**What goes wrong:** `id.includes('tuk')` or `id.includes('coert')` matching an unintended card
whose id happens to contain the substring.
**Why it happens:** this is the established idiom throughout `placeEffects.js`
(`effect_de_box`, `effect_coerts_caravan`, `effect_the_gym`'s `isWest`/`isCless` checks all use
it), so it's the right call to keep using it, but every new usage should be checked against the
full `mosjes.js` id list first (as done in Card 4/Card 8 above) rather than assumed.
**Warning signs:** a Mosje id list that grows in a later phase and silently starts matching an
existing Place bonus it shouldn't.

### Pitfall 4: Forgetting the `resolvePlaceEffect` return-value envelope
**What goes wrong:** every branch of the dispatcher's `switch` must still return through the
common `{ ...nextState, _lastPlaceEffect: {...} }` wrapper at the bottom of the function
(`placeEffects.js:672-681`). If a card's effect function signature changes (e.g. Card 9 needs a
new `playerId` parameter), the dispatcher's call site (the `case` block) must be updated to pass
it — a mismatch here throws or silently passes `undefined`.
**How to avoid:** whenever an effect function's signature changes, grep `resolvePlaceEffect`'s
switch statement for that `case` and update the call in the same commit.

## Code Examples

### Loop-all-active-slots pattern (Cards 1, 2, 3)
```js
// Source: src/abilities/placeEffects.js:34-60 (effect_the_gym), existing live code
export function effect_bank_chilling(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	for (const mosje of player.activeSlots) {
		if (!mosje || mosje.isDefeated) continue;
		const social = mosje.traits?.social || 0;
		if (social >= 2) {
			mosje.mp += 15;
			console.log('[ABILITY] Bank Chilling: +15 MP applied (Social 2+)');
		}
	}
	return state;
}
```

### Once-per-turn flag pattern (reference for Card 11's waiver / Card 12's cap)
```js
// Source: src/engine/turnManager.js:210-212 (startTurn reset), :603-607 (playPiecie consumption)
// Reset every turn:
activePlayer.kasteLuckSameTurnActivation = false;
// Set by the triggering ability:
kasteLuckPlayer.kasteLuckSameTurnActivation = true;
// Consumed once, then cleared:
const kasteLuckBonus = player.kasteLuckSameTurnActivation === true;
if (kasteLuckBonus) {
	player.kasteLuckSameTurnActivation = false;
}
```

### Quest dice-bonus stacking pattern (reference for Card 10's Skiffa +2)
```js
// Source: src/main.js:1249-1251 (existing live code)
const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
// ... later, combined:
// { diceBonus: diceBonus + questPrepBonus + placeDiceBonus, ... }
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | PLACE-06/PLACE-07 cannot literally "hook mpCost" because no such hook exists — needs a scoping decision (build new cost-charging vs. implement as a currently-no-op flag) before tasks are written | Critical Finding 1, Cards 6-7 | If the planner picks a scope silently, either (a) balance-impacting change to ~35 Piecies ships without a sim pass across all 5 decks, or (b) a card ships whose text change has zero observable in-game effect, undermining the whole point of a "text-vs-engine reconciliation" phase |
| A2 | PLACE-05's ATTACK-Piecie +10 bonus requires editing ~11 Piecie effect functions in `piecieEffects.js`, which is nominally out of this phase's "Places only" scope | Card 5 | If descoped without a substitute, PLACE-05's card text will still promise the ATTACK bonus and not deliver it — the exact class of bug this phase exists to fix, just moved rather than fixed |
| A3 | PLACE-12's 9 candidate play/activate functions cannot be narrowed to the "right" 5 without an explicit ruling on play-vs-activate and whether Mosje-ability-use counts | Card 12 | Implementing the wrong subset either leaves a loophole (Void's cap doesn't actually stop stacking multiple actions) or is overly restrictive (blocks a category the ruling didn't intend, e.g. blocking `playPiecie` face-down placement when only `activatePiecie` was meant) |
| A4 | `getSynergyChamberDurationBonus` and the `questLogic.js:981` `getSynergyChamberDiceBonus` call site may already be dead code (no confirmed consumer / likely-always-null argument) — removal may have zero observable effect either way, but should be verified with a quick grep/test before assuming so | Card 11 | Low risk either way — worst case is a slightly-too-cautious removal-verification test that turns out to be unnecessary |
| A5 | `getSkiffaRerolls` (Critical Finding 3) should be removed as part of PLACE-10, not kept alongside the new +2 dice bonus | Card 10 | If kept, Social-quest attempts with an ARTISTIC Mosje get a stacked, untexted bonus (reroll + flat +2) that isn't described anywhere on the new card |

## Open Questions

1. **What is the correct scope for PLACE-06/PLACE-07's cost-0 implementation?**
   - What we know: no generic Piecie cost-charging mechanism exists anywhere in the engine (Critical Finding 1).
   - What's unclear: whether Gandoe wants this phase to introduce one (bigger scope, needs a full-deck balance/sim pass) or wants these 2 cards implemented as a currently-inert flag (satisfies "text wins" literally but has no play impact today).
   - Recommendation: raise this explicitly before planning PLACE-06/07 — likely via a quick clarifying question at plan time or a dedicated checkpoint, rather than silently choosing.

2. **Is PLACE-05's ATTACK-Piecie bonus in scope, given it requires editing Piecie effect files?**
   - What we know: the bonus can only be implemented inside each ATTACK Piecie's own effect function (11 functions in `piecieEffects.js`), not inside Drain Zone's own effect file.
   - What's unclear: whether "small, mostly-independent surgical changes... not new architecture" (CONTEXT.md) was written with this cross-file requirement in mind.
   - Recommendation: confirm scope, or consider descoping the ATTACK-bonus clause from PLACE-05's card text back to something implementable within `placeEffects.js` alone (a text-side compromise) if a full cross-file change isn't wanted this phase.

3. **Which of the 9 play/activate functions does The Void's "one card per turn" cap actually gate?**
   - What we know: the ruling names 5 categories (Snelle/Piecie/Personal Quest/Place/Mosje); the engine has 9 distinct play/activate functions, with a play-vs-activate split for 3 of the 5 named categories.
   - What's unclear: whether "play" (face-down placement) or "activate" (face-up resolution) is the gated moment for Piecie/Personal Quest/Place, and whether Mosje-ability-use (`useMosjeAbility`) is included alongside or instead of playing a Mosje.
   - Recommendation: get an explicit answer before writing PLACE-12's task — this is the single highest-risk ambiguity in the whole batch and the ruling record already flags it as "implement LAST," so there's no time pressure to guess.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.4 (unit) + Playwright 1.60 (browser/card-behavior/sim) |
| Config file | `vitest.config.js` (unit), `playwright.config.*` (browser projects: `visual`, `sim`, `cards`) |
| Quick run command | `npm test` (vitest, unit-level) |
| Card-behavior run | `npm run test:cards` (Playwright `cards` project, workers=1) |
| Full suite / sim command | `npm run test:sim` (Playwright `sim` project, workers=1) |

**⚠ CLAUDE.md's `node --loader ts-node/esm src/simulation/run-once.ts` command does not exist**
(the directory was removed in the SSOT migration) — use `npm run test:sim` instead. This is a
stale-doc correction the planner/executor should apply, not a new discovery to re-verify.

### Ronald Kip Stacking Test
Lives as a data entry in `tests/ui/cards/card-registry.js:164-168` (`cardId:
'piecie_ronald_kip'`, `mpDeltaMin: 50, mpDeltaMax: 100` — covers the 50 base / 60 Ronald-synergy /
100 FOOD-double-synergy stacking range), driven by `tests/ui/cards/card-test-runner.js` via
`npm run test:cards`. This is the "Ronald Kip stacking test" referenced throughout CLAUDE.md and
the ruling record — there is no separate dedicated test file by that name.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLACE-01 | Bank Chilling loops all slots + fires via dispatcher | engine unit + card-registry | `npm test` + `npm run test:cards` | ❌ Wave 0 — no `place_bank_chilling` entry in `card-registry.js` yet |
| PLACE-02 | Obby #1 loops all slots | engine unit | `npm test` | ❌ Wave 0 |
| PLACE-03 | Arcade loops all slots | engine unit | `npm test` | ❌ Wave 0 |
| PLACE-04 | De Box Tuk extension + log fix | engine unit | `npm test` | ❌ Wave 0 |
| PLACE-05 | Drain Zone ATTACK bonus + gain-bonus removal | engine unit (+ Piecie effect tests if in scope) | `npm test` | ❌ Wave 0 |
| PLACE-06 | Delluft SUBSTANCE cost-0 | engine unit | `npm test` | ❌ Wave 0 — blocked on Open Question 1 |
| PLACE-07 | Dierenasiel PET cost-0 + typo cleanup | engine unit | `npm test` | ❌ Wave 0 — blocked on Open Question 1 |
| PLACE-08 | Coert's Caravan replace + trigger fix | engine unit through dispatcher | `npm test` | ❌ Wave 0 |
| PLACE-09 | Digital Gaming Stop DIGITAL-EQUIPMENT bonus | engine unit | `npm test` | ❌ Wave 0 |
| PLACE-10 | Skiffa rework + trigger change + getSkiffaRerolls disposition | engine unit + UI dice-bonus check | `npm test` (+ manual/Playwright for main.js dice flow) | ❌ Wave 0 |
| PLACE-11 | Synergy Chamber waiver + 3-bonus removal | engine unit + new UI trigger (if built) | `npm test` | ❌ Wave 0 — blocked on Open Question design |
| PLACE-12 | The Void activation cap | engine unit across all gated functions | `npm test` | ❌ Wave 0 — blocked on Open Question 3 |

None of the 12 cards currently have a `tests/ui/cards/card-registry.js` entry (Places aren't yet
represented in the data-driven card-test-library — only Piecies/Snelle/Mosjes are). Existing
`tests/engine/*.test.ts` and `tests/abilities/*.test.ts` files are the closer precedent for
Place-effect-function unit tests (e.g. `tests/engine/quest-haven-double-quest.test.ts` is the
nearest existing example of a Place-effect test, for `place_quest_haven`).

### Sampling Rate
- **Per task commit:** `node --check` on touched files (per CLAUDE.md's exact file list, extended
  to include `src/abilities/placeEffects.js`, `src/data/places.js`, and any touched Piecie/quest
  file) + `npm test`.
- **Per MP-touching card (PLACE-01,02,03,04,05,08,09):** additionally `npm run test:cards`
  (Ronald Kip stacking entry) + `npm run test:sim`.
- **Phase gate:** full `npm test` + `npm run test:cards` + `npm run test:sim` green before
  `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] No `tests/ui/cards/card-registry.js` entries exist for any of the 21 Place cards — the
      planner should decide per-card whether a new card-registry entry (browser-driven,
      end-to-end through the dispatcher — closes Pitfall 1) or an engine-level `tests/engine/`
      unit test (faster, but must explicitly go through `resolvePlaceEffect`/`startTurn`/`endTurn`
      to avoid Pitfall 1) is the right test shape. Given CONTEXT.md's discretion note on "exact
      test shapes," either is acceptable, but the dispatcher-level requirement from Critical
      Finding 2 applies regardless of which shape is chosen.
- [ ] No existing test proves the `'TURN_START'` vs `'START_PHASE'` dispatch bug (Critical
      Finding 2) — the PLACE-01 test must assert on this specifically (e.g. call `startTurn` and
      confirm `_lastPlaceEffect.placeId === 'place_bank_chilling'` fired), not just call the raw
      effect function.

## Security Domain

Not meaningfully applicable — this phase touches only internal game-state transform functions in
a client-side prototype with no new user input, auth, session, or network surface. No ASVS
category applies beyond the project's existing "immutable reducer, never mutate state directly"
convention, which every touched function in this research already follows (all clone via
`cloneState`/`deepCloneState` before mutating).

## Sources

### Primary (HIGH confidence — direct code read/grep, this session)
- `src/data/places.js` — all 21 Place data definitions, full file read
- `src/abilities/placeEffects.js` — all effect functions + dispatcher, full file read
- `src/engine/mpManager.js` — `gainMP`/`loseMP`, full file read
- `src/engine/turnManager.js` — `playPiecie`, `activatePiecie`, `activatePlace`, `playSnellie`,
  `playMosje`, `useMosjeAbility`, `playPlace`, `startTurn` (partial), `applyPlaceEffectsOn*`
  dispatch functions — targeted reads + exhaustive grep for `mpCost`, `TURN_START`,
  `resolvePlaceEffect`, `actionsThisTurn`
- `src/abilities/questLogic.js` — `resolveQuest` (partial), quest requirement functions,
  `getPartnerSynergyQuestBonus`, `quest_req_perfect_timing` — targeted reads
- `src/engine/synergyResolver.js` — full file read
- `src/main.js` — targeted reads around quest-dice flow (~1230-1290, ~2480-2560, ~3330-3350) and
  `mpCost` display sites
- `src/data/piecies.js`, `src/data/mosjes.js`, `src/data/snellePiecies.js` — grepped for
  `mpCost`, `SUBSTANCE`, `PET` (subtype), `DIGITAL-EQUIPMENT`, and specific Mosje id spellings
- `.planning/audits/2026-07-14-places-text-audit.md` — the canonical ruling record (read in full)
- `.planning/phases/35-places-text-reconciliation/35-CONTEXT.md` — locked decisions (read in full)
- `.planning/STATE.md`, `.planning/ROADMAP.md` (Phase 35 section) — project history/requirements
- `docs/card-reference.md` — Place rows + "Place Design Notes" (confirms several rows describe
  the now-archived TS engine and are stale — flagged for a doc-update task alongside code changes)
- `tests/ui/cards/card-registry.js`, `tests/data/deck-balance.test.ts` — confirmed test coverage gaps
- `package.json` — confirmed live npm scripts (`test`, `test:cards`, `test:sim`)

No Context7/WebSearch/WebFetch lookups were performed — this phase has zero external library or
framework surface; all research was internal codebase investigation.

## Metadata

**Confidence breakdown:**
- Standard stack / architecture: N/A (no external stack — internal engine only)
- Per-card current-vs-target behavior: HIGH — every claim verified by direct file read this session
- Critical Findings 1-3: HIGH — verified by exhaustive grep across the entire `src/` tree, not sampled
- Open Questions (A1-A3 scoping ambiguities): these are genuine ambiguities in the ruling record
  itself, not gaps in this research — flagged rather than guessed, per CLAUDE.md's "stop and ask"
  directive

**Research date:** 2026-07-14
**Valid until:** Until this branch's code changes (this research is tied to the exact current
state of `card/full-game-text-audit`; if other work lands on this branch or main before
PLACE-01..12 are implemented, re-verify line numbers before trusting them literally — the
described *behaviors* and *bugs* will remain valid regardless of line drift).
