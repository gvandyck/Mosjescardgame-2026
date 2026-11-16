// opponentPickableHand - the indexes of a hand an opponent's effect may pick from (everything but Personal Quests, D-06).
import { isOpponentProof } from './isOpponentProof.js';

export function opponentPickableHand(hand = []) {
	return hand.map((c, i) => (isOpponentProof(c) ? -1 : i)).filter(i => i >= 0);
}
