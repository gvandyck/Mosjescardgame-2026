// Mouse: "Needs: a Digital Mosje. Search your deck for a gear Piecie and put it in your hand." No Mosje gains MP.
import { searchDeckForTag } from '../searchDeckForTag.js';

export function effect_mouse(gameState, playerId, ctx = {}) {
	const res = searchDeckForTag(gameState, playerId, 'gear', 'mouse_search', {});
	return res.needChoice ? res : res.state;
}
