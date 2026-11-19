// pickCostMosje - the bot's answer to the cost step ("Which Mosje pays?", key cost_mosje): the own Mosje with the most MP,
// so the price leaves it above 0 whenever any Mosje can manage that. Options are { playerId, slotIndex, label }.
// Called by chooseTriggerChoice with the bot's table view (BOT-04). Returns one of the options, or undefined (malformed) so the caller takes the first.

export function pickCostMosje(table, botId, pendingChoice) {
	const options = pendingChoice?.options;
	const slotOf = (o) => table.players?.[o?.playerId ?? botId]?.activeSlots?.[o?.slotIndex];
	if (!Array.isArray(options) || options.length === 0 || !options.every(o => slotOf(o))) return undefined;
	// the price is the same for every option, so the highest MP is also the highest MP left
	return options.reduce((top, o) => ((Number(slotOf(o).mp) || 0) > (Number(slotOf(top).mp) || 0) ? o : top));
}
