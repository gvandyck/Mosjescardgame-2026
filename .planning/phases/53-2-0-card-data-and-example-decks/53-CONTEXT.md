# Phase 53: 2.0 Card Data and Example Decks - Context

**Gathered:** 2026-10-10
**Status:** Ready for planning
**Source:** Handoff express path (Gandalf chose "mostly autonomous"; the Obby 2.0 docs are the locked spec)

<domain>
## Phase Boundary

Make `src/data/*.js` hold the 2.0 Card List: every card's 2.0 name, text, Energy cost, rarity and the new 2.0 fields; hide V4-only cards (data kept); add the 3 Example Decks. This phase changes **data plus the data-access helpers** (card index, deck/booster/bot pools, starter-deck list), not game rules. Rules (Energy, levels, attacks, Quests, slots) are Phases 54–57; effects are Phases 58–60; card faces Phase 62.

</domain>

<decisions>
## Implementation Decisions

### Source and precedence (locked)
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` is the text and number source for every card; it wins over phase docs and over current `src/data` texts.
- Keep every existing card `id` (saved decks, tests, art paths). New ids only: `quest_dutch_courage`, `quest_cheat_code`.
- Apply handoff §3a renames exactly (Nature's Gift for `piecie_eendjes_voeren`, Lucky Cóin, Quest spellings, Mosje names without `[ ]` brackets: "Gandoe, The Unpredictable Wizard").
- Keep `artPath` values untouched.

### Fields (locked, names may follow codebase conventions — document any rename in the SUMMARY)
- Mosje: `cost` (Energy), `rarity`, `startMP`, `levels: [{ power, traits }] ×3`, ability name + text, synergy label (partner ids) and holder `synergyText`, `limitPerDeck`.
- Piecie / Snelle: `cost` (Blensen! "4 or free" as a cost text/flag), `rarity`, `tag` (`food` | `pet` | `substance` | `gear` | null; exactly food 7, pet 5, substance 9, gear 6; at most one per card), `stays`, `levelGate` (2 or null; only Harde Didde, Klaar Met Jou, Dikke Taks), `limitPerDeck`, `givesMP`, text. `DIGITAL-EQUIPMENT` / `PHYSICAL-EQUIPMENT` become `gear`; functional tags may remain as internal metadata only.
- Quest: `stack` (FIGHTING/DIGITAL/ARTISTIC; 13/13/12), `band`, `rollTrait` (trait | `best` | `none`), cost text/id ("First you must…"), `win`, `lose`, `extras`.
- Place: `cost`, `rarity`, text, `goodFor`, `badFor`, `limitPerDeck`.
- Limit 1 per deck: every ★★★★★ card, plus The Protector and Mosje Reborn (and any card the Card List marks).
- Frame data (Phase 7 §A1/§A9): keep rules `rarity` separate from a derived `frameTier`; add the editor `foil` flag; per the Phase 7 proposal set `foil: true` on the 12 Mosjes that `main` had at ★★★★★ on 2026-10-06.

### Hidden cards (locked)
- Add a hidden flag and exclude from decks, boosters, deck builder lists and the bot pool, data kept: Mosjes `mosje_binti_creator`, `mosje_amplifier`, `mosje_coert_kastelein`; Piecie `piecie_mp_adjuster`; Place `place_momentum_factory`; Quests `quest_precision_work`, `quest_the_gauntlet`, `quest_elimination_challenge`, `quest_chain_master`, all `quest_personal_*` and `quest_west_perfect_read`; the 5 duo decks and the 3 old starter decks.
- Unhide `place_drain_zone` and `place_the_void` (`playerFacingPlaces.js` `HIDDEN_PLACE_IDS`).

### Example Decks (locked)
- The 3 decks from `Obby Card Game 2.0 - Example Decks.md` (Fighting "Taksen", Digital "Regelaars", Artistic "Creatievelingen"): 30 cards each, max 2 copies, ★★★★★ max 1, starting Mosje marked and inside the 30.

### Transition strategy (locked by orchestrator, Gandalf delegated)
- The V4 engine on `obby-2.0` must keep running and `npm test` must stay green at the end of this phase. So: **add** the 2.0 fields alongside V4 fields; keep V4 fields (`mpCost`, `roll.thresholds`, `successMP`/`failMP`, `requirement`, `questType`, `difficulty`, `level` 0-based, …) until the phase that rewrites their consumer (54–57) removes them.
- Where V4 tests assert old card **texts/names/costs** that this phase changes, update or delete those assertions in this phase (V4-rule tests are rewritten, never left failing).
- No V4/2.0 switch in code.

### Claude's Discretion
- Exact field names and shapes where the codebase already has a convention (e.g. traits as `{ physical: 3 }` vs existing trait format) — follow existing conventions, record the mapping.
- How to structure the deck definitions and the hidden flag (keep `STARTER_DECKS` shape if the lobby reads it).
- Splitting files to respect CLAUDE.md "small files" where a new helper is added (one exported function per file).
- Whether Quest band values are stored per card or derived from a band table (Card List band table is the source of the numbers).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 2.0 spec
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` — §3 card data changes (ids, renames, hidden cards, fields), §2g tags/limits/gates, §6a E28–E30
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` — every 2.0 card's text and numbers (wins over everything)
- `docs/obby-2.0/Obby Card Game 2.0 - Example Decks.md` — the 3 decks
- `docs/obby-2.0/Obby Card Game 2.0 - Core Numbers.md` — numbers and rulings (MP multiples of 5, Power multiples of 10)
- `docs/obby-2.0/Obby Card Game 2.0 - Phase 7 Card Frames and Art.md` — §A1 frame tier / foil, §A9 data the frames need

### Codebase
- `src/data/mosjes.js`, `piecies.js`, `snellePiecies.js`, `places.js`, `quests.js`, `starterDecks.js`, `cardIndex.js`, `boosterEngine.js`, `playerFacingDecks.js`, `playerFacingPlaces.js`
- `CLAUDE.md` — one `.js` engine, never read `/_archive/`, verification sequence, small files

</canonical_refs>

<specifics>
## Specific Ideas
- E28: tag counts food 7 / pet 5 / substance 9 / gear 6, no card with two tags.
- E29: every Card List card exists with right cost/rarity/fields; hidden cards excluded from decks, boosters and the bot.
- E30: each Example Deck 30 cards, max 2 copies, ★★★★★ max 1, starting Mosje inside.
- A good E29 implementation parses the Card List markdown tables in a test and compares against `src/data`, so the data can't drift from the doc.

</specifics>

<deferred>
## Deferred Ideas
- Removing V4 fields and their consumers — Phases 54–57.
- Effect rewrites to the new texts — Phases 58–60.
- Card face rendering of the new fields — Phase 62.

</deferred>

---

*Phase: 53-2-0-card-data-and-example-decks*
*Context gathered: 2026-10-10 via handoff express path*
