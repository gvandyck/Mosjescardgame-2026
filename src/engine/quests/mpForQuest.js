// mpForQuest - the MP a Mosje counts as having for Quest requirements: Perfect Setup's pick (this turn) or its real MP.
export function mpForQuest(slot) {
	return Number.isFinite(slot?.questMpOverride) ? slot.questMpOverride : slot?.mp;
}
