---
phase: 62
slug: 2-0-card-faces
status: ready
shadcn_initialized: false
preset: not applicable
created: 2026-10-20
---

# Phase 62 — UI Design Contract: 2.0 Card Faces

> Visual contract for the card faces. Written inline from `62-CONTEXT.md` + Phase 7 §A (no researcher/checker agent, cheap process; self-checked at the bottom). All sizes are **reference pixels** on the 440 × 660 pop-up face (field tile 240 × 176) and scale with `--u = --cv1-w / 440` (field: `min(w/240, h/176)`). Nothing is fixed-px except interactive buttons.

## Design System

| Property | Value |
|----------|-------|
| Tool | none: vanilla JS + CSS, `.js` only, builders in `src/ui/cardV1/` (one function per file), styles in `styles/card-v1.css` |
| Component library | none |
| Icons | inline SVG only (die icon, STAYS/foil glyphs), no icon font |
| Fonts | Sora 600/700/800 (names, numbers, labels), DM Sans 400/600/700 (body); local `assets/fonts/*.woff2` |
| Size token | ONE: `--cv1-w` (card width in px). Everything else is `calc(N * var(--u))`. Narrow-card rules use a CSS container query on the card width, not media queries. |
| Base | card `#050505`, radius 24, art window inset 18, left text edge 42 (pop-up) |

## Size contract (what must stay collision-free)

| Context | Width | `--u` | Rule |
|---------|-------|-------|------|
| Pop-up / detail view | 440 and up | ≥ 1 | everything unclamped, all 3 level rows |
| Hand, real size at 1920×1080 | ~386 (150% of the old 258; decided 2026-10-20) | 0.88 | all 3 level rows; text rarely clamps |
| Hand, stress case | 230 | 0.52 | all 3 level rows; ability/synergy text may clamp (D-02); the old collision check stays at 230 |
| Small (phone, Phase 65) | 100-150 | 0.23-0.34 | below 150 px wide the 3 rows collapse to the lit row; text clamps harder; no overlaps |
| Field tile | one size for every table card, max 240 × 176 (about 207 × 152 with 8 slots); decided 2026-10-20 | min(w/240, h/176) | content per "Field tile" below; Quests, Piecies, Places, Mosjes and piles all use it |

Clamped text shows a bottom fade + "…" and sets `data-cv1-clamped="true"` on the face; the detail view never clamps.

## Spacing and layout (reference px, from `design-tokens.json`)

Card faces keep the approved E1 values instead of a 4 px grid. Exceptions (all intentional): left edge 42, window inset 18, name top 40, pill height 22, border text 10.5, badge numbers 34.

Vertical stack of the pop-up, top to bottom:

| Zone | Position | Notes |
|------|----------|-------|
| Rarity diamonds | top 6, centred | lit ones only; chrome from `buildTierChrome` unchanged |
| Cost block | left 42, top 34 | number Sora 800 44, "COST" label 10/800 tracking .14em under it; no box, no crystal |
| Divider | x = 106, 1 px, white 35%, height 56 | between cost and name |
| Name | left 120, right 40, top 40 | Mosje: first name 36 → min 22 (fit) + nickname 20/600 on line 2. Piecie/Snelle/Place/Quest: one name, may wrap to 2 lines at ≤ 28. |
| Art | Mosjes always full art; others by tier (boxed 1-3, full 4-5); Quest = boxed tier 1 | Quest without art: stack colour + seigaiha + large die icon |
| **Frosted text box** | left 30, right 30, bottom 108, grows upward, max ~46% of height | bg `rgba(5,5,5,.62)`, `backdrop-filter: blur(14u) saturate(1.1)`, 1 px `rgba(255,255,255,.12)` border, radius 10, padding 12/14 |
| Level-row block (Mosje only) | last child of the text box, 3 rows | own bg `rgba(5,5,5,.80)`; row = `L1  Power 10 · Phys ★★ · Res ★ · Cre ★★` 11.5/600 tabular; lit row white + type-colour left bar 3 wide + `rgba(255,255,255,.10)` fill; dim rows opacity .55 |
| Info line | left 42, bottom 85, 12.5/600 `#f4f4f5` | "Needs: …" (Piecie/Snelle) / "Good for … · Bad for …" (Place) / "Rolls: …" (Quest); absent = no line |
| Pill row | left 42, bottom 54 | type pill (22 high) + optional STAYS chip beside it |
| Label | left 42, bottom 30, Sora 700 10.5 tracking .16em uppercase, type tint | per type, see copy |
| Footer numbers | bottom 22, left/right 42 | Mosje: POWER left, MP right (Sora 800 34 + 10/800 label), LVL chip + "<TYPE> MOSJE" centred. Quest: WIN left, LOSE right. Others: none. |

Mosje pop-up replaces the pill/info/label stack with the footer row (LVL chip centre, type label under it); Piecie/Snelle/Place keep the stack and have no footer numbers.

## Typography

| Role | Size (ref px) | Weight | Line height |
|------|---------------|--------|-------------|
| Cost number | 44 | Sora 800 | 1 |
| Name (first) | 36 fit to 22 | Sora 800 | 1.05 |
| Nickname | 20 | Sora 600 | 1.2 |
| Ability text | 14.5 default, 13 long, **floor 11.5** then clamp | DM Sans 400, ability name 700 | 1.5 |
| Level rows | 11.5 | DM Sans 600 tabular | 1.35 |
| Info line | 12.5 | DM Sans 600 | 1.3 |
| Pill / chip | 12 / 10 | DM Sans 800, tracking .08em | 22 / 18 high |
| Label / COST | 10.5 / 10 | Sora 700 / DM Sans 800, tracking .16em / .14em | 1.2 |

## Color

| Role | Value | Usage |
|------|-------|-------|
| Surface | `#050505` | card body, field tile |
| Text | `#fff` (info `#f4f4f5`) | all card text on the frosted box |
| Frosted tint | `rgba(5,5,5,.62)`; level block `.80` | text box; token `--cv1-tint-alpha` has a floor of .60 (unit-tested) |
| Fighting | `#C2410C` / tint `#FFEDD5` | Fighting Mosje + Fighting Quest |
| Digital | `#0E7490` / `#CFFAFE` | Digital Mosje + Digital Quest |
| Artistic | `#A21CAF` / `#FAE8FF` | Artistic Mosje + Artistic Quest |
| Piecie | `#15803D` / `#DCFCE7` | pill, STAYS chip outline |
| Snelle | `#A16207` / `#FEF9C3` | pill |
| Place | `#6D28D9` / `#EDE9FE` | pill |
| Quest rose `#BE123C` | **dropped** | remove `TYPE_COLORS.QUEST` use for 2.0 Quests |

Type colour is reserved for: pill, middle diamond, lit level-row bar, LVL chip, STAYS chip, Quest whole-card tint. Never for body text.

**Contrast (4.5:1, tested by construction):** worst case is pure white art. White on tint .62 → ≈ 6.2:1. Dim level rows (opacity .55) on the .80 block → ≈ 5.0:1. Phase 7 said "about 45%" for dimmed rows; .55 is the lowest that still passes 4.5:1, so that is the contract (flag to Gandalf in the summary).

## Per-type face contract

| Type | Top-left | Info line | Pill + label | Extra |
|------|----------|-----------|--------------|-------|
| Mosje (hand/pop-up) | cost (Energy) | none (traits live in the level rows) | footer row: POWER · `LVL n` chip + `<TYPE> MOSJE` · MP | frame tier via `getFrameTier` (4, or 5 holo when ★★★★★ / `foil`); synergy holder: "While <name> is also on your field: …" in the text; non-holder: `Synergy: <Card List short names>` label (`synergyLabelText`) |
| Piecie | activation cost | `needsText` only | `PIECIE` · label = `tag` (Food/Gear/Substance/Pet) else `group` (MP/Attack/Utility) | `STAYS` chip when `stays` |
| Snelle | cost; Blensen! `4` + "or free" under COST | `needsText` only | `SNELLE` · "Instant · any turn" | |
| Place | cost | "Good for: X · Bad for: Y" | `PLACE` · "Only 1 in play" | |
| Quest | dice need + "NEED" (one-success bands "4+"; two-success "2× 4+" / "2× 5+"; Trained "★★" + "TRAINED"; Coin flip "4+" + "COIN"); no cost | "Rolls: <trait \| best trait \| no trait> · <Band>" | `<STACK> QUEST` centre; WIN +N left, LOSE −N right (Trained: "can't fail") | text = "First you must: …" then Also text; no LVL chip, no Power/MP |

Live-state input (optional, Phase 63 supplies it): `{ level, power, mp, tempMp }`. Level lights the row; Power/MP show live values; `tempMp` shows big with the real MP small under it.

## Field tile (240 × 176 reference)

- Mosje: art, name + nickname on one line top, `L{n}` chip centre bottom, POWER box bottom-left, MP box bottom-right. No cost. (Fresh / Protected / Sideways / HOLD = Phase 63.)
- Piecie / Snelle / Place: art, name, small type pill, `STAYS` chip when face-up and `stays`. No cost (already paid; decided here, flag if wrong). Face-down Piecie stays the card back.
- Quest: name, need block, WIN / LOSE, **2 fail pips** top-right (empty ring / filled dot).
- Tile text never overlaps at any width the builder is given (same collision check as the pop-up).
- Field tile shadow stays short (about `0 6u 14u`, reach under 25 px): the board zone clips anything below ~29 px under the tile, which shows as a hard band on the felt table (fixed 2026-10-20 in `card-v1.css` + `board.css` `.board-zone__row`). Keep that room when the 2.0 tile CSS lands.

## Copywriting Contract

| Element | Copy |
|---------|------|
| Cost label | `COST` (never "MP COST", never "Free"; 0 renders `0`) |
| Blensen! | `4` + `or free` under COST |
| Needs | `Needs: <needsText>` (no line when none) |
| Piecie hover | "Place face-down for free. From your next turn, pay its cost to activate it." |
| Snelle hover | "Play from your hand at any time, also on your opponent's turn, with saved Energy. Needs a free Piecie slot." |
| Place hover | "Play from your hand on your turn. Works at once and stays until destroyed. Fresh Mosjes ignore it." |
| Limit | "Limit 1 per deck" (hover panel, when `limitPerDeck === 1`) |
| Clamp | text ends with "…" + fade; full text in the detail view |
| Empty / error | not applicable (a face always renders; missing art falls back to the type-colour gradient, Quests to seigaiha + die) |

## Test hooks (the contract between builders and A10 tests)

`data-cv1-cost`, `data-cv1-need`, `data-cv1-level-row="1|2|3"` with `data-lit="true|false"`, `data-cv1-power`, `data-cv1-mp`, `data-cv1-win`, `data-cv1-lose`, `data-cv1-pip="empty|filled"`, `data-cv1-stays`, `data-cv1-clamped`, `data-cv1-tier`, `data-cv1-foil`. Playwright: headless, 1920×1080, DOM/geometry assertions + saved screenshots (no pixel baselines).

## Registry Safety

Not applicable: no component registry or third-party UI code; fonts are local files already in `assets/fonts/`.

## Checker Sign-Off

Self-checked 2026-10-20 (the ui-checker agent was skipped under the cheap Obby process):

- [x] Copywriting: every string above comes from Phase 7 §A or CONTEXT.md
- [x] Visuals: one zone map for pop-up and field tile, per-type table
- [x] Color: 7 type colours + 2 tint tokens, contrast computed for the worst case
- [x] Typography: 8 text roles in 2 families, ability floor 11.5 defined
- [x] Spacing: approved E1 values, exceptions listed
- [x] Registry safety: n/a

**Approval:** pending Gandalf (read at plan time; open points: dim rows .55 vs "about 45%", no cost on Piecie/Snelle/Place field tiles)
