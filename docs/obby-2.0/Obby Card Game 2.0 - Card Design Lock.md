# Obby Card Game 2.0 — Card Design Lock (29–30 Oct 2026)

Locked by Gandalf on 29 Oct 2026 after the Tiers 9–21 iterations on the design canvas (https://claude.ai/artifact/MpeFz61Zf4Cfrvc21MsT2T); updated 30 Oct 2026 with the level-card / Personal Quest rulings and the board-tile choice; 31 Oct 2026: one Mosje card with level strip B, Ultimate, Personal Quest cards (canvas https://claude.ai/artifact/GAaZFfx4dKMh36PQt6LTX5). Reference boards: **Tiers 18** (Gandoe level cards), **Tiers 20** (frame line per type), **Tiers 21** (Snelle colour, row D = mint), **Tiers 22** (board tiles, direction A). This replaces the boxed/5-tier frame in `Card Tier Style Reference.md`.

## Card shape
- Poker size **63 × 88 mm (5:7)**; design reference 440 × 616 px.
- **Full art only.** Art fills the card inside an even black frame (18 px at 440 wide), radius 6 px, top fade 150 px, bottom fade sized to the text.
- Two finishes only: **full art** and **full art foil** (holo wash + light sweep + glints). Foil = special cards: every Ultimate and the limit-1 (★★★★★) cards. No boxed frames, no tier 1–3 frames.
- **No rarity mark on the face at all** (ruled 30 Oct: no diamonds, no collector line). Rarity lives in the card data and the hover/detail panel; it still drives copy limits and booster rates.
- Base `#050505`, fonts **Sora** (names, numbers, labels) + **DM Sans** (text).

## Frame line per type (2 px, inside the black frame, broken around the side labels)
| Type | Line |
|---|---|
| Mosje (all levels) | none: plain black frame |
| Piecie | green `#15803D` |
| Snelle | mint `#2DD4BF` (tint `#CCFBF1`) |
| Place | violet `#6D28D9` |
| Quest | silver `#CBD5E1` (tint `#E2E8F0`) |
Foil cards keep their type line; the holo shows they are special. | Personal Quest | gold `#D4A017` (tint `#FEF3C7`), added 31 Oct |

## Card face
- **Top-left:** cost as a plain number with `COST` under it (Quests: dice need with `NEED`), thin divider, then the name. Mosjes: name + epithet on a second line. **Level 2 and 3 Mosje cards show no cost** (levelling is free).
- **No type pills, no STAYS chip, no corner glyphs, no level badge, no rarity mark.**
- **Side labels** (vertical, 6.5 px Sora, all in the same white rgba(255,255,255,.85), centred ~44 px above the card's middle): right = card type (`PIECIE · FOOD`, `SNELLE · INSTANT`, `PLACE`, `QUEST · FIGHTING`, `FIGHTING MOSJE`); left = `OBBY CARD GAME`, `ULTIMATE` on Ultimates, `FIGHTING ONLY` etc. on Personal Quests.
- **Text:** no text box; text floats over the art's bottom fade with a soft shadow. Card-specific lines first in the type tint (`Needs:`, `Good for: … · Bad for: …`, the card's own `Stays …` sentence). Rules sentences the rulebook covers (playing any time, only 1 Place in play, levelling up) are not printed in the card text; the side label still names the type (e.g. SNELLE · INSTANT).
- **Mosje footer:** level strip B bottom-left (LV1–3 rows: Power + traits), MP bottom-right (start MP; default 10, never 0). Generous bottom padding.
- **Ultimate:** foil, cost `3` + `OR FREE`, ability + traits line + Power; no MP. **Personal Quest:** separate gold card (see below).
- **Quest footer:** `+WIN` left, `−LOSE` right. No fail pips (30 Oct): a Quest leaves after one attempt, win or fail, and is shuffled back into its stack.

## Mosjes: one card, level strip B (ruled 31 Oct 2026; replaces "one card per level")
- One card per Mosje with a compact level strip (rows LV1 / LV2 / LV3: Power + traits) bottom-left and MP bottom-right; no Power footer. Left side label `OBBY CARD GAME`.
- **Ultimate:** optional foil card per Mosje (own art, ★★★★★, limit 1, cost 3 or free at Level 3), left label `ULTIMATE`.
- **Personal Quest:** its own card type, gold line `#D4A017` / tint `#FEF3C7`, top-left `3 LEVEL`, left label `FIGHTING ONLY` (type lock), footer WIN THE GAME / FAIL · SHUFFLE IN.
- Full rules: `Obby Card Game 2.0 - Rules and Decisions.md`. Full values: `Card Design Spec.md`.

## Board tile (direction A, chosen 30 Oct 2026)
- Same look as the hand card: black frame + type line (Mosjes none). 240×176 desktop, 142×104 Mosjes / 118×86 others on phone.
- Mosje tile: name, LVL, traits, one remember-line (ability, max 2 lines), Power (+ Place buff chip), MP, MP bar. Piecie/Snelle: cost, name, effect line, type label. Place: name, effect line, type label. Quest: NEED, name, effect line, Rolls, WIN / LOSE.
- Phone: the remember-line and traits drop; numbers stay.
- The remember-line comes from a new short-text field per card: **Claude Code drafts it, Gandalf approves** (never reworded rules text on the tile without approval).

## Next
- "Final card designs" handover sheet + spec for Claude Code (every type, state, finish, colour legend, spacing).
