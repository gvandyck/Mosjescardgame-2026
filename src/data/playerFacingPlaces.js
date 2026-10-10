// playerFacingPlaces.js — Single source of truth for the Place cards players may see.
// Deck-building and booster packs read from this accessor so hidden Places can
// never drift between surfaces.
//
// Obby 2.0 (Phase 53): Drain Zone and The Void are playable again. A Place is
// hidden only by the shared `disabled` flag on its card data; this accessor
// filters on nothing else. Engine importers read the raw PLACES list unfiltered.

import { PLACES } from './places.js';

export function getPlayerFacingPlaces() {
	return PLACES.filter(place => !place.disabled);
}
