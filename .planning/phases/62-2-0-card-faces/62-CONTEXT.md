# Phase 62: 2.0 Card Faces - Context

**Gathered:** 2026-10-20
**Status:** Ready for planning (next: /gsd-ui-phase 62, then /gsd-plan-phase 62)

<domain>
## Phase Boundary

Every card face (pop-up/hand face AND field-tile face) follows the Phase 7 §A frame spec for Mosjes, Piecies, Snelle, Places and Quests, built on the rarity-tier design already in `src/ui/cardV1/`. Requirements UI-04, TEST-04. The 5 ROADMAP success criteria are the scope.

Out of scope (other phases): board layout, Energy crystals, End Turn, tile pixel size and the live-state badges on the board (Fresh / Protected / Sideways / "LVL 3 · HOLD" / Tactician MP) = Phase 63; phone layout = Phase 65; lobby/deploy = Phase 64.

</domain>

<decisions>
## Implementation Decisions

### Update 2026-10-23: UI work committed on obby-2.0 after these plans were written (8cac3cd + the text-fit spec commit)
- **Hover dock:** hovering ANY card (field, opponent's, hand) previews it large in the right-hand dock, same spot and size as the action spotlight (`.hover-zoom` in styles/arena.css; `hoverZoom.js` no longer positions anything). Gandoe likes this: keep it, never go back to a cursor-following popup. Guarded by `tests/ui/hover-dock.spec.js`.
- **Hand size:** hand cards are now 150% (about 386 px at 1920x1080, 338 px at the smallest); `--hand-sink` is 47% of the card height. `cardv1-hand.spec.js` enforces text collisions from 338 px up; 230 px is informational until 62-03 turns it back on.
- **Auto-fit text:** `getBoxedTextFit` (in getAbilityTextSize.js) shrinks boxed text down to 11.5 and flags text that cannot fit; `tests/ui/cards/card-text-fits.spec.js` guards it. The 2.0 text box (D-02) replaces it, so port the intent, not just delete it.
- **Felt table:** `styles/table.css` paints the board page background. Untouched by Phase 62.

### Branches (asked 2026-10-20)
- **D-01:** No UI branch is merged first. `ui/card-frame-v1`, `ui/arena-hover-spotlight` and `ui/rarity-tiers` are already ancestors of `obby-2.0` (and of `main`), so there is nothing to bring in. `ui/graveyard-clickable-cards` (1 commit) is decided in Phase 63. `ui/mosjes-headline-doodle` stays parked; `ui/arena-style-cards` is V4 planning docs only.

### Tight sizes (asked 2026-10-20)
- **D-02:** Text clamps first, the 3 level rows stay. At hand size (~230 px) and up a Mosje shows all 3 level rows (current one lit, L1 when there is no live state). Ability and synergy text shrinks to a font floor, then clamps with a fade and "…". Below ~150 px (phone) the 3 rows collapse to the lit one only. The large detail view always shows the full text. Faces scale from ONE size token (container-relative units, no fixed-px layout), per the Mobile-ready rule in ROADMAP Phase 62. The existing 230 px collision failures (`cardv1-hand`: mosje_martin_historian, mosje_martin_senor_west, piecie_bowie_stormey, piecie_tony, piecie_gekke_vogels) must be fixed by this, not by weakening the check.

### Needs line (asked 2026-10-20)
- **D-03:** New `needsText` data field on Piecies and Snelle, written from the Card List (16 cards have a leading "Needs:" / "Only if" sentence today, plus the 3 `levelGate: 2` cards). The face prints it on the info line above the pill and drops that same sentence from the text box (no duplicate). No `needsText` = no info line (never print "Requires: Any"). A guard test checks every `needsText` against the start of the Card List text. The old V4 `requirement` codes are no longer shown; this fixes the display leftover for Jammertje Gepakt! and Lucky Cóin. Before deleting the `requirement` field, the planner checks its other readers (`src/deck-builder.js`, `src/ui/modalManager.js`, `src/ui/packOpeningOverlay.js`); stopping the display is mandatory, removing the data is optional.

### Wording calls (asked 2026-10-20, after planning)
- **D-10:** The "Synergy: <partners>" label on a non-holder uses the Card List SHORT names ("Senor West, ViannaPoes"), because they fit the card better. New data field `synergyLabelText` (string) on the 14 Mosjes that have a `synergyLabel`, copied from the Card List Synergy column, with a guard test. The engine keeps using the `synergyLabel` ids.
- **D-11:** Quest dice need for one-success bands (Steady, Prepared, Gated) shows plain "4+"; two-success bands show "2× 4+" / "2× 5+"; Coin flip "4+" + COIN; Trained "★★" + TRAINED.
- **D-12:** "Only if X: it gains …" Piecies split as planned: info line "Needs: X", text box "It gains …" (one capital letter changes, no other word).

### Locked by Phase 7 §A (Gandalf, 2026-10-10; do not re-ask)
- **D-04:** Cost top-left as a big number (Sora 800) + small "COST" under it, no box or crystal; 0 shows "0" not "Free"; old "MP COST" label goes; Blensen! shows "4" with "or free" (`costText`). Field mode drops the cost for Mosjes. Quests show the dice need there instead.
- **D-05:** Text box is frosted/blurred (art shows through, dark tint) with text contrast 4.5:1 or better; overrides the old "no blur" rule. Ability name bold; text split at sentence breaks only, never reworded.
- **D-06:** Mosjes: always full art; frame tier from `getFrameTier` (4, or 5 when ★★★★★ or `foil: true`); footer = Power bottom-left, LVL chip + type centre, MP bottom-right; 3 level rows from `levels[0..2]`; name + nickname.
- **D-07:** Piecies: "Needs:" line only with a requirement; pill `PIECIE`; label under it = `tag` first (Food / Gear / Substance / Pet) else `group` (MP / Attack / Utility); "STAYS" chip next to the pill when `stays`. Snelle: pill `SNELLE`, label "Instant · any turn". Places: cost, "Good for · Bad for", pill `PLACE`, label "Only 1 in play". Piecie/Snelle/Place frame tier from their own rarity (1-5, as on main).
- **D-08:** Quests: whole card in stack colour (Fighting `#C2410C`, Digital `#0E7490`, Artistic `#A21CAF`); dice need top-left with "NEED" ("2× 4+"; Trained "★★ TRAINED"; Coin flip "4+ COIN"); "Rolls: <trait>" + band info line; "First you must: …" then the Also text; footer WIN +N / pill `<STACK> QUEST` / LOSE −N (Trained: "can't fail"); no LVL chip, no Power/MP boxes, no cost, tier-1 frame; placeholder art = stack colour + seigaiha + big die icon; field tile shows name, need, win/lose and 2 fail pips (empty/filled). Faces are for the 38 2.0 Quests (those with `stack`), not the 10 leftover V4 quests.
- **D-09:** Hover/long-press panel carries flavour text, rarity, "Limit 1 per deck" when `limitPerDeck` is 1, and the per-type reminder line (A4-A6). Not on the face.

### Claude's Discretion
- **Live state:** the Mosje face builders accept an optional live-state input (level, power, mp, tempMp) so the pop-up of a field Mosje shows the right lit row, Power and MP. Phase 62 renders what it is given; Phase 63 wires the board and owns Fresh / Protected / Sideways / HOLD badges and their A10 tests.
- **V4 coexistence:** 2.0 replaces V4 faces in place. The `?cardv1=off` switch (`isCardV1Enabled.js`) can be dropped. V4-string tests (`tests/ui/card-v1-{piecie,place,snelle}.test.ts`, `tests/ui/cards/cardv1-{piecie,place,snelle}.spec.js`: "Requires:", "MP COST", old Piecie sub-categories, "Instant - play any time", "Only 1 active") are rewritten to 2.0, not deleted.
- **Contrast** is guaranteed by construction (tint alpha token with a unit test for the worst case, white art) plus a pixel-sample check in Playwright.
- **Test evidence (TEST-04):** unit tests for the A10 items (Mosje tier always 4/5; foil only with ★★★★★ or `foil`; Piecie label tag-first; cost 0 renders "0"; needsText vs Card List) + headless Playwright at 1920×1080 with DOM/geometry assertions (lit level row, cost text, stack colour, need/win/lose/pips, no text collisions at 230 px) and screenshots saved for Gandalf to review. No pixel-diff baselines.
- **Quest dice need** derived from `QUEST_BANDS` / quest fields (add structured count/min if the string `needs` is too loose).
- **Plan order** (one card type per plan, shared frame first) and `.js`-only code in small one-function files, per CLAUDE.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec (Card List wins over phase docs)
- `docs/obby-2.0/Obby Card Game 2.0 - Phase 7 Card Frames and Art.md` §A1-A10 — the frame spec, data map (A9) and test list (A10)
- `docs/obby-2.0/Obby Card Game 2.0 - Card List.md` — card texts, costs, Quest band table (line ~72), Rulings section
- `docs/obby-2.0/Obby Card Game 2.0 - Claude Code Handoff.md` §3b (data fields), §4 (board pieces)
- `docs/obby-2.0/README.md` — reading order and working rules

### Planning
- `.planning/ROADMAP.md` Phase 62 entry (5 success criteria, Known gap at 230 px, Mobile-ready rule)
- `.planning/REQUIREMENTS.md` UI-04, TEST-04
- `.planning/STATE.md` "How we work" (headless Playwright only, 1920×1080+, never test:sim, no probe files in tests/, `node --check` each UI file, never weaken tests)
- `.planning/phases/65-mobile-play-touch-ux-and-phone-layout-for-the-2-0-game/` — what Phase 65 will build on these faces

### Existing design (the base this builds on)
- `design/HANDOFF.md` and `design/card-frame-v1/` — the approved E1 frame (left-aligned at 42 px, Sora + DM Sans, art window inset); `docs/arena-ui.md` for hover/spotlight

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/cardV1/` (34 small one-function files): `buildFaceV1`, `buildFieldFaceV1`, `build{Mosje,Piecie,Snelle,Place,Quest}SpecV1`, tier chrome / shine / boxed layers, `getDescriptionLayout`, `getAbilityTextSize`, `fitFirstName`, `parseMosjeName`, `splitSentences`.
- `src/data/getFrameTier.js` — already implements Phase 7 A1 (Mosje 4/5 by stars or `foil`, Quest 1, others by stars). `src/data/questBands.js` — 2.0 band table.
- Phase 53 data fields already on the cards: `cost`, `costText`, `levels[]`, `tag`, `group`, `stays`, `levelGate`, `goodFor`/`badFor`, `limitPerDeck`, `foil`; Quests have `stack`, `band`, `rollTrait`, `costId`, `win`, `lose`, `extras`. Missing: `needsText`.
- Test helpers: `tests/ui/cards/cardv1-helpers.js`, `seedOfflineSession` + `window.__testHooks`.

### Established Patterns
- Spec builder (data → spec) separate from HTML builder (spec → markup); CSS in `styles/card-v1.css` (370 lines); pure data in `src/data/*.js`.
- Builders still read V4 fields: `mpCost` / `formatCost` ("Free", "MP COST"), `getRequirementText` ("Requires: Any"), `getPiecieCategoryLabel` (sub-categories), Place with no badge, Quest in rose with `successMP`/`failMP`, Mosje boxed by rarity tier and badge = MP only.

### Integration Points
- Render call sites: `src/ui/cardRenderer.js` (511 lines, `buildUnifiedCardHTML`, `buildMosjeCardHTML`, `buildPlaceCardHTML`), `handRenderer.js`, `boardRenderer.js`, `hoverZoom.js`, `cardSpotlight.js`, `modalManager.js`, `cardAudit.js`, `cardTiersDemo.js`, `cardEditor/main.js`.
- Existing specs to rewrite/extend: `tests/ui/cards/cardv1-{hand,mosje,piecie,snelle,place,board,activate-btn}.spec.js`, `quest-cards-2-0.spec.js`, `tests/ui/card-v1-*.test.ts`, `card-tiers.*`, `quest-card-tiers.spec.js`.

</code_context>

<specifics>
## Specific Ideas

- Visual truth for the mock-up: "0c · Alyssa with Power + Energie" (Board & Combat canvas, per Phase 7 A2).
- Judge everything at 1920×1080 or larger; hand size (~230 px) and the small-size floor (~100-150 px) are the stress cases.

</specifics>

<deferred>
## Deferred Ideas

- `ui/graveyard-clickable-cards` — decide in Phase 63 (modal/board UI).
- Field-tile pixel size: DECIDED 2026-10-20 (Gandalf, applied on the V4 board as a CSS change): every card on the table (Mosjes, Piecies, Places, Quests, deck and discard piles; both sides) is ONE landscape size, the 240:176 tile, at most 240 × 176 at 1080p (about 207 × 152 with a full row of 8 slots). The Quest cards get that size too. The hand is 150% of its old size (about 386 × 563 at 1920 wide; old 258 × 375), sunk by 47% of its height, with an overlap that adapts so a full hand fits. Phase 63 keeps these sizes when it rebuilds the board; the 62 faces must look right at the field size and at the new hand size (the 230 px collision check stays as the stress case).
- Fresh / Protected / Sideways / HOLD / Tactician-MP badges and their Playwright tests — Phase 63.
- Place-coloured felt (optional mock-up idea) — Phase 63.
- Quest art — optional, not required for the frame.
- Phone layout — Phase 65.

</deferred>

---

*Phase: 62-2.0 Card Faces*
*Context gathered: 2026-10-20*
