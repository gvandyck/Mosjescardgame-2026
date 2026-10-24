// toMosjeTileCards.js — one player's Mosjes as board tile data (63-04, UI-03, D-15..D-18).
// Each live slot becomes { cardId, slotIndex, name, mp, level, power, ... } for renderCard(fieldMode):
//   power = the live getPower (level row + boosts + Place), never the printed level-row number;
//   sideways / levelUpProtected / entryProtected / actedThisTurn drive the tile badges and the sideways pose;
//   a Tactician set (slot.tacticianSet) keeps the temporary MP in slot.mp, so it goes out as tempMp and mp is
//   the REAL MP (what snapBackTacticianSet will restore: real + this turn's gains and losses, 5-grid, 0..95).
import { MOSJES } from '../../data/mosjes.js';
import { getPower } from '../../engine/mp/getPower.js';
import { getAbilityEnergyCost } from '../../engine/energy/getAbilityEnergyCost.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { roundToFive } from '../../engine/roundToFive.js';

export function toMosjeTileCards(state, ownerId) {
	const owner = state?.players?.[ownerId];
	const ownerEnergy = owner?.energy ?? 0;
	return (owner?.activeSlots || [])
		.map((slot, slotIndex) => ({ slot, slotIndex }))
		.filter(({ slot }) => !!slot)
		.map(({ slot, slotIndex }) => {
			const mosjeDef = MOSJES.find(m => m.id === slot.cardId);
			const cost = getAbilityEnergyCost(mosjeDef?.abilityId);
			const set = slot.tacticianSet;
			const realMp = set ? roundToFive(Math.min(95, Math.max(0, set.realMp + set.delta))) : slot.mp;
			return {
				cardId: slot.cardId,
				slotIndex,
				name: slot.name,
				type: 'MOSJE',
				mp: realMp,
				...(set ? { tempMp: slot.mp } : {}),
				level: slot.level,
				power: getPower(slot, state, ownerId),
				isDefeated: slot.isDefeated,
				traits: slot.traits ?? {},
				abilityUsedThisTurn: slot.abilityUsedThisTurn,
				abilityUsedThisGame: slot.abilityUsedThisGame === true,
				abilityCost: cost,
				cantAffordAbility: cost > ownerEnergy,
				description: slot.isDefeated ? 'Defeated' : '',
				summonedByPiecie: slot.summonedByPiecie || null,
				entryProtected: isFresh(slot), // U8: Fresh until the owner's next turn start
				levelUpProtected: slot.levelUpProtected === true, // R2: the turn a Mosje levelled up
				sideways: slot.sideways === true, // getemt at Level 1 (D-16)
				actedThisTurn: slot.actedThisTurn === true,
			};
		});
}
