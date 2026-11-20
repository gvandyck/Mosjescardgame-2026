// describePersonalQuestFail - the one log line after a failed Personal Quest (72-04, D-04): what the fail discarded.
// The discards are the growth of the player's pile (failPersonalQuest puts them there). Pure; plain text (the log escapes).
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

export function describePersonalQuestFail(beforePlayer, afterPlayer, questName) {
	const was = (beforePlayer?.graveyard || []).length;
	const added = (afterPlayer?.graveyard || []).slice(was);
	const names = added.map(e => toGraveyardEntry(e.cardId, e.source).name);
	const tail = 'the card went back to your deck';
	return names.length
		? `${questName} failed: discarded ${names.join(', ')}, ${tail}`
		: `${questName} failed: nothing was discarded, ${tail}`;
}
