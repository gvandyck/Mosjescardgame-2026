// getAbilityChip.js — the tray's Ability chip for one own Mosje, or null when it has no button (63-UI-SPEC "Action tray").
// Same rule boardRenderer's .mosje-ability-btn uses: only an 'activated' ability that is not a draw-step or reactive one
// (hidden V4 Mosjes keep the old "no autoAbility" rule). The reasons mirror useMosjeAbility, which re-checks everything.
import { MOSJES } from '../../data/mosjes.js';
import { MOSJE_ABILITY_RULES } from '../../rules/mosjeAbilityRules.js';
import { getEffectiveCost } from '../../engine/energy/getEffectiveCost.js';
import { delluftFee } from '../../engine/energy/delluftFee.js';
import { isCooldownBlocked, COOLDOWN_ERROR } from '../../engine/turn/isCooldownBlocked.js';
import { canMosjeAct } from '../../engine/mp/canMosjeAct.js';
import { makeTrayChip } from './makeTrayChip.js';

const LEGACY_RULE = { kind: 'activated', per: 'turn', maxPerTurn: 1, ownTurnOnly: false };

function pickReason(state, playerId, slot, rule, cost) {
	if (rule.ownTurnOnly !== false && state.activePlayerId !== playerId) return 'You can only use this on your own turn';
	if (isCooldownBlocked(state, playerId)) return COOLDOWN_ERROR;
	if (!canMosjeAct(slot)) return 'This Mosje is sideways';
	if (rule.per === 'game' && slot.abilityUsedThisGame) return 'Ability already used this game';
	const used = slot.abilityUsesThisTurn ?? (slot.abilityUsedThisTurn ? 1 : 0);
	if (used >= (rule.maxPerTurn ?? 1) + (slot.extraAbilityUses || 0)) return 'Ability already used this turn';
	if ((state.players[playerId].energy ?? 0) < cost) return `Not enough Energy (need ${cost})`;
	return '';
}

export function getAbilityChip(state, playerId, slotIndex) {
	const slot = state.players?.[playerId]?.activeSlots?.[slotIndex];
	const def = slot ? MOSJES.find((m) => m.id === slot.cardId) : null;
	if (!def?.abilityId) return null;
	const rule = MOSJE_ABILITY_RULES[def.abilityId] || LEGACY_RULE;
	const shown = MOSJE_ABILITY_RULES[def.abilityId]
		? rule.kind === 'activated' && !rule.drawStep && !rule.reactive
		: !def.autoAbility;
	if (!shown) return null;
	const base = getEffectiveCost(state, playerId, def.abilityId, 'ability');
	const cost = base + delluftFee(state, playerId, base);
	const chip = makeTrayChip('ability', cost > 0 ? `Ability · ${cost} Energy` : 'Ability', pickReason(state, playerId, slot, rule, cost));
	return { ...chip, cost };
}
