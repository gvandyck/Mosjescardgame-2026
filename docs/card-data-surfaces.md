# Card Data Surfaces

> **Resolved 2026-06-12 — there is now ONE card data surface.** This doc previously
> described two (a `.js` UI surface and a `.ts` engine surface). The `.ts` engine was
> retired to `/_archive/`. The single source of truth is the plain-JavaScript data
> below. Edit each card **once**; never create a `.ts` definition.

## The single card data surface (`src/data/*.js`)

Files:

- `src/data/mosjes.js`
- `src/data/piecies.js`
- `src/data/snellePiecies.js`
- `src/data/places.js`
- `src/data/quests.js`
- `src/data/cardIndex.js`

Used by:

- `src/main.js`, `src/ui/*`
- browser pages (`game.html`, `deck-builder.html`, demos)
- the bot, multiplayer, and browser game state

Card **behaviour** (effects) lives in `src/abilities/*.js` — keep `src/data/*.js`
pure data (name, cost, traits, description), with no logic.

## Working rule

When adding or changing a card:

1. Update the data entry in `src/data/<type>.js` (data only).
2. Update its effect in the matching `src/abilities/*.js`.
3. Update `docs/card-reference.md` (verify against code — flags have gone stale before).
4. Add/adjust a test, preferably a real-engine browser test in `tests/ui/cards/`.

The old "update both surfaces" rule no longer applies. The retired `.ts` registry in
`/_archive/` must not be read, scanned, or edited.
