# MOSJES: Rarity-tier card redesign, handoff for Claude Code

Owner: Gandalf. Source of truth for visuals: the "Mosjes Card Designs" design canvas, boards **Tiers 7** (Alyssa, all four tiers) and **Tiers 8** (Piecie, Place, Snelle plus a full-art Piecie). Everything below is derived from those boards. If this document and the boards disagree, the boards win. Ask before deviating.

Suggested location in the repo: `.planning/RARITY-TIERS-DESIGN.md`. Save screenshots of Tiers 7 and 8 next to it (`docs/design/rarity-tiers/`) so the visual reference lives in the repo.

---

## 0. How to work (read first)

1. **Investigate before planning.** Do not write code yet.
   - `git branch -a` and `git log --oneline -30`. Gandalf has an **unfinished parallel card-redesign branch** (the "E1" full-art frame). Find it, read what it already implements, and build on it instead of redoing it.
   - Read `src/ui/cardRenderer.js` (`renderCard` → `buildUnifiedCardHTML`, plus the older `buildMosjeCardHTML` / `buildPlaceCardHTML`), `styles/cards.css` (the `uc-*` unified template starts around the "UNIFIED CARD TEMPLATE" comment), `card-spec.md`, `card-demo-v2.html`, `preview-kannetje-melk.html`, and `CLAUDE.md`.
   - Read how rarity is used today: `src/data/boosterEngine.js`, `src/deck-builder.js` (`RARITY_COPY_LIMITS`), `src/ui/modalManager.js` (`copyLimit`).
2. **Plan, then wait for approval.** Use the project's GSD workflow from `CLAUDE.md` (new phase, sequenced plans). Show Gandalf the plan, including anything in this brief that conflicts with the current code.
3. **Implement one tier at a time**, with a test-and-approval gate after each: tier 4 (full art) first, then the boxed layout for tiers 1, 2 and 3.
4. **Do not touch:** Quest cards, game logic, rarity drop weights, deck copy limits, card backs.
5. Keep the 745-test suite green. Add tests for the tier helper (section 2) and for the renderer output (classes and data attributes).

---

## 1. What we are building

Four rarity tiers. The tier is the star count of the existing `card.rarity` string (`★` to `★★★★`). The tier decides the **layout** and the **effects**. **Every card type can be any tier**; a Piecie or Snelle can be ★★★★.

| Tier | Stars | Layout | Frame treatment | Special effect |
|---|---|---|---|---|
| 1 | ★ | Boxed art | Inner line is soft white, 1px | None |
| 2 | ★★ | Boxed art | Inner line is the card's **type colour**, 2px | None |
| 3 | ★★★ | Boxed art | Inner line **and** artwork border are animated **rainbow foil**, 2px | Cosmos dots + foil sheen inside the art window; wave pattern in the frame is rainbow-tinted |
| 4 | ★★★★ | **Full art** | Plain black 18px frame, no wave pattern | Animated holographic shine over the whole artwork, light sweep, sparkles |

Decisions already made (do not re-open):
- Four tiers, labelled with stars. A fifth tier was tried and scrapped.
- The wave pattern (seigaiha) is on boxed cards only. It is deliberately **not** on full art, to keep the pure-black feel.
- Rarity stars and flavour text are **not** on the card face. They stay in the hover / long-press panel.
- No outer 1px black outline around any card. No box or fill behind the MP / cost number.
- Text structure is **identical** across all tiers so readers always find things in the same place.

---

## 2. Tier model and data

```js
// proposed helper, e.g. src/ui/rarityTier.js
export function getRarityTier(card) {
  const stars = (String(card?.rarity || '').match(/★/g) || []).length;
  return Math.min(4, Math.max(1, stars || 1));   // missing rarity → tier 1 (renderer already defaults to '★')
}
export const isFullArt = (tier) => tier === 4;
```

- Renderer sets on the card root: `card--tier-{1..4}`, `card--fullart` (tier 4) or `card--boxed` (tiers 1–3), and `data-tier="{n}"`.
- Type accent is still carried by the existing type class (`card--mosje`, `card--piecie`, …). Expose it as CSS custom properties `--accent` and `--accent-tint` (table in section 3).
- Current live data (from the repo at commit `4389f7c`, enabled cards): ★ = 16 cards (14 Piecies, 2 Snelles, **no Mosjes**), ★★ = 64, ★★★ = 56, ★★★★ = 16. So ★ boxed cards will only appear on Piecies and Snelles for now. Do not "fix" this.
- Do **not** change `rarityToWeight` (60/30/10/4) or the copy limits (4/3/2/1). Those already match the four tiers.
- Older docs (`assets/MOSJES_CARD_DATABASE.md`) use ◆ for Mosjes. Ignore that; the code uses ★.

---

## 3. Shared design tokens

Reference card is **440 × 660** (2:3). Build it so it scales: either a `--card-scale` custom property or container-query units, never fixed px that break the hand, field and opponent sizes (the opponent area scales cards down to about 160 × 240). All values below are at 440 × 660.

| Token | Value |
|---|---|
| Card radius | 24px |
| Card base | `#050505` |
| Drop shadow | `0 24px 50px rgba(0,0,0,.7)` (tier 3 adds `0 0 30px rgba(255,190,120,.18)`) |
| Display font | **Sora** (name, MP, labels) |
| Body font | **DM Sans** (ability text, traits line) |
| No | outer 1px black outline, serif fonts, text-area blur on full art |

Type accents:

| Type | `--accent` | `--accent-tint` |
|---|---|---|
| Fighting | `#C2410C` | `#FFEDD5` |
| Digital | `#0E7490` | `#CFFAFE` |
| Artistic | `#A21CAF` | `#FAE8FF` |
| Piecie | `#15803D` | `#DCFCE7` |
| Place | `#6D28D9` | `#EDE9FE` |
| Snelle | `#A16207` | `#FEF9C3` |

### 3.1 Shared text structure (identical on all four tiers)

Positions are measured from the card edges.

| Element | Position | Style |
|---|---|---|
| Name (Mosje first name, or card name) | left 42, top 40 | Sora 800, 40px, line-height 1.05, letter-spacing -.01em, white, single line |
| Nickname (Mosjes only) | directly under name | Sora 600, 20px, line-height 1.2. Name parsing: `[First] Nickname` → first name in the name line, nickname in the nickname line. Cards without a nickname simply omit it |
| Traits / requirement line | left 42, right 110, bottom 77 | DM Sans 600, 12.5px, `#f4f4f5`. Mosje: `Physical ★★★ · Social ★★★ · Resilient ★★`. Others: `Requires: …` / `Good for: … · Bad for: …` |
| Pill | left 42, bottom 46 | height 22, padding 0 9, radius 5, bg `--accent`, white, 12px / 800, letter-spacing .08em. Mosje: `LVL n`. Others: `PIECIE` / `PLACE` / `SNELLE` |
| Category label | left 42, bottom 22 | Sora 700, 10.5px, letter-spacing .16em, uppercase, color `--accent-tint`. e.g. `Fighting Mosje`, `Momentum-Gaining`, `Only 1 active at a time`, `Instant - play any time` |
| MP / cost | right 10, bottom 12, 80 × 80 | **No background, no border.** `text-shadow: 0 1px 6px rgba(0,0,0,.9)`. Value: Sora 800, 34px (26px for the word `Free`). Label under it: 10px / 800, letter-spacing .14em, `--accent-tint`; `MP` on Mosjes, `COST` on others. **Places have no badge** |
| Tier diamonds | top **22**, left 202 / 212 / 222 / 232 | Four 5 × 5 squares rotated 45°. First *n* are lit (n = tier): background `--accent` plus `box-shadow: 0 0 5px --accent`. The rest `rgba(255,255,255,.2)` |
| Side text | see below | |

**Side text** reads `OBBY CARD GAME`. Two vertical labels, Sora 700, **6.5px**, letter-spacing .32em, uppercase, `rgba(255,255,255,.55)`, `writing-mode: vertical-rl`, box 10 × 124 at top 268, centred, `padding-top: .32em` (compensates the trailing letter-spacing). The left one is rotated 180° so it reads bottom-to-top. Horizontal position: **boxed cards `left:2px` / `right:2px`** (visually centred between card edge and artwork border); **full art `left:4px` / `right:4px`** (centred in the 18px frame). Hide the side text when the rendered card is narrower than about 120px.

Ability text size scales with length (this is what the boards use): 14px for long Mosje abilities (3 sentences), 15px for Places with 3 short lines, 17px (boxed) / 18px (full art) for one-sentence Piecies and Snelles. Implement as a small length-based rule, not per card.

---

## 4. Boxed layout (tiers 1, 2, 3)

Layer order, bottom to top:

1. **Base** `#050505`.
2. **Wave pattern (seigaiha).** Geometry in a 440 × 660 viewBox: scale radius 30; each scale is a filled disc `#050505` plus four concentric rings (r = 30, 22.5, 15, 7.5; stroke 1.5, no fill). Rows every 15 units; columns every 60; every other row offset by 30. Draw rows top to bottom so lower scales overlap upper ones (the filled disc is what hides the lines underneath). Line colour `rgba(255,255,255,.55)`, group opacity **.16** (tier 3: **.22**, and tinted rainbow, see below). Ship it as a static SVG asset (a repeating `<pattern>` is fine if the overlap looks identical, check against the board) used as a background layer. Must look like the boards.
3. **Calm gradients** (keep the name and footer text clean over the pattern): top 120px `linear-gradient(180deg, rgba(5,5,5,.7), rgba(5,5,5,0))`; bottom 110px `linear-gradient(0deg, rgba(5,5,5,.75), rgba(5,5,5,0))`.
4. **Grain:** SVG `feTurbulence` (fractalNoise, baseFrequency .85, 2 octaves, stitchTiles) converted to white with alpha, `mix-blend-mode: screen`, opacity .13.
5. **Top-left light:** `radial-gradient(ellipse at 18% 0%, rgba(255,255,255,.09), rgba(255,255,255,0) 52%)`.
6. **Inner line**, a rounded rectangle running around the card, inset **6px** (tier 1: 6.5px), radius 18px (tier 1: 17.5px), centred between the card edge and the artwork border:
   - Tier 1: `rgba(255,255,255,.14)`, 1px.
   - Tier 2: `--accent`, 2px.
   - Tier 3: rainbow foil, 2px (see section 6).
   - On all tiers, **break the line** (mask it out) between y = 262 and y = 386 on both sides so it doesn't run through the side text.
7. **Side text** and **tier diamonds** (section 3.1).
8. **Name block.**
9. **Artwork window:** left/right **24**, top **124**, height **224**, radius **6**, `object-fit: cover`. Border:
   - Tiers 1 and 2: `0 0 0 1px rgba(255,255,255,.14), 0 0 0 3px #050505, 0 0 0 4px rgba(255,255,255,.07)` (identical to the description box, grey, **no colour**).
   - Tier 3: `0 0 0 3px #050505`, plus a separate rainbow-foil ring 2px wide around it (outer rect: left/right 19, top 119, height 234, radius 11).
   - Tier 3 inside the window: cosmos-dot layer (three radial-dot layers, sizes 41 / 83 / 29px, `mix-blend-mode: screen`, opacity .32) and a rainbow layer (`mix-blend-mode: color-dodge`, opacity .14).
10. **Description box** ("plate"): left/right **24**, top **366**, height **186**, radius 6, padding 16 / 18. Background `linear-gradient(180deg, rgba(19,19,24,.36), rgba(11,11,15,.36))`, `backdrop-filter: blur(4px) brightness(2.1) contrast(1.15)`, outline `0 0 0 1px rgba(255,255,255,.14), 0 0 0 3px #050505, 0 0 0 4px rgba(255,255,255,.07)`. It is intentionally see-through so the wave pattern shows a little.
    - **Tiers 1 and 2 need one extra layer:** a second copy of the wave pattern clipped to the plate rectangle, `mix-blend-mode: screen`, opacity .20. Without it the texture looks fainter behind the plate than on tier 3. Tier 3 gets its extra visibility from the rainbow tint.
    - Fallback if `backdrop-filter` is unsupported: solid `rgba(15,15,19,.85)`.
    - Overflow: clamp to the plate; auto-shrink font down to 13px before clipping.
11. **Footer** (traits line, pill, category label, MP / cost) per section 3.1.

Ring thickness note: Gandalf tried a wide (18px) coloured frame at the card edge and rejected it. Tiers are shown by the **thin inner line** and **artwork border** only.

---

## 5. Full-art layout (tier 4)

- Black frame **18px on all four sides**, `#050505`, outer radius 24.
- Artwork window `left/right/top/bottom: 18px`, radius **6px** (concentric with the 24px card radius, so the frame keeps constant thickness through the corners). Artwork must fill the window to the corners; no black wedges.
- Inside the window (over the artwork): a bottom gradient to about `rgba(0,0,0,.9)` for text legibility (height 380px for Mosjes with long ability text, about 250–300px otherwise) and a top gradient 150px, `rgba(0,0,0,.88)` → 0.
- Text is anchored from the bottom: ability text `left:42; right:42; bottom:114`, white, `text-shadow: 0 1px 3px #000, 0 0 8px #000, 0 0 14px #000`. Everything else as section 3.1.
- No wave pattern, no inner line, no description box.
- **Shine effect** (this is what marks it as super rare). All layers live **inside the artwork window element**, which must have `overflow:hidden; border-radius:6px; isolation:isolate; clip-path: inset(0 round 6px)`:
  1. **Holo:** `linear-gradient(115deg, #ff5fc4, #ffd36e, #6dffc9, #62a0ff, #c58bff, #ff5fc4, #ffd36e, #6dffc9)`, `background-size: 230% 230%`, `mix-blend-mode: overlay`, opacity .75, animation `holoshift` 9s ease-in-out infinite alternate (`background-position: 0% 25%` ↔ `100% 75%`). Covers the whole artwork.
  2. **Sweep:** a 30%-wide band, `linear-gradient(90deg, transparent, rgba(255,255,255,.30) 50%, transparent)`, `mix-blend-mode: screen`, animation `shinesweep` 6s ease-in-out infinite: `translateX(-160%) skewX(-18deg)` held until 55%, then to `translateX(420%) skewX(-18deg)`.
  3. **Three glints:** 30px four-point sparkles (radial dot plus 1px cross lines) at roughly `left 22% / top 16%`, `right 12% / top 30%`, `left 55% / top 8%`, animation `twinkle` 3.2s with delays 0 / 1.1 / 2.1s (opacity 0 → 1 → 0, scale .4 → 1).
  - **Gotcha, learned the hard way:** if the shine layers sit in a separate sibling container with its own `isolation`, `contain`, `transform` or `clip-path`, `mix-blend-mode` can no longer blend with the artwork and the rainbow becomes far too intense. Keep them inside the artwork window so they blend with the image.
- `prefers-reduced-motion: reduce`: no animation; keep the holo layer static and the glints visible at about .8 opacity.

---

## 6. Rainbow foil recipe (tiers 3 and the wave tint)

```css
@property --foil-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes foilturn { to { --foil-a: 360deg; } }

/* the foil: conic gradient, animated */
.foil { background: conic-gradient(from var(--foil-a), #f6d36a, #ff8fb4, #86c9ff, #9cf0c2, #f6d36a);
        animation: foilturn 10s linear infinite; }

/* a line / ring made of the foil: show only the border band */
.ring { position: absolute; box-sizing: border-box; pointer-events: none;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
/* usage: .ring.foil with padding = line thickness (2px) and the same border-radius as the line */
```

`cards.css` already has a `@property --holo-angle` holo sweep; check whether it can be reused or merged rather than adding a parallel mechanism.

**Rainbow-tinted waves (tier 3 frame):** wrap the wave SVG and a `.rb` layer (`conic-gradient(from var(--foil-a) at 30% 20%, …same stops…)`, `mix-blend-mode: color`) in a container with `isolation:isolate; background:#050505`. The blend turns the faint white lines into faint rainbow lines while the frame stays black. Keep it very faint: readability must not drop.

---

## 7. Not designed yet (do not invent)

- Field-mode tile for boxed cards. Keep the current tile behaviour; the board only covers the pop-up / hand-size card.
- Hover / long-press detail panel (flavour text, rarity stars). Keep current behaviour.
- Quest cards.

If any of these must change to avoid a visual break, flag it in the plan.

---

## 8. Edge cases to handle

- Mosje without a nickname; very long names (shrink, never wrap onto three lines); very long ability text; Mosjes with 4 traits (traits line must not collide with the MP area: right bound is 110).
- Missing art: keep the existing placeholder gradient, in both layouts.
- Places: no MP / cost badge. Make sure the traits line can use that space if needed.
- Small renders (hand strip, opponent area): drop the side text and the glints below a size threshold; keep tier diamonds readable or drop to a simple count.
- Performance: tier 3 and tier 4 cards carry animated layers. Animate only on cards that are zoomed, hovered, or on the field; pause when off-screen. A hand of 7 plus a full field must not drop frames. Use `will-change` sparingly.
- Safari: verify `backdrop-filter`, `mix-blend-mode` inside the isolated artwork window, and the `mask-composite` fallbacks.

---

## 9. Verification checklist

- [ ] `getRarityTier` unit tests (missing, `★`…`★★★★`, malformed strings).
- [ ] One card of every type rendered at every tier (a debug page such as `card-demo-v2.html` extended with a tier switcher is fine).
- [ ] Text positions identical across tiers (overlay screenshots of tier 3 and tier 4 for the same card).
- [ ] Tier 4 frame is exactly 18px on all sides; no corner wedges; shine never leaves the rounded window.
- [ ] Tier 3 rainbow is faint; description text stays readable on the busiest art.
- [ ] Description box shows texture behind it on tiers 1, 2 and 3, equally.
- [ ] Reduced motion and no-backdrop-filter fallbacks.
- [ ] Hand, field, opponent and deck-builder renders still work. Existing tests green. No change to quests, game logic, drop weights or copy limits.

---

## 10. Kickoff prompt to paste into Claude Code

> Read `.planning/RARITY-TIERS-DESIGN.md` and the screenshots in `docs/design/rarity-tiers/`. Do **not** write code yet. First investigate: list all branches and tell me what the unfinished redesign branch already implements; read `cardRenderer.js`, `styles/cards.css`, `card-spec.md`, the demo pages, and how `rarity` is used in `boosterEngine.js`, `deck-builder.js` and `modalManager.js`. Then write a plan using our GSD workflow that implements the four-tier system in the order: tier 4 full art, then the boxed layout for tiers 1–3. Call out every place the brief conflicts with the current code. Stop after the plan and wait for my approval. When implementing, do one tier at a time and stop for my visual approval after each. Do not touch Quest cards, game logic, drop weights or copy limits.
