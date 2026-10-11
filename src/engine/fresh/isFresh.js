// isFresh — a Mosje that just entered play (2.0 "fresh"); cleared at the owner's next turn start.
export function isFresh(slot) {
	return slot?.entryProtected === true;
}
