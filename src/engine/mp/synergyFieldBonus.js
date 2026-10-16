// synergyFieldBonus - Synergy Field: each staying copy adds +10 to every MP gain an ability of the owner's Mosjes gives.
export function synergyFieldBonus(state, playerId) {
	const slots = state.players?.[playerId]?.piecieSlots || [];
	return slots.filter(e => e?.stays === true && e.cardId === 'piecie_synergy_field').length * 10;
}
