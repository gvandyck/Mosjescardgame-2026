// askPuntoBanco - the Punto Banco question right before a Quest or Personal Quest roll (71-18, D-32), with the existing
// option modal. Asks only with Punto Banco in play, 1+ Energy and the once-per-turn use still free.
// Returns 'punto', 'banco' or undefined (no / cancelled / not offered).
export async function askPuntoBanco({ state, playerId, modal }) {
	const player = state.players[playerId];
	if (state.activePlace !== 'place_punto_banco' || !player) return undefined;
	if ((player.energy || 0) < 1 || player.puntoBancoTurn === state.turnNumber) return undefined;
	const id = await modal.showOptionSelect({
		title: 'Punto Banco',
		prompt: 'Pay 1 Energy and call a side; one die each. Your call higher: +2 dice on this roll. A tie: Energy back.',
		options: [
			{ id: 'no', label: 'No' },
			{ id: 'punto', label: 'Call Punto' },
			{ id: 'banco', label: 'Call Banco' },
		],
	});
	return id === 'punto' || id === 'banco' ? id : undefined;
}
