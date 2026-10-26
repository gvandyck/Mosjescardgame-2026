// buildDeckTiles.js — the one deck picker every lobby choice uses (D-07): your deck, the bot rows, Watch Bots rows,
// and later Phase 67's room screens. Data -> specs -> escaped HTML (buildDeckTilesHtml) -> radiogroup with behaviour.
// The only innerHTML here is the output of buildDeckTilesHtml, which escapes every value.
import { buildDeckTilesHtml } from './buildDeckTilesHtml.js';
import { toDeckTileSpecs } from './toDeckTileSpecs.js';
import { bindRadioGroup } from './bindRadioGroup.js';

export function buildDeckTiles(decks, { selectedId, onSelect, label, picker, includeRandom = false, compact = false } = {}) {
	const holder = document.createElement('div');
	holder.innerHTML = buildDeckTilesHtml(toDeckTileSpecs(decks, { selectedId, includeRandom }), { label, compact });
	const group = holder.firstElementChild;
	group.dataset.picker = picker;
	bindRadioGroup(group, { onSelect });
	return group;
}
