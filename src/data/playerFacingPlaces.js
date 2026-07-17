// playerFacingPlaces.js — Single source of truth for the Place cards players may see.
// Deck-building and booster packs read from this accessor so hidden Places can
// never drift between surfaces.
//
// Explicit blacklist: Drain Zone and The Void are DESCOPED this phase (Phase 35,
// see 35-CONTEXT.md) — their card text promises cross-cutting mechanics too
// large for a Places-only phase. Hidden from player-facing pools until a future
// phase implements them properly. Both stay fully defined in PLACES untouched,
// so any already-in-play instance still resolves correctly.

import { PLACES } from './places.js';

const HIDDEN_PLACE_IDS = ['place_drain_zone', 'place_the_void'];

export function getPlayerFacingPlaces() {
	return PLACES.filter(place => !HIDDEN_PLACE_IDS.includes(place.id));
}
