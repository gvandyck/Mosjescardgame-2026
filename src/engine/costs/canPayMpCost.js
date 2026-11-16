// canPayMpCost - rules §9 (D-22): an MP cost can only be paid by a Mosje that stays above 0 MP afterwards.
// A defeated or missing slot cannot pay.
export function canPayMpCost(slot, amount) {
	if (!slot || slot.isDefeated) return false;
	if (!Number.isInteger(amount) || amount < 0) return false;
	return slot.mp - amount > 0;
}
