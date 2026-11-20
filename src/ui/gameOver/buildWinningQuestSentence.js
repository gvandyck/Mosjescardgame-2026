// buildWinningQuestSentence.js - "<Player> completed <Quest> with <Mosje>" (D-16). Plain text; the caller escapes it.
export function buildWinningQuestSentence(info) {
	return `${info.playerName} completed ${info.questName} with ${info.mosje.name}`;
}
