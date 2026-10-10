# Phase 53: 2.0 Card Data and Example Decks - Research

**Researched:** 2026-10-10
**Domain:** Static card-data modules (`src/data/*.js`), data-access helpers, Vitest data tests, one-off data generation from a markdown spec
**Confidence:** HIGH (everything below was read or run against the repo and the 2.0 docs in this session; the few judgement calls are tagged `[ASSUMED]` and collected in the Assumptions Log)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Source and precedence (locked)**
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` is the text and number source for every card; it wins over phase docs and over current `src/data` texts.
- Keep every existing card `id` (saved decks, tests, art paths). New ids only: `quest_dutch_courage`, `quest_cheat_code`.
- Apply handoff section 3a renames exactly (Nature's Gift for `piecie_eendjes_voeren`, Lucky Cóin, Quest spellings, Mosje names without `[ ]` brackets: "Gandoe, The Unpredictable Wizard").
- Keep `artPath` values untouched.

**Fields (locked, names may follow codebase conventions - document any rename in the SUMMARY)**
- Mosje: `cost` (Energy), `rarity`, `startMP`, `levels: [{ power, traits }] x3`, ability name + text, synergy label (partner ids) and holder `synergyText`, `limitPerDeck`.
- Piecie / Snelle: `cost` (Blensen! "4 or free" as a cost text/flag), `rarity`, `tag` (`food` | `pet` | `substance` | `gear` | null; exactly food 7, pet 5, substance 9, gear 6; at most one per card), `stays`, `levelGate` (2 or null; only Harde Didde, Klaar Met Jou, Dikke Taks), `limitPerDeck`, `givesMP`, text. `DIGITAL-EQUIPMENT` / `PHYSICAL-EQUIPMENT` become `gear`; functional tags may remain as internal metadata only.
- Quest: `stack` (FIGHTING/DIGITAL/ARTISTIC; 13/13/12), `band`, `rollTrait` (trait | `best` | `none`), cost text/id ("First you must..."), `win`, `lose`, `extras`.
- Place: `cost`, `rarity`, text, `goodFor`, `badFor`, `limitPerDeck`.
- Limit 1 per deck: every five-star card, plus The Protector and Mosje Reborn (and any card the Card List marks).
- Frame data (Phase 7 A1/A9): keep rules `rarity` separate from a derived `frameTier`; add the editor `foil` flag; per the Phase 7 proposal set `foil: true` on the 12 Mosjes that `main` had at five stars on 2026-10-06.

**Hidden cards (locked)**
- Add a hidden flag and exclude from decks, boosters, deck builder lists and the bot pool, data kept: Mosjes `mosje_binti_creator`, `mosje_amplifier`, `mosje_coert_kastelein`; Piecie `piecie_mp_adjuster`; Place `place_momentum_factory`; Quests `quest_precision_work`, `quest_the_gauntlet`, `quest_elimination_challenge`, `quest_chain_master`, all `quest_personal_*` and `quest_west_perfect_read`; the 5 duo decks and the 3 old starter decks.
- Unhide `place_drain_zone` and `place_the_void` (`playerFacingPlaces.js` `HIDDEN_PLACE_IDS`).

**Example Decks (locked)**
- The 3 decks from `Obby Card Game 2.0 - Example Decks.md` (Fighting "Taksen", Digital "Regelaars", Artistic "Creatievelingen"): 30 cards each, max 2 copies, five-star max 1, starting Mosje marked and inside the 30.

**Transition strategy (locked by orchestrator, Gandalf delegated)**
- The V4 engine on `obby-2.0` must keep running and `npm test` must stay green at the end of this phase. So: **add** the 2.0 fields alongside V4 fields; keep V4 fields (`mpCost`, `roll.thresholds`, `successMP`/`failMP`, `requirement`, `questType`, `difficulty`, `level` 0-based, ...) until the phase that rewrites their consumer (54-57) removes them.
- Where V4 tests assert old card **texts/names/costs** that this phase changes, update or delete those assertions in this phase (V4-rule tests are rewritten, never left failing).
- No V4/2.0 switch in code.

### Claude's Discretion
- Exact field names and shapes where the codebase already has a convention (e.g. traits as `{ physical: 3 }` vs existing trait format) - follow existing conventions, record the mapping.
- How to structure the deck definitions and the hidden flag (keep `STARTER_DECKS` shape if the lobby reads it).
- Splitting files to respect CLAUDE.md "small files" where a new helper is added (one exported function per file).
- Whether Quest band values are stored per card or derived from a band table (Card List band table is the source of the numbers).

### Deferred Ideas (OUT OF SCOPE)
- Removing V4 fields and their consumers - Phases 54-57.
- Effect rewrites to the new texts - Phases 58-60.
- Card face rendering of the new fields - Phase 62.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | All 183 Card List cards in `src/data/*.js` with Card List name, text, Energy cost, rarity; ids kept; renames applied | Full id <-> name table (section "Card id mapping"); text-patch generator approach; per-type V4->2.0 field table |
| DATA-02 | Mosjes: `startMP`, `levels[3]`, ability text, synergy label/holder text, `limitPerDeck` | Mosje field table; verified L1 traits == V4 `traits` for all 32; 6 Mosjes with a "While" holder text; Martin Precision Driver has 2 abilities |
| DATA-03 | Piecies/Snelle: `tag` (7/5/9/6), `stays`, `levelGate`, `limitPerDeck`, `givesMP` | Tag counts verified from Card List "Kind" column; stays list (14 cards); levelGate = 3 cards; givesMP heuristic list (needs one human review) |
| DATA-04 | Quests: `stack`, `band`, `rollTrait`, cost, win/lose, extras; two new quests | Stack counts 13/13/12 verified; band table consistent with every quest row; V4-compat fields required for the 2 new quests (deck-balance guard rails) |
| DATA-05 | Places: `cost`, `goodFor`, `badFor`, `limitPerDeck`; Drain Zone + The Void unhidden | Existing `goodFor`/`badFor` are string arrays and are rendered with `.join(', ')` - keep arrays |
| DATA-06 | Parked/cut cards, Personal Quests, duo decks, old starter decks hidden, never reach decks/boosters/bot | Existing `disabled: true` flag already honoured by 3 filter points; the 15 hidden card ids reconcile exactly with the data-only set; all deck surfaces go through `getPlayerFacingDecks()` |
| DATA-07 | 3 Example Decks as 30-card decks | Example Decks doc parsed and cross-checked against the Card List (totals, costs, tags all consistent); `STARTER_DECKS` shape and `buildDeck` handle duplicates as repeated strings |
</phase_requirements>

## Summary

Phase 53 is a data-migration phase with no external libraries. The live data lives in five arrays (`MOSJES` 35, `PIECIES` 74, `SNELLE_PIECIES` 20, `PLACES` 21, `QUESTS` 46 = 196 cards) plus `STARTER_DECKS` (8 decks). The Card List has 183 cards. I mapped them: 181 Card List cards map to an existing id (many by rename: all 32 Mosje names (brackets dropped), 12 Quests, Nature's Gift, Lucky Coin), 2 are new quests (`quest_dutch_courage`, `quest_cheat_code`); exactly 15 data cards are not in the Card List and they are exactly the 15 cards the handoff says to hide (3 Mosjes + 1 Piecie + 1 Place + 10 Quests, which is 4 cut Quests + 6 Personal/West quests). So the data set reconciles with no surprises.

The safest route is "add, don't remove": every V4 field that a V4 consumer reads (`mpCost`, `requirement`, `roll`, `successMP`/`failMP`, `traits`, `synergyWith`, `petSynergy`, `tags`, `abilityCost`, `effectId`/`abilityId`) stays untouched. Only `name`, display text (`description`, `abilityDescription`, `synergyEffect`), `rarity`, `startMP` and `goodFor`/`badFor` are overwritten from the Card List, and the new 2.0 fields are inserted next to them. No code in `src/` compares card names (grep-verified), so renames only break a small, listed set of tests. A text-patching generator (same technique as the existing card editor's `patchCardSource.mjs`) preserves the comments and the editor-safe layout; whole-file rewriting would not.

The two real design risks are (1) the **`parseMosjeName` UI helper**, which only understands `[First] Nickname` and would show "Alyssa, The Bulldozer" as one big first name, so it must learn the `First, Nickname` form in this phase, and (2) **`disabled` vs a new "hidden" flag**: the repo already has a `disabled: true` card flag that boosterEngine, cardIndex and deck-builder filter on (and a test guards). Reusing it means zero new filter points.

**Primary recommendation:** Build a Node-only generator (`scripts/obby2/`) that parses the Card List markdown with one shared parser, text-patches each card block in `src/data/*.js` (overwrite 6 fields, insert the 2.0 fields before `artPath`), add the 3 Example Decks to `STARTER_DECKS`, flip `disabled: true` on the 15 hidden cards and 8 hidden decks, then guard everything with E28/E29/E30 tests that re-parse the same markdown. Do it type by type and run `npm test` (about 8 s) after each.

## Architectural Responsibility Map

There is no backend in this phase; "tiers" are the layers of the browser-run, no-build JS app plus dev tooling.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Card definitions (names, texts, costs, 2.0 fields) | Static data modules `src/data/*.js` | - | CLAUDE.md: card files are pure data; one source of truth; editor patches them in place |
| Hidden-card / hidden-deck filtering | Data-access helpers (`playerFacingDecks.js`, `playerFacingPlaces.js`, `boosterEngine.js`, `cardIndex.js`, `deck-builder.js` ALL_CARDS) | Data flag on the card (`disabled: true`) | One flag, filtered at the existing access points so UI/bot/boosters cannot drift |
| Example Decks | `STARTER_DECKS` in `src/data/starterDecks.js` | `getPlayerFacingDecks()` whitelist | Lobby, onboarding, bot picker and claimStarterDeck all read this accessor |
| Derived values (frame tier, copy limit) | Pure helper functions in `src/data/` (one function per file) | - | Keeps rules `rarity` from ever driving a frame, and gives E30 a single copy-limit rule |
| Mosje name display ("First, Nickname") | UI helper `src/ui/cardV1/parseMosjeName.js` | `src/ui/cardRenderer.js` callers | Only place that parses names; must follow the new data format |
| Data generation from the Card List | Dev tooling (Node, `scripts/obby2/`) | - | One-off; must NOT be imported by `src/` (no runtime dependency) |
| Drift guard (data vs Card List vs Example Decks) | Vitest tests (`tests/data/*.test.ts`) | Shared parser module in `scripts/obby2/` | Re-parses the markdown on every run so data cannot silently drift |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none new) | - | Phase adds data, helpers and tests only | No external packages are needed `[VERIFIED: codebase - package.json devDependencies]` |
| Vitest | ^2.1.4 (installed) | Unit/data tests | Already the `npm test` runner `[VERIFIED: package.json, vitest.config.ts]` |
| Node.js | v24.12.0 (installed) | Generator script + tests | `engines: >=20` `[VERIFIED: node --version via run]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node `fs` / `url` built-ins | built-in | Generator reads markdown, tests read markdown | Both generator and E29/E30 tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Text-patching existing blocks | Re-serialising whole data files from loaded objects | Whole-file rewrite loses ~24+ explanatory comments in `mosjes.js` alone and makes a giant unreviewable diff; also clobbers editor edits to `rarity`/`artFocus` made in between |
| Text-patching | Hand editing 183 cards | Error-prone, slow, and the Edit tool struggles with CRLF files (see Pitfalls) |
| A separate generated `cardList20.js` overlay merged at load | In-place fields | Duplicates name/text/rarity in two places (the double-maintenance the project removed with the TS engine) and the card editor writes `rarity` in place |

**Installation:** none.

**Version verification:** no packages to verify. `npm test` baseline run in this session: 83 test files, 814 tests passed, about 5.3 s in Vitest (8 s wall) `[VERIFIED: ran npm test]`.

## Package Legitimacy Audit

No external packages are installed or recommended by this phase. Nothing to audit.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 docs/obby-2.0/Card List.md ----+                       docs/obby-2.0/Example Decks.md
        (source of truth)       |                                   |
                                v                                   v
                  scripts/obby2/parseCardList.mjs  <---- shared by ----> tests/data/*.test.ts (E28/E29/E30)
                                |                                   |
              (one-off, run by hand, NOT imported by src/)          | compares on every `npm test`
                                v                                   v
              scripts/obby2/applyCardList.mjs  --text-patch-->  src/data/{mosjes,piecies,snellePiecies,places,quests}.js
                                                                    |  (name/text/rarity/startMP overwritten,
                                                                    |   2.0 fields inserted before artPath,
                                                                    |   15 hidden cards get disabled:true)
                                                                    v
   src/data/starterDecks.js (+3 EXAMPLE_* decks, 8 old decks disabled:true)
                |                                   |
                v                                   v
   playerFacingDecks.js  <---- lobby dropdown, onboarding picker, bot picker, pickBotDeck
   playerFacingPlaces.js <---- boosterEngine, deck-builder ALL_CARDS
   cardIndex.js (ALL_CARDS, getStarterEligible filters disabled)
   boosterEngine.js (POOL filters disabled), deck-builder.js (ALL_CARDS filters disabled)
                |
                v
   V4 engine unchanged: reads mpCost / requirement / roll / successMP / traits / synergyWith as before
```

### Recommended Project Structure
```
scripts/obby2/                 # dev tooling only; never imported from src/
  parseCardList.mjs            # one function: markdown -> {mosjes,quests,piecies,snelle,places}
  parseExampleDecks.mjs        # one function: markdown -> {taksen,regelaars,creatievelingen}
  cardIdMap.mjs                # data: Card List name -> id (183 entries, see mapping table)
  applyCardList.mjs            # the one-off generator (text patch); prints a change report
src/data/
  questBands.js                # QUEST_BANDS data table (pure data): need + win/lose per band
  getFrameTier.js              # one function: Mosje -> 4|5 (foil or 5-star), others -> star count
  getCopyLimit.js              # one function: limitPerDeck ?? (rarity 5 stars ? 1 : 2)
  starterDecks.js              # + 3 EXAMPLE_* decks, old decks flagged disabled:true
tests/data/
  card-list-2-0.test.ts        # E29: every Card List card vs data, hidden exclusion
  card-tags-2-0.test.ts        # E28: tag counts
  example-decks-2-0.test.ts    # E30: deck rules
```
Do not put helper `.ts` files under `tests/`: `vitest.config.ts` includes `tests/**/*.ts`, so any helper `.ts` there is run as a test file and fails with "no test suite found". Put shared parsing in `scripts/obby2/*.mjs` (the existing `tests/card-editor-patch.test.ts` already imports from `scripts/card-editor/`) or in a `.js` helper like `tests/helpers/testHelpers.js` `[VERIFIED: vitest.config.ts include glob; tests/helpers/testHelpers.js is .js]`.

### Current shape of each card type (verified)

**Mosje** (`src/data/mosjes.js:5` `export const MOSJES`, entries from line 11, 35 entries; file is 710 lines):
`id, type:"MOSJE", subtype:"FIGHTING|DIGITAL|ARTISTIC", name:"[First] Nickname", startMP, traits:{physical:2,...}, abilityId, [autoAbility], [abilityCost], [unlimitedAbility], abilityDescription:"Name: text.", synergyWith:[mosjeIds], synergyEffect:string|null, petSynergy:id|null, tags:["GANDOE",...], flavourText, [artFocus:"50% 25.9%"], artPath, rarity:"★..", isBoosterOnly:false, [disabled:true]`.
- Trait format is `{ physical: 3 }` with keys physical/mental/social/creative/technical/resilient and values 1-3 `[VERIFIED: mosjes.js:16-17 and dump]`. Card List `Phys/Men/Soc/Cre/Tech/Res` map 1:1.
- `traits` equals the Card List **L1 trait row for all 32 Mosjes** (script-verified, 0 differences). So keep `traits` (V4 reads it) and make `levels[0].traits` deep-equal it (assert in E29).
- Existing `disabled: true`: `mosje_drainer` (line 368 block, flag at 388) and `mosje_coert_kastelein` (id line 618, flag at 638), with a comment naming the 3 filter points `[VERIFIED: grep]`.
- Ability text convention: `"Name: text."`. `formatAbilityLine.js` bolds `^([^:.]{1,40}:)`, and `"While ..."` lines are treated as conditions `[VERIFIED: src/ui/cardV1/formatAbilityLine.js]`.
- Synergy convention (test-guarded): `synergyEffect` starts `"While <partner> is also on your field:"` `[VERIFIED: tests/data/synergy-text-clarity.test.ts]`.

**Piecie** (`src/data/piecies.js:6`, 74 entries, 1168 lines): `id, type:"PIECIE", subtype ("MOMENTUM-GAINING"|"ATTACK"|"UTILITY"|"PET"|"SUBSTANCE"|"DIGITAL-EQUIPMENT"|"PHYSICAL-EQUIPMENT"), name, mpCost (0 everywhere except piecie_welloe_force = 40), requirement ("any"|"level1"|"level2"), effectId, tags:["FOOD","RESTORE",...], description, flavourText, artPath, rarity, isBoosterOnly, [persistUntilEndOfTurn:true]` (11 cards; unrelated to 2.0 `stays`).
**Snelle** (`src/data/snellePiecies.js:5`, 20 entries): same shape, `type:"SNELLE_PIECIE"`, `subtype:"INSTANT"|"COUNTER-CHAIN"|"UTILITY"`, `mpCost` all 0, `requirement` incl. `mental2`, `physical2`, `mental3`, `bankChilling`.
**Place** (`src/data/places.js:6`, 21 entries): `id, type:"PLACE", name, trigger, effectId, tags, description, flavourText, artPath, goodFor:[strings], badFor:[strings], rarity, isBoosterOnly` (no cost field today).
**Quest** (`src/data/quests.js:18`, 46 entries, 950 lines): `id, type:"QUEST", questType:"GENERAL"|"PERSONAL", category:"Physical|Mental|Social|Creative|Technical|Resilient|Mixed", requiredMosjeId, name, requirementId:"quest_req_<x>", roll:{trait,thresholds:{1,2,3}}|null, requirementDescription, successMP, failMP (negative), description, difficulty, isBoosterOnly, rarity, flavourText, artPath, [drawOnSuccess|opponentLoseMP|perMosjeConfig]`. `category` is NOT the 2.0 stack (e.g. Sustained Assault is category Mixed, Fighting stack).
**Decks** (`src/data/starterDecks.js:5`, 261 lines): `{ id, name, description, mosjes:[ids], piecies:[ids with repeats], snellePiecies:[ids], places:[ids], quests:[ids] }`. Ids at lines 7, 38, 70 (the 3 originals PHYSICAL_FORCE / DIGITAL_CONTROL / ARTISTIC_RHYTHM) and 107, 138, 169, 200, 231 (the 5 DUO_*). `buildDeck` accepts entries as plain strings (repeated for copies) or `{id, qty}` `[VERIFIED: src/engine/deckEngine.js expandEntries]`. V4 `createPlayerState` picks a RANDOM starter Mosje from `deck.mosjes` and builds the draw deck excluding it (`gameState.js:71-87`), opening hand 6.
**Access helpers:**
- `cardIndex.js`: `ALL_CARDS`, `getCardById`, `getCardsByTag`, `getCardsByType`, `getStarterEligible` (filters `!isBoosterOnly && !disabled`, line 54-58).
- `boosterEngine.js:22-30`: POOL = MOSJES + PIECIES + SNELLE + `getPlayerFacingPlaces()` + PERSONAL QUESTS, then `.filter(c => !c.disabled)`.
- `deck-builder.js:31-37`: same list, `.filter(c => !c.disabled)`; `RARITY_COPY_LIMITS` at line 39 (V4: 4/3/2/2/1).
- `playerFacingDecks.js:12-23`: whitelist of the 5 DUO ids; `playerFacingPlaces.js:13`: `HIDDEN_PLACE_IDS = ['place_drain_zone','place_the_void']`.
- Every lobby/onboarding/bot surface reads `getPlayerFacingDecks()` (`main.js:127,148,246,270,329,348,564,1141,3576`; `pickBotDeck.js`). Raw `STARTER_DECKS` is read directly by `gameState.js:71,213` (engine, must stay unfiltered) and by tests.

### Card editor (how it writes into src/data - do not fight it)
`scripts/card-editor/patchCardSource.mjs` is a pure text patch: it finds the block that starts at `^[ \t]*id:\s*["']<id>["']` and ends at the next `\n<same indent>id:["']`, then regex-replaces only `rarity: "<stars>"` (or inserts it) and `artFocus` (inserting before `artPath:` when absent). `server.mjs:24` writes the file with `fs.writeFileSync`. `validateEdit.mjs` only allows `rarity` (`^★{1,5}$`) and `artFocus`. A guard test (`tests/card-editor-patch.test.ts:48-58`) round-trips every card in the 5 data files: for each `id: "..."` line matching `(mosje|piecie|place|snelle|quest)_`, the first `rarity:\s*"(★+)"` within 2500 chars must patch back to the identical file.
Rules that follow for this phase:
1. Keep `id:` as the first key on its own line with consistent indent; never add another line starting `id:` with a card-like prefix inside a block.
2. Keep `rarity: "★..."` a double-quoted literal and the first `rarity:` key in the block; do not add any other key whose name ends in lowercase `rarity`.
3. The editor changes **rules** `rarity` in place. That is exactly why `frameTier` must be derived and `foil` must be a separate flag (Phase 7 A1): editor edits can then never change a copy limit through a frame decision.
4. Insert new fields before the `artPath:` line (present on all 196 cards; the last property in quests has no trailing comma, so inserting before `artPath` avoids trailing-comma bugs, same trick the editor uses).
The editor has no `foil` toggle yet (`src/ui/cardEditor/main.js` only sets `rarity`); adding the toggle is Phase 62 work. This phase only adds the data field.

### Recommended 2.0 fields per type (V4 field -> 2.0 field mapping)

| Type | Overwritten from Card List (existing field) | New fields added (alongside V4) | Renames vs CONTEXT wording (record in SUMMARY) |
|------|---------------------------------------------|----------------------------------|-------------------------------------------------|
| Mosje | `name`, `rarity`, `startMP`, `abilityDescription` (as `"Name: text."`, multiple abilities joined), `synergyEffect` (Card List "While ..." holder text, else `null`) | `cost` (2/3/4), `levels:[{power,traits}x3]`, `abilityName` (first ability), `synergyLabel:[ids]` (Mosje and pet/Piecie ids), `limitPerDeck`, `foil:true` on 12 | `abilityText` -> existing `abilityDescription`; `synergyText` -> existing `synergyEffect`; `synergyLabel` is new and sits next to V4 `synergyWith` (do not touch `synergyWith`/`petSynergy`: `synergyResolver.js:30-46`, `cardRenderer.js:151,198,216` and deck-builder read them) |
| Piecie / Snelle | `name`, `rarity`, `description` (Card List text, `**` stripped) | `cost` (number; Blensen! `cost:4` + `costText:"4 or free"`), `tag`, `group` (Piecies: `"mp"|"attack"|"utility"|null`), `stays`, `levelGate`, `limitPerDeck`, `givesMP` | `tag` (singular) lives next to V4 `tags` (plural array used by `turnManager.js:904-1000`, `main.js:702,1868`, bot) |
| Quest | `name` only (12 renames) | `stack`, `band`, `rollTrait`, `costText` + `costId`, `win` (e.g. 40), `lose` (signed, e.g. -30, `null` for Trained), `extras` (verbatim "Also" text or `null`) | Keep V4 `description`, `requirementDescription`, `roll`, `successMP`, `failMP`, `category`, `rarity`: they describe V4 behaviour and are asserted by `deck-balance`/`phase-22`/`quest-threshold` tests |
| Place | `rarity`, `description`, `goodFor`, `badFor` (split Card List text on `", "` into string arrays) | `cost`, `limitPerDeck` | Keep arrays: `cardRenderer.js:349-353`, `deck-builder.js:300-301`, `formatAffinityLine.js` all `.join(', ')` them |

Field value conventions to lock in the plan:
- `cost`: always a JS number (Blensen! is `4` plus `costText:"4 or free"`). `[CITED: Phase 7 A9 says costText: "4 or free"]`
- `limitPerDeck`: explicit `1` or `2` on every Card List card (generator writes it; avoids a hidden default). One-star-limit set is 10 cards: the 8 five-star cards (Gandoe The Destroyer, Harde Didde, Klaar Met Jou, Leipe Swap, Dingetje toch?!, Blensen!, Delluft, Synergy Chamber) plus The Protector and Mosje Reborn `[VERIFIED: parsed Card List]`.
- `rollTrait`: trait name lowercase (`"physical"`...), `"best"` (Ultimate Challenge), `"none"` for Trained (no roll) **and** Coin flip (the band distinguishes them: Trained = no roll, Coin flip = roll 1 die 4+).
- `win`/`lose`: Card List uses U+2212 minus; parse it; store `lose` as a signed negative number to match V4 `failMP`.
- `band`: lower snake ids `steady|skilled|heroic|prepared|gated|coin_flip|trained`. Add `src/data/questBands.js` (pure data) exporting `QUEST_BANDS` with the Card List band table, and assert in E29 that every quest's `win`/`lose` equals its band row. All 38 quest rows already agree with the band table `[VERIFIED: script - 7 distinct band/win-lose combos, no outliers]`.
- `costId`: the 21 distinct "First you must..." texts (list below) map to short ids by a lookup table in the generator.
- `stays` values: `null | "endOfTurn" | "endOfNextTurn" | "startOfNextTurn" | "custom"` (matches handoff 3b "none | endOfNextTurn | startOfNextTurn | custom"; `endOfTurn` added for Blensen!).
- `foil:true` set on exactly: `mosje_gandoe_wizard, mosje_alyssa_fissa, mosje_gandoe_destroyer, mosje_ronald_chef, mosje_ming_natural, mosje_martin_historian, mosje_coert_tech, mosje_jeffrey_gambler, mosje_fps_west, mosje_chris_ddr, mosje_amplifier, mosje_coert_kastelein`. These are precisely the 12 Mosjes at five stars in the current data (script-verified), which matches the Phase 7 proposal's list of 10 + the two parked Mosjes.

### Pattern 1: Text-patch one card block
**What:** For each card id, slice its block (editor-style boundaries), replace the single-line `name:`, `description:`/`abilityDescription:`, `synergyEffect:`, `rarity:`, `startMP:` values with `JSON.stringify`-escaped strings, insert the new field lines before `artPath:`, and write back using the file's own line ending.
**When to use:** Always for this phase; it is the only approach that keeps comments and editor compatibility.
**Example:**
```js
// scripts/obby2/applyCardList.mjs (sketch). Source: pattern of scripts/card-editor/patchCardSource.mjs
const eol = source.includes('\r\n') ? '\r\n' : '\n';          // data files are CRLF in the working tree
const setStr = (block, key, value) =>
  block.replace(new RegExp(`(\\b${key}:\\s*)"(?:[^"\\\\]|\\\\.)*"`), `$1${JSON.stringify(value)}`);
const insertBeforeArtPath = (block, indent, lines) =>
  block.replace(/^([ \t]*)artPath:/m, `${lines.map(l => indent + l).join(eol)}${eol}$1artPath:`);
```
All current string values in the data files are single-line double-quoted literals (grep: no single-quote or template-literal `description`/`name`/`abilityDescription`/`synergyEffect`), so this regex is safe.

### Pattern 2: Hidden flag reuse
Use `disabled: true` for hidden cards and hidden decks. The three existing filter points (boosterEngine POOL, cardIndex `getStarterEligible`, deck-builder ALL_CARDS) already honour it, and `tests/effects/thematic-piecies.test.ts` asserts `mosje_coert_kastelein.disabled === true`. Map CONTEXT's "hidden flag" to `disabled` in the SUMMARY. Then change only: `getPlayerFacingDecks()` (filter `!deck.disabled`, whitelist the 3 EXAMPLE ids), `getPlayerFacingPlaces()` (filter `!place.disabled`, drop `HIDDEN_PLACE_IDS` entries for Drain Zone/The Void, flag `place_momentum_factory`). Leave raw `PLACES`/`STARTER_DECKS` importers (engine) unfiltered, as the existing regression guard in `tests/data/player-facing-places.test.ts` requires.

### Pattern 3: Example Deck entries
```js
// src/data/starterDecks.js - append; shape identical to existing decks plus two fields
{
  id: "EXAMPLE_TAKSEN", name: "Taksen", description: "Hit hard, keep your Mosjes fed, push Physical Quests at The Gym.",
  kind: "FIGHTING", startingMosje: "mosje_alyssa_fissa",
  mosjes: ["mosje_alyssa_fissa","mosje_gandoe_wizard", /* ...6 unique ids, start included */],
  piecies: ["piecie_kannetje_melk","piecie_kannetje_melk", /* ...18 entries, repeats = copies */],
  snellePiecies: [/* 4 */], places: ["place_the_gym","place_de_box"], quests: []
}
```
Ids: `EXAMPLE_TAKSEN`, `EXAMPLE_REGELAARS`, `EXAMPLE_CREATIEVELINGEN` `[ASSUMED]` naming. V4 still picks a random start Mosje from `mosjes`; `startingMosje` is the 2.0 field Phase 55 will honour. `quests: []` is safe (`buildDeck` reads `starterDeckConfig?.quests`).

### Pattern 4: Helpers (one function per file, pure)
```js
// src/data/getFrameTier.js
export function getFrameTier(card) {
  const stars = (String(card?.rarity ?? '').match(/★/g) || []).length;
  if (card?.type === 'MOSJE') return (stars >= 5 || card.foil === true) ? 5 : 4;  // Phase 7 A1: Mosjes always full art
  if (card?.type === 'QUEST') return 1;                                            // Phase 7: Quests use tier-1 frame
  return Math.min(5, Math.max(1, stars || 1));
}
// src/data/getCopyLimit.js
export function getCopyLimit(card) {
  if (Number.isInteger(card?.limitPerDeck)) return card.limitPerDeck;
  return (String(card?.rarity ?? '').match(/★/g) || []).length >= 5 ? 1 : 2;
}
```

### Anti-Patterns to Avoid
- **Removing V4 fields now.** `mpCost` has a guard test (`mp-cost-tribute-audit.test.ts`: all 0 except Welloe Force = 40); `successMP/failMP` are asserted by `deck-balance.test.ts` (`failMP >= -20`, `successMP >= 40` for ALL quests, including the 2 new ones); removing breaks tests the plan was told to keep green.
- **Rewiring renderers to `frameTier` in this phase.** `card-tiers.test.ts` and the card-v1 tests build Mosje faces from `{...MOSJES[x], rarity:'★★★'}` and expect tier 3 boxed; delegating `getRarityTier` for Mosjes would force a rewrite of those tests for no data gain. Ship `getFrameTier` + its unit test now; Phase 62 switches the renderers. Visual side effect to accept: Mosje faces at ★/★★/★★★ render boxed on V4 UI until Phase 62.
- **Helper `.ts` files under `tests/`** (run as test files, fail).
- **Importing `scripts/obby2/*` from `src/`** (breaks "no runtime dependency"; the browser runs raw `.js`).
- **Editing the data files with the Edit tool** (CRLF working tree; multi-line `old_string` will not match). Use the generator / `Write`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Applying 183 cards of edits | Manual edits | Text-patch generator + one shared markdown parser | Hand edits drift; the same parser then powers E29 so doc and data are checked by the same code |
| Markdown table parsing | A markdown library | ~40-line splitter: `line.split('|').slice(1,-1).map(trim)`, split Mosje level cell on `<br>`, strip `**` | Tables are simple pipe tables; no new dependency (and no package audit) |
| Card hiding | A second hidden mechanism | Existing `disabled: true` + existing 3 filter points | Already test-guarded |
| Copy-limit rule | Per-caller rarity maps (deck-builder has its own 4/3/2/2/1) | `getCopyLimit(card)` | Needed by E30; deck-builder keeps its V4 map until the 2.0-C slice |
| Frame tier | Reusing `rarity` for frames | `getFrameTier(card)` | Phase 7 A1 engine note |

**Key insight:** The risky part is not typing 183 cards; it is keeping the doc, data and V4 consumers in agreement afterwards. A re-parsing test is the only guard that survives future edits.

## Runtime State Inventory

This phase renames cards (display `name` only, ids unchanged), so the five categories were checked:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Firebase RTDB saved custom decks / collections / wallets reference card **ids**, not names. Ids are kept, so nothing to migrate. Saved decks may contain ids of newly hidden cards; V4 UI does not resolve them against `disabled` except deck-builder pool. | None (code edit only). Note for 2.0-C: hidden ids in saved decks. |
| Live service config | None on this branch: 2.0 uses a separate Firebase project and URL (Handoff section 1); V4 services untouched. | None |
| OS-registered state | None - verified: no scheduled tasks/services reference card names. | None |
| Secrets/env vars | None - card data has no secrets; `firebase-config.js` untouched. | None |
| Build artifacts | None - no build step (raw `.js` in browser). `cache-bust.mjs` exists in `scripts/`; bump `APP_VERSION` per project deploy rules only when deploying. | None for this phase |

## Common Pitfalls

### Pitfall 1: `parseMosjeName` cannot read the new names
**What goes wrong:** `src/ui/cardV1/parseMosjeName.js` splits only `[First] Nickname`. For `"Alyssa, The Bulldozer"` it returns `{firstName:'Alyssa, The Bulldozer', nickname:''}`; for the literal-bracket Hacker name `"[...], The Hacker"` it returns nickname `", The Hacker"` (leading comma). Callers: `cardRenderer.js:89,174`, `buildMosjeSpecV1.js:11`, `cardTiersDemo.js`.
**How to avoid:** Update the helper to (a) keep the bracket branch but strip a leading `,`, (b) otherwise split at the **first** `", "`: `FPS Coert` and `Dancing/DDR Chris` have no comma (no nickname); `Tuk "The Builder", The Sims Architect` -> first `Tuk "The Builder"`; `Martin, The Precision Driver`; `DJ 80/20, The Lucky Mixer`; `Coert, KasteLuck` all split correctly. Add this file to the `node --check` list. Rewrite `tests/ui/card-v1-mosje.test.ts:16-35` for the new inputs; keep the bracket cases only if the bracket branch is kept.
**Warning signs:** Card faces show the whole name in the big first-name slot; `fitFirstName` shrinks to 24px.

### Pitfall 2: Pet cards carry a shared "pet line" that is NOT in their table row
**What goes wrong:** Card List "Pet Piecies (5)" prints "Every pet starts with the same line: **Stays until the end of your next turn. One of your Mosjes (choose now) loses 10 less MP each time it loses MP. The named Mosje loses 20 less instead.**" above the table; each row holds only the text after it (e.g. Tony: "Named: Coert, KasteLuck. While Coert, KasteLuck is also on your field: ..."). A naive row copy loses the protection rule.
**How to avoid:** Generator prepends the pet line to each pet `description`; E29 does the same when comparing. Same idea for Mosje cells: ability text and "While ..." holder text are separated by `<br>`.

### Pitfall 3: CRLF in the working tree
**What goes wrong:** `src/data/*.js` have CRLF line endings on disk (`file` says so; `core.autocrlf=true`, `.gitattributes` `* text=auto`). The Card List and Example Decks markdown are LF. Edit-tool multi-line matches and `^`-anchored regexes without `\r` handling misbehave; mixed endings in one file would make diffs noisy.
**How to avoid:** Generator detects `\r\n` and writes the same ending; parsers do `.replace(/\r/g,'')` on the markdown. Use `Write`/the generator, not multi-line Edit.

### Pitfall 4: Unicode and escaping
**What goes wrong:** Card List contains U+2605 stars (1124x), U+2212 minus (46x, win/lose), U+2014 em dash (91x, "-" placeholder cells and ability separators), U+2013, U+2026, `o-umlaut` (Doner) and `o-acute` (Coin), no curly quotes. Texts contain double quotes (`Endure Pain`: `any "Stays" card`; `Tuk "The Builder"`).
**How to avoid:** Generate string literals with `JSON.stringify`, never string-concatenate quotes. Treat `"—"` (em dash) cells as null. Compare names exactly (the V4 `Lucky Coin` -> `Lucky Cóin` rename is the only accent change). Data files stay UTF-8 (no BOM).

### Pitfall 5: Blensen! "4 or free"
**What goes wrong:** The only non-integer cost in the whole Card List. `Number("4 or free")` is NaN and would poison `cost` comparisons and sorting.
**How to avoid:** `cost: 4, costText: "4 or free"`; the parser special-cases it, E29 asserts `costText` for exactly that card. The "free if a Jensen!/Frenssen! was played this turn" logic is Phase 60.

### Pitfall 6: Varkenspootjes and other text-vs-structure traps
Varkenspootjes: "Choose any Mosje that isn't fresh (yours or your opponent's). A Binti gains 40 MP. Any other Mosje loses 15 MP." It is food (tag `food`) yet can hit opponents, and it also says "gains" so a naive `givesMP` heuristic marks it true (correct for The Void/Jeffrey semantics). Others: Warm Kannetje Melk is food but *loses* MP (givesMP false); Protein Shake is `food` in 2.0 although V4 subtype is `PHYSICAL-EQUIPMENT` (the 2.0 `tag` is independent of V4 `subtype`/`tags`); Dingetje toch?! has `tag: null` ("counts as any tag" is Phase 59); Mouse/Keyboard/Controller are `gear`.

### Pitfall 7: New-quest V4 compatibility
The two new quests join V4's General deck (`gameState.js:26,200` use `QUESTS.filter(q => q.questType === 'GENERAL')`, `main.js:3673` too) unless hidden. `requirementId` is only compared with `===` in `questLogic.js`/`questOdds.js` (no dynamic dispatch; verified by grep), so a requirementId with no function behaves like a plain threshold quest. They need full V4 fields: `questType:"GENERAL"`, `category`, `requiredMosjeId:null`, `roll:{trait,thresholds}`, `successMP >= 40`, `failMP >= -20` (the deck-balance guard rails apply to ALL quests), `difficulty`, `rarity`, `artPath` (placeholder path used by other quests: `assets/quests/placeholder.png`). Suggested: Dutch courage modelled on Endurance Test (physical, 55/-15), Cheat code on Strategy Puzzle-like mental (60/-20) `[ASSUMED]`.

### Pitfall 8: Do not hide quests out of the V4 General deck in this phase
The 4 cut General quests (`precision_work`, `the_gauntlet`, `elimination_challenge`, `chain_master`) get `disabled: true`, but V4 `gameState.js` and `sanitizeQuestCardsInPlayerZones` (`main.js:3673`) do not look at `disabled`. Leave them as is; Phase 55/56 rebuild the stacks. `tests/abilities/quest-behaviors.test.ts:175` still looks up `quest_elimination_challenge` by id (data kept, so it passes). Personal quests are only reachable through decks/boosters/deck-builder, all of which filter `disabled`.

### Pitfall 9: Seeded smoke test may stop finishing
`tests/bot/offlineGame.smoke.test.ts` seeds `Math.random` (mulberry32 0xC0FFEE) and asserts the game FINISHES within 60 turns using the old deck ids. Changing `startMP` for 20 Mosjes changes the deterministic game. If it fails, adjust the turn cap or seed (V4-rule test, not a bug), and note it in the SUMMARY.

### Pitfall 10: Rarity changes ripple into V4 numbers
Rarity moves for 27 of 32 Mosjes (e.g. Gandoe Wizard 5->3 stars), 16 Piecies, 4 Snelle, 11 Places. Consumers: booster weights (`rarityToWeight`, drop odds shift), deck-builder copy limits (V4 4/3/2/2/1), V4 face tier (boxed vs full art), `modalManager.js:495` "max N/deck" label. All acceptable transitional effects; just don't be surprised.

## Code Examples

### Parse one Mosje row (Card List -> object)
```js
// Source: Card List table shape (docs/obby-2.0/Obby Card Game 2.0 - Card List.md lines 22-31); verified by running a prototype
const TRAIT = { Phys:'physical', Men:'mental', Soc:'social', Cre:'creative', Tech:'technical', Res:'resilient' };
function parseLevelCell(cell) {            // "L1: Power 10 · Phys ★★ · Res ★ · Cre ★★<br>L2: ..."
  return cell.split('<br>').map(s => {
    const m = s.match(/^L(\d): Power (\d+)(.*)$/);
    const traits = {};
    for (const t of m[3].split('·').map(x => x.trim()).filter(Boolean)) {
      const mm = t.match(/^(\w+) (★+)$/);  traits[TRAIT[mm[1]]] = mm[2].length;
    }
    return { power: +m[2], traits };
  });
}
// Quest win/lose: "+40 / −30" (U+2212) or "+25 / —" -> { win: 40, lose: -30 } / { win: 25, lose: null }
```
Prototype results (run in this session against the real docs): 32 Mosjes, 38 Quests, 73 Piecies, 20 Snelle, 20 Places parsed = 183; Mosje power values all multiples of 10 and non-decreasing across levels, no trait drops between levels, no star counts above 3, all start MP multiples of 5.

### E29 skeleton (compare doc vs data on every run)
```ts
// tests/data/card-list-2-0.test.ts  (the parser lives in scripts/obby2/, NOT in tests/)
import { describe, it, expect } from 'vitest';
import fs from 'fs';
// @ts-expect-error JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-expect-error JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-expect-error JS module
import { ALL_CARDS } from '../../src/data/cardIndex.js';

const md = fs.readFileSync('docs/obby-2.0/Obby Card Game 2.0 - Card List.md', 'utf8').replace(/\r/g, '');
const list = parseCardList(md);                       // {mosjes, quests, piecies, snelle, places}
const byId = new Map(ALL_CARDS.map((c: any) => [c.id, c]));

describe('E29 Card List vs src/data', () => {
  it('has 183 cards and every one maps to an existing id', () => { /* counts 32/38/73/20/20; byId.has(id) */ });
  it('every non-disabled data card is in the Card List (bijection)', () => { /* ids(non-disabled) === ids(map values) */ });
  for (const row of [...list.mosjes /* ... */]) it(`${row.name}`, () => { /* name, cost, rarity, type-specific fields */ });
});
```

### playerFacingDecks after the change
```js
// src/data/playerFacingDecks.js
import { STARTER_DECKS } from './starterDecks.js';
const PLAYER_FACING_DECK_IDS = ['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN'];
export function getPlayerFacingDecks() {
  return STARTER_DECKS.filter(d => PLAYER_FACING_DECK_IDS.includes(d.id) && !d.disabled);
}
```

## Card id mapping (all 183 Card List cards)

Source of truth for `scripts/obby2/cardIdMap.mjs`. "data name today" shows the exact current `name` where it differs from the Card List name ("same" = exact match). Generated by a script that matched on normalised names plus the manual overrides in the handoff 3a; "same" is an exact string comparison.

**Cards in the Card List with no existing id:** only the two new Quests (`quest_dutch_courage`, `quest_cheat_code`).
**Non-hidden data cards not in the Card List:** none. The 15 data cards not in the Card List are exactly the handoff hide list: `mosje_binti_creator`, `mosje_amplifier`, `mosje_coert_kastelein`, `piecie_mp_adjuster`, `place_momentum_factory`, `quest_precision_work`, `quest_the_gauntlet`, `quest_elimination_challenge`, `quest_chain_master`, `quest_west_perfect_read`, `quest_personal_iron_will`, `quest_personal_perfect_sync`, `quest_personal_lucky_crescendo`, `quest_personal_winston_tijd`, `quest_personal_kickboxing_bootcamp`. (Handoff "6 Personal / west" = 5 `quest_personal_*` + `quest_west_perfect_read`.)
**Special cases:** `piecie_eendjes_voeren` (Piecie) becomes "Nature's Gift" while `place_eendjes_voeren` (Place) stays "Eendjes Voeren" - never match these two by name alone. `mosje_drainer` is currently `disabled: true` and must be **un-hidden** (it is in the Card List and in the Regelaars deck). `mosje_tactician` / `mosje_hacker` / `mosje_drainer` keep their placeholder names exactly as printed: "Placeholder 1, The Tactician", "[...], The Hacker" (literal brackets kept; Example Decks also prints "[...], The Hacker"), "Placeholder 4, The Drainer"; strip only the `*(name owed)*` marker.

**Mosjes (32)**

| Card List name | id | data name today |
|---|---|---|
| Gandoe, The Unpredictable Wizard | `mosje_gandoe_wizard` | [Gandoe] The Unpredictable Wizard |
| Jeffrey, The Strongman | `mosje_jeffrey` | [Jeffrey] The Strongman |
| Alyssa, The Bulldozer | `mosje_alyssa_bulldozer` | [Alyssa] The Bulldozer |
| Alyssa, Fissa Fissa! | `mosje_alyssa_fissa` | [Alyssa] Fissa Fissa! |
| AZN Cless, The Wild Card | `mosje_azn_cless` | [AZN Cless] The Wild Card |
| Michelle, Iron Tuk | `mosje_michelle` | [Michelle] Iron Tuk |
| Parkour West, The Flow Fighter | `mosje_parkour_west` | [Parkour West] The Flow Fighter |
| Gandoe, The Destroyer | `mosje_gandoe_destroyer` | [Gandoe] The Destroyer |
| Ronald, The Master Chef | `mosje_ronald_chef` | [Ronald] The Master Chef |
| Ming, The Natural | `mosje_ming_natural` | [Ming] The Natural |
| Ming, The Predictor | `mosje_ming_predictor` | [Ming] The Predictor |
| Martin, The Historian | `mosje_martin_historian` | [Martin] The Historian |
| Martin, Senor West | `mosje_martin_senor_west` | [Martin] Senor West |
| Coert, The Hawaiian Tech Savant | `mosje_coert_tech` | [Coert] The Hawaiian Tech Savant |
| [...], The Hacker *(name owed)* | `mosje_hacker` | [The Hacker] |
| Jeffrey, The Silent Gambler | `mosje_jeffrey_gambler` | [Jeffrey] The Silent Gambler |
| Chris, The All-Rounder | `mosje_chris` | [Chris] The All-Rounder |
| Youri, The Speedrunner | `mosje_youri` | [Youri] The Speedrunner |
| Placeholder 1, The Tactician *(name owed)* | `mosje_tactician` | [Placeholder 1] The Tactician |
| Placeholder 4, The Drainer *(name owed)* | `mosje_drainer` | [Placeholder 4] The Drainer |
| FPS Coert | `mosje_fps_coert` | [FPS Coert] |
| FPS West | `mosje_fps_west` | [FPS West] |
| Ronald, The Mastermind | `mosje_ronald_mastermind` | [Ronald] The Mastermind |
| Jisca, The Maestro | `mosje_jisca` | [Jisca] The Maestro |
| Tuk, The Healing Spirit | `mosje_tuk_healer` | [Tuk] The Healing Spirit |
| DJ 80/20, The Lucky Mixer | `mosje_dj_8020` | [DJ 80/20] The Lucky Mixer |
| Coert, KasteLuck | `mosje_coert_kasteluck` | [Coert] KasteLuck |
| Binti, The Sharp Tongue | `mosje_binti` | [Binti] The Sharp Tongue |
| Cless, The Teacher | `mosje_cless_teacher` | [Cless] The Teacher |
| Martin, The Precision Driver | `mosje_martin_driver` | [Martin] The Precision Driver |
| Tuk "The Builder", The Sims Architect | `mosje_tuk_architect` | [Tuk] The Sims Architect |
| Dancing/DDR Chris | `mosje_chris_ddr` | [Dancing/DDR Chris] |

**Quests (38)**

| Card List name | id | data name today |
|---|---|---|
| Arm Wrestling | `quest_arm_wrestling` | same |
| Sprint Race | `quest_sprint_race` | same |
| Sustained Assault | `quest_sustained_assault` | same |
| Tough It Out | `quest_tough_it_out` | Tough it Out |
| Survive Storm | `quest_survive_storm` | Survive the Storm |
| Never Give Up | `quest_never_give_up` | same |
| Parkour Challenge | `quest_parkour_challenge` | same |
| Endurance Test | `quest_endurance_test` | same |
| Endure Pain | `quest_endure_pain` | Endure the Pain |
| Momentum Master | `quest_momentum_master` | same |
| Ultimate Challenge | `quest_ultimate_challenge` | same |
| Geen Raad? Vraag Aad! | `quest_geen_raad_vraag_aad` | Geen raad? Vraag Aad! |
| Dutch courage | `quest_dutch_courage` | (new card) |
| Debug System | `quest_debug_system` | Debug the System |
| Quick Thinking | `quest_quick_thinking` | same |
| Calculate Odds | `quest_calculate_odds` | Calculate the Odds |
| Late Night Questing | `quest_late_night_questing` | same |
| Hack Mainframe | `quest_hack_mainframe` | Hack the Mainframe |
| Strategy Puzzle | `quest_strategy_puzzle` | same |
| Synergy Mastery | `quest_synergy_mastery` | same |
| Build Gadget | `quest_build_gadget` | Build a Gadget |
| Speed Run | `quest_speed_run` | same |
| Master Plan | `quest_master_plan` | same |
| Regelaar | `quest_regelaar` | De Regelaar |
| Perfect Timing | `quest_perfect_timing` | same |
| Cheat code | `quest_cheat_code` | (new card) |
| Team Building | `quest_team_building` | same |
| Artistic Expression | `quest_artistic_expression` | same |
| Inspire Crowd | `quest_inspire_crowd` | Inspire the Crowd |
| Improvise! | `quest_improvise` | Improvise |
| Form Alliance | `quest_form_alliance` | Form an Alliance |
| Lucky Break | `quest_lucky_break` | same |
| Negotiation | `quest_negotiation` | same |
| Larry Temmen Niemand Zeggen | `quest_larry_temmen` | Larry Temmen |
| Parkeren Delft | `quest_parkeren_delft` | Parkeren in Delft |
| Create Masterpiecie | `quest_create_masterpiece` | Create a Masterpiece |
| Shotje Obby | `quest_shotje_obby` | same |
| Leap of Faith | `quest_leap_of_faith` | same |

**Piecies (73)**

| Card List name | id | data name today |
|---|---|---|
| Kannetje Melk | `piecie_kannetje_melk` | same |
| Warm Kannetje Melk | `piecie_warm_kannetje_melk` | same |
| Broodje Döner | `piecie_broodje_doner` | same |
| Ronald Kip | `piecie_ronald_kip` | same |
| Chef's Special | `piecie_chefs_special` | same |
| Varkenspootjes | `piecie_varkenspootjes` | same |
| Protein Shake | `piecie_protein_shake` | same |
| Momentum Boost | `piecie_momentum_boost` | same |
| Nature's Gift | `piecie_eendjes_voeren` | Eendjes voeren |
| Shoettoe | `piecie_energy_surge` | same |
| Snoeiertje | `piecie_snoeiertje` | same |
| Te Hard Gaan | `piecie_te_hard_gaan` | same |
| Super Saiyan Mos | `piecie_super_saiyan_mos` | same |
| Momentum Diefje | `piecie_momentum_diefje` | same |
| Jantje Jantje... | `piecie_jantje_jantje` | same |
| Continuous Assault | `piecie_continuous_assault` | same |
| MP Hemorrhage | `piecie_mp_hemorrhage` | same |
| Kleine Taks | `piecie_kleine_taks` | same |
| Dikke Taks | `piecie_dikke_taks` | same |
| Harde Didde | `piecie_harde_didde` | same |
| Klaar Met Jou | `piecie_klaar_met_jou` | same |
| Zie je die Dingetjes | `piecie_zie_je_die_dingetjes` | same |
| Bagga of Greed | `piecie_bagga_of_greed` | same |
| Boosterpackkie | `piecie_boosterpackkie` | same |
| Perfect Rhythm | `piecie_perfect_rhythm` | same |
| TemPiecie | `piecie_tempiecie` | same |
| TweedeKANs | `piecie_tweede_kans` | same |
| Dubbele Dosis | `piecie_quest_prep` | same |
| Loaded Dice | `piecie_loaded_dice` | same |
| Dikke Plaat | `piecie_dikke_plaat` | same |
| Kan het?! | `piecie_kan_het` | same |
| Perfect Setup | `piecie_perfect_setup` | same |
| Redbull | `piecie_redbull` | same |
| Double Trigger | `piecie_double_trigger` | same |
| Dubbele Ding | `piecie_dubbele_ding` | same |
| Chain Reaction | `piecie_chain_reaction` | same |
| MP Amplifier | `piecie_mp_amplifier` | same |
| Synergy Field | `piecie_synergy_field` | same |
| Leipe Swap | `piecie_leipe_swap` | same |
| Afblijven! | `piecie_afblijven` | same |
| Laat me chillen! | `piecie_laat_me_chillen` | same |
| Mosje Shield | `piecie_mosje_shield` | same |
| Welloe Force | `piecie_welloe_force` | same |
| Mosje Reborn | `piecie_mosje_reborn` | same |
| Call of the Welloes | `piecie_call_of_welloes` | same |
| Slecht Gezet | `piecie_slecht_gezet` | same |
| Shhh, popo komt! | `piecie_popo_komt` | same |
| Huisbaas | `piecie_huisbaas` | same |
| Stookerino | `piecie_stookerino` | same |
| Those Eyelashes Tho... | `piecie_those_eyelashes` | same |
| F1 Telemetry Data | `piecie_f1_telemetry` | same |
| Battle Concert | `piecie_battle_concert` | same |
| Dingetje toch?! | `piecie_dingetje_toch` | same |
| Keyboard | `piecie_keyboard` | same |
| Mouse | `piecie_mouse` | same |
| Controller | `piecie_controller` | same |
| Dumbbells | `piecie_dumbbells` | same |
| Boxing Gloves | `piecie_boxing_gloves` | same |
| Skipping Rope | `piecie_skipping_rope` | same |
| Bowie & Stormey | `piecie_bowie_stormey` | same |
| Tony | `piecie_tony` | same |
| Gekke Vogels | `piecie_gekke_vogels` | same |
| KatjeGang | `piecie_katjegang` | same |
| ViannaPoes | `piecie_vianna_poes` | same |
| Grammetje Pieter | `piecie_grammetje_pieter` | same |
| Dikke Jonko | `piecie_dikke_jonko` | same |
| Affoe | `piecie_affoe` | same |
| Stripje Bennies | `piecie_stripje_bennies` | same |
| Tikker | `piecie_tikker` | same |
| Straffoe | `piecie_straffoe` | same |
| Larry / Zegeltje | `piecie_larry_zegeltje` | same |
| Pot of Weed | `piecie_pot_of_weed` | same |
| Bong Hit Demolition | `piecie_bong_hit_demolition` | same |

**Snelle (20)**

| Card List name | id | data name today |
|---|---|---|
| Momentum Rush | `snelle_momentum_rush` | same |
| Bijna Welloe | `snelle_bijna_welloe` | same |
| Emergency Healings | `snelle_emergency_healings` | same |
| The Protector | `snelle_the_protector` | same |
| Perfect Dodge | `snelle_perfect_dodge` | same |
| Drain Reversal | `snelle_drain_reversal` | same |
| Not Today! | `snelle_negate_elimination` | same |
| Ff Haaltje Nemen | `snelle_ff_haaltje_nemen` | same |
| Lucky Cóin | `snelle_lucky_coin` | Lucky Coin |
| Sleutelpuntje | `snelle_sleutelpuntje` | same |
| Je Weet Niet | `snelle_jeweetniet` | same |
| Counter Strikka | `snelle_counter_strikka` | same |
| Jammertje Gepakt! | `snelle_jammertje_gepakt` | same |
| Dubbele Temminks | `snelle_dubbele_temminks` | same |
| Gevalletje Klakkeloos | `snelle_gevalletje_klakkeloos` | same |
| Jantje Jantje... Jantje? | `snelle_jantje_jantje_jantje` | same |
| Chillingsvoorbij! | `snelle_chillingsvoorbij` | same |
| Jensen! | `snelle_jensen` | same |
| Frenssen! | `snelle_frenssen` | same |
| Blensen! | `snelle_blensen` | same |

**Places (20)**

| Card List name | id | data name today |
|---|---|---|
| The Gym | `place_the_gym` | same |
| Boxing Ring | `place_boxing_ring` | same |
| De Box | `place_de_box` | same |
| Eendjes Voeren | `place_eendjes_voeren` | same |
| Arcade | `place_arcade` | same |
| Digital Gaming Stop | `place_digital_gaming_stop` | same |
| Tesla | `place_tesla` | same |
| Coert's Caravan | `place_coerts_caravan` | same |
| Skiffa | `place_skiffa` | same |
| Bank Chilling | `place_bank_chilling` | same |
| Delluft | `place_delluft` | same |
| Quest Haven | `place_quest_haven` | same |
| Obby #1 | `place_obby_1` | same |
| Zo is Natuur | `place_zo_is_natuur` | same |
| Drain Zone | `place_drain_zone` | same |
| Momentum Stabilizer | `place_momentum_stabilizer` | same |
| The Void | `place_the_void` | same |
| Welloe Graveyard | `place_welloe_graveyard` | same |
| Synergy Chamber | `place_synergy_chamber` | same |
| Dierenasiel | `place_dierenasiel` | same |

### Derived facts the generator needs (all computed from the Card List)

- **Rarity changes vs data today:** Mosjes: `rarity` changes on 27 of 32 (the other 5 keep their rarity) and `startMP` changes on 20 of 32 (29 Mosjes have at least one change), Piecies 16 of 73, Snelle 4 of 20, Places 11 of 20. Rarity distribution in the Card List: 1-star 22, 2-star 49, 3-star 52, 4-star 14, 5-star 8 (cards other than Quests).
- **Mosje cost:** 2 (x11), 3 (x19), 4 (x2).
- **Tag counts (E28):** food 7, pet 5, substance 9, gear 6, untagged 46 (Piecies only; Snelle have no tag). Food: Kannetje Melk, Warm Kannetje Melk, Broodje Doener, Ronald Kip, Chef's Special, Varkenspootjes, Protein Shake.
- **`stays` (14 cards):** Continuous Assault `endOfNextTurn`; Synergy Field `endOfNextTurn`; Laat me chillen! `endOfNextTurn`; Mosje Shield `endOfNextTurn`; Afblijven! `startOfNextTurn`; Welloe Force `startOfNextTurn`; Kleine Taks `custom`; Call of the Welloes `custom` (as long as the summoned Mosje stays); the 5 pets `endOfNextTurn` (from the shared pet line); Blensen! `endOfTurn` (Snelle). Cards that mention staying but are not "Stays" cards: Tikker ("leave Tikker face-up next to it"), MP Hemorrhage ("put this card next to the first Mosje it attacks") - see Open Questions. Endure Pain's cost counts "any Stays card", i.e. the 13 Piecies above.
- **`levelGate: 2`:** Dikke Taks, Harde Didde, Klaar Met Jou (the three cards whose text starts "Needs: one of your Mosjes at Level 2+"). All other "Needs:" lines (Perfect Dodge, Lucky Cóin, Counter Strikka, Jammertje Gepakt!) are trait needs, not level gates.
- **`givesMP` (proposal, heuristic = text says a Mosje "gains ... MP" / "MP more"):** 33 cards match: Kannetje Melk, Broodje Doener, Ronald Kip, Chef's Special, Varkenspootjes, Protein Shake, Momentum Boost, Nature's Gift, Shoettoe, Momentum Diefje, Boosterpackkie, Perfect Rhythm, Kan het?!, MP Amplifier, Synergy Field, Stookerino, Those Eyelashes Tho..., F1 Telemetry Data, Keyboard, Mouse, Controller, Dumbbells, Bowie & Stormey, Gekke Vogels, Grammetje Pieter, Dikke Jonko, Affoe, Tikker, Larry / Zegeltje (Piecies, 29) and Momentum Rush, Bijna Welloe, Emergency Healings, Jantje Jantje... Jantje? (Snelle, 4). Needs a human decision on **MP Amplifier** and **Synergy Field** (they only modify other gains) - recommended false for both `[ASSUMED]`; The Void ("Piecies and Snelle can't make a Mosje gain MP") and Jeffrey ("can't activate Piecies that give MP") will read this flag in Phases 58-60.
- **Quest costs (21 distinct, for `costId`):** none (15 quests), Mosje has Physical 2+, Level 1 Mosje only, Discard 1 ready Piecie (Parkour Challenge, Parkeren Delft), Discard 1 food Piecie from hand or ready (Endurance Test), Piecie of yours stays in play (Endure Pain), Mosje has 80 MP or more, A Place is in play, Discard 1 substance Piecie from hand or ready (Dutch courage, Larry Temmen), Mosje has Technical 2+, Reveal the top 3 cards then put back, Also used this Mosje's ability this turn, Activate 1 ready Piecie, Activate 2 ready Piecies, 3 Piecies face-down, More Piecies in play than opponent, Mosje has 70 to 80 MP, Discard 1 Snelle from hand, Mosje has Social 2+, Discard 1 Piecie from hand, 3 or more Piecies in play, Total MP lower than opponent's.
- **Quest stacks:** Fighting 13, Digital 13, Artistic 12 (parsed from the three `###` sub-headings). Bands: Steady 9, Skilled 5, Heroic 3, Prepared 9, Gated 6, Coin flip 3, Trained 3. Roll traits: Physical 6, Resilient 4, Mental 5, Technical 6, Creative 5, Social 5, best 1, no-trait (coin flip) 3, no roll (trained) 3.
- **Mosje synergy labels (`synergyLabel`)**, parsing the Card List "Synergy" column against known names (note commas inside "Martin, The Historian" and "Coert, The Hawaiian Tech Savant": split by longest known-name match, not by comma): AZN Cless -> [`mosje_martin_senor_west`, `piecie_vianna_poes`]; Michelle -> [`piecie_bowie_stormey`]; Ronald, The Master Chef -> [`piecie_ronald_kip`, `piecie_chefs_special`]; Martin Historian -> [`mosje_cless_teacher`]; Senor West -> [`mosje_azn_cless`]; Coert Tech -> [`mosje_binti`]; Youri -> [`mosje_chris_ddr`]; FPS Coert -> [`mosje_fps_west`]; FPS West -> [`mosje_fps_coert`]; Coert KasteLuck -> [`piecie_tony`]; Binti -> [`mosje_coert_tech`]; Cless Teacher -> [`mosje_martin_historian`, `piecie_vianna_poes`]; Tuk Architect -> [`piecie_bowie_stormey`]; DDR Chris -> [`mosje_youri`]. Holder texts ("While X is also on your field:") exist on exactly 5 Mosjes (Martin Historian, Senor West, Youri, Binti, FPS West) plus Piecies (Ronald Kip, Chef's Special, pets, F1 Telemetry, etc.). All other Mosjes get `synergyEffect: null`, including Alyssa x2 and Jisca, which have **no** synergy in the Card List but still carry V4 `synergyWith` (keep it; see impact list).
- **Martin, The Precision Driver has two abilities** (Perfect Line + Pit Stop) in one cell; V4 has one `abilityId`. Store `abilityName:"Perfect Line"` and keep both sentences in `abilityDescription`; Phase 58 splits them.

## Test impact (V4 tests that encode old names/texts/costs/rarities/decks)

Static analysis of `tests/**/*.ts` (what `npm test` runs). Confidence: the first group is certain; the second is likely; **run `npm test` after each data type to confirm**, since a positive `toContain` on text is easy to miss.

| Test file | What it asserts | Action |
|-----------|-----------------|--------|
| `tests/data/hidden-cards.test.ts` | `HIDDEN_IDS = [mosje_coert_kastelein, mosje_drainer]` must be `disabled` and never drop | Rewrite: drainer is visible now; hidden = binti_creator, amplifier, coert_kastelein (+ Piecie/Place/Quests); keep the booster/starter-eligible checks |
| `tests/data/player-facing-places.test.ts` | `getPlayerFacingPlaces().length === PLACES.length - 2`; Drain Zone/Void absent | Rewrite: now `PLACES.length - 1` (Momentum Factory only), Drain Zone/The Void present; keep the "raw importers stay unfiltered" guard |
| `tests/data/player-facing-decks.test.ts` | exactly 5 DUO ids, none of the 3 originals | Rewrite to the 3 EXAMPLE ids; DUO/originals must not appear |
| `tests/data/duo-deck-validity.test.ts` | "has 5 duo decks", iterates `getPlayerFacingDecks()` | Re-target to the 3 example decks (keep id-resolves check) |
| `tests/ui/card-v1-mosje.test.ts` | `parseMosjeName` bracket cases (lines 16-35), `byName('[Alyssa] The Bulldozer')` etc. (lines 12, 94-130) | Update names to `'Alyssa, The Bulldozer'`, `'FPS Coert'`, `'Jisca, The Maestro'`; add comma-form parse cases |
| `tests/ui/card-v1-snelle.test.ts` | `byName('Lucky Coin')`, `>Lucky Coin<` (lines 10-11, 29, 34) | Rename to `Lucky Cóin` |
| `tests/data/synergy-text-clarity.test.ts` | `REQUIRED_PARTNER_MENTIONS` (e.g. `'Martin Senor West'`, `'Gandoe'`, `'FPS Coert'`) must appear in `synergyEffect`; "no synergy holder missing from table" | Rewrite to the 5 Mosje holders + their 2.0 partner names; the "While ... on your field" start rule stays valid |
| `tests/effects/thematic-piecies.test.ts` (~lines 100-145) | `toMatchObject` rarity: loaded_dice ★★, perfect_rhythm ★, dikke_plaat ★★ (Card List: ★, ★★, ★); "out of starter decks": Boosterpackkie, Perfect Rhythm... | Update rarities; remove/limit the "not in any starter deck" assertion (Boosterpackkie is in Regelaars) - the other assertions (kastelein disabled, no "all-rounder" Piecie) stay |
| `tests/abilities/fps-west-guess.test.ts:123-126` | FPS West description contains "Guess" and "70" | Rewrite (new text is Tactical Analysis) |
| `tests/abilities/call-of-welloes.test.ts:243-245` | description contains "Level 1, 50 MP", "summoned Mosje is also defeated" | Rewrite to the Card List text |
| `tests/abilities/interrupt-data-fixes.test.ts:50-51` | Not Today! description contains "graveyard", not "Welloe pile" (Card List says Welloe pile) | Rewrite (the V4 graveyard terminology is gone in 2.0) |
| `tests/abilities/ronald-chef-lock.test.ts:158-161` | Ronald Chef description contains "lock" and "20 mp" | Rewrite |
| `tests/abilities/ability-text-reconciliation.test.ts` (lines ~127, 209, 289, 391, 519, 662, 818) | mostly `not.toContain(...)` guards on old wording; a few positive `toContain` ("activate") | Re-run; most negative guards will still pass; fix only the failures |
| `tests/abilities/phase-22-quest-gates.test.ts:289-292` | Larry Temmen quest `description` matches `/5\+|roll 5/` | Passes only if quest `description` is left untouched (recommended); do NOT overwrite quest `description` |
| `tests/bot/offlineGame.smoke.test.ts` | Seeded V4 games on the 3 original decks must FINISH in 60 turns | Re-run; see Pitfall 9 |
| `tests/data/deck-balance.test.ts` | Quest economy (`failMP >= -20`, `successMP >= 40` for ALL quests), original-deck contents, personal quests by id | Unchanged if V4 fields stay; the 2 new quests must satisfy the two guards |
| `tests/data/mp-cost-tribute-audit.test.ts`, `tests/abilities/leipe-swap.test.ts:140` | `mpCost` 0 everywhere except Welloe Force 40; Leipe Swap ★★★★★ | Unchanged (these protect the "keep V4 fields" rule) |
| `tests/card-editor-patch.test.ts:48-58` | Round-trip of every card block in the 5 data files | Must still pass: keeps the format rules in "Card editor" above |
| `tests/multiplayer/claim-starter-deck.test.ts`, `expand-deck-to-card-ids.test.ts` | Use raw `STARTER_DECKS` `DUO_COERT_BINTI` | Unchanged (raw array keeps the duo decks, just `disabled:true`) |

Playwright (not run by `npm test`, but will drift): `tests/ui/onboarding-starter-deck.spec.js` and `active-deck-lobby.spec.js` assert the 5 DUO ids in the onboarding modal and lobby dropdown; `cinema/starter-deck-onboarding-cinema.spec.js`; `tests/ui/cards/cardv1-mosje.spec.js:13-18` finds Mosjes by bracketed name; `tests/ui/cards/card-registry.js` still lists hidden cards (Phase 60 TEST-02 owns this). `seedOfflineSession`/`?deck1=` use raw ids, so those still work. Do not leave stale specs undocumented: either update the DUO/name constants (small edits) or list them in the SUMMARY as deferred to Phase 63/64.

## State of the Art

| Old Approach (V4) | Current Approach (2.0) | When Changed | Impact |
|-------------------|------------------------|--------------|--------|
| Cards cost MP (`mpCost`) | Energy `cost` | Handoff 2a | Both fields coexist until Phase 54-57 |
| 1 trait row per Mosje (`traits`) | 3 level rows (`levels[]`) | Handoff 3b | `traits` == `levels[0].traits` |
| `[First] Nickname` names | `First, Nickname` | Handoff 3a | `parseMosjeName` must learn the new form |
| 5 duo starter decks + 3 originals | 3 Example Decks | Example Decks doc | Lobby/onboarding/bot read `getPlayerFacingDecks()` |
| `DIGITAL-EQUIPMENT`/`PHYSICAL-EQUIPMENT`/`FOOD` tags | `tag` in {food, pet, substance, gear} | Handoff 2g | New singular `tag` beside V4 `tags` |

**Deprecated/outdated:** `docs/phase0-rulings.md`, `docs/card-reference.md`, `docs/developer-handoff.md`, `src/rules/card-specific-rulings.md` describe V4 (Handoff section 7 schedules their rewrite; not part of this phase).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Reuse existing `disabled: true` as the "hidden flag" (for cards and decks) instead of introducing `hidden` | Pattern 2 | Low; if Gandalf wants a distinct name, rename in 3 filter points + hidden-cards test |
| A2 | Example deck ids `EXAMPLE_TAKSEN`, `EXAMPLE_REGELAARS`, `EXAMPLE_CREATIEVELINGEN`, plus `kind` and `startingMosje` fields | Pattern 3 | Low; ids are internal, only tests and Phase 55 read them |
| A3 | `givesMP` false for MP Amplifier and Synergy Field (heuristic would mark true) | Derived facts | Medium; changes Jeffrey/The Void behaviour in Phases 58-60 |
| A4 | `stays` for Tikker and MP Hemorrhage left `null` (Card List does not bold "Stays" for them) | Derived facts | Medium; Endure Pain's "any Stays card" cost may need them |
| A5 | New quest V4 numbers: Dutch courage Physical 55/-15 (like Endurance Test), Cheat code Mental 60/-20 | Pitfall 7 | Low; V4 only, replaced in Phase 56 |
| A6 | `group` on Piecies: `mp` / `attack` / `utility` from the Card List sections; gear/pet/substance Piecies get `group: null` (their `tag` is shown instead) | Field table | Low; Phase 62 reads it |
| A7 | `getFrameTier` helper only; renderers not rewired until Phase 62 | Anti-patterns | Low-medium; Mosje faces at 1-3 stars render boxed on V4 UI meanwhile |
| A8 | Leave quest `description`/`requirementDescription` as V4 text | Field table | Medium; DATA-01 says "Card List text" for Quests: satisfied via `costText`/`extras`/`win`/`lose` |
| A9 | `rollTrait: "none"` for both Trained and Coin flip | Field conventions | Low; band disambiguates |
| A10 | Do not touch deck-builder `RARITY_COPY_LIMITS` (V4 4/3/2/2/1) in this phase | Pitfall 10 | Low; deck builder is slice 2.0-C |

## Open Questions (RESOLVED)

1. **`givesMP` edge cases (MP Amplifier, Synergy Field) and Stays edge cases (Tikker, MP Hemorrhage).**
   - What we know: the Card List text is ambiguous; heuristics gave 33 `givesMP` matches and 14 `stays` cards.
   - What's unclear: whether Jeffrey's "Piecies that give MP" includes modifiers; whether "leave Tikker face-up" / "next to the first Mosje it attacks" counts as Stays for Endure Pain.
   - Recommendation: default to the narrow reading (A3/A4) and put both in the SUMMARY as items for Gandalf; they are one-line data flips.
   - RESOLVED: decided in plan 53-04 (Piecies/Snelle): givesMP false on MP Amplifier and Synergy Field, stays null on Tikker and MP Hemorrhage, each line marked `// TODO(phase 59): confirm` and listed for Gandalf in the SUMMARY.
2. **`isBoosterOnly` on cards used by the Example Decks** (Harde Didde, Boosterpackkie, Nature's Gift = `piecie_eendjes_voeren`). `getStarterEligible` excludes booster-only, but decks are claimed by id via `claimStarterDeck`. Recommendation: leave the flag alone (economy is slice 2.0-C) and relax `thematic-piecies.test.ts` accordingly.
   - RESOLVED: decided in plan 53-04: `isBoosterOnly` stays unchanged (orchestrator decision, A10); thematic-piecies test relaxed there.
3. **Hidden quests and V4 General deck.** Recommendation: leave `gameState.js` untouched (see Pitfall 8).
   - RESOLVED: decided in plan 53-06: the 4 cut General Quests get `disabled: true` but stay in the V4 shared Quest pile; accepted risk (T-53-14) until Phases 55/56 rebuild the 3 typed stacks.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Generator, Vitest | Yes | v24.12.0 | - |
| npm / Vitest | `npm test` | Yes | vitest ^2.1.4 installed | - |
| Playwright | Optional UI specs | Yes (installed) | ^1.60.0 | Not needed for this phase's gate |
| Git | Branching (`obby-2.0`) | Yes | - | - |

No missing dependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.4, node environment |
| Config file | `vitest.config.ts` - `include: ["tests/**/*.ts"]`, excludes `_archive` |
| Quick run command | `npx vitest run tests/data tests/ui/card-v1-mosje.test.ts` (a few seconds) |
| Full suite command | `npm test` (83 files, 814 tests, about 8 s wall in this session) |

Suites that import `src/data`: 34 `.ts` files (abilities x10, bot x3, card-editor-patch, data x7, effects x1, engine x3, multiplayer x2, ui x6) plus `tests/helpers/testHelpers.js`; all are run by `npm test`.

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | 183 cards exist, right name/text/cost/rarity, ids kept, renames applied, new quests exist | unit (E29) | `npx vitest run tests/data/card-list-2-0.test.ts` | No - Wave 0 |
| DATA-02 | Mosje `startMP`, 3 level rows (`levels[0].traits == traits`), ability/synergy text, `limitPerDeck` | unit (E29) | same file | No - Wave 0 |
| DATA-03 | Tag counts 7/5/9/6, one tag max, `stays`, `levelGate` only on 3 cards, `limitPerDeck`, `givesMP` | unit (E28 + E29) | `npx vitest run tests/data/card-tags-2-0.test.ts` | No - Wave 0 |
| DATA-04 | Quest `stack` 13/13/12, `band`, `rollTrait`, `win/lose` == band row, new quests present with V4-compat fields | unit (E29) | card-list-2-0.test.ts | No - Wave 0 |
| DATA-05 | Place `cost`, `goodFor`/`badFor`, `limitPerDeck`; Drain Zone/Void in `getPlayerFacingPlaces()` | unit | `npx vitest run tests/data/player-facing-places.test.ts` | Yes - rewrite |
| DATA-06 | Hidden cards/decks excluded from `getPlayerFacingDecks`, `getPlayerFacingPlaces`, `drawPack(500)`, `getStarterEligible`, example decks; data still in arrays | unit (E29) | `npx vitest run tests/data/hidden-cards.test.ts tests/data/player-facing-decks.test.ts` | Yes - rewrite |
| DATA-07 | Each example deck: 30 cards, max 2 copies, five-star max 1, `startingMosje` inside, 6/2/18/4 composition, ids resolve, cost/tag columns agree with data | unit (E30) | `npx vitest run tests/data/example-decks-2-0.test.ts` | No - Wave 0 |
| (guard) | `getFrameTier`, `getCopyLimit`, `parseMosjeName` comma form | unit | `npx vitest run tests/data tests/ui/card-v1-mosje.test.ts` | Partly |
| (guard) | V4 engine still plays a game on the new decks | unit (seeded node smoke) | `npx vitest run tests/bot/offlineGame.smoke.test.ts` (add a EXAMPLE_* vs EXAMPLE_* case) | Yes - extend |

### Sampling Rate
- **Per task commit:** the quick command plus `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js src/ui/cardV1/parseMosjeName.js`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` fully green, plus a headless smoke of a bot-vs-bot game on each Example Deck (the Node smoke above; optionally `npm run test:sim` once, which is slow and needs the http-server)

### Wave 0 Gaps
- [ ] `scripts/obby2/parseCardList.mjs`, `parseExampleDecks.mjs`, `cardIdMap.mjs` (shared by generator and tests)
- [ ] `tests/data/card-list-2-0.test.ts` (E29), `tests/data/card-tags-2-0.test.ts` (E28), `tests/data/example-decks-2-0.test.ts` (E30) - red first
- [ ] No framework install needed

## Security Domain

`security_enforcement` is not set to false in `.planning/config.json`, so it is addressed; the phase touches only static local data and dev scripts.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | - |
| V3 Session Management | no | - |
| V4 Access Control | no | - |
| V5 Input Validation | limited | Generator treats the markdown as trusted repo content but escapes with `JSON.stringify`; the card editor's `validateEdit` regexes are untouched |
| V6 Cryptography | no | - |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Code injection via a card text containing quotes/backslashes written into a `.js` data file | Tampering | Build literals with `JSON.stringify`, never string concatenation; E29 re-imports the result |
| Hidden cards leaking into player-visible pools (information/cheating) | Information disclosure | Single `disabled` flag + E29 exclusion tests across deck, booster, deck-builder pool, bot picker |
| Dependency confusion | Supply chain | Not applicable: no new packages |

## Project Constraints (from CLAUDE.md)

- Work on a branch, never commit to `main`; here: feature branches off `obby-2.0` (e.g. `card/obby2-card-data`), merging into `obby-2.0`, never into `main`.
- One `.js` engine; never read, grep or edit `/_archive/`. No `.ts` card definitions.
- One exported function per file; small files (about 80 lines); card definition files are pure data (no logic); `src/engine` and effects stay pure.
- Verification before every commit: (1) `node --check src/main.js src/ui/modalManager.js src/ui/boardRenderer.js src/ui/handRenderer.js src/ui/logRenderer.js src/ui/actionAnimations.js` (add `src/ui/cardV1/parseMosjeName.js` because it is edited here), (2) `npm test`, (3) for MP/quest/level logic changes the simulation; this phase changes `startMP` data and adds quests, so run the Node seeded smoke and, once at the end, `npm run test:sim` (memory: the old `run-once.ts` path is gone). Target: 0 crashes, timeout rate under 25%.
- New card/feature gets a test in the same branch; E28/E29/E30 cover this.
- Missing doc files: stop and ask. All three 2.0 docs this phase needs exist (read in this session).
- Bug-reproduction-first rule does not apply (no bug fix here); do not apply it to the V4 test rewrites.
- Playwright specs, if touched, follow the `seedOfflineSession` + `GAME_URL_TEST` pattern; judge UI at 1920x1080 or larger.
- CLAUDE.md "Quick reference" still lists TS paths (`src/effects`, `.ts`), which the ONE-engine section supersedes; follow the SSOT section.

## Sources

### Primary (HIGH confidence)
- Repo files read: `.planning/phases/53-.../53-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md` (Phase 53), `docs/obby-2.0/` Handoff (sections 2g, 3, 6a), Card List, Example Decks, Phase 7 Card Frames and Art (A1, A9, A10)
- `src/data/*.js` (all 10 files), `src/engine/gameState.js`, `src/engine/deckEngine.js`, `src/engine/synergyResolver.js`, `src/ui/cardV1/*`, `src/ui/cardRenderer.js`, `src/deck-builder.js`, `src/bot/pickBotDeck.js`, `src/bot/strategy/botProfiles.js`, `scripts/card-editor/*`, `vitest.config.ts`, `package.json`, `playwright.config.js`
- Commands run: `npm test` (814 passed), Node scripts parsing the Card List / Example Decks and diffing against `ALL_CARDS` (counts, mapping, rarity/startMP/traits diffs, deck totals and cost/tag consistency)

### Secondary (MEDIUM confidence)
- Static reading of test files for text/name assertions (list above; to be confirmed by running `npm test` after each data change)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no external dependencies; existing Vitest/Node verified
- Architecture: HIGH - data shapes, filter points and editor mechanics all read from source
- Pitfalls: HIGH for the data/format ones (verified by scripts); MEDIUM for the exact list of V4 tests that will fail (static analysis, confirm by running)

**Research date:** 2026-10-10
**Valid until:** 2026-11-09 (stable; invalidated earlier if the Card List or `src/data` changes on `obby-2.0` or `main` is merged in)
