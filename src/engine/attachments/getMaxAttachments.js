// getMaxAttachments - how many cards this Mosje slot can carry: 2, Jeffrey The Strongman 3.
import { MAX_ATTACHMENTS, MAX_ATTACHMENTS_BY_MOSJE } from './attachRules.js';

export function getMaxAttachments(slot) {
	return MAX_ATTACHMENTS_BY_MOSJE[slot?.cardId] ?? MAX_ATTACHMENTS;
}
