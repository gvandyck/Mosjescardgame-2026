# Phase 54: Energy, Levels and Getemt - Research

**Researched:** 2026-10-11
**Domain:** Imperative `.js` card-game engine (vanilla ES modules, no build step); rules rewrite of the MP economy (Energy, Levels 1-3, getemt, hold-L3 win, loss pipeline)
**Confidence:** HIGH for the code map (every claim is a grep/read of this repo in this session); MEDIUM for the rules edge cases flagged in Open Questions (spec is silent or ambiguous)

> Tags: all codebase claims below are `[VERIFIED: codebase grep/read]` (file:line given). Rules claims are `[CITED: docs/obby-2.0/...]`. Anything else is `[ASSUMED]` and collected in the Assumptions Log. No new packages are needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Energy (RULE-01, locked - handoff section 2a, Core Numbers section 1-2)**
- `player.energy`: starts at 2 for both players; +1 at the start of each of the player's own turns, max 6; unspent Energy carries over (so with nothing spent: 3/4/5/6 on turns 1-4).
- Energy pays for summons, Piecie activations, Snelle, Places and activated abilities, using the 2.0 `cost` field from Phase 53. A payment larger than the pool is refused (no partial pay, no negative Energy).
- **MP is never a currency:** every V4 MP-cost path (`mpCost`, U7 cost rule in `universal-rules.js`, tribute payer, Welloe Force paying MP) stops charging MP. Where a card's V4 effect still reads `mpCost`, charge `cost` in Energy instead; effect texts themselves are rewritten in Phases 58-60.
- Remove/neutralise V4 fields' consumers as they are replaced (Phase 53 kept `mpCost` etc. alongside); delete the field consumers this phase replaces, and keep the data field only if another not-yet-rewritten consumer still needs it (record which in the SUMMARY).

**Levels (RULE-02, locked - handoff section 2b)**
- No Level 0 anywhere: a Mosje enters at **Level 1** with its `startMP`. Engine level representation may stay 0-based internally only if every display/test uses 1-3; prefer storing 1-3 (decide in research, record it).
- Reaching 100 MP from **any** gain (Quest, Piecie, ability, Place) -> level +1, **MP resets to 0** (no carry-over). L1->L2->L3.
- At Level 3, MP can't go above **95**.
- Leipe Swap is never a gain; Tactician's 10-75 can never reach 100 (effects in later phases - just don't let a "set MP" path trigger level-up).
- Power comes from the Mosje's current level row (`levels[level-1].power`) plus boosts; boosts and Power plumbing that cards use arrive in later phases, but `getPower(mosje)` (level row + modifiers, floor 0) belongs here.

**Getemt (RULE-03, locked - handoff section 2b, Core Numbers section 1, Phase 1/3 rulings)**
- Trigger: after **any** MP loss (attack, card, own ability or cost, failed Quest, Quest jab, Place) whose **final amount is > 0** and that leaves the Mosje at **0 MP or less**.
- Level 2-3: level -1, MP = 50.
- Level 1: MP = 0, the Mosje turns **sideways**: it skips its owner's next turn and stands up at the end of that turn. Getemt again while sideways -> **Welloe pile** (out of the game, separate from the discard pile).
- **A loss reduced to 0 is no loss:** no getemt, also at 0 MP.
- Negative MP never persists (floor 0).

**Win / lose (RULE-04, locked)**
- Win check is the **first thing at the start of a player's turn**: if one of their Mosjes is at Level 3 (it got there on an earlier turn and is still there), they win. Reaching Level 3 does not win immediately.
- A player **loses** when no Mosje of theirs is left outside their Welloe pile (field, hand and deck all empty of Mosjes).

**Grid and loss order (RULE-09, locked - handoff section 2g)**
- MP always a multiple of 5 (keep `roundToFive`), never below 0. Power a multiple of 10, never below 0.
- One MP loss resolves: base amount -> reductions (pets, Afblijven!, Laat me chillen!, Zo is Natuur, Flow, reaction Snelle) -> Momentum Stabilizer's 30 cap -> round to 5, floor 0 -> if 0: no loss. Emergency Healings adds MP *before* the loss. Build this as one engine function (e.g. `resolveMpLoss`) with hook points for reductions/caps that later phases register into; the concrete card reductions arrive in 58-60.

**Transition (locked by orchestrator)**
- One engine, no V4/2.0 switch: V4 level/MP rules are replaced in place.
- `npm test` green at the end of every plan: V4 tests that encode Level 0, MP costs, carry-over level-up, V4 getemt (remainder into 100), 100-cap of non-Quest gains, or "win at Level 3 immediately" are **rewritten to the 2.0 rule or deleted** (never left failing, never weakened into no-ops). List them in SUMMARYs.
- The game must still start and run a bot-vs-bot game on the Example Decks without throwing (Node smoke in `npm test`); it may play oddly until Phases 55-57.
- MP-touching phase: run the full CLAUDE.md verification at the phase gate. The V4 Ronald Kip stacking test is replaced in Phase 59 - keep or adapt the current one so it still passes under 2.0 MP rules. The sim (`npm run test:sim`) still uses old deck ids until Phase 64: don't run the full 2-hour sim; run at most one short headless sim spec, or the Node smoke, and say so.
- Playwright: headless only; if a headed window is unavoidable it must open at `--window-position=2560,0` (Gandalf plays on the main screen).

### Claude's Discretion
- File layout (one exported function per file, small files), names like `gainMp`, `loseMp`, `resolveMpLoss`, `checkLevelUp`, `applyGetemt`, `getPower`, `checkWin`, `checkLoss`, `payEnergy`, `canPay`.
- Where the Welloe pile lives in state (`player.welloePile`), and how "sideways"/"skips next turn" is flagged (turn skipping itself can be wired minimal here and completed in Phase 55's turn flow - record the boundary).

### Deferred Ideas (OUT OF SCOPE)
- Summon cost charging at summon time (TABLE-01) and setup/R1/R5/cooldown/fresh - Phase 55.
- Attack damage, Quest win/lose, jabs - Phase 56.
- Card-specific reductions (pets, shields, Stabilizer) registering into the loss pipeline - Phases 58-60.
- Energy crystals UI - Phase 63.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RULE-01 | Energy pool: start 2, +1 own turn start, max 6, carries over; pays summons/Piecie activations/Snelle/Places/abilities; MP never spent | Sections "MP-as-currency map", "Energy hook points"; plan 54-01 + 54-03 |
| RULE-02 | Level 1 start, 100 MP -> level +1 and MP resets to 0 from any gain, L3 stops at 95 | Sections "Level representation", "Gain pipeline"; plans 54-01, 54-02, 54-06 |
| RULE-03 | Getemt: L2-3 -> level-1 at 50; L1 -> sideways 0 MP; again -> Welloe pile; reduced-to-0 loss = no loss | Sections "Loss pipeline", "Welloe pile + sideways"; plan 54-04 |
| RULE-04 | Win = still L3 at start of own next turn; lose = no Mosje outside Welloe pile | Section "Win / lose"; plan 54-05 |
| RULE-09 | MP multiple of 5, floor 0; Power multiple of 10, floor 0; one loss resolves in 2g order | Sections "Gain pipeline", "Loss pipeline", `getPower`; plans 54-02, 54-04 |
</phase_requirements>

## Summary

The V4 MP economy is concentrated in a small set of files but its **tentacles are wide**. The clean core is `src/engine/mpManager.js` (`gainMP`, `loseMP`, `checkLevelUp`) plus `src/engine/victoryChecker.js` (`checkVictory`, `clampMosjeMp`, `markMosjeDefeated`). However ~60 effect sites do **not** use those functions: they mutate `slot.mp +=/-=` directly, and three files carry their own copies of an old `applyDamage` helper (`mosjeAbilities.js:19`, `piecieEffects.js:46`, `placeEffects.js:15`) that implement the V4 "Level 0 -> `_pendingDefeat`, else regress with remainder into 100" logic, plus `applyMPGain` (`piecieEffects.js:88`) that hard-caps at 100. The biggest risk of this phase is therefore **not** rewriting `mpManager`; it is funnelling every direct mutation site through one slot-level gain/loss function, otherwise level-up and getemt only fire on Quest paths.

MP is almost never a currency in the live engine already (Phase 36 moved 45 cards to `mpCost: 0`). The real MP-as-currency sites are few and enumerable: Welloe Force's 40 MP tribute (engine `piecieEffects.js:884-897` + UI picker `main.js:2800-2830`), the 20 MP Quest attempt cost (`main.js:1541`, `main.js:2615`, bot `botDriver.js:448`, plus the `mp >= 20` gates in `assessQuestRisk.js:85`, `modalManager.js:754`, `botDriver.js:205/515`), and three MP-priced abilities (Ronald Strategic Insight 20, Youri Speed Activate 20, Gandoe Destroyer Elimination Strike 80, plus `abilityCost` consumers `main.js:3477-3489`, `boardRenderer.js:113-124`, `botDriver.js:197-205`). Energy currently does not exist anywhere: no `player.energy`, no payment gate in `activatePiecie`/`playSnellie`/`playPlace`/`useMosjeAbility`.

Levels are stored **0-based** today (`gameState.js:140`, `turnManager.js:1222`, "0, 1, 2 - reach 3 to win") and the UI already adds `+1` to display them (`buildMosjeSpecV1.js:14`, `cardRenderer.js:103`, `modalManager.js:408/459`, `main.js:3635`, `hoverZoom.js:27/34`). **Recommendation: switch to storing 1-3** (one wave, ~12 reader sites + ~35 test fixtures of `level: 0`). 0-based storage would carry an off-by-one trap through Phases 58-60 (cards say "Level 2+") and conflicts with CONTEXT "no Level 0 anywhere" and the sim's `levels[level-1]`.

**Primary recommendation:** Build the 2.0 rules as small pure **slot-level** functions (`applyGainToSlot`, `resolveMpLoss`, `applyGetemt`, `getPower`, `payEnergy`), make `gainMP`/`loseMP` thin state wrappers around them, then mechanically replace every direct `.mp +=/-=` and the three `applyDamage` copies with calls to those functions, backed by a static guard test that fails on any new direct `.mp` mutation in `src/abilities`. Win check moves to the top of `startTurn`; `checkVictory` keeps only the "no Mosje left" loss.

## Architectural Responsibility Map

This is a single-tier engine phase (no server). "Tiers" here are engine layers.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Energy pool, payment, per-turn refill | Engine (`src/engine/`) | UI (afford checks, Phase 63 crystals) | State rule; UI only reads `player.energy` |
| MP gain/loss, level-up, getemt, grid | Engine (`mpManager` + new slot-level files) | Abilities (must call the engine, not mutate) | Single source of truth; effect files currently bypass it |
| Win/lose | Engine (`startTurn` + `victoryChecker`) | UI (`main.js:866-900` win text) | Win check is a turn-start hook |
| Welloe pile / sideways state | Engine state (`player.welloePile`, `slot.sideways`) | UI display (Phase 63) | Plain JSON, Firebase-sync safe |
| Level display | UI (`cardV1`, `cardRenderer`, `modalManager`, `hoverZoom`) | -- | Readers must stop adding `+1` |
| Bot affordability / risk | Bot (`botDriver`, `assessQuestRisk`) | Engine returns `success:false` | Minimal keep-alive here; real rework Phase 61 |

## Standard Stack

No new libraries. This phase uses what exists.

| Tool | Version | Purpose | Source |
|------|---------|---------|--------|
| Vitest | 2.1.9 | Engine unit tests (`tests/**/*.test.ts`, node env) | `vitest --version`; `vitest.config.ts` includes `tests/**/*.ts` [VERIFIED: codebase] |
| Playwright | 1.60.0 | Browser card tests / UI specs (`visual`, `cards`, `sim` projects) | `npx playwright --version` [VERIFIED: codebase] |
| Node | v24.12.0 | Runs `node --check` and vitest | `node --version` [VERIFIED: codebase] |

**Package Legitimacy Audit:** Not applicable - this phase installs **no** external packages. Packages removed due to slopcheck: none. Packages flagged suspicious: none.

**Installation:** none.

**Baseline (measured this session):** `npm test` = 93 files / 968 tests, all green, ~10 s. [VERIFIED: ran `npm test`]

## Architecture Patterns

### System Architecture Diagram (target data flow)

```
                       +--------------------------------------------+
 startTurn(owner) ---> | 1. checkWin(owner): any own Mosje L3 ?  --> FINISHED(winner=owner)
                       | 2. +1 Energy (cap 6) ; reset per-turn flags
                       | 3. arm sideways stand-up for owner's sideways Mosjes
                       +--------------------------------------------+
                                        |
   any MP gain  -----> applyGainToSlot(slot, amt)            (pure, slot level)
   (Quest, Piecie,       - amt > 0 ; roundToFive
    ability, Place,      - mp += amt
    trickle, bot)        - while mp>=100 and level<3: level+=1, mp=0, traits=levels[level-1]
                         - if level==3: mp=min(mp,95)
                                        |
   any MP loss  -----> resolveMpLoss(state, target, base, source)
   (attack, card,        1 base -> 2 reducers[] (halve, flat, shields; hook registry)
    cost, failed         -> 3 caps[] (Stabilizer 30) -> 4 roundToFive, floor 0
    Quest, jab,          -> 5 final==0 ? return (NO LOSS, no getemt)
    Place)               -> 6 mp' = mp - final
                         -> 7 mp' <= 0 ? applyGetemt(slot)
                                |-- level>=2 : level-1, mp=50, traits refresh
                                |-- level==1 & !sideways : mp=0, sideways=true
                                '-- sideways already : slot._pendingWelloe=true
                                        |
   checkVictory(state) --> sweep _pendingWelloe -> markMosjeDefeated -> player.welloePile
                           (WELLOE_SHIELD / Not Today! still intercept -> mp=5, stay)
                           checkLoss: owner has no Mosje on field+hand+deck -> opponent wins ("KNOCKOUT")
                                        |
 endTurn(owner) ------> sideways Mosjes of owner that were armed this turn stand up
```

### Recommended Project Structure (one exported function per file, <~80 lines)

```
src/engine/
  energy/
    canPay.js            # canPay(player, amount)
    payEnergy.js         # payEnergy(state, playerId, amount) -> {state, success, error}
    gainEnergy.js        # gainEnergy(state, playerId, n=1) (cap 6)
    getEnergyCost.js     # reads card.cost (Energy), ability cost from abilityEnergyCosts
  mp/
    applyGainToSlot.js   # slot-level pure gain (grid, level-up, L3 cap 95)
    checkLevelUp.js      # slot-level; mpManager re-exports a state wrapper
    resolveMpLoss.js     # computes final amount via ordered pipeline (no mutation)
    lossSteps.js         # ordered registry: reducers[], caps[] (later phases register)
    applyGetemt.js       # slot-level getemt (level -1 @50 / sideways / pending welloe)
    getPower.js          # level row + boosts, floor 0
    createMosjeSlot.js   # THE single slot factory (replaces 3 copies)
  winLose/
    checkWin.js          # start-of-turn hold-L3 check
    checkLoss.js         # no Mosje outside Welloe pile
src/rules/abilityEnergyCosts.js   # data-only map abilityId -> Energy cost (see Pitfall 7)
```
`mpManager.js` keeps exporting `gainMP`, `loseMP`, `checkLevelUp`, `applyStatusEffectMP`, `getTotalMPForPlayer` as thin wrappers (existing imports in `turnManager`, `questLogic`, `snelleEffects`, `botDriver`, `main.js` keep working). Note CLAUDE.md "one function per file" is violated today by `mpManager.js`; new code follows the rule, wrappers may remain until touched.

### Pattern: slot-level pure functions + state wrappers
Effect files hold the slot object (`player.activeSlots[si]`) inside an already-cloned state, so the funnel must accept a **slot**, not `(state, playerId, slotIndex)`. State-level `gainMP`/`loseMP` clone, call the slot function, return. This is what lets the three `applyDamage` copies and ~60 `mosje.mp +=` lines be replaced one-for-one without restructuring each effect.

### Anti-Patterns to Avoid
- **Re-implementing getemt per effect file** (the current state: 4 copies of the regress loop). One `applyGetemt`.
- **A mode flag `allowLevelUp`** (`mpManager.js:37`, 7 callers incl. `turnManager.js:349/363`, `mosjeAbilities`, `questLogic`): 2.0 has no non-levelling gain; delete the parameter and the `mp-cap` test that asserts it.
- **Detecting getemt in a post-hoc sweep.** A sweep can fix "mp > 100 -> level up" (gain side, as a backstop) but cannot know whether a 0-MP Mosje was *just hit* (needs the event). Getemt must be decided inside the loss function.
- **Using `GAIN`/`DRAIN` string sources to decide semantics** beyond what exists (`COST` substring in U8 guard `mpManager.js:103`, `Quest...COST` at `:19`). Keep the substring contract until Phase 55 rewrites U8.

## MP-as-currency map (item 1) and Energy hook points

### A. Places that spend or check MP as a currency (must stop; Energy replaces)

| # | Site | What it does today | 2.0 action |
|---|------|--------------------|------------|
| 1 | `src/abilities/piecieEffects.js:884-897` `effect_welloe_force` | `applyDamage(player.activeSlots[si], 40)` tribute; needs `_pendingTargets.welloeForcePayerSlot` or no-ops (D-05/D-06) | Remove the MP payment and the payer requirement; Energy (`cost: 2`) is charged by `activatePiecie`. Keep the 3-turn redirect (`_welloeForceActive`) until Phase 59. |
| 2 | `src/main.js:2800-2830` Welloe Force branch | Filters Mosjes with `mp >= 40`, shows `modal.showTributePayerSelect`, blocks if none | Delete the branch; delete `showTributePayerSelect` (`modalManager.js:32, 771`) if no other user (grep `showTributePayerSelect` first) |
| 3 | `src/main.js:1541` and `:2615` | `loseMP(..., 20, 'QUEST_COST')` before a Quest roll | Remove (2.0 Quests have only the "First you must..." cost, Phase 56) |
| 4 | `src/bot/botDriver.js:448` | Bot pays `QUEST_ATTEMPT_COST` via `loseMP` | Remove |
| 5 | `src/bot/botDriver.js:205, 514-516`; `src/bot/strategy/assessQuestRisk.js:16, 85-90`; `src/ui/modalManager.js:754` (`hasEnoughMp`) | `mp >= 20` affordability gates | Remove the gate; `mpAtRoll = mosje.mp` |
| 6 | `src/abilities/mosjeAbilities.js:315-316,` call at `:322` (Ronald Strategic Insight, `loseMP(...20,'RONALD_INSIGHT')`) | MP-priced ability | Charge Energy (2.0 text: 2 Energy) instead |
| 7 | `src/abilities/mosjeAbilities.js:540-559` (Youri Speed Activate: `youriSlot.mp < 20`, `youriSlot.mp -= 20`) | MP-priced | Energy 1 |
| 8 | `src/abilities/mosjeAbilities.js:265-270` (Gandoe Destroyer: `< 80`, `-= 80`); UI `main.js:2038-2044` text "Pay 80 MP" | MP-priced | Energy 4 |
| 9 | `abilityCost` data: `mosjes.js:191` (80), `mosjes.js:344` (10); consumers `main.js:3477-3489` (`cantAffordAbility: slot.mp < cost`), `boardRenderer.js:113-124` ("Not enough MP", "MP" labels), `botDriver.js:197-205` | MP afford check/labels | Compare against `player.energy`; label "Energy" |
| 10 | `src/engine/mpManager.js:19, 103` and `src/rules/universal-rules.js:58-62`, `src/rules/helpers/U7_isCostPayment.js` | U7 "cost payment is not effect damage" | U7 becomes obsolete (no MP costs). Keep the `COST` substring bypass in `loseMP` until Phase 55 U8 rewrite; re-purpose U7 text to "Energy payment is not an MP loss". No tests reference `U7_*` other than `entry-protection.test.ts:129`. |
| 11 | `piecieEffects.js:710` `player.activeSlots[si].mp += discarded.mpCost` | Gains MP equal to a discarded card's `mpCost` | Not a currency; keep reading data `mpCost` (still present) but route through gain funnel. Flag for Phase 59 (effect text rewrite). |

`mpCost` **data** field: still read by UI card faces (`buildPiecieSpecV1.js:18`, `buildSnelleSpecV1.js:17`, `formatCost.js`, `deck-builder.js:291`, `modalManager.js:471`, `packOpeningOverlay.js:122`, `main.js:710`) and by one effect (#11). **Recommendation:** keep the data field this phase (UI faces are Phase 62), delete only the *engine/bot* consumers above, record "kept `mpCost` because card faces + effect_#11 still read it" in the SUMMARY.

### B. Where Energy hooks in (all currently absent)

| Hook | File:line | Change |
|------|-----------|--------|
| State | `gameState.js:87-120` `createPlayerState` | add `energy: 2`, `welloePile: []` |
| Refill | `turnManager.js:231` `startTurn`, after win check, before trickle (`:344`) | `gainEnergy(state, playerId, 1)` capped 6 |
| Piecie activation | `turnManager.js:862` `activatePiecie`, after validations (`:910`) and **before** `slot.faceDown=false; slot.activated=true` (`:934`) | `payEnergy(state, playerId, def.cost)`; return `{success:false,error:'Not enough Energy'}` if short. Chain/free activations (Chris DDR `turnManager.js:96-135`, Jisca, Lucky Draw) call effect functions directly, bypassing `activatePiecie`, so they are free by construction (matches handoff 2g). |
| Snelle | `turnManager.js:1053` `playSnellie` | charge `cardDef.cost` after validation, refund-free on failure |
| Place | `turnManager.js:1447` `playPlace` | charge `cardDef.cost` after "slots full" check (`:1460`) |
| Ability | `turnManager.js:1245` `useMosjeAbility`, after `abilityUsedThisTurn` check (`:1257`) and before `fn(...)` (`:1270`); Energy must be charged **only when `fn` succeeds** (abilities throw to signal "needs UI input", caught at `:1291`) so pay after success or pay on a clone and discard on failure | read cost from `src/rules/abilityEnergyCosts.js` |
| Summon | `turnManager.js:1171` `playMosje` | **Phase 55** (TABLE-01). Phase 54 only provides `payEnergy`; do not charge here. |
| Cheap UI affordability | `main.js:3489` | `cost > player.energy` |

**Fixture impact:** because real states always have `energy` (set in `createPlayerState`) but hand-built test states don't, charging in `activatePiecie`/`playSnellie`/`playPlace`/`useMosjeAbility` makes `canPay` refuse in every fixture lacking `player.energy`. Do **not** add a "no energy field = free" hack to the engine. Instead update fixtures (see Test Migration) and give the Playwright test hooks a `setEnergy` hook plus `energy: 6` default in `card-test-runner.js`.

## Level representation, readers, level-up, caps, floor (item 2)

### Decision: store levels 1-3 [recommended; CONTEXT asks research to decide]
- Today: 0-based, `gameState.js:140` ("0, 1, 2 - reach 3 to win"), `turnManager.js:1222` (`level: 0`), `confirmCallOfWelloes` `:1153` sets `slot.level = 1` (a Call-of-Welloes Mosje already "Level 1" = V4 second level), test hook default `level = 0` (`main.js:1013`).
- Mixed semantics already exist in effects: `piecieEffects.js:1078-1080` (`mosje.level || 1`, `>= 3` -> 40, `=== 2` -> 25) and `:1144` assume 1-based; `mosjeAbilities.js:810` (`[15,25,35][mosje.level]`) assumes 0-based. These disagree today; 1-based is what the 2.0 card texts use ("Level 2+").
- Migration sites (every reader of `level`):

| Layer | Sites |
|-------|-------|
| Slot creation | `gameState.js:127-152` `createMosjeSlot`, `turnManager.js:1213-1233` `createMosjeSlotFromDefinition`, `turnManager.js:1140-1160` Call of the Welloes, `turnManager.js:1202` saved-state restore, `piecieEffects.js:603-611` Mosje Reborn (revived slot keeps old fields), `main.js:1013-1030` test hook. **Collapse into one `createMosjeSlot(def, {level=1, mp})`.** |
| Engine rules | `mpManager.js:230-240, 275-285`, `victoryChecker.js:140` (`level >= 3`), the 3 `applyDamage` copies (`mosjeAbilities.js:28`, `piecieEffects.js:51`, `placeEffects.js:25`) |
| Abilities/effects | `mosjeAbilities.js:276` (Elimination Strike lowest-level, tie-break MP: order-preserving, safe), `:810` (Martin Driver table -> use `[15,25,35][level-1]` or fix by 2.0 text in Phase 58), `piecieEffects.js:139` (Ronald Kip `level < 2` gate: **remove**, 2.0 text has no gate), `:274` (Super Saiyan `level < 1`: **remove**, "All Level 1+ requirements disappear" handoff 2g), `:874`, `:1078-1080`, `:1144` (already 1-based) |
| Bot | `botDriver.js:152` (`level === 0` lethal-pressure), `:220`, `:240-243` (`(level||0) >= 1` "leveled threat"), `assessQuestRisk.js:57` (`level > 0` -> 'regress'), `:105` (`winsGame = levelsUp && level >= 2`) |
| UI | `main.js:878` (win text `level >= 3`), `:1767` (West `level === 0 && mp === 0`), `:2030-2040`, `:3484`, `:3634-3636` (the `+1`s), `cardV1/buildMosjeSpecV1.js:14` (`+1`), `cardRenderer.js:103,239,417-418` (`+1`/LVL), `modalManager.js:209,408,459` (`+1`), `hoverZoom.js:27,34` (`-1` parsing the DOM chip), `actionAnimations.js:90,366` (only compares, order-safe) |
| Tests/hooks | ~35 `level: 0` fixtures (list below), `tests/ui/helpers.js:170-190` doc comments, `card-test-runner.js:140-144` |

`levels[]` data (Phase 53): each Mosje has `levels: [{power, traits}, {…}, {…}]` (e.g. `mosjes.js:26`). `getPower` reads `MOSJES.find(id).levels[level-1].power` (the engine can import `MOSJES`, already imported in `gameState.js:5` and `turnManager.js`). On any level change also refresh `slot.traits = {...levels[level-1].traits}` (cheap, keeps Phase 56 Quest dice correct; flagged Claude's-discretion in Open Questions).

### Gain pipeline (RULE-02, RULE-09)
Current: `gainMP` (`mpManager.js:37-65`): `allowLevelUp` true adds then `checkLevelUp` with carry-over (`mosje.mp -= 100`, `:276`); false caps at 100. `checkLevelUp` stops at level 3 and keeps leftover MP (`:275-285`). `clampMosjeMp` (`victoryChecker.js:100-130`) clamps >100 and snaps to the 5-grid inside every `checkVictory`. `roundToFive` exists (`roundToFive.js:4`).

2.0 target (reference: `obby_desk_sim.py` `gain()`, lines 262-269):
```js
// Source: docs/obby-2.0/tools/obby_desk_sim.py:262-269 (reference only, not imported)
mp += amt
while (mp >= 100 && level < 3) { level += 1; mp = 0; levelledThisTurn = true }  // reset, NO carry-over
if (level === 3) mp = Math.min(mp, 95)
```
Note the sim loop would level L1->L3 on one huge gain only if `mp` stayed >= 100, but `mp = 0` after the first level-up, so **one gain levels at most once** (the Quest/Piecie cannot skip a level). Matches CONTEXT ("level +1, MP resets to 0").
Edge: at L3 a gain makes `mp = min(mp, 95)` - the `while` guard `level < 3` already prevents a 4th level. E7b: L3 90 + 25 = 95.
The existing safety net `clampMosjeMp` should become `normalizeMosjeMp`: >=100 at <L3 -> level-up (backstop for any missed direct mutation), L3 > 95 -> 95, non-multiple of 5 -> `roundToFive`, <0 -> 0. Keep it inside `checkVictory`.

**Never-a-gain paths (must not trigger level-up):** Leipe Swap (`turnManager.js:522-532` swaps `mp` raw; `piecieEffects.js:675-676`), MP Adjuster revert (`turnManager.js:316-319`, a `Math.max(0, mp - delta)`), Tactician "set MP" (Phase 58), `slot.mp = 50`/`5` restores. These write `mp` directly by design and must be allowed; the static guard test (below) must whitelist them explicitly by file:function.

**"Levelled this turn" marker:** R2 level-up protection is Phase 55/56, but the funnel is the only place that knows a level-up happened: set `slot.levelledUpTurn = state.turnNumber` there (cheap, sim does the same: `m.levelled_turn = s.turn`). Because slot-level functions don't see `turnNumber`, either pass `{turnNumber}` or set a transient `slot._justLevelled = true` consumed by the state wrapper. Recommend the wrapper stamps `levelledUpTurn`.

### MP floor, 5-grid, 100-cap today
- 100-cap on non-Quest gains: `mpManager.js:62`, `piecieEffects.js:98` (`Math.min(100, ...)`), `victoryChecker.js:118-121`, and the many `Math.min(100,...)`/`mp > 90 -> 90` forms (`piecieEffects.js:819-820` Dikke/clamp 60..90 - V4 effect, leave). All gone in 2.0.
- Floor: `Math.max(0, mp)` in `mpManager.js:243`, the three `applyDamage` copies, `turnManager.js:317`, `botDriver.js:112,2988`-style bot/UI direct writes (`main.js:2985-3008`, `botDriver.js:109-112` Varkenspootjes resolve: `mp += 60`, `mp = max(0, mp-30)` - **funnel these too**).
- roundToFive usage: `mpManager.js:198` (halving), `piecieEffects.js:92` (amplifier 1.5x), `questLogic.js:522` (Michelle half), `victoryChecker.js:123` snap. Keep.

## Getemt, defeat-at-0 today, Welloe pile, sideways (items 2 and 4)

### Current logic being replaced
- `loseMP` (`mpManager.js:221-243`): subtract, then `while (mp < 0)`: if `level === 0` set `mp=0; _pendingDefeat=true` (defeat-at-0 ruling, memory "Defeat at 0 MP rule": `< 0` threshold, exactly-0 survives); else `level -= 1; mp = 100 - overflow`. Same loop duplicated in the 3 `applyDamage` copies.
- `victoryChecker.applyPendingDefeats` (`:66-90`) sweeps `_pendingDefeat` -> `markMosjeDefeated` (`:175-233`): honours `WELLOE_SHIELD` (mp=5, stays), "Not Today!" flag (`_snelleFlags.negateNextElimination`, mp=5), then **pushes the Mosje to `player.graveyard`** (`source: 'defeated'`, `:212`) and nulls the slot.
- 2.0 differences: threshold is `<= 0` (not `< 0`), **only if final loss > 0**, level math is "level-1 at 50", and the destination is a separate Welloe pile.

### Does a Welloe pile / graveyard exist? (item 4)
- `player.graveyard` (typed entries `{cardId,name,type,source}`; Phase 23) is the **only** pile. "Welloe pile" today = `graveyard` entries with `type: 'MOSJE'`. Readers: `getGraveyardByType(player,'MOSJE')` used by Mosje Reborn (`piecieEffects.js:594-612`) and Call of the Welloes (`:861-877`), `main.js:874-880` (win text "last to fall"), UI discard pile renderer (memory: every defeated card must show in the visual discard pile).
- **There is no `welloePile` and no "separate from discard" concept.** Recommendation: add `player.welloePile: []` in `createPlayerState`; `markMosjeDefeated` pushes `{...mosje, type:'MOSJE', source:'welloe'}` there instead of `graveyard`; re-point Mosje Reborn / Call of the Welloes / the `main.js:874` text to `welloePile` (small edit) so their tests keep a meaningful meaning. The `unified-graveyard.test.ts` case for defeated Mosjes and `call-of-welloes*.test.ts`, `mosje-reborn-graveyard.test.ts` change fixtures from graveyard to welloePile. **Conflict to flag:** memory "Discard pile rule" says defeated cards must appear in the visual discard pile; 2.0 explicitly says the Welloe pile is separate (handoff 2f). The 2.0 doc wins; the UI to show it is Phase 63. Until then a defeated Mosje is visible only in the battle log (`main.js:3636-3640` "was defeated"). Record this in the SUMMARY.
- Tesla destruction on Coert defeat (`victoryChecker.js:202-207`), `summonedByPiecie` link cleanup (`:215-230`) stay as-is.

### Sideways / "skips its owner's next turn" - recommended flagging
The sim shows sideways is **per-Mosje inactivity, not a lost player turn** (`obby_desk_sim.py:594-596`: a sideways Mosje is skipped in the action list and `skip_done=True`; `:575-579`: at end of the owner's turn it stands up). Handoff 2d: "A Mosje that isn't fresh **and isn't sideways** chooses...; Sideways Mosjes can be attacked." So the owner keeps playing cards that turn.
- State: `slot.sideways = true` set by `applyGetemt` (L1). `slot.sidewaysArmed` is set in `startTurn(owner)` for the owner's sideways Mosjes (so "next turn" is correct even if the getemt happened during the owner's own turn or the opponent's). In `endTurn(owner)`, any slot with `sideways && sidewaysArmed` -> `sideways=false; delete sidewaysArmed`.
- Do **not** reuse `player.skipNextTurn` (`turnManager.js:239-256`): that is the V4 deck-out whole-turn skip, which Phase 55 replaces with the cooldown turn.
- Phase 54 boundary: expose `isSideways(slot)` / `canMosjeAct(slot)` and wire it where actions exist today: `useMosjeAbility` (block), Quest target eligibility (UI `modalManager.js:754` picker disables, bot `runQuestPhase`). Attack/Quest "one action" enforcement is Phase 56.
- Welloe `getemt-while-sideways`: `applyGetemt` sets `slot._pendingWelloe = true` (mirror of `_pendingDefeat`); the sweep in `checkVictory` (renamed `applyPendingWelloe`) calls `markMosjeDefeated`, which keeps the existing shield/Not-Today interception.

## Loss pipeline (RULE-09): current order vs required

Current `loseMP` order (`mpManager.js:77-255`): Welloe-Force redirect (`:82`) -> U8 entry-protection fizzle (`:98-108`) -> Void (`:112`) / Momentum Factory attack block (`:117`) -> Drain Zone +10 (`:124`) -> **Stabilizer cap 30 (`:129`)** -> Zo is Natuur cap 25 (`:140`) -> Coert's Caravan shield (`:144`) -> Snelle flags (negate/dodge/reversal, early returns with raw `mp += 15`/`Math.max` writes, `:161-191`) -> MP_LOSS_HALVED (`:194`) -> MP_LOSS_REDUCTION (`:204`) -> Protector flag (`:213`) -> subtract.

Required order: base -> reductions -> **Stabilizer cap** -> round to 5 / floor 0 -> if 0 no loss. So the Stabilizer cap must **move after** the reducers (today it runs before them), and Zo is Natuur must become a reducer (2.0 "reductions (pets, Afblijven!, Laat me chillen!, Zo is Natuur, Flow, reaction Snelle)") - for Phase 54 keep its V4 effect but register it as a reducer step so the order is right. Keep the *pre-pipeline gates* (redirect, entry-protection, Void, Factory) ahead of the pipeline: they are "prevent entirely" not "reduce".
Recommended `lossSteps.js`: an exported ordered object `{ reducers: [], caps: [] }` of pure `(ctx) => newAmount` functions where `ctx = { state, target, amount, source }`. Phase 54 registers the existing V4 reducers (halve, flat reduction, Protector, Zo is Natuur, Caravan) and the Stabilizer cap; Phases 58-60 add more. "Emergency Healings adds MP *before* the loss" = a pre-hook (`beforeLoss[]`) - include the empty array now.
Tracking: `totalDamageTaken` (`mpManager.js:246`) and `mpLostThisTurn` (`:250`) should record the **final** amount (after reductions), not raw. (Test `mp-level-regression.test.ts:84-100` asserts raw accumulation; it is being rewritten anyway.) Alyssa's "taksed 30+ in one turn" reads `mpLostThisTurn`.

## Win / lose and turn-start hooks (item 3)

Current `checkVictory` (`victoryChecker.js:24-54`) is called after nearly every action (`playPiecie :706`, `activatePiecie :942,954,1036`, `playSnellie :1124`, `playMosje :1209`, `useMosjeAbility :1346`, `endTurn :535`, `resolveQuest` end `questLogic.js:~495`, `markMosjeDefeated :232`). Win reasons today: `LEVEL_3` (instant, `:139-142`), `KNOCKOUT` (all of the *opponent's field slots* null/defeated, `:146-153`; ignores hand/deck), `QUEST_MASTER` (7 quests, `:156`), `MOMENTUM_DOMINATION` (250 MP, only when `state.momentumCheckPhase`, `:161-164`, set around `turnManager.js:336-338`). UI text for each in `main.js:866-905`.

2.0 changes:
1. Delete `LEVEL_3` from `getWinReason`; add `checkWin(state, playerId)`: any `activeSlots` Mosje with `level === 3` (and not defeated) -> FINISHED, `winReason: 'LEVEL_3'`. Call it as the **first statement of `startTurn`** (`turnManager.js:231`), *before* the deck-out skip branch (`:240`) so a skipped player still wins. "Still there" is automatic (checked only at the owner's start of turn).
2. Delete `QUEST_MASTER` and `MOMENTUM_DOMINATION` (not in 2.0; no tests reference them - verified by grep) and the `momentumCheckPhase` plumbing (`turnManager.js:335-338`, `tests/engine/deck-out.test.ts:23`, `tests/helpers/testHelpers.js:141` fixtures set it to false harmlessly; leave fixture fields).
3. Replace `KNOCKOUT` with `checkLoss`: a player loses when they have **no Mosje on field (non-defeated) and none in `hand` (type MOSJE) and none in `deck`**. Keep the `winReason` string `'KNOCKOUT'` (UI `main.js:880` + `card-chains.spec.js` refer to it) but change the text. `checkLoss` runs inside `checkVictory` so it fires right after the last Mosje goes to the Welloe pile (E8).
   - Empty field but Mosje still in hand/deck is **not** a loss (R1 refills it in Phase 55). In Phase 54 that player simply has an empty field until Phase 55; the bot/engine must not crash on an empty field (guard `getFirstActiveSlotIndex` callers - they already return -1 handling in most effects).
4. `main.js:866-905` win-reason text: `LEVEL_3` text becomes "held Level 3"; remove the QUEST_MASTER/MOMENTUM cases.

Simultaneous loss+win edge: both players can't both have `checkLoss` true in one action in practice; evaluate `checkLoss` for the non-active players first, keep deterministic player order.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| 5-grid rounding | custom rounding per effect | existing `roundToFive` (`src/engine/roundToFive.js`) | already the project rule (memory "MP five-grid rule") |
| State cloning | structuredClone variants | existing `JSON.parse(JSON.stringify())` pattern | whole engine is JSON-plain for Firebase sync; Node 24 fine |
| Seeded randomness in tests | new RNG | existing Math.random override pattern in `tests/bot/offlineGame.smoke.test.ts:12-20` | deterministic dice for bot-vs-bot smoke |
| Test hooks | new global | existing `window.__testHooks` in `main.js:995-1075` (add `setEnergy`) | CLAUDE.md mandates hook-based repro, gated by `testMode=true` |
| Level-up protection flag, fresh flag | new systems | existing U8 `entryProtected` (extended in Phase 55) | don't invent parallel flags now |

**Key insight:** every "new" 2.0 behaviour here has a V4 ancestor that works on the *state* level (`loseMP`) but is duplicated at the *slot* level in effect files. The work is consolidating the duplicate, not inventing mechanisms.

## Runtime State Inventory

Not a rename/migration phase in the datastore sense, but it changes the **shape of persisted/synced game state**. Explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Firebase/P2P synced `gameState` JSON (`src/multiplayer/`). New fields `player.energy`, `player.welloePile`, `slot.sideways`; `slot.level` semantic shift 0-based -> 1-based; removed `winReason` values. In-flight V4 games would mis-read. | Code edit only; no durable store of live games is migrated (games are ephemeral). Note in SUMMARY that mid-game sessions across the deploy boundary are not supported (2.0 deploys separately at `/obbycardgame2`, Phase 64). |
| Live service config | None - verified: no external service stores level/MP/cost rules (2.0 is a separate Firebase project per roadmap). | None |
| OS-registered state | None - verified by scope (browser game). | None |
| Secrets/env vars | None - no secret keys reference these mechanics. | None |
| Build artifacts | None - raw `.js`, no build step (CLAUDE.md). | None |

## Common Pitfalls

### Pitfall 1: Gains/losses that bypass the engine (the big one)
**What goes wrong:** ~60 direct `slot.mp +=/-=` writes (grep: `mosjeAbilities.js:64,159,183,196,210,236,265,381,432,465,553,585,811,859`; `piecieEffects.js:98,308,611,675,710,769,795,800,819,996,1011,1017,1044,1066`; `placeEffects.js:51-53,79,84,104,134,159,177,218,265,363,387-411,433-444,472-479`; `questLogic.js:132,138,522-526,561,589`; `snelleEffects.js:19,56,72,154,209,235`; `turnManager.js:317,528,950,1152`; `botDriver.js:109-112`; `main.js:961,1438,2953,2985-3008`) will exceed 100 / go below 0 without levelling or getemt.
**Why it happens:** effects clone state and mutate the slot object in place; `gainMP`/`loseMP` need `(state, playerId, slotIndex)`.
**How to avoid:** slot-level funnel + mechanical replacement + backstop `normalizeMosjeMp` in `checkVictory` + a static guard test (`tests/engine/no-direct-mp-writes.test.ts`) that reads `src/abilities/*.js`, `src/bot/*.js`, `src/main.js` and fails on `\.mp\s*(\+|-)=` outside an explicit allow-list (Leipe Swap, MP Adjuster revert, the funnel files).
**Warning signs:** a Mosje displayed at 105 MP or -5 MP; level-up works only after a Quest.

### Pitfall 2: Level 0 fixtures and the off-by-one
**What goes wrong:** `level: 0` fixtures mean "Level 1" in V4 but are now invalid; code that does `levels[level-1]` gets `levels[-1]` -> `undefined` -> `getPower` NaN.
**How to avoid:** `getPower` clamps `level` into 1..3; one codemod pass `level: 0` -> `level: 1` in tests (35 occurrences, list in Test Migration); `createMosjeSlot` is the only factory. Test hook default 0 -> 1.

### Pitfall 3: Charging Energy breaks every fixture without `energy`
**What goes wrong:** ~10 vitest files + the whole Playwright `cards` project (`card-test-runner.js` plays/activates every card) start failing with "Not enough Energy".
**How to avoid:** do the Energy charging in its own plan *after* adding the fixture/hook support in the same plan; give `setEnergy` hook and `energy: 6` in `card-test-runner.js` setup; fixtures get `energy: 6`. Do **not** add engine leniency.

### Pitfall 4: Getemt inside the same loop as MP == 0 loss-of-zero
**What goes wrong:** Writing `if (mp <= 0) getemt` after the clamp triggers getemt for a "0 loss" or for a Mosje already at 0 that took no damage (E6).
**How to avoid:** compute `final` first; `if (final <= 0) return unchanged` *before* touching MP; test with a shield reducing 15 -> 0 on a 0-MP L1 Mosje (E6).

### Pitfall 5: Reducer ordering regression (Stabilizer before halving)
**What goes wrong:** keeping the V4 order gives different numbers than 2.0 (e.g. 80 loss, halved: 2.0 = 40 -> capped 30; V4 = capped 30 -> halved 15).
**How to avoid:** unit test with explicit numbers asserting the 2g order.

### Pitfall 6: Win check placed after the deck-out skip, or kept in `checkVictory`
**What goes wrong:** instant win on reaching L3 (violates E7) or a skipped player never wins.
**How to avoid:** `checkWin` first line of `startTurn`; delete the L3 branch from `getWinReason`; E7 test asserts `status` stays `PLAYING` after the level-up and flips at the owner's next `startTurn`.

### Pitfall 7: Editing generated card data
**What goes wrong:** `src/data/mosjes.js` is produced by `scripts/obby2/*.mjs` (Phase 53); hand-added fields (`abilityEnergy`) get overwritten on the next regeneration.
**How to avoid:** keep ability Energy costs in `src/rules/abilityEnergyCosts.js` keyed by `abilityId`, with a data test that regex-checks `abilityDescription` ("pay N Energy") against the map.

### Pitfall 8: The bot "stalls" or throws, not loops
**What goes wrong:** assumed risk "bot loops forever when nothing is affordable".
**Reality (verified):** every bot phase iterates a fixed list and `continue`s on `success:false` (`botDriver.js:272-298, 331-355, 360-376, 384-396`); turn end is unconditional (`:410-416`). There is no unbounded `while`. The real risks are (a) the bot wasting its turn trying unaffordable cards (harmless), (b) games not finishing within the smoke test's 60-turn cap now that wins need a hold (`offlineGame.smoke.test.ts:34, 81, 91`), (c) `QUEST_ATTEMPT_COST` import breaking `strategy.test.ts:11`.
**How to avoid:** relax the two V4-deck smoke tests (they assert `FINISHED`); the Example-Deck smokes (`:96-110`) only assert no-throw and already tolerate non-finish.

### Pitfall 9: Games that never end
**What goes wrong:** with hold-L3 win, no Mosje attacking yet (Phase 56) and only Quests/Piecies feeding MP, both bots may stall.
**How to avoid:** accept non-termination for this phase (CONTEXT: "may play oddly until 55-57"); do not assert `FINISHED` in any new smoke; add a dedicated deterministic E7 unit test instead of relying on a bot game.

### Pitfall 10: UI shows Level 2 for a fresh Mosje
**What goes wrong:** after switching to 1-based, leftover `+1` display adaptors show "Lv 2" for a new Mosje and "Lv 4" for L3 (`buildMosjeSpecV1.js:14`, `cardRenderer.js:103`, `modalManager.js:408,459`, `main.js:3635-3636`, `hoverZoom.js:27,34` converts DOM text back with `-1`).
**How to avoid:** remove every `+1`/`-1` in one plan; the card-v1 vitest files (`tests/ui/card-v1-mosje.test.ts`) assert the displayed level and must be updated in the same plan.

## Code Examples

### Slot-level gain (target)
```js
// Source: derived from obby_desk_sim.py:262-269; project rule roundToFive
import { roundToFive } from '../roundToFive.js';
import { MOSJES } from '../../data/mosjes.js';

export function applyGainToSlot(slot, amount) {
  if (!slot || slot.isDefeated || !(amount > 0)) return { leveled: false };
  slot.mp = roundToFive(slot.mp + amount);
  let leveled = false;
  while (slot.mp >= 100 && slot.level < 3) {
    slot.level += 1; slot.mp = 0; leveled = true;   // no carry-over
    refreshTraits(slot);
  }
  if (slot.level === 3 && slot.mp > 95) slot.mp = 95;
  return { leveled };
}
```

### Getemt (target)
```js
// Source: docs/obby-2.0/tools/obby_desk_sim.py:248-260 + handoff 2b
export function applyGetemt(slot) {
  if (slot.level >= 2) { slot.level -= 1; slot.mp = 50; refreshTraits(slot); return 'dropped'; }
  if (slot.sideways)   { slot._pendingWelloe = true; slot.mp = 0; return 'welloe'; }
  slot.mp = 0; slot.sideways = true; return 'sideways';
}
```

### One loss, in 2g order
```js
export function resolveMpLoss(ctx) {            // ctx: {state, target, amount, source}
  let a = ctx.amount;
  for (const r of LOSS_STEPS.reducers) a = r({ ...ctx, amount: a });
  for (const c of LOSS_STEPS.caps)     a = c({ ...ctx, amount: a });
  a = Math.max(0, roundToFive(a));
  return a;                                      // 0 => caller returns with NO getemt
}
// caller: const final = resolveMpLoss(ctx); if (final <= 0) return state;
//         slot.mp -= final; if (slot.mp <= 0) applyGetemt(slot); slot.mp = Math.max(0, slot.mp)
```

### Energy
```js
export function payEnergy(state, playerId, amount) {
  const p = state.players[playerId];
  if (!Number.isInteger(amount) || amount < 0) return { state, success: false, error: 'Invalid cost' };
  if ((p?.energy ?? 0) < amount) return { state, success: false, error: 'Not enough Energy' };
  p.energy -= amount; return { state, success: true };
}
```

## State of the Art (V4 -> 2.0 on this branch)

| Old (V4) | New (2.0) | Impact |
|----------|-----------|--------|
| level 0..3, 3 = instant win | level 1..3, hold L3 to next own turn | `getWinReason` L3 branch removed; `startTurn` gets `checkWin` |
| level-up carries leftover MP, only Quests level, others cap 100 | reset to 0, any gain levels, L3 cap 95 | delete `allowLevelUp`; `mp-cap` test rewritten |
| below-0 at Level 0 = defeat; else regress with `100 - overflow` | `<= 0` after a loss > 0: L2-3 -> level-1 @50, L1 -> sideways, again -> Welloe | 4 duplicate loops replaced by `applyGetemt` |
| KNOCKOUT = opponent's field empty | lose = no Mosje on field+hand+deck | `checkLoss` |
| QUEST_MASTER (7 quests), MOMENTUM_DOMINATION (250 MP) wins | gone | remove + UI text |
| MP spent on Welloe Force (40), Quest attempts (20), 3 abilities | Energy only | see map |
| Welloe pile == graveyard Mosje entries | separate `player.welloePile` | Reborn / Call of the Welloes re-pointed |

**Deprecated/outdated here:** `docs/phase0-rulings.md`, `docs/card-reference.md`, `docs/developer-handoff.md` still describe V4 and are rewritten in Phase 55 (roadmap note). CLAUDE.md verification step 3 (`node --loader ts-node/esm src/simulation/run-once.ts`) references a path that no longer exists (memory "Build/test/sim commands") - use the Node smoke instead and say so.

## Test Migration (item 5): V4 tests that encode MP/level/victory rules

Baseline: 93 files / 968 tests green. Counts of `level: 0` fixtures per file are exact greps. "Fixture-only" means the test's intent survives; just set `level: 1` (and `energy: 6` where noted).

### A. REWRITE to 2.0 (assertions encode a V4 rule)
| File | V4 rule encoded | Recommendation |
|------|-----------------|----------------|
| `tests/engine/mp-level-regression.test.ts` (101 lines, 10 cases) | overflow regress `100 - overflow`, Level 0 clamp, raw `mpLostThisTurn` | **Rewrite** as `getemt.test.ts` covering E4 (L2/L3 -> level-1 @50), E5 (L1 sideways -> stand up -> Welloe), E6 (reduced-to-0 no getemt incl. at 0 MP). Keep the `totalDamageTaken`/`mpLostThisTurn` cases but assert *final* amounts. Delete the old file. |
| `tests/engine/defeat-at-zero-mp.test.ts` (133 lines, 8 cases) | Level 0 `<0` defeat, exactly-0 survives, `KNOCKOUT`, WELLOE_SHIELD | **Rewrite**: sideways-then-Welloe replaces defeat; exactly-0 *with loss > 0* now getemts; keep WELLOE_SHIELD + Not-Today saves (mp=5) and KNOCKOUT-after-last-Welloe (E8). |
| `tests/engine/mp-cap.test.ts` (75 lines, 6 cases) | non-Quest gain caps at 100 without level-up; Quest gain levels with carry | **Rewrite**: any gain levels, reset to 0, E3, E7b (L3 90+25=95), grid snap. Drop `allowLevelUp` cases (4 refs). |
| `tests/engine/instant-win-level3.test.ts` (97 lines, 2 cases) | win the instant L3 is reached; overshoot keeps leftover | **Rewrite** as E7: reaching L3 -> `PLAYING`; `startTurn` of owner -> `FINISHED/LEVEL_3`; losing L3 in between -> no win. |
| `tests/engine/quest-mp-cost.test.ts` (132 lines) | 20 MP Quest attempt cost | **Delete** (cost removed). |
| `tests/data/mp-cost-tribute-audit.test.ts` (4 cases) | only Welloe Force has `mpCost > 0` (40) | **Rewrite** as a guard: no `mpCost` read in `src/engine`, `src/abilities`, `src/bot` (grep test); drop the "mpCost === 40" assertion (data field kept, but no longer a currency). |
| `tests/abilities/welloe-force-tribute.test.ts` | deducts exactly 40 MP from chosen payer | **Rewrite**: Welloe Force no longer spends MP; redirect state still set; Energy 2 charged by `activatePiecie` (separate test). |
| `tests/ui/welloe-force-tribute.spec.js` (Playwright) | tribute payer picker | **Delete** (picker removed). |
| `tests/ui/general-quest-affordability.spec.js` (Playwright) | `mp >= 20` gate, 20 MP deducted | **Delete** (gate removed; Phase 56 adds Quest UI specs). |
| `tests/bot/offlineGame.smoke.test.ts` cases 1-2 (`PHYSICAL_FORCE vs DIGITAL_CONTROL`, `ARTISTIC_RHYTHM vs PHYSICAL_FORCE` assert `FINISHED` in 60 turns, lines 76-92) | V4 instant L3 win ends bot games | **Delete** those two (V4 decks are disabled by Phase 53). Keep the two Example-Deck no-throw smokes (`:96-110`); add Energy/level invariants (no mp > 100, no mp not multiple of 5, level in 1..3, energy 0..6) over the run. |
| `tests/bot/strategy.test.ts` (QUEST_ATTEMPT_COST import `:11`, `:121`, levels `:189-218`, severity `:300-335`, 5 `level: 0` fixtures) | 20 MP gate; 100-MP-levels-up with carry; fatal at Level 0; `regress` at level>0 | **Rewrite affected cases**: remove cost gate, levels-up = `mp + gain >= 100`, winsGame always false (reach L3 ≠ win), severity: L1 not sideways = "sideways risk", L1 sideways = fatal, L2+ = "regress". Keep `classifyLossSeverity` name. |
| `tests/bot/botDriver.test.ts` (1 `level: 0` fixture `:68`; `:365-371` "level to lose") | Level 0 fatal vs level to lose | **Rewrite** the two level cases to L1 vs L2. |

### B. Fixture-only edits (`level: 0` -> `level: 1`, and `energy: 6` where it calls a charged entry point)
`tests/bot/strategy.test.ts` (5), `tests/engine/first-turn-quest-lock.test.ts` (3, uses `createInitialGameState`), `tests/abilities/dead-flag-engine.test.ts` (3; calls `useMosjeAbility`/`activatePiecie`: needs energy), `tests/engine/west-calculated-guess.test.ts` (2), `tests/engine/stub-engine-wiring.test.ts` (2; charged entry points: needs energy; `:375` comment on abilityCost), `tests/engine/piecie-persist-eot.test.ts` (2; needs energy), `tests/engine/geen-raad-vraag-aad.test.ts` (2), `tests/engine/aad-recovery.test.ts` (2), `tests/abilities/amplifier-hacker-rework.test.ts` (2; needs energy), `tests/engine/snelle-piecie-full-slots.test.ts` (1; needs energy), `tests/engine/quest-threshold.test.ts` (1), `tests/engine/quest-haven-double-quest.test.ts` (1), `tests/engine/momentum-master.test.ts` (1), `tests/engine/food-double-synergy.test.ts` (1), `tests/engine/entry-protection.test.ts` (1; also needs energy; `:135` and `:129-141` use the `QUEST_COST` source label: keep passing because the `COST` substring bypass stays until Phase 55), `tests/engine/deck-out.test.ts` (1), `tests/engine/alyssa-jisca-synergy-resolver.test.ts` (1), `tests/bot/botDriver.test.ts`.
Charged-entry-point callers needing `energy` (from grep): `tests/abilities/ability-text-reconciliation.test.ts`, `amplifier-hacker-rework.test.ts`, `dead-flag-engine.test.ts`, `tests/effects/thematic-piecies.test.ts`, `tests/engine/entry-protection.test.ts`, `piecie-persist-eot.test.ts`, `place-synergy-chamber.test.ts`, `snelle-piecie-full-slots.test.ts`, `stub-engine-wiring.test.ts`, `tests/ui/general-quest-mosje-select.test.ts`.
`tests/engine/place-coerts-caravan.test.ts:75` ("does not prevent Quest attempt costs") and `entry-protection.test.ts:129-141` keep the `QUEST_COST` source label; fine since `loseMP` still accepts arbitrary source strings. Expected numeric drift: any test that asserts exact MP after a loss with `Math.ceil`/V4 clamp rules or Stabilizer-before-halving (`tests/engine/mp-five-grid.test.ts` halving case stays valid).
Level-display tests: `tests/ui/card-v1-mosje.test.ts` (4 `level` refs; the `+1` removal changes expected chips).
Welloe re-point (fixture graveyard -> welloePile, rewrite): `tests/abilities/call-of-welloes.test.ts` (12 level refs), `call-of-welloes-graveyard.test.ts`, `mosje-reborn-graveyard.test.ts`, `tests/engine/unified-graveyard.test.ts` (defeated-Mosje entry).
Level-gate removal: any test asserting Ronald Kip or Super Saiyan refuse at low level (grep `level 2 required` in `tests/` returned none; recheck during execution).

### C. Playwright (not part of `npm test`; headless, run subsets)
`tests/ui/cards/*` (the data-driven card-test-library): needs `energy` seeding (add `setEnergy` hook; set 6 in `card-test-runner.js`), `setMosjeOnField` default level 0 -> 1 (`main.js:1013`), and specs with explicit `level: 0`: `card-chains.spec.js` (5; chain A asserts defeat-at-0 KNOCKOUT with Affoe `-15` on 5 MP: rewrite to sideways -> Welloe -> KNOCKOUT or delete the chain), `deckout-banner.spec.js` (2), `deckout-hang-repro.spec.js` (2), `cinema/deckout-recycle-cinema.spec.js` (2), `onfield-ability-clamp.spec.js` (1), `cinema/arena-hover.spec.js`, `cards/cardv1-mosje.spec.js`, `cards/cardv1-board.spec.js`, `full-game.spec.js:310-351` (L2 90 MP -> level-up -> win text). Entry point for a Phase-54 gate: run only `entry-protection.spec.js`, `deckout-banner.spec.js`, `cards/cardv1-mosje.spec.js` and a 5-card sample of `piecie-effects.spec.js` (headless). Do NOT run `npm run test:sim` (2 h, old decks).

### D. Ronald Kip stacking test
There is **no file named for it**; the stacking coverage is `tests/engine/food-double-synergy.test.ts` (Kannetje Melk 25 -> 50 with Binti+Coert; asserts `20 + 50 = 70`, `20 + 25 = 45`) via `applyMPGain` (`piecieEffects.js:88`, 1.5x amplifier + `roundToFive`), plus the Playwright registry entry `piecie_ronald_kip` (`tests/ui/cards/card-registry.js:192`, "requires Lv2" per `card-test-runner.js:140`). `docs/developer-handoff.md:59` and `phase0-rulings.md:205` still call it the "Ronald Kip stacking test". **Recommendation:** keep `food-double-synergy.test.ts` (it keeps passing under 2.0 if gains stay on the 5-grid and below 100: 20+50=70), and **add** `tests/engine/ronald-kip-stacking.test.ts` in plan 54-06: Kip 50 / 60 with Ronald Chef / 100 with Binti+Coert double; a gain that reaches 100 levels up and resets to 0; amplifier 1.5x stays on the 5-grid. Remove the Ronald Kip `level < 2` gate (`piecieEffects.js:139`) so the 2.0 text ("gains 50 MP") holds; adjust the Playwright registry's `ownLevel` accordingly.

## Recommended Wave / Plan Breakdown (item 6)

| Plan | Wave | Goal | Req | Depends |
|------|------|------|-----|---------|
| **54-01** Levels 1-3 + single slot factory + Energy state | 1 | Switch storage to 1-3; one `createMosjeSlot` (level 1, `sideways:false`) used by `createPlayerState`, `playMosje`, Call of the Welloes, Mosje Reborn, test hook; remove all `+1`/`-1` display adaptors and V4 level gates (Ronald Kip `:139`, Super Saiyan `:274`); `player.energy=2`, `player.welloePile=[]`; `energy/` files (`canPay/payEnergy/gainEnergy`); `startTurn` +1 Energy (E1); test hooks `setEnergy`, `setMosjeOnField` default level 1; codemod `level: 0` -> 1 in tests; update card-v1 level display tests. | RULE-01 (state), RULE-02 | -- |
| **54-02** Gain pipeline, grid, Power | 2 | `applyGainToSlot`, `checkLevelUp` (reset-to-0, L3 cap 95), `getPower`, `normalizeMosjeMp` replacing `clampMosjeMp`; `gainMP` wrapper (drop `allowLevelUp` and its 7 call-site args); `levelledUpTurn` stamp. Tests E3, E7b, E14, E27 (gain side). Rewrite `mp-cap.test.ts`. | RULE-02, RULE-09 | 54-01 |
| **54-03** Energy replaces MP as currency | 2 (parallel; disjoint files from 54-02) | Charge Energy in `activatePiecie`/`playSnellie`/`playPlace`/`useMosjeAbility`; `abilityEnergyCosts.js`; remove Welloe Force tribute (engine + UI picker + tests), the 20 MP Quest cost (3 sites + gates + `QUEST_ATTEMPT_COST` users), Ronald/Youri/Gandoe MP costs; UI/bot affordability against Energy; U7 text; add `energy: 6` to fixtures that call charged entry points; delete/rewrite tests in Test Migration A. | RULE-01 | 54-01 |
| **54-04** Loss pipeline, getemt, sideways, Welloe pile | 3 | `resolveMpLoss` + `lossSteps` registry (V4 reducers registered, Stabilizer after reducers), `applyGetemt`, `loseMP` wrapper, `_pendingWelloe` sweep, `markMosjeDefeated` -> `welloePile` (shield / Not-Today stay), `sideways` arm/stand-up in `startTurn`/`endTurn`, `canMosjeAct` wired into `useMosjeAbility`, re-point Reborn/Call of the Welloes. E4, E5, E6 + E27 (loss side). Rewrite `mp-level-regression`, `defeat-at-zero-mp`. | RULE-03, RULE-09 | 54-02 |
| **54-05** Win / lose | 4 | `checkWin` first in `startTurn`; remove `LEVEL_3`/QUEST_MASTER/MOMENTUM from `getWinReason` and `momentumCheckPhase`; `checkLoss` (field+hand+deck); UI win text. E7, E8; rewrite `instant-win-level3`. | RULE-04 | 54-04 |
| **54-06** Funnel the direct mutation sites + guard + gate | 4 (parallel with 54-05: disjoint files, but both touch `main.js` text lines - sequence 54-06 after if the executor can't merge) | Replace the 3 `applyDamage` copies, `applyMPGain` and ~60 direct `.mp` writes in `src/abilities`, `turnManager`, `botDriver`, `main.js` with the funnel; static guard test; bot keep-alive edits (`assessQuestRisk`, `botDriver` level/cost); `ronald-kip-stacking.test.ts`; smoke invariants; run the full CLAUDE.md verification; SUMMARY lists every rewritten/deleted test. | RULE-02, RULE-03, RULE-09 | 54-04 |

Why this order: 54-01 first because every later plan assumes 1-based levels and the single slot factory. 54-02 and 54-03 touch disjoint files (`src/engine/mp/*`+`mpManager.js`+`victoryChecker.js clamp` vs `turnManager activate*/main.js/bot/abilities cost lines`) so they can run in parallel. 54-04 needs the gain funnel's slot API. 54-06 last because it needs both slot-level APIs and is the broadest mechanical edit.

### Risks per plan
- **Bot loops when nothing is affordable:** not a loop risk (see Pitfall 8); only wasted attempts. Bot keeps alive; real Energy planning is Phase 61.
- **Games never ending:** expected until Phases 56-57; no new test may assert `FINISHED` from bot play.
- **UI reading level 0 / "Lv 2" on a fresh Mosje:** Pitfall 10; fixed wholly in 54-01 with its own vitest assertions.
- **Charging Energy before fixtures/hook exist:** Pitfall 3; the same plan (54-03) adds fixture energy and hooks.
- **54-06 size:** ~60 mechanical edits across 6 files; split per file into tasks (one commit each) so `npm test` can be run between tasks.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | `node --check`, vitest | yes | v24.12.0 | -- |
| Vitest | `npm test` | yes | 2.1.9 | -- |
| Playwright | headless UI/card specs | yes | 1.60.0 | skip Playwright subset, report honestly |
| `ts-node` run-once sim (`src/simulation/run-once.ts`) | CLAUDE.md step 3 | no (path removed, memory) | -- | Node smoke in `npm test`; one short headless sim spec at most |
| Full sim (`npm run test:sim`) | -- | present but forbidden (2 h, old decks) | -- | do not run |

**Missing dependencies with no fallback:** none.

## Validation Architecture

> `workflow.nyquist_validation` is absent in `.planning/config.json` (only `commit_docs`, `workflow.use_worktrees`), so this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 (engine, node env) + Playwright 1.60.0 (UI/cards, headless) |
| Config file | `vitest.config.ts` (include `tests/**/*.ts`); `playwright.config.js` (projects `tiers-webkit`, `visual`, `sim`, `cards`) |
| Quick run command | `npx vitest run tests/engine tests/data` (~3-5 s) |
| Full suite command | `npm test` (93 files / 968 tests baseline, ~10 s) |
| Syntax gate | `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` (plus any new engine file touched) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RULE-01 (E1) | Energy starts 2; +1 at own turn start; cap 6; carries over; payment > pool refused (no negative, no partial) | unit | `npx vitest run tests/engine/energy.test.ts` | Wave 0 |
| RULE-01 | `activatePiecie`/`playSnellie`/`playPlace`/`useMosjeAbility` charge `cost` and refuse when short; chain/free activations are free | unit | `npx vitest run tests/engine/energy-charging.test.ts` | Wave 0 |
| RULE-01 | No MP spent anywhere: guard that `src/engine`, `src/abilities`, `src/bot` never read `mpCost`/charge `QUEST_COST`; Welloe Force leaves MP unchanged | unit/grep | `npx vitest run tests/data/mp-cost-tribute-audit.test.ts tests/abilities/welloe-force-tribute.test.ts` | exists, rewrite |
| RULE-02 (E3) | 95 + 10 from a Piecie -> level +1 at 0 MP, no carry-over | unit | `npx vitest run tests/engine/level-up.test.ts` | Wave 0 |
| RULE-02 (E7b) | L3 at 90 + 25 -> 95; L3 never exceeds 95 | unit | same file | Wave 0 |
| RULE-02 | New Mosje is Level 1 at `startMP`; no `level: 0` anywhere (`createMosjeSlot` is the only factory); display shows Lv 1 | unit | `npx vitest run tests/engine/mosje-slot-factory.test.ts tests/ui/card-v1-mosje.test.ts` | Wave 0 / exists |
| RULE-02 (E14) | `getPower`: level row + boost, floor 0 (-10 on Power 0 stays 0), never NaN at levels 1-3 | unit | `npx vitest run tests/engine/get-power.test.ts` | Wave 0 |
| RULE-03 (E4) | Loss to <= 0 at L2/L3 -> level-1 @50 (traits refreshed) | unit | `npx vitest run tests/engine/getemt.test.ts` | Wave 0 (replaces mp-level-regression) |
| RULE-03 (E5) | L1 -> sideways @0; armed at owner's next start; stands up at end of that turn; second getemt while sideways -> `welloePile` | unit | same file | Wave 0 |
| RULE-03 (E6) | Loss reduced to 0 by a reducer -> no getemt, also at 0 MP; exactly-0 with loss>0 does getemt | unit | same file | Wave 0 |
| RULE-04 (E7) | Reaching L3 does not finish the game; owner's next `startTurn` finishes it; dropping below L3 first cancels | unit | `npx vitest run tests/engine/hold-level-3-win.test.ts` | Wave 0 (replaces instant-win-level3) |
| RULE-04 (E8) | Last Mosje to Welloe pile with none in hand/deck -> opponent wins; Mosje in hand/deck prevents loss | unit | `npx vitest run tests/engine/no-mosje-left-loss.test.ts` | Wave 0 |
| RULE-09 (E27) | After gains, losses, halves, doubles (amplifier 1.5x): MP % 5 === 0, >= 0; Power % 10 === 0, >= 0; property-style loop over many random amounts/sources | unit | `npx vitest run tests/engine/mp-grid-invariants.test.ts tests/engine/mp-five-grid.test.ts` | Wave 0 / exists |
| RULE-09 | Order: base -> reducers -> Stabilizer cap -> round/floor -> no-loss (explicit numeric cases incl. 80 halved then capped 30) | unit | `npx vitest run tests/engine/loss-pipeline-order.test.ts` | Wave 0 |
| RULE-02/03/09 | Static guard: no direct `.mp +=/-=` in `src/abilities`, `src/bot`, `src/main.js` outside the allow-list (Leipe Swap, MP Adjuster revert, funnel files) | unit/grep | `npx vitest run tests/engine/no-direct-mp-writes.test.ts` | Wave 0 |
| Ronald Kip stacking | 50 / 60 / 100 stacks stay on the grid; reaching 100 levels up and resets | unit | `npx vitest run tests/engine/ronald-kip-stacking.test.ts tests/engine/food-double-synergy.test.ts` | Wave 0 / exists |
| Smoke | Bot-vs-bot on Example Decks never throws; invariants (mp in 0..100 and % 5, level in 1..3, energy 0..6, no negative MP) hold after every turn | integration | `npx vitest run tests/bot/offlineGame.smoke.test.ts` | exists, extend |

### Sampling Rate
- **Per task commit:** `node --check <touched src files>` + `npx vitest run <the plan's test files>`
- **Per wave merge:** `npm test` (full, ~10 s) + the `node --check` list above
- **Phase gate:** full `npm test` green; `node --check` list clean; headless Playwright subset (entry-protection, deckout-banner, cardv1-mosje, a 5-card `piecie-effects` sample); the Node bot-vs-bot smoke stands in for the "run-once" sim (obsolete path) - state this explicitly; full sim NOT run. Then `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `tests/engine/energy.test.ts`, `energy-charging.test.ts` - E1 and charge/refuse
- [ ] `tests/engine/level-up.test.ts` - E3, E7b
- [ ] `tests/engine/get-power.test.ts` - E14
- [ ] `tests/engine/getemt.test.ts` - E4, E5, E6 (replaces `mp-level-regression.test.ts`)
- [ ] `tests/engine/hold-level-3-win.test.ts`, `no-mosje-left-loss.test.ts` - E7, E8
- [ ] `tests/engine/mp-grid-invariants.test.ts`, `loss-pipeline-order.test.ts` - E27, RULE-09 order
- [ ] `tests/engine/mosje-slot-factory.test.ts` - single factory, Level 1
- [ ] `tests/engine/no-direct-mp-writes.test.ts` - funnel guard
- [ ] `tests/engine/ronald-kip-stacking.test.ts`
- [ ] Shared test builder `tests/helpers/makeEngineState.ts` (a 2-player state with `energy: 6`, `welloePile: []`, 1-based level slots) to stop each file hand-rolling `makePlayer` (currently every file does)
- [ ] Playwright hook `setEnergy` + `energy: 6` default in `tests/ui/cards/card-test-runner.js`
- Framework install: none.

## Security Domain

`security_enforcement` is not set to false, so included (brief; this phase has no auth/network surface).

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | -- |
| V3 Session Management | no | -- |
| V4 Access Control | partial | Multiplayer is client-authoritative P2P/Firebase: a modified client can write its own `energy`/`level`. Out of scope for the prototype (CLAUDE.md: playtest build); note, don't fix. |
| V5 Input Validation | yes | `payEnergy` must reject non-integer / negative / NaN amounts (cost comes from data but hooks may pass computed values); `getPower`/`applyGainToSlot` guard `amount > 0` and finite; clamp `level` to 1..3 |
| V6 Cryptography | no | -- (`rollDie` uses Math.random as today) |

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Negative/NaN Energy payment mints Energy | Tampering | integer, >= 0 guard in `payEnergy` (code example above) |
| Forged `player.energy`/`level` in synced state | Tampering | accepted prototype risk; log in SUMMARY |
| Prototype-pollution-style keys via `_pendingTargets` | Tampering | unchanged from V4; not touched |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Skips its owner's next turn" means the **Mosje** is inactive (sim `:594-596`), not that the whole player turn is skipped | Welloe pile + sideways | If Gandalf meant a whole-turn skip, sideways design changes to the V4 `skipNextTurn` mechanism and Phase 55 interplay |
| A2 | `checkLoss` counts Mosjes on field + hand + deck (parenthetical in handoff 2b), not the discard pile | Win / lose | A Mosje in the discard pile (rare after Phase 54) would not save a player; handoff literal reading ("no Mosje left outside your Welloe pile") would count it |
| A3 | Ability Energy costs come from the 2.0 `abilityDescription` text ("pay N Energy"): Ronald Chef 2, Youri 1, Gandoe Destroyer 4, Coert Tech 1, Hacker 1, Tactician 2, FPS West 1, Ronald Mastermind 2, Tuk Healer 1, Binti 1, Martin Driver 1, Tuk Architect 1, Ming Predictor 1 (optional pay), Jeffrey Gambler (stake 1-2) | MP-as-currency map | Wrong numbers cost the wrong Energy until Phase 58 verifies each ability; low blast radius |
| A4 | Refreshing `slot.traits` from `levels[level-1].traits` on every level change is wanted now (not only in Phase 56) | Level representation | Extra scope; if unwanted, traits stay V4-static until Phase 56 |
| A5 | Removing the V4 level gates in Ronald Kip (`piecieEffects.js:139`) and Super Saiyan (`:274`) is within scope ("All Level 1+ requirements disappear", handoff 2g) | Level representation | Tests/behaviour that rely on the gates would need to be kept until Phase 59 |
| A6 | Showing defeated Mosjes only in the battle log until Phase 63 is acceptable despite memory "Discard pile rule" | Welloe pile | Gandalf may want a minimal Welloe pile counter earlier |
| A7 | Removing the 20 MP Quest attempt cost now (rather than leaving to Phase 56) is required by success criterion 1 ("no card or ability spends MP") | MP-as-currency map | If left, the criterion is violated; if removed, the old General Quest still works but costs nothing |

## Open Questions (RESOLVED)

All resolved by orchestrator decisions on 2026-10-11; each RESOLVED line names the plan that implements it.

1. **Sideways = Mosje inactive or player-turn skipped?**
   - Known: handoff says "skips its owner's next turn"; sim and handoff 2d treat it per-Mosje; V4 `skipNextTurn` is whole-turn (deck-out).
   - Unclear: Gandalf's intent in prose.
   - Recommendation: per-Mosje inactivity (A1); flag in the 54-04 plan and confirm at verify.
   - RESOLVED: per-Mosje. The sideways Mosje takes no action on its owner's next turn and stands up at the end of that turn; the player still plays the turn; V4 `skipNextTurn` is not reused. Implemented in 54-11 (getemt sets `sideways` in 54-10).

2. **Does a Mosje in the discard pile count against the loss condition?**
   - Recommendation: field + hand + deck only (A2); R1 (Phase 55) can only fetch from hand/deck, so counting the discard would leave a "not lost but stuck" player.
   - RESOLVED: field, hand and deck only (discard pile and Welloe pile don't count). Implemented in 54-12 (`checkLoss`).

3. **Should Quest-attempt MP cost (20) go in Phase 54 or 56?**
   - Recommendation: remove in 54 (A7): MP is "never a currency" is a Phase 54 success criterion. Phase 56 builds the real "First you must..." costs.
   - RESOLVED: remove now in Phase 54, including the bot and UI gates; Quest rules arrive in Phase 56. Implemented in 54-04.

4. **Where to put activated-ability Energy costs (data field vs rules file)?**
   - Recommendation: `src/rules/abilityEnergyCosts.js` + a data test against `abilityDescription` (Pitfall 7), not new fields in generated `mosjes.js`.
   - RESOLVED: new `src/rules/abilityEnergyCosts.js` (mosjes.js is generator-owned), values from the Card List ability texts, guarded by a data test. Implemented in 54-03.

5. **Level storage 0-based vs 1-based?**
   - Recommendation: 1-3 (decided above); record in the 54-01 SUMMARY (CONTEXT asked research to decide).
   - RESOLVED: store 1-3 behind one `createMosjeSlot` factory. Implemented in 54-05 (display in 54-06, fixtures in 54-08).

6. **`mpCost` data field: delete or keep?**
   - Recommendation: keep (UI faces, Phase 62; effect `piecieEffects.js:710`); delete engine/bot consumers only; record it.
   - RESOLVED: keep the `mpCost` data field; delete only engine/bot consumers. Implemented in 54-04 (static guard; the piecieEffects gain line is marked for Phase 59).

7. **Is a minimal Welloe pile display needed before Phase 63?**
   - Recommendation: no; battle-log line only (A6). Ask Gandalf only if verify surfaces confusion.
   - RESOLVED: no Welloe pile UI before Phase 63; battle-log line only. Implemented in 54-10.

8. **Stabilizer / Zo is Natuur ordering vs V4 tests.**
   - Recommendation: follow 2g strictly (reducers then cap); any V4 test asserting the old order is rewritten (none found by grep for Stabilizer-specific tests, recheck at execution).
   - RESOLVED: follow §2g strictly (base -> reducers -> Stabilizer cap -> round/floor -> no-loss). Implemented in 54-09.

9. **(Assumption A4) Refresh `slot.traits` from the level row on every level change?**
   - RESOLVED: yes, on every level change (orchestrator decision 7). Implemented in 54-05 (`refreshLevelTraits`), used by 54-07 (level-up) and 54-10 (getemt).

## Project Constraints (from CLAUDE.md)

- Ask when in doubt; never assume. New feature/bugfix -> `gsd-discuss-phase` first (already done: CONTEXT.md exists).
- **Never read `/_archive/`.** (Not read in this research.)
- Bug reports require a live-browser repro before the fix (Playwright, `seedOfflineSession` + `GAME_URL_TEST` + `window.__testHooks`); this phase is a rules rewrite, but any bug found in execution follows that workflow.
- Branches only (this work is on `obby-2.0`); never commit to `main`.
- **One function per file**, small files (~80 lines), card definitions are pure data, `src/engine/` and `src/effects/` pure functions. (Note: the live code is `src/abilities/` and `src/engine/`; `src/effects/` in CLAUDE.md is the obsolete TS layout.)
- Verification before every commit: `node --check` list -> `npm test` -> MP changes: Ronald Kip stacking test + simulation (sim path obsolete; CONTEXT says use the Node smoke and report that the full sim was not run).
- Every new feature/card gets a test in the existing suite. MP changes: check `docs/phase0-rulings.md` (V4, being superseded by `docs/obby-2.0/*`; the 2.0 docs win on this branch per CONTEXT).
- Read-first docs (`docs/developer-handoff.md`, `card-reference.md`, `phase0-rulings.md`, `phase10-report.md`): per CLAUDE.md, STOP if missing. They exist but are V4; they are rewritten in Phase 55.
- Modular UI: reuse generic components (e.g. `SelectionModal`/`showOptionSelect`) rather than new one-off modals.
- Playwright: headless only; headed must use `--window-position=2560,0`; judge UI at >= 1920x1080 (memory).

## Sources

### Primary (HIGH confidence - read in this session)
- `src/engine/mpManager.js` (all), `src/engine/victoryChecker.js` (all), `src/engine/gameState.js:1-260`, `src/engine/turnManager.js` (startTurn/endTurn/activatePiecie/playSnellie/playMosje/useMosjeAbility/playPlace regions), `src/engine/roundToFive.js`, `src/rules/universal-rules.js`, `src/rules/helpers/U7_isCostPayment.js`
- `src/abilities/mosjeAbilities.js`, `piecieEffects.js`, `placeEffects.js`, `questLogic.js` (MP-touching regions via grep + reads)
- `src/bot/botDriver.js`, `src/bot/strategy/assessQuestRisk.js`
- `src/main.js` (test hooks 995-1075, Welloe Force UI 2790-2830, win text 866-905, `toMosjeCards` 3470-3495, level log 3628-3645), `src/ui/*` level readers via grep
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` (2a-2g, 6a, 8), `docs/obby-2.0/Obby Card Game 2.0 - Core Numbers.md` (1, 2, 4, 5), `docs/obby-2.0/tools/obby_desk_sim.py` (gain/lose/getemt/turn_of/actions)
- `.planning/phases/54-.../54-CONTEXT.md`, `.planning/ROADMAP.md` (Phase 54), `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/phases/53-.../53-07-SUMMARY.md`, `53-VERIFICATION.md`
- `npm test` run: 93 files / 968 tests green (2026-10-11)

### Secondary / Tertiary
- None. No external web sources were needed (project-internal rules phase). Context7 not applicable (no third-party library behaviour involved).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies; versions read from the tool CLIs.
- Architecture / code map: HIGH - every site cited was read or grepped; the one soft spot is the long tail of direct `.mp` writes (counted by grep, sampled by read).
- Test migration list: MEDIUM - derived by static grep of level/MP/victory references and fixture shapes, not by executing the changed engine; the per-plan `npm test` runs will surface stragglers, which the SUMMARYs must list.
- Rules edge cases (sideways meaning, loss scope): MEDIUM - see Assumptions A1-A2.

**Research date:** 2026-10-11
**Valid until:** 2026-11-10 (stable; invalidated if Phase 55/56 planning changes slot or turn-flow shape first)
