// payMpCost - pays an MP cost on a slot (mutates the already cloned slot; callers check canPayMpCost first).
// A cost takes exactly the amount: no reducer, shield, Resilient or getemt applies. A Pay counts as losing MP
// (rules §13), so the lost-MP tracker of this turn goes up. MP stays on the 5-grid as long as the amount is.
export function payMpCost(slot, amount) {
	slot.mp -= amount; // mp-direct-ok: a paid cost takes exactly its amount, no reducers (rules §9, D-22)
	slot.mpLostThisTurn = (slot.mpLostThisTurn || 0) + amount;
	return slot;
}
