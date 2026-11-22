// readCardSheetData.js - what the card sheet shows for one card element (72.1-06, T-72.1-12). Reads ONLY what the tile already shows
// publicly: its dataset (card id, attachment ids, max, timed-effect tags as JSON) and its live data-cv1 stat hooks, plus the card's own
// static data. Never the game state, so nothing of an opponent's hand can leak. srcEl = a table card, the Place tile, a Quest stack
// (data-quest) or a hand card wrapper. Returns null for an unknown card.
import { getCardById } from '../../data/cardIndex.js';
import { getCardPanelLines } from '../cardV1/getCardPanelLines.js';
import { readHook } from '../hover/readHook.js';
import { getCardTypeLabel } from './getCardTypeLabel.js';
import { parseSheetTags } from './parseSheetTags.js';

// Card texts mark bold with **; the sheet shows plain text.
const plain = (t) => String(t ?? '').replace(/\*\*/g, '');

export function readCardSheetData(srcEl) {
	const data = srcEl?.dataset || {};
	const def = getCardById(data.cardId || data.quest);
	if (!def) return null;
	const live = { mp: readHook(srcEl, 'mp'), level: readHook(srcEl, 'level'), power: readHook(srcEl, 'power') };
	const ids = (data.attachments || '').split(',').filter(Boolean);
	const max = Number(data.maxAttachments);
	const rows = ids.map((id) => ({ name: getCardById(id)?.name ?? String(id), text: plain(getCardById(id)?.description) }));
	const isMosje = getCardTypeLabel(def) === 'Mosje';
	const text = [];
	if (def.abilityDescription) text.push({ label: 'Ability', text: plain(def.abilityDescription) });
	if (def.synergyEffect) text.push({ label: 'Synergy', text: plain(def.synergyEffect) });
	if (!isMosje && typeof def.description === 'string' && def.description && def.description !== def.abilityDescription) text.push({ label: 'Effect', text: plain(def.description) });
	return {
		name: def.name,
		typeLabel: getCardTypeLabel(def),
		level: live.level,
		mp: live.mp,
		power: live.power,
		text,
		attachments: rows.length && Number.isFinite(max) ? { rows, max } : null,
		tags: parseSheetTags(data.tags),
		panelLines: getCardPanelLines(def),
	};
}
