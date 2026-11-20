// toPendingChoiceOptions — state.pendingChoice -> { options, leave, promptCard } for showOptionSelect (72-11, D-13).
// An option with a cardId becomes a card row (the modal draws its face). A leave option (index -1, choice 'keep' or a
// `leave: true` flag) is lifted out of the rows into the always-visible `leave` button. Ids are the option positions, so
// the caller answers with pc.options[Number(id)] (the original object: the engine matches it by JSON equality).
const isLeave = (o) => o !== null && typeof o === 'object' && (o.leave === true || o.index === -1 || o.choice === 'keep');
const labelOf = (o) => (o !== null && typeof o === 'object') ? (o.label ?? o.name ?? JSON.stringify(o)) : String(o);

export function toPendingChoiceOptions(pc) {
	const options = [];
	let leave = null;
	(pc?.options || []).forEach((o, i) => {
		const id = String(i);
		if (isLeave(o) && !leave) { leave = { id, label: labelOf(o) }; return; }
		const row = { id, label: labelOf(o) };
		if (o !== null && typeof o === 'object' && o.cardId) row.card = { cardId: o.cardId };
		options.push(row);
	});
	return { options, leave, promptCard: pc?.promptCardId || null };
}
