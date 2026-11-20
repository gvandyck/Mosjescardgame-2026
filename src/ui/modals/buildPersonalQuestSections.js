// buildPersonalQuestSections - the detail-view sections of a Personal Quest: Needs, Pay, Roll (72-04, D-01).
// Returns [[label, text]] with the printed strings unchanged (the caller escapes them); a line the card lacks is left out.
import { getPersonalQuestBlocks } from '../cardV1/getPersonalQuestBlocks.js';

export function buildPersonalQuestSections(card) {
	return getPersonalQuestBlocks(card).map(b => [b.label, b.text]);
}
