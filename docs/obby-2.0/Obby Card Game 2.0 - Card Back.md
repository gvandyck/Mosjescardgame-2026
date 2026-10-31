# Obby Card Game 2.0 — Card Back (chosen 31 Oct 2026)

Chosen by Gandalf on 31 Oct 2026 after 5 rounds on the canvas "OBBY Card Back" (https://claude.ai/artifact/8kzepYYfzYe37UNnQBrNxw): **round 5, "XXL · Engraved"**, then changed the same day to **solid marks** instead of engraved lines (Gandalf: "too liney, make it a solid shape"). Replaces the card-back line in `Card Design Spec.md` §2 (seigaiha + centred OBBY ring). Shown on the Final Card Designs canvas, boards 04 and 08.

**Why it works (Gandalf):** the eclipse reads as the "O" of OBBY next to the two B-shaped marks, and the faces gaze off past the card edge toward the stars. Keep both when tweaking: don't move the faces to look at the disc (that was X5, not chosen) and keep the disc round and central.

How we got here: round 1 (bold Sora OBBY, type colours) felt too blocky → subtler, monochrome, darker → Engraved and Eclipse liked (Eclipse after a homemade-TCG reference with a black disc and nebula) → Indigo Eclipse → the Obby mark XXL instead of OBBY text → engraved fill → solid fill.

- **Card back:** one back for every card type, so no type, rarity or foil hint. **Point-symmetric**: identical when turned 180° (opponents see backs upside down). Works in print without glow or animation. Layers, bottom to top, at 440 × 616:
  - Card radius 24, base `#050505`, 18 px frame; everything below is clipped to the inner field (x 18 / y 18, 404 × 580, radius 6).
  - **XXL Obby mark (The Obby House V3 logo mark; vector: `claude/Obby Card Game 2.0 - Obby mark V3.svg`, 676 × 973 viewBox), twice:** 400 px tall, one upright centred at (150, 158), one rotated 180° centred at (290, 458), both cut off by the frame. **Solid fill `#6B74FF` at 8 %** (lowered from 16 %, same day: stood out too much) (ruled 31 Oct; replaces the engraved 0.7 px lines). Prints without the line break-up risk.
  - **Eclipse halo:** 30 star pairs (each star has a twin mirrored through the centre, r 0.35–1.1, white 20–65 %); nebula haze (fractal noise tinted `#7C84FF`, masked to a ring around the centre, drawn twice at 50 %, the second copy rotated 180° so the haze is symmetric); corona ring (radial, centre (220, 308), r 140: `#C9CCFF` 50 % at 68 %, `#6B74FF` 12 % at 80 %, fading out).
  - **Disc:** r 92 at (220, 308), fill `#050505`, 0.6 px rim `rgba(201,204,255,.4)`.
  - **Pinline:** 0.75 px `#6B74FF` at 50 %, 8 px inside the card edge (radius 17), broken around the side labels (y 244–372).
  - **Side labels:** `OBBY CARD GAME` on both edges, Sora 700 6.5 px .32em white 85 %, **centred on the card's middle (y 308)** so they swap when turned: left reads bottom-to-top, right top-to-bottom.
  - Indigo `#6B74FF` is the back's only accent and matches no card type. No OBBY text, no seigaiha (its waves point one way).
  - Optional foil back (special editions): silver gradient (palindromic, so still symmetric) on the marks only, screen 22 %.
  - Board tile (face-down Piecie, deck pile): the same back turned 90° to fit the landscape tile.

## Open
- Swap the traced mark for the original vector logo file if Gandalf has it.
- Print proof: check the solid marks and the haze on matte stock.
