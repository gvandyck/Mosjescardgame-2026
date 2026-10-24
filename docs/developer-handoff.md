# Developer Handoff - Obby 2.0

> **This branch (`obby-2.0`) plays Obby Card Game 2.0.** The old V4 text that used to live here is gone from this branch (it stays in git history on `main`).
>
> The canonical rules and card data now live in `docs/obby-2.0/`:
>
> - `Obby Card Game 2.0 - Rules and Decisions.md` (Core Numbers overrides it where they differ)
> - `Obby Card Game 2.0 - Core Numbers.md`
> - `Obby Card Game 2.0 - Card List.md`
> - `Obby Card Game 2.0 - Claude Code Handoff.md`
> - `Obby Card Game 2.0 - Example Decks.md`
>
> Start at `docs/obby-2.0/README.md` (roadmap, working rules, reading order).

## Engine map (Phases 54-55)

One imperative `.js` engine, no V4/2.0 switch. 2.0 modules under `src/engine/`, one exported function per file:

- `energy/` - Energy pool (start 2, +1 per turn, max 6), `canPay`, `payEnergy`, `gainEnergy`, ability costs.
- `mp/` - MP on the five-grid, level-ups (reset to 0), Getemt.
- `winLose/` - `checkWin` (hold Level 3 until your next turn) and `checkLoss`.
- `setup/` - starting Mosje free and fresh, 3-card hand, 3 typed Quest stacks, opening die, R5 first-draw skip.
- `turn/` - turn start order, R1 empty-field rule, cooldown turn (`isCooldownBlocked`), end of turn.
- `fresh/` - fresh / level-up protection flags (`isFresh`), opponent-proof by source.
- `targets/` - own/opponent target resolvers (no "active Mosje"; the player or bot picks which Mosje).
- `table/` - summoning (pay `cost` in Energy, max 2 Mosjes per field).

Tests that matter run the real game headless: `tests/ui/turn-flow-2-0.spec.js`, `tests/ui/cards/`. Run Playwright headless only.

## Card faces (Phase 62)

One 2.0 face system for all five card types, in `src/ui/cardV1/` (one function per file, `.js` only). Entry point: `renderCard` in `src/ui/cardRenderer.js` -> `buildCardV1`.

- **Spec builders** `build{Mosje,Piecie,Snelle,Place,Quest}SpecV1` turn a card into a 2.0 spec (corner, name, text lines, level rows, info, pill, label, footer). Two face builders draw it: `buildPopupFace` (pop-up, hand, detail view; 440 x 660 reference) and `buildFieldTile` (field tile; 240 x 176). A V4 Quest without `stack` returns null and falls back to the unified template.
- **Helpers**: `formatEnergyCost`, `formatEnergyChip`, `getPiecieLabel` (tag first, else group), `getLevelRows`, `splitNeedsLead`, `getQuestNeed`, `formatQuestRollsLine`, `formatQuestStakes`, `getTextBoxLayout` (text size / clamp), `getCardPanelLines` (hover and detail panel: flavour, rarity, "Limit 1 per deck", per-type reminder).
- **Frame tier** comes from `src/data/getFrameTier.js` (Mosje 4, or 5 with five stars or `foil`; Quest 1; the rest by rarity). The diamonds show the rules rarity, not the tier.
- **CSS**: `styles/card-face-2-0.css`. ONE size token, `--cv1-w` (card width); `--u = --cv1-w / 440` and every length is `calc(N * var(--u))`. Below 150 px wide (container query `cv1card`) the 3 level rows collapse to the lit one. The frosted text box tint (`.62`) and the dim level rows (`.55`) are tokens in `faceTokens.js` with a contrast test.
- **Live state** is read from card fields: `level`, `mp`, `power`, `tempMp` (Mosje) and `failTokens` (Quest). `boardRenderer` and `hoverZoom` merge the slot into the card; without it a Mosje shows level 1 and its Start MP.
- **Data fields** `needsText` (16 Piecies / Snelle: the info line "Needs: ...") and `synergyLabelText` (14 Mosjes: Card List short names) are guarded against the Card List by `tests/data/card-list-2-0-*.test.ts`. The engine keeps using the `synergyLabel` ids.
- **Test hooks** on the DOM: `data-cv1-cost`, `-need`, `-level-row` (+ `data-lit`), `-power`, `-mp`, `-win`, `-lose`, `-pip`, `-stays`, `-clamped`, `-tier`, `-foil`.
- **Tests**: unit `tests/ui/card-face-2-0-*.test.ts`, `card-field-tile-2-0`, `card-panel-lines`, `no-v4-face-display`, `card-v1-*.test.ts`; Playwright `tests/ui/cards/cardv1-*.spec.js`, `card-faces-2-0-a10.spec.js` (A10 at 1920x1080, screenshots in `tests/ui/screenshots/cardv1/a10-*.png`) and `card-faces-2-0-sweep.spec.js` (all 183 cards at 230 / 120 px faces and 240 / 120 px tiles). Helpers: `tests/helpers/faceZones.js`, `contrast.js`, `samplePixels.js`.
- **Phase 63 did**: board layout, tile pixel size, the Fresh / Protected / Sideways / HOLD badges and their A10 tests, and live Power, `tempMp` and Quest tiles on the board (see "Board (Phase 63)" below). `deck-builder.js` still enforces the V4 copy-limit table (`getCopyLimit` is the 2.0 rule; Phase 64).

## Board (Phase 63)

The 2.0 table is played by taps. Everything new is in `src/ui/board/` (one function per file, `.js` only), styles in `styles/board-2-0.css` (shell, crystals, tiles, status strip with Confirm / Cancel, toast) and `styles/board-actions.css` (selection ring, tray, target glows); `boardRenderer.js` draws it and `main.js` owns the state and the flows.

- **One root, size tokens.** `.game-board` is a size container; its children carry `--field-tile-w` / `--field-tile-h` (one tile, `max(170px, ...)`), `--bu` (one board unit = tile width / 240), `--row-w`, `--crystal-col` (64 px) and `--field-slots` (7, or 8 while either Welloe pile has cards: both rows share it, the tiles shrink once). They are `@property` lengths declared on `.game-board > *`: read them on a board child, not on `#board-root`. The hand tokens (`--hand-card-height`, `--hand-sink`, `--hand-peek`) sit in the same file; the board reserves `--hand-peek` so no row lies under the hand. Every control is `min 44 x 44`, independent of `--bu`.
- **Rows.** Each side is crystals, 2 Mosje + 3 Piecie slots (dashed outlines when empty), deck, discard, and the Welloe pile only while it has cards (`getFieldSlots`, `buildBoardSkeleton`, `buildSlotOutlines`, `fillSlotOutlines`, `buildEnergyCrystals`, `buildWelloePile`). The middle strip is Place tile | 3 Quest stacks | End Turn (`renderPlaceTile`, `buildQuestStacksHtml`, `renderEndTurnButton`); the felt tint comes from `getPlaceTint` (`--place-tint`).
- **Tile states.** `toMosjeTileCards` merges live Power, sideways, Fresh, level-up protection, Tactician `tempMp` into the tile; `getTileBadges` / `buildTileBadges` draw the pills (FRESH, PROTECTED, SKIPS TURN, ACTED); a Level 3 tile reads `LVL 3 · HOLD`.
- **Controller** (`createBoardController`): `idle` -> tap an own card -> `selected` (action tray: Attack, Quest, Ability, Details; Piecie: Activate, Details; Place: Details) -> Attack -> `choose-target` -> tap a target -> `preview` -> Confirm -> engine; or Quest -> `choose-quest` -> tap a Quest tile -> the picker and roll modals. It reuses `runAttackFlow` / `runQuestFlow` (new preset arguments `slotIndex`, `targetPlayerId`, `targetSlotIndex`, `stackId`) and `settleReactions`, so every engine path is unchanged. Cancel, Esc, empty felt and the end of the turn return to `idle`. A chip that cannot be used stays tappable with `aria-disabled="true"` and a toast says why (`showToast`, `#board-toast`).
- **Status strip** (`pickStatusMessage`, `renderStatusStrip`, `#status-strip`, always 44 px): one message by priority: action mode (`choose-target`, `preview` with Confirm / Cancel, `choose-quest`) > `cooldown` > `hold` > `bot-turn`. Prompts: End Turn asks "A Mosje can still act" only while a Mosje can attack or Quest (`countActionsLeft`, `confirmEndTurn`); the Reaction prompt is the generic option modal with a context line and a "No reaction" row (`describeReactionContext`).
- **DOM hooks for tests**: `data-board`, `data-zone` (`opponent|middle|player`, and on tiles `mosje|piecie|place`), `data-slot-kind`, `data-energy` + `data-energy-max`, `data-crystal` (`full|empty|spend`), `data-action-tray`, `data-action` + `aria-disabled` + `data-reason`, `data-status-kind`, `data-confirm`, `data-cancel`, `data-target` (`valid|invalid`), `data-quest-stack` + `data-stack-count`, `data-place-owner`, `data-badge`, `data-actions-left`, `data-pile` + `data-count`. Kept: `#btn-end-turn`, `#quest-stacks`, `.mosje-card--owned` / `--opponent`.
- **Test helpers**: `tests/helpers/boardTaps.js` (`tapOwnCard`, `chooseTray`, `attackByTap`, `questByTap`, `activateByTap`, `abilityByTap`, `readTrayChip`; every helper takes `{ touch: true }` to press with `locator.tap()`), `tests/helpers/clickEndTurn.js` (answers the End Turn confirm). `attackViaUi` / `questViaUi` in `tests/ui/helpers.js` delegate to them. Specs: `energy-pool`, `attack-action`, `getemt-sideways`, `level-up-protection`, `quest-stacks`, `snelle-reaction`, `place-play` (1920x1080 and 1280x800), `cooldown-turn`, `empty-field-summon`, `win-hold-level3`, `board-layout-2.0` (U12 plus the 44 px floor at 1920x1080 and 1280x800), `tap-only-turn` (a whole turn by touch). Screenshots: `tests/ui/screenshots/board-2-0/` (git-ignored).
- **Known limits (Phase 65 / 66 own them).** Below about 1000 px viewport height the three rows cannot fit above the hand (at 1280x800 the bottom row is partly under the hand; taps still reach it). The hand is sunk only under `@media (hover: hover)`, so a touch-only device (`hover: none`, also every Playwright `hasTouch` context) shows the hand full height over the board: the phone hand (swipe-up drawer), the phone board layout, swipes and long-press are Phase 65. The tier look of board tiles (tier-coloured edge, foil) is Phase 66.
