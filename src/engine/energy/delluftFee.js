// delluftFee - Delluft parking fee for a payment of `amount` by playerId (0 when none applies).
// First non-zero payment on the payer's own turn; Coert or Binti on field: no fee; Cless: 2; else 1.
import { fieldHasMosjeNamed } from './fieldHasMosjeNamed.js';

export function delluftFee(state, playerId, amount) {
	if (state.activePlace !== 'place_delluft' || !(amount > 0)) return 0;
	if (state.activePlayerId !== playerId) return 0;
	if (state.players[playerId]?.delluftFeeTurn === (state.turnNumber ?? 0)) return 0;
	if (fieldHasMosjeNamed(state, playerId, 'coert') || fieldHasMosjeNamed(state, playerId, 'binti')) return 0;
	return fieldHasMosjeNamed(state, playerId, 'cless') ? 2 : 1;
}
