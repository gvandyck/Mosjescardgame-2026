// pickBotOwnTarget — which of its own Mosjes the bot aims a "your Mosje" Piecie at (slot index, -1 when none).
// By what the card does: a Power boost goes to a Mosje that can still attack, a self-loss to the Mosje that absorbs it,
// a pet to an own Level 3 (else the most valuable Mosje); an MP gain protects a threatened Level 3, else levels something up.
// The picking itself is pickOwnSlotByRole; the role comes from the Piecie's tags (comboTags) and its self-loss amount.
import { PIECIES } from '../../data/piecies.js';
import { getCardTags } from './comboTags.js';
import { SELF_LOSS_MP } from './cardAmounts.js';
import { pickOwnSlotByRole } from './pickOwnSlotByRole.js';
import { asBotView } from './asBotView.js';

export function pickBotOwnTarget(state, botId, effectId) {
	state = asBotView(state, botId); // BOT-04: from here on `state` is the table view
	const slots = state.players?.[botId]?.activeSlots || [];
	const card = PIECIES.find(p => p.effectId === effectId);
	const tags = card ? getCardTags(card.id) : [];
	const loss = card ? SELF_LOSS_MP[card.id] ?? 0 : 0; // Straffoe's own 5 MP counts too
	let role = 'gain';
	if (tags.includes('power')) role = 'power';
	else if (loss > 0) role = 'self-loss';
	else if (tags.includes('defense')) role = 'defense';
	return pickOwnSlotByRole(state, botId, role, slots.map((_, i) => i), loss);
}
