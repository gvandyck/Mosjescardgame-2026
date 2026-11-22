// describeRaiseView.js — the three texts of the raise dock for one raised card (Phase 65-06): its name, its one info line (the reason
// it cannot be played, else "Costs N Energy" or "Free") and whether Play is disabled. Pure: strings only, no DOM, no card text as markup.
export function describeRaiseView(view) {
	const info = view.info;
	const nameMatch = String(view.card?.name || view.cardId).match(/^\[(.+?)\]\s*(.*)/);
	let line = 'Free';
	if (!info.canPlay) line = info.reason;
	else if (view.card?.type === 'PERSONAL_QUEST') line = 'Play to attempt it';
	else if (info.cost > 0) line = `Costs ${info.cost} Energy`;
	return { name: nameMatch ? nameMatch[1] : String(view.card?.name || view.cardId), line, disabled: !info.canPlay };
}
