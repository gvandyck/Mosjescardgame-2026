// getEffectiveCost - the Energy a card/ability really costs after Place discounts (floor 0).
// kind: 'piecie' | 'ability' | 'other'. For 'ability', cardId is the abilityId.
// Dierenasiel: pet Piecies 0. Welloe Graveyard: Harde Didde, Klaar Met Jou, Elimination Strike 1 less.
// Coert's Caravan (opts.caravan): the player's first Piecie costing 1+ this turn is free; opts.commit marks it used.
import { getCardEnergyCost } from './getCardEnergyCost.js';
import { getAbilityEnergyCost } from './getAbilityEnergyCost.js';
import { fieldHasMosjeNamed } from './fieldHasMosjeNamed.js';
import { ATTACHMENT_RULES } from '../../rules/attachmentRules.js';
import { PIECIES } from '../../data/piecies.js';

const WELLOE_CARDS = new Set(['piecie_harde_didde', 'piecie_klaar_met_jou', 'ability_gandoe_destroyer_elimination_strike']);

// Hawaiishirt: while it is attached to one of the player's live Mosjes the first Piecie of the turn costs 1 less (also a
// 0-cost one: the discount is used because the counter rises). Adds to Coert's Caravan.
function firstPiecieDiscount(state, playerId) {
	const player = state?.players?.[playerId];
	if (!player || (player.piecieActivationsThisTurn || 0) > 0) return 0;
	let total = 0;
	for (const slot of player.activeSlots || []) {
		if (!slot || slot.isDefeated) continue;
		for (const a of slot.attachments || []) total += ATTACHMENT_RULES[a.cardId]?.firstPiecieDiscount || 0;
	}
	return total;
}

export function getEffectiveCost(state, playerId, cardId, kind = 'piecie', opts = {}) {
	let cost = kind === 'ability' ? getAbilityEnergyCost(cardId) : getCardEnergyCost(cardId);
	const place = state?.activePlace;
	if (kind === 'piecie' && place === 'place_dierenasiel' && PIECIES.find(p => p.id === cardId)?.tag === 'pet') cost = 0;
	if (place === 'place_welloe_graveyard' && WELLOE_CARDS.has(cardId)) cost = Math.max(0, cost - 1);
	if (kind === 'piecie' && opts.caravan && place === 'place_coerts_caravan' && cost >= 1) {
		const player = state.players?.[playerId];
		const turn = state.turnNumber ?? 0;
		if (player && player.caravanUsedTurn !== turn && fieldHasMosjeNamed(state, playerId, 'coert')) {
			if (opts.commit) player.caravanUsedTurn = turn;
			cost = 0;
		}
	}
	if (kind === 'piecie') cost -= firstPiecieDiscount(state, playerId); // Hawaiishirt: reads the activation counter, no flag
	return Math.max(0, cost);
}
