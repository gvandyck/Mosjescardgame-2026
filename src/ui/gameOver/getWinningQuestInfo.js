// getWinningQuestInfo.js - state -> what the game-over screen shows about a Personal Quest win (D-16), or null.
// Pure. The quest id is checked against the data (T-72-22): an unknown id from a synced state is ignored.
// Level and MP come from the winning slot, which is still on the field at game over; they are null when it is gone.
import { getPersonalQuestDef } from '../../engine/personalQuests/getPersonalQuestDef.js';

export function getWinningQuestInfo(state) {
	if (state?.winReason !== 'PERSONAL_QUEST' || !state.winningQuest) return null;
	const won = state.winningQuest;
	const def = getPersonalQuestDef(won.cardId);
	if (!def) return null;
	const player = state.players?.[won.playerId ?? state.winnerId];
	const slot = player?.activeSlots?.[won.slotIndex] || null;
	return {
		questCardId: def.id,
		questName: def.name,
		playerName: player?.name || 'Winner',
		dice: Array.isArray(won.dice) ? [...won.dice] : [],
		mosje: {
			cardId: slot?.cardId ?? won.mosjeCardId ?? null,
			name: slot?.name ?? won.mosjeName ?? 'a Mosje',
			level: slot?.level ?? null,
			mp: slot?.mp ?? null,
		},
	};
}
