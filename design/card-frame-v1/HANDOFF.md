# MOSJES Card Frame v1 - Design Brief and Handoff

Status: design approved by Gandalf (the "E1" frame, final iteration). Your job is to implement it in the game, faithfully, for every card type.

## 0. What is in this folder

| File | Purpose |
|---|---|
| `HANDOFF.md` | This document: brief, spec, mapping, verification |
| `CLAUDE_CODE_PROMPT.md` | The kickoff prompt (already given to you) |
| `design-tokens.json` | Exact numbers: sizes, colors, fonts, offsets |
| `reference/card-system.html` | Static visual reference: one of each type, pop-up + field mode + hover panel. Open in a browser. |
| `reference/art/` | The 4 art files used in the reference |
| `source/CardSystem.dc.html` | Original design source (read-only, has absolute px values). Not runnable on its own. |
| `card-system.png` (if present) | Exported screenshot of the reference. Treat as visual truth. |

Source of truth order: `card-system.png` > `reference/card-system.html` > `design-tokens.json` > this text. If they disagree, say so; do not guess.

## 1. Goal

Replace the current card faces with the new full-art frame for **Mosje, Piecie, Snelle Piecie and Place** cards, in two display modes:

1. **Pop-up / full card** - the large view (hover, long-press, hand inspect). Reference size 440 x 660 (2:3).
2. **Field mode** - small tile on the board: art, name, small pill, small badge. Reference size 240 x 176.

Quest cards are **not** part of this design. Do not touch the Quest renderer. Face-down card backs also stay unchanged.

## 2. Design language (non-negotiable)

Do:
- Black rounded card (`#050505`, radius 24) with the art as a full-bleed window inside it (inset 18 / 18 / 18 / 40, radius 10).
- Text sits directly on the art over a dark gradient fade. One dark layer per area, never a box on top of a fade.
- Everything on the face is **left-aligned on one edge: 42px from the card's left**: name, title, description, info line, pill, border text.
- MP/cost badge is a rounded square that **straddles** the art window's bottom-right corner (half on art, half on the black border).
- Border artifacts: striped tick marks on left and right border, three small diamonds at top center (middle one in the type color).
- Fonts: **Sora** (names, badge numbers, border text) and **DM Sans** (body). Modern sans only.
- Rounded corners everywhere (pills radius 5, badge radius 16).
- Generous spacing (see section 5).

Do not (each of these was tried and rejected):
- No serif fonts.
- No blur / backdrop-filter on the text area. Readability comes from the dark gradient only.
- No divider line between the info line and the description.
- No square corner brackets on the border. No circular/round MP counter.
- No "MOSJES" wordmark text anywhere on the card.
- No stacked dark shapes (a dark box over the dark fade).
- Flavor text and rarity are **not on the card face**. They appear only in the hover / long-press detail panel.

## 3. Card types and data mapping

Colors come from `design-tokens.json > typeColors`. `main` = pills and the middle diamond. `tint` = border text and badge label.

| Type | Color | Name block | Pill | Info line (above pill) | Border text (below pill) | Badge |
|---|---|---|---|---|---|---|
| **Mosje** | by Mosje type: Fighting `#C2410C`, Digital `#0E7490`, Artistic `#A21CAF` | first name XL + nickname L | `LVL <current level>` | traits with stars, e.g. `Physical ★★★ · Social ★★★ · Resilient ★★` | `<Type> Mosje` | **current MP** (live), label `MP` |
| **Piecie** | `#15803D` | name XL, no second line | `PIECIE` | `Requires: <req>` (e.g. Any, Lvl 1+) | the Piecie sub-category (Momentum-Gaining, Momentum-Draining, Utility, Digital Equipment, Pet Protection, Substance, Attack) | cost: `Free` or number, label `COST` / `MP COST` |
| **Snelle** | `#A16207` | name XL, no second line | `SNELLE` | `Requires: <req>` | `Instant - play any time` | cost, label `MP COST` |
| **Place** | `#6D28D9` | name XL, no second line | `PLACE` | `Good for: X - Bad for: Y` | `Only 1 active at a time` | **none** (no cost/MP) |

Notes:
- Mosje name comes from `[FirstName] Nickname`. First name = text in brackets. Nickname = the rest, trimmed. Edge cases in the card list: no nickname (`[FPS Coert]`, `[FPS West]`, `[Dancing/DDR Chris]`), placeholder (`[...] The Hacker`), nested quotes (`[Tuk "The Builder"] The Sims Architect`), long first names (`Dancing/DDR Chris`, `AZN Cless`, `Parkour West`). No nickname = single line, no gap. Long first names must auto-shrink to fit the width between the 42px edges (min 24px), never wrap or clip.
- **MP and level are live game state**, not the printed "Start MP". The reference shows 0 and LVL 1 only as examples.
- Piecie sub-category: derive from the data model if a field exists. If not, flag it, and use the card list section headings as source. Do not invent categories.
- Place has no badge. The info line may therefore run the full width (right edge 42px instead of 110px).
- Ability text is split into separate lines **at sentence breaks, formatting only**. Never reword, trim or reorder card text. Ability name stays bold (e.g. **Unstoppable:**).
- Rarity: Mosjes use diamonds (◆◆), others use stars (★★☆☆☆). Hover panel only.

### Hover / long-press detail panel (not on the face)

Small dark panel (`#14121c`, 1px `#2e2a3d`, radius 10) with label "Hover / long-press":
- Mosje: flavor text (italic) + Rarity
- Piecie: "Place face-down first. It can activate after 1 full turn." + Rarity
- Place: "Cannot be overwritten, only destroyed by effects." + Rarity
- Snelle: "Can be played from hand at any time, even on the opponent's turn." + Rarity

Reuse the existing pop-up/tooltip pattern in the game for this (see rule in section 7); do not build a new modal.

## 4. Layout spec (pop-up, reference 440 x 660)

All values in px at reference size. Implement as **proportional scaling** (CSS custom property for card width, or container query units), because the card appears at many sizes. Never hardcode px that cannot scale.

Vertical stack, measured from the card bottom:
- Border text: bottom 12, 10.5px Sora 700, letter-spacing .16em, uppercase, tint color
- Pill: bottom 41, height 22, padding 0 9, radius 5, 12px DM Sans 800, letter-spacing .08em, white on type main
- Info line: bottom 72, 12.5px 600, `#f4f4f5`, right edge 110 (42 if no badge)
- Description: bottom 114, 14.5px DM Sans, line-height 1.5, 10px gap between sentences, white with text-shadow `0 1px 3px #000, 0 0 8px #000, 0 0 14px #000`
- Badge: 80 x 80, right 10, bottom 12, bg `#050505`, radius 16; value Sora 800 34px (26px for the word "Free"); label 10px 800, letter-spacing .14em, tint

From the top:
- Name block: top 40, left 42. First name Sora 800 40px / lh 1.05 / ls -.01em. Nickname Sora 600 20px / lh 1.2 / margin-top 7. Text-shadow `0 2px 8px rgba(0,0,0,.85)`.
- Top fade: height 150, `rgba(0,0,0,.88)` to transparent.
- Bottom fade: gradient `0 -> .6 at 36% -> .9`. Height 380 default, 250 for short text (1 sentence), 440 for very long text.
- Stripes: left 5 and right 5 (card edge), top 296, 8 x 64, `repeating-linear-gradient(180deg, rgba(255,255,255,.5) 0 2px, transparent 2px 8px)`.
- Diamonds: top 6, left 208 / 218 / 228, 5 x 5, rotated 45 deg, middle in type main, others `rgba(255,255,255,.5)`.

Long text rule (needed: several Mosjes have 3-4 effects): default 14.5px. Step down in small steps to a minimum of 12.5px if the description would collide with the name block or exceed ~55% of card height. Increase the bottom fade height to match. If text still does not fit at minimum, do not clip silently: list that card in the verification report.

Art: `object-fit: cover`, default position 50% 50%. Allow a per-card `artFocus` (x% y%) override if the data model has room; the reference uses it for field tiles (e.g. Alyssa 50% 24%) so faces stay visible. Missing art: a neutral dark fallback in the type color, text still readable. Never a broken-image icon.

## 5. Field mode spec (reference 240 x 176)

- Tile: bg `#050505`, radius 14. Art window inset 8 / 8 / 8 / 14, radius 7. Top fade 48, bottom fade 44.
- Name at top 6 / left 10: first name Sora 800 17px, nickname Sora 600 11px (margin-left 6, opacity .9), single line, ellipsis on overflow. Non-Mosjes: name only.
- Small pill bottom-left (bottom 10, left 10): Mosje `L<level>`; others the kind label. 10.5px 800, height 18, radius 5.
- Badge: 50 x 50, right 5, bottom 5, radius 11, straddling the art window corner. Value Sora 800 20px (14px for "Free"), label 8px. Not shown on Place.
- No description, traits or border text in field mode.

## 6. Implementation guidance

- Find where cards are rendered today (`renderMosjeCard()` in `script.js` and the equivalents for Piecie, Snelle, Place). Reuse them: change markup and styles, do not rewrite the engine.
- CSS: patch existing files (`mosje_style.css`, `style_v3.css`), do not replace wholesale. Put the new frame under one clear namespace (for example `.card-v1`) so old and new can coexist until approved, then remove the old paths in a separate cleanup commit.
- A partially done redesign exists on a separate branch (full-art background, type-colored borders, trait rows, activate button). Inspect it first. Reuse what is compatible, resolve conflicts explicitly, and keep the **activate ability button** behavior working (see section 7).
- Fonts: load Sora and DM Sans. Prefer self-hosting into the repo (the game is FTP-hosted); fall back to Google Fonts only if self-hosting is a problem, and tell Gandalf.
- Star glyphs (★) and diamonds (◆) must render the same on all browsers. Check this.

## 7. Guardrails

- Do not change card text, stats, costs, abilities or any game logic. Visual layer only.
- All existing vitest tests must stay green (currently 546). Run the full suite before each commit.
- Reuse existing UI components (modal, tooltip, Mosje selector). No new modals.
- Interactive elements that existed before must still work: ability activation button, selection, drag/target highlighting, face-down state.
- Branch discipline: work on `ui/card-frame-v1` (or `card/*` per convention). Never commit to main. Merge only after Gandalf's approval.
- Out of scope but nearby (flag, do not fix silently): the known "Lucky Coin wrong label" bug, MP floor below 0, anything in Quests.

## 8. Verification (design is checked per card type)

Do this for **each** type, in this order: Mosje, Piecie, Snelle, Place. Do not start the next type until the current one passes and Gandalf has seen it.

Test cards (render the real card from game data, not a mock):

| Type | Cards |
|---|---|
| Mosje | Alyssa The Bulldozer (3 effects), Ronald The Master Chef (2 effects), Jisca The Maestro (longest text, stress test), one Mosje with no nickname (FPS Coert), one with a long first name (Dancing/DDR Chris), one per type color (Fighting, Digital, Artistic) |
| Piecie | Kannetje Melk (Free, short text), one with a numeric cost, one with a long effect (Emergency Swap or Stookerino) |
| Snelle | Lucky Cóin (numeric cost), one with Free cost (Momentum Rush) |
| Place | The Gym (no badge), one with long text (Delluft or Digital Gaming Stop) |

For each: pop-up mode and field mode at 1:1, plus one small-size render (hand/field scale).

Checklist per card type (write results to `design/card-frame-v1/VERIFICATION.md`, one section per type, pass/fail per line):
1. Left edge: name, nickname, description, info line, pill and border text all start at the same x.
2. Badge straddles the art window corner; value fits (try 0, 5, 100+, "Free").
3. No text collides with the badge, the stripes or the name block.
4. Longest text in the type fits without clipping, or is listed as overflowing.
5. Name block: no-nickname case, long-first-name case, long nickname case.
6. Type color is correct on pill, border text, badge label and middle diamond.
7. No blur, no divider, no brackets, no wordmark, no serif, no flavor/rarity on the face.
8. Hover panel shows the right content for the type.
9. Field mode: name ellipsis, pill, badge, Place without badge.
10. Missing-art fallback renders cleanly.
11. Live values: MP and level update when game state changes.
12. Side-by-side with `reference/card-system.html` (same viewport): list every visible difference, even small.

Never write "matches the design" without having rendered and compared it. If you cannot take screenshots in this environment, say so and give Gandalf the exact steps and URL to check it himself (Live Server).

## 9. Known open points (tell Gandalf, do not decide silently)

- Place card has no badge. He may want to add something in that corner later.
- Quest cards are not designed yet.
- Piecie trim color (green), Place (violet), Snelle (gold) are first picks; easy to change in the token file.
- Mosje ability text for the longest cards may need a text-length review.
