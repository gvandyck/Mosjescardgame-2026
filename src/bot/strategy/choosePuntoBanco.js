// choosePuntoBanco - should this roll call Punto Banco (CC-6)? Returns 'punto' or undefined, only for one roll.
// The engine pays 1 Energy and decides; the bot only judges whether the Energy is spare (beyond the reaction reserve).
// A Personal Quest roll (no stackId): one spare Energy. An ordinary Quest: PUNTO_QUEST_ENERGY spare, a dice Quest
// (not trained, not a coin flip) whose win chance is still under PUNTO_QUEST_MAX_CHANCE.
import { asBotView } from './asBotView.js';
import { reactionReserve } from './reactionReserve.js';
import { questWinChance } from './questWinChance.js';
import { QUEST_NEEDS } from './questNeeds.js';
import { PQ_VALUES } from './pqValues.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { getQuestDiceCount } from '../../engine/quests/getQuestDiceCount.js';

export function choosePuntoBanco(state, botId, { slotIndex, stackId } = {}) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const player = view.players?.[botId];
	if (view.activePlace !== 'place_punto_banco' || !player || player.puntoBancoTurn === view.turnNumber) return undefined;
	const spare = (Number(player.energy) || 0) - reactionReserve(view, botId).energy;
	if (stackId === undefined) return spare >= 1 ? 'punto' : undefined;
	const quest = getQuestDef(view.questStacks?.[stackId]?.faceUp);
	const slot = player.activeSlots?.[slotIndex];
	if (!quest || !slot || !QUEST_NEEDS[quest.band] || quest.band === 'coin_flip') return undefined;
	if (spare < PQ_VALUES.PUNTO_QUEST_ENERGY) return undefined;
	const chance = questWinChance(quest.band, getQuestDiceCount(view, botId, slot, quest), player.questEaseThisTurn || 0);
	return chance < PQ_VALUES.PUNTO_QUEST_MAX_CHANCE ? 'punto' : undefined;
}
