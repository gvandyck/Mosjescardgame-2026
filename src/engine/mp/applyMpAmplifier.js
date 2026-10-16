// applyMpAmplifier - MP Amplifier: "this turn, the next time one of your Mosjes gains MP, it gains double (at most 40
// extra)". Returns the boosted amount and disarms player.mpAmplifierThisTurn (one-shot). Mutates the given state clone.
export const MP_AMPLIFIER_MAX_EXTRA = 40;

export function applyMpAmplifier(state, playerId, amount) {
	const player = state.players?.[playerId];
	if (!player?.mpAmplifierThisTurn) return amount;
	player.mpAmplifierThisTurn = false;
	return amount + Math.min(amount, MP_AMPLIFIER_MAX_EXTRA);
}
