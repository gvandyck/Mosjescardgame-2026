// grantCountsFor - does this die grant count for the roller? An unbound grant counts for any Mosje; a bound one only for its slot index and card id.
export function grantCountsFor(grant, slot, slotIndex) {
	if (!Number.isInteger(grant.slotIndex)) return true;
	return grant.slotIndex === slotIndex && grant.cardId === slot?.cardId;
}
