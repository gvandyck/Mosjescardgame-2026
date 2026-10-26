// toDeckTileSpecs.js — deck data -> the plain specs a deck tile is drawn from (D-07).
// Stack colour = TYPE_COLORS by deck kind (same tokens as the Phase 63 Quest stacks). includeRandom prepends the
// neutral "Random" tile that bot pickers use (the warm tone Phase 63 uses for a neutral Place).
import { MOSJES } from '../../data/mosjes.js';
import { TYPE_COLORS } from '../cardV1/typeColors.js';
import { RANDOM_DECK_CHOICE } from '../../config/lobbyModes.js';

const NEUTRAL_COLOR = '#B45309';
const NEUTRAL_TINT = '#FFEDD5';

export function toDeckTileSpecs(decks, { selectedId, includeRandom = false } = {}) {
	const specs = decks.map(deck => ({
		id: deck.id,
		name: deck.name,
		description: deck.description,
		startingMosjeName: MOSJES.find(mosje => mosje.id === deck.startingMosje)?.name ?? '',
		color: TYPE_COLORS[deck.kind]?.main ?? NEUTRAL_COLOR,
		tint: TYPE_COLORS[deck.kind]?.tint ?? NEUTRAL_TINT,
		isRandom: false,
		selected: deck.id === selectedId,
	}));
	if (!includeRandom) return specs;
	return [
		{
			id: RANDOM_DECK_CHOICE,
			name: 'Random',
			description: 'Rolled again every game',
			startingMosjeName: '',
			color: NEUTRAL_COLOR,
			tint: NEUTRAL_TINT,
			isRandom: true,
			selected: selectedId === RANDOM_DECK_CHOICE,
		},
		...specs,
	];
}
