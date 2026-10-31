# Obby Card Game 2.0 — Card Design Spec (handover for Claude Code)

Written 30 Oct 2026 by Gandalf + Claude; updated 31 Oct 2026 (one Mosje card with level strip B, Ultimate, Personal Quest cards). This is how cards must look in the game. **Visual reference:** design canvas "Obby Card Game 2.0 · Final Card Designs" (https://claude.ai/artifact/GAaZFfx4dKMh36PQt6LTX5), boards 01–09. Rules behind it: `Obby Card Game 2.0 - Rules and Decisions.md` (level marker, Ultimate, Personal Quest cards). Summary of the decisions: `Obby Card Game 2.0 - Card Design Lock.md`.

Supersedes for the card face: `Card Tier Style Reference.md` (boxed 5-tier frames, rarity diamonds, type pills) and the board v2.4c field tile.

**Work order:** plan → approval → implement → screenshots → approval, own branch, full test suite green before merge. Don't change game rules, drop weights or copy limits from this doc; the rules doc is the source. Ask when this doc and the code disagree.

---

## 1. Tokens

### Card type colours
| Type | Frame line | Tint (small labels only) | Right side label |
|---|---|---|---|
| Mosje (incl. Ultimate) | none (plain black frame) | Mosje type tint (below) | `FIGHTING MOSJE` / `DIGITAL MOSJE` / `ARTISTIC MOSJE` |
| Personal Quest | `#D4A017` (gold) | `#FEF3C7` | `PERSONAL QUEST` (left: `FIGHTING ONLY` / `DIGITAL ONLY` / `ARTISTIC ONLY`) |
| Piecie | `#15803D` | `#DCFCE7` | `PIECIE · FOOD` / `· GEAR` / `· SUBSTANCE` / `· PET`, untagged: `PIECIE` |
| Snelle | `#2DD4BF` (mint) | `#CCFBF1` | `SNELLE · INSTANT` |
| Place | `#6D28D9` | `#EDE9FE` | `PLACE` |
| Quest | `#CBD5E1` (silver) | `#E2E8F0` | `QUEST · FIGHTING` / `· DIGITAL` / `· ARTISTIC` |

### Mosje type colours (tint only, Mosjes have no line)
| Type | Main | Tint |
|---|---|---|
| Fighting | `#C2410C` | `#FFEDD5` |
| Digital | `#0E7490` | `#CFFAFE` |
| Artistic | `#A21CAF` | `#FAE8FF` |

### Base and board UI
- Card base `#050505`, text white with a soft black shadow (`0 1px 3px #000, 0 0 8px #000, 0 0 14px #000` on full-art text).
- Board (v2.4c): you `#3fd0ff`, opponent / damage `#ff4d6d`, level-up / win `#ffc94d` (board UI only, never on a card), Place effect chip `#6D28D9` with text `#b79cff`, table `#07080f` + 48 px grid lines `rgba(140,160,255,.055)`.
- Gold `#D4A017` is used on cards **only** for the Personal Quest line (ruled 31 Oct). The board UI gold `#ffc94d` stays board-only.

### Fonts
- **Sora**: names (800), epithet (600), numbers (800), labels (800), side labels (700). **DM Sans**: card text (400, bold 700).
- Repo has both as variable woff2 in `assets/fonts/`.

### Finishes
- Two only: **full art** and **full art foil**. Foil = every ★★★★★ card and every Ultimate.
- Foil layers (inside the art window so blend modes hit the art): holo wash (`linear-gradient(115deg,#ff5fc4,#ffd36e,#6dffc9,#62a0ff,#c58bff,…)`, overlay, background 230 %, 9 s alternate drift), light sweep (30 % wide white band, skew −18°, screen, every 6 s), three glints (30 px crosses at 22 %/16 %, right 12 %/30 %, 55 %/8 %, 3.2 s twinkle, staggered 0 / 1.1 / 2.1 s).
- Animate only on hover / zoom / flagged; static otherwise. `prefers-reduced-motion`: everything paused, glints stay visible.

### Sizes (all drawn from one unit)
| Use | Size | Unit |
|---|---|---|
| Hand / print card | 440 × 616 (5:7, 63 × 88 mm) | u = width ÷ 440 |
| Hand on desktop | 280 × 392 | same |
| Detail / hover panel | 360 × 504 | same |
| Board tile desktop | 240 × 176 | u = width ÷ 240 |
| Board tile phone | Mosjes 142 × 104, others 118 × 86 | same |

---

## 2. The card (hand / print / detail): anatomy at 440 × 616

All values in px at 440 wide; multiply by u. Canvas board 02 shows them numbered.

- **Shape:** radius 24, base `#050505`, shadow `0 24px 50px rgba(0,0,0,.7)`. No outer outline.
- **Art:** fills the card inside an even **18 px black frame**, radius 6, `object-fit: cover`, per-card focus (`artFocus`). Top fade 150 px (`rgba(0,0,0,.88)` → 0). Bottom fade sized to the text: items 250–520 px, Mosjes 380–580 px (`transparent → rgba(0,0,0,.6) 36% → rgba(0,0,0,.9)`). No art yet: gradient in the type colour (placeholder, not a style).
- **Type line (not on Mosjes):** 2 px inset line in the frame-line colour, 8 px inside the card edge (radius 17), with a gap where the side labels sit (gap = label box ± 6 px).
- **Side labels:** vertical, Sora 700 6.5 px, letter-spacing .32em, uppercase. Box 10 × 124 px at **y 202–326** (centred 44 px above the card's middle), 4 px from the edge. Right: card type (table above). Left: `OBBY CARD GAME` on every type (Mosjes too: the level is no longer a card), `ULTIMATE` on Ultimates, `FIGHTING ONLY` / `DIGITAL ONLY` / `ARTISTIC ONLY` on Personal Quests. **Both labels on every card are the same white, rgba(255,255,255,.85)** (ruled 30 Oct: never tint, never dimmer).
- **Cost:** top-left at x 28 / y 36, centred in its own box: Sora 800 42 px (2 chars 36, 3+ chars 28), `COST` under it Sora 800 9 px .16em in the tint. Alternative cost on a second line (Blensen!: `4` + `OR FREE`). Quests: dice need with `NEED` (`4+`, `2× 4+`, `★★` + `TRAINED`, `4+` + `COIN`). Personal Quests: the level the Mosje must be, `3` + `LEVEL`. Ultimates: `3` + `OR FREE` (3 Energy at Level 1–2, free at Level 3).
- **Divider:** 1 px white 30 %, 50 px tall, 10 px right of the cost box.
- **Name:** 14 px after the divider, Sora 800, up to 40 px, shrinks to fit one line (≈ 0.64 × font-size per character). Mosjes: epithet under it, Sora 600 ≤ 20 px, one line. Right margin 30.
- **Text (no text box):** left/right 42. All text white; keywords bold white (see §5 Keywords). Keyword lines first, then the card text. Items: DM Sans 18 → 12.5 px auto-fit, line-height 1.5, 10 px between paragraphs, block ends **48 px** above the bottom edge. Quests: same, ends 112 px above the bottom (above the footer); no separate `Rolls:` line (the `Roll:` keyword line carries the trait).
- **Mosje text:** ability (bold name) DM Sans 15 → 13 px auto-fit, line-height 1.45, 9 px between paragraphs; an ability that grows gets a second line starting with bold `From LV3:` (or `From LV2:`). Block ends 150 px above the bottom (above the level strip).
- **Mosje level strip (B, chosen 31 Oct):** bottom-left, 36 px from the bottom, left 42. Header `POWER · TRAITS` Sora 800 9 px .14em tint (indented to the Power column). Three rows `LV1` / `LV2` / `LV3`, 3 px vertical padding, 1 px white 14 % line between rows: level label Sora 800 10 px .14em tint (24 px column) · Power Sora 800 17 px white (28 px column) · traits DM Sans 700 12 px white, short names (`Phys Res Cre Soc Men Tech`), stars in the tint, `·` between. Gap 10 px between columns. All rows full brightness on the printed card; **in the game UI (detail panel) the current level row is bright and the others at 40 % opacity.**
- **Mosje MP:** bottom-right, 36 px from the bottom: Sora 800 34 px + `MP` 10 px .14em tint. Start MP: after summoning and after every level up / level drop. **Default 10, never 0.** No separate Power footer (Power lives in the strip).
- **Ultimate:** Mosje layout without strip: name (the Mosje's name) + epithet `Ultimate · <title>`, cost `3` + `OR FREE`, ability, traits line (DM Sans 700 12.5 px under a 1 px white 18 % divider), Power bottom-left (Sora 800 34 px + `POWER`), no MP (the Mosje keeps its own). Foil, side labels `ULTIMATE` / `FIGHTING MOSJE`.
- **Personal Quest footer:** 36 px from the bottom: `WIN` (Sora 800 34 px) + `THE GAME` (tint) left; `✕` + `FAIL · SHUFFLE IN` right.
- **Quest footer:** 36 px from the bottom: `+WIN` left, `−LOSE` right (Trained: `—` + `CAN'T FAIL`).
- **Card back (chosen 31 Oct 2026, "XXL · Engraved"):** full spec in `Obby Card Game 2.0 - Card Back.md` (vector mark: `Obby Card Game 2.0 - Obby mark V3.svg`). Summary: two XXL solid indigo Obby marks (8 %) (point-symmetric, cut off by the frame), eclipse disc r 92 in the centre with corona, mirrored stars and nebula, indigo `#6B74FF` as the only accent, `OBBY CARD GAME` side labels centred on y 308. One back for every type; identical when turned 180°.

### Never on a card
Type pills · rarity diamonds or any rarity mark · STAYS chip · rules sentences in the card text that the rulebook covers (e.g. "play any time, also on your opponent's turn", "only 1 Place in play") · level-up / MP reset / hold-to-win text · separate level cards · a Personal Quest printed on a Mosje · corner glyphs · level badge · a text box behind the description · boxed art windows or tier 1–3 frames · fail pips on Quests. Rarity shows only in the detail panel.

---

## 3. Card types

- **Mosje:** one card per Mosje: cost, name + epithet, one ability (may grow with a `From LV3:` line), level strip B (Power + traits per level), start MP. Side labels `OBBY CARD GAME` / `FIGHTING MOSJE`. ★★★★ full art, ★★★★★ foil.
- **Ultimate (optional, per Mosje):** foil, own art, ★★★★★, limit 1; cost 3 or free at Level 3; ability, traits, Power. Placed from hand on that Mosje at any level (free at Level 3, 3 Energy below); replaces Power and traits while on top.
- **Personal Quest:** gold line; top-left `3` / `LEVEL`; name; own art (no art → Quest theme with die showing the real need); keyword lines `Needs:` / `Pay:` / `Roll:`; footer WIN THE GAME / FAIL · SHUFFLE IN. Type-locked via the left label. Without art the die shows the roll need (two 5+ = two dice showing 5).
- **Piecie:** cost, name, keyword lines, text; tag in the side label.
- **Snelle:** same as Piecie, mint line, `SNELLE · INSTANT`.
- **Place:** cost, name, `Good for / Bad for` line, text.
- **Quest:** need, name, shared board theme art (`#1c2040` + tinted seigaiha + die at 55 %) until a Quest has art, text + Rolls, WIN / LOSE. **The die shows the real need:** `4+` = one die showing 4, `5+` = 5, `2× 4+` = two dice showing 4, Trained = the trait stars (`★★`) instead of a die, Coin = one die showing 4. Never a decorative face that doesn't match.

Examples of every one: canvas boards 03 and 04 (real cards from `src/data`).

## 4. Rarity → finish
| Rarity | Types | Finish | Copies (getCopyLimit) | Drop weight |
|---|---|---|---|---|
| ★–★★★ | Piecie, Snelle, Place, Personal Quest | Full art | 2 | 60 / 30 / 10 |
| ★★★★ | Piecie, Snelle, Place, Mosje, Personal Quest | Full art | 2 | 10 |
| ★★★★★ | Piecie, Snelle, Place, Mosje, Personal Quest | Foil | 1 | 4 |
| Ultimate | Mosje (optional card) | Foil (always) | 1 | open |
| — | Quest | Full art | — | — |

## 5. Text rules

### Keywords (ruled 30 Oct 2026)
Bold **white** (never in the tint), always the same word for the same job, one keyword per line, in this order:
| Keyword | Means | Example |
|---|---|---|
| `Needs:` | a condition that must be true (Piecie / Snelle requirement, Gated Quest, Personal Quest setup) | **Needs:** one of your Mosjes has Creative ★ |
| `Pay:` | something you give up first (Prepared Quest cost, Personal Quest discard) | **Pay:** discard 1 substance Piecie |
| `Roll:` | the dice | **Roll:** 1 die per Physical ★, need two 4+ · **Roll:** none, it can't fail |
| `Win:` | extra reward on success | **Win:** jab |
| `Good for:` / `Bad for:` | Places | **Good for:** Fighting · **Bad for:** Digital, Artistic |
| `Stays …` | the card's own duration sentence | **Stays until the end of your next turn.** |
| Ability name | Mosje ability, Personal Quest name | **Chaos Roll:** · **Title Fight** |
Nothing else is bold. Old labels are replaced: `First you must:` → `Pay:` (cost) or `Needs:` (condition); `Requires` → `Needs:`; `Rolls: Trait · Band` → folded into `Roll:`.
- Auto-fit steps: items 18, 17, 16, 15, 14, 13, 12.5 px; Mosjes 16, 15, 14.5, 14, 13.5, 13 px. Grow the bottom fade with the text.
- Order: Needs → Pay → Roll → card text → Win. Places: Good for / Bad for first. Mosjes: ability → `From LV3:` line → level strip. Personal Quests: Needs → Pay → Roll.
- Text is never reworded, only split at sentence breaks. Contrast ≥ 4.5 : 1 on the fade; raise the fade, never add a box.
- Edge cases verified (board 06): Bowie & Stormey (387 chars), Martin, Senor West (ability + synergy), Jantje Jantje... Jantje? (24-char name), Huisbaas (2-line Needs), Delluft (longest Place), Gekke Vogels.

---

## 6. Board tile (direction A)
Same look as the card: black frame, 2 px type line at inset 2.2u width 1.6u (none on Mosjes), Sora / DM Sans, tint labels. u = width ÷ 240.
- Geometry: art inset 6u, radius 13u (art 4u), header 10u from top / 12u from sides, name Sora 800 15u (min 11 px), numbers 21u, labels 6u, footer 10u from the bottom, top fade 64u, bottom fade 96u.
- **Mosje tile:** name · `LVL n` top-right (tint 7.5u) · traits line under the name (DM Sans 700 8u, ★ in tint) · remember-line (DM Sans 9.5u, max 2 lines, 46u from the bottom) · Power (+ Place buff chip `#6D28D9`) · MP · MP bar (3u, white fill = MP %, red segment = damage preview, struck old MP number). LVL from the level marker; Power + traits from that strip row. Ultimate on top: tile shows the Ultimate (art, Power, traits, ability) with a foil wash; LVL and MP stay.
- **Piecie / Snelle tile:** cost (19u) + divider · name · remember-line (26u from the bottom) · type label (tint 7u). **Place:** name · remember-line · `PLACE`. **Quest:** need + divider · name · remember-line · `+WIN` · `Rolls Trait` · `−LOSE`.
- **Phone (142 × 104 / 118 × 86):** drop the remember-line and the traits; keep names (≥ 11 px) and numbers.
- **Remember-line:** new data field per card, e.g. `tileText` (≤ ~60 chars). **Claude Code drafts it for every card; Gandalf approves before it ships.** Never generate it on the fly from rules text.

## 7. Board states (board 08)
Chips hang under the tile: right 8, 13 px below the edge, dark pill (`#07080f`), 1 px coloured outline, Sora 700 10 px .1em. Sockets: `outline 1px owner@32%`, offset 5 (3 on phone), shadow `0 16px 34px -12px owner@40%`.
| State | Look |
|---|---|
| Ready | chip `READY` (owner) |
| Picking a target | lift 6 px, `2px solid owner`, chip `TAKSEN · PICK A TARGET` |
| Valid target | `2px dashed #ff4d6d`, chip `TARGET` |
| Damage preview | big `−N` 46 px red over the art, old MP struck + new MP red, red MP-bar segment |
| Fresh · protected | chip `FRESH · PROTECTED` with shield, `#9fe6ff`, opacity .92 |
| Acted this turn | desaturated / dimmed, chip `DONE` |
| At 100 MP, Level 3 | chip `MAX 100 · LEVEL 3` |
| Ultimate placed | gold socket, chip `ULTIMATE · POWER 60`; tile shows the Ultimate's art, Power, traits, ability with foil wash; LVL and MP stay |
| Level up (at 100 MP) | gold socket, chip `LEVEL UP → LV2 · 10 MP`; flash + sound; LVL +1, Power + traits from the next strip row, MP back to the start MP |
| Level drop | chip `LV2 → LV1 · 10 MP` (no card lost; with an Ultimate on top the Ultimate is discarded instead and the level stays) |
| Getemt Level 1 | tile rotated 90°, scale .72, desaturated; skips next turn |
| Personal Quest ready | Level 3 Mosje + a PQ of its type in hand with its needs met: gold socket, chip `TITLE FIGHT READY · PLAY FROM HAND`, action button `PLAY <PQ NAME>` |
| Personal Quest not met | PQ in hand, needs not met: chip with what is missing (`NEEDS BOXING GLOVES`, owner only); in hand the PQ card is dimmed with `NEEDS LV3 FIGHTING` when no matching Mosje is at Level 3 |
| Place buff | `+10` chip next to Power, chip `THE GYM +10 POWER` (`#b79cff`) |
| Place drain | chip `THE GYM −10 MP / TURN` on the Mosjes it hits |
| Piecie face-down (own) | card back + peek line (eye icon + name, owner only), chip `WAITS 1 TURN` |
| Piecie face-down (opponent) | plain card back |
| Piecie ready | chip `READY · 2 ENERGY` |
| Piecie stays | chip `ACTIVE · UNTIL END OF NEXT TURN` |
| Snelle in a slot | chip `PLAYED ON YOUR TURN` (mint) |
| Place in play | chip `YOU · 2 TURNS` |
| Quest modifiers | chip `+1 DIE · THE GYM` (no stack count, no fail counter) |
| Empty slot | `1.5px dashed owner@35%`, label `PIECIE SLOT` / `MOSJE SLOT` / `WELLOE PILE` |
| Deck pile | stacked backs (offset 6 px), count chip in owner colour |

## 8. Hand and detail panel (board 09)
- Hand: real cards 280 × 392 on desktop, fanned ±3° per step, sunk so ~70 % shows; hover lifts to fully visible + owner glow and drives the Energy spend preview (`4/6 → 3/6 · COST 1`). Can't-play cards: dimmed + red chip with the reason (`PLACE IN PLAY · DESTROY IT FIRST`, `PIECIE SLOTS FULL 3/3`, `NEEDS A FREE PIECIE SLOT`, `MOSJE SLOTS FULL 2/2`, `NEEDS A MOSJE AT LEVEL 2+`). Level 2/3 cards in hand: playable only when that Mosje is on the field with 100 MP.
- Detail panel: docked right (x ≈ 1530 on the 1920 board), card 360 × 504, info box under it: flavour text, rarity + finish + copy limit (the only place rarity shows), type reminder, context notes in colour (Personal Quest status gold, Place effects violet, MP / getemt info cyan, taksen preview red, can't-play reason). Phone: bottom sheet on tap.

---

## 9. Data changes needed
- **Mosjes stay one card** (as in `src/data` today: `levels[0..2]` with `power` + `traits`). Add: ability growth text per level (optional, e.g. `abilityGrowth: {3: '…'}`), `startMP` default 10, never 0 (raise current 0-MP Mosjes, e.g. Alyssa, The Bulldozer, Martin LV1 Power 0 → check). The level is game state (`level` 1–3 on the Mosje in play), not a card.
- **New card type `ultimate`:** `mosjeId` (which Mosje it goes on), `power`, `traits`, ability, `art`, `rarity: 5`, `foil: true`, limit 1. Candidate: turn `mosje_gandoe_destroyer` into Gandoe's Ultimate.
- **New card type `personalQuest`:** `stack`/`mosjeType` (FIGHTING / DIGITAL / ARTISTIC), `name`, `needsText`, `payText`, `roll` (trait + count + threshold, or none), machine-readable requirement, `rarity`, `art`. Old personal Quests in `src/data` (Kickboxing Bootcamp etc.) are candidates.
- **New fields:** `epithet` (split from `name`), `tileText` (board remember-line), `artFocus` per card, `tag` (Piecie), `needsText`, `goodFor` / `badFor` (exist).
- **Remove from the renderer:** tier 1–3 boxed frames, rarity diamonds, pills, STAYS chip, corner glyphs, LVL chip on the card face, the old in-text level table (replaced by strip B).
- **Snelle colour:** `#A16207` gold → mint `#2DD4BF` / `#CCFBF1` everywhere.
- **Engine (rules doc):** Quests leave after one attempt (win or fail) and are shuffled back into their stack, new top card face-up (remove fail tokens and stack-empty handling); win by completing a Personal Quest card (played from hand by a Level 3 Mosje of its type, as its action; fail = its required cards are discarded, the PQ goes back into the deck and the deck is reshuffled); level up at 100 MP (level +1, MP back to start MP), MP cap 100 at Level 3; getemt at Level 2/3 = level −1, MP back to start MP; Ultimate placed on its Mosje at any level (free at Level 3, 3 Energy below), overrides Power + traits, discarded when getemt (level stays, MP back to 10).

## 10. Open (don't build yet)
- Deck: 40 cards; level up automatic; PQ rarity ★–★★★★★ (all ruled 31 Oct). Open: minimum PQs per deck (proposal 1).
- Which Mosjes get an Ultimate first; Ultimate art; Ultimate Energy cost below Level 3 (3 = playtest start).
- Final `From LV3` ability lines, Ultimate abilities, and the Personal Quest card list (drafts on board 03: Title Fight, Cat Sanctuary, LAN Legend). Quest art.
- Exact `tileText` per card (to be drafted and approved).
- Quest wording: all Quest texts get a rewrite (shorter, meaningful requirements) before final; the Quest examples on the canvas show layout only.
