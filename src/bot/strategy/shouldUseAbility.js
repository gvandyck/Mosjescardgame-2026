// shouldUseAbility - should the bot press the ability button of its Mosje in `slotIndex` now? (BOT-02: moved out of
// botDriver.js.) Two gates, both the engine's own: whether the engine would accept the press at all (the same
// MOSJE_ABILITY_RULES data and counters useMosjeAbility reads, plus each ability's Only-if) and the REAL price: Place
// discounts (Welloe Graveyard) plus the Delluft parking fee, with `reserve` Energy kept back. Timing, "can it act" and the
// inputs stay with the caller; `profile` is kept for callers that pass the deck profile.
import { MOSJES } from '../../data/mosjes.js';
import { MOSJE_ABILITY_RULES } from '../../rules/mosjeAbilityRules.js';
import { getStrikeCandidates } from '../../abilities/mosje/getStrikeCandidates.js';
import { isCooldownBlocked } from '../../engine/turn/isCooldownBlocked.js';
import { asBotView } from './asBotView.js';
import { canBotAfford } from './canBotAfford.js';
import { emitBotMetric } from './emitBotMetric.js';

const MOSJE_LOOKUP = Object.fromEntries(MOSJES.map(m => [m.id, m]));
const LEGACY_RULE = { kind: 'activated', per: 'turn', maxPerTurn: 1, ownTurnOnly: false }; // what the engine assumes for an ability without rules

// Would useMosjeAbility accept a press now? Mirrors its checks in order: cooldown, kind, own turn, per-game and per-turn limits.
// Triggers and passives fire by themselves; Lucky Beats (reactive) is a reaction-window card; Extra Resources and
// Time Control (drawStep) are options of the draw step. None of them has a button in the action phase.
function enginePressable(view, botId, slot, abilityId) {
	if (isCooldownBlocked(view, botId)) return false;
	const rule = MOSJE_ABILITY_RULES[abilityId] || LEGACY_RULE;
	if (rule.kind !== 'activated' || rule.reactive || rule.drawStep) return false;
	if (rule.ownTurnOnly !== false && view.activePlayerId !== botId) return false;
	if (rule.per === 'game' && slot.abilityUsedThisGame) return false;
	const uses = slot.abilityUsesThisTurn ?? (slot.abilityUsedThisTurn ? 1 : 0);
	return uses < (rule.maxPerTurn ?? 1) + (slot.extraAbilityUses || 0); // Redbull / Double Trigger add paid extra uses
}

// Chris - Perfect Setup: the ability itself needs all 3 Piecie slots holding face-down, unactivated Piecies.
function perfectSetupReady(view, botId) {
	const slots = view.players?.[botId]?.piecieSlots || [];
	return slots.length >= 3 && [0, 1, 2].every(i => slots[i]?.type === 'PIECIE' && slots[i].faceDown && !slots[i].activated);
}

// Elimination Strike (once per game): only when it sets up the knockout (opponent down to one Mosje) or removes a leveled threat.
function shouldUseEliminationStrike(view, botId, slot) {
	if (slot.abilityUsedThisGame) return false;
	const oppId = Object.keys(view.players).find(id => id !== botId);
	const oppActive = (view.players[oppId]?.activeSlots || []).filter(s => s && !s.isDefeated);
	if (oppActive.length === 0) return false;
	// The strike takes the lowest-level non-fresh Mosje (a tie is settled by the bot's first pick); none = it would be refused.
	if (getStrikeCandidates(view, oppId).length === 0) return false;
	const setsUpKnockout = oppActive.length === 1;
	const removesLeveledThreat = oppActive.some(s => (s.level || 1) >= 2);
	if (setsUpKnockout || removesLeveledThreat) {
		emitBotMetric('elimination-strike', { knockout: setsUpKnockout });
		return true;
	}
	return false;
}

export function shouldUseAbility(state, botId, slotIndex, profile, reserve = 0) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const slot = view.players?.[botId]?.activeSlots?.[slotIndex];
	const abilityId = slot ? MOSJE_LOOKUP[slot.cardId]?.abilityId : null;
	if (!abilityId || !enginePressable(view, botId, slot, abilityId)) return false;
	if (!canBotAfford(view, botId, abilityId, 'ability', reserve)) return false;
	if (abilityId === 'ability_chris_perfect_setup') return perfectSetupReady(view, botId);
	if (abilityId === 'ability_gandoe_destroyer_elimination_strike') return shouldUseEliminationStrike(view, botId, slot);
	return true;
}
