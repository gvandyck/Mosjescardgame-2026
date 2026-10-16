// releaseBoundPower - a Stays Piecie that gave its bound Mosje Power while it stays (boundTo[].power, kept on the Mosje
// as powerStaysBonus) takes it back when it leaves. Returns a new players object (no mutation of the old slots).
export function releaseBoundPower(players, entry) {
	let next = players;
	for (const b of entry?.boundTo || []) {
		if (!b.power) continue;
		const owner = next[b.playerId];
		const slot = owner?.activeSlots?.[b.slotIndex];
		if (!slot || slot.cardId !== b.cardId || !slot.powerStaysBonus) continue;
		const activeSlots = owner.activeSlots.slice();
		activeSlots[b.slotIndex] = { ...slot, powerStaysBonus: Math.max(0, slot.powerStaysBonus - b.power) };
		next = { ...next, [b.playerId]: { ...owner, activeSlots } };
	}
	return next;
}
