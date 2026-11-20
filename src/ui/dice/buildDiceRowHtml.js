// buildDiceRowHtml - a row of die faces (numbers, no pictographs) for a roll result (72-04, CC-2). Shared with the game-over screen.
// `need` is an optional caller sentence ("Need 2x 4+"). Everything is escaped (T-72-05). No dice returns ''.
import { escapeHtml } from '../cardV1/escapeHtml.js';

export function buildDiceRowHtml(dice, { need = '' } = {}) {
	if (!Array.isArray(dice) || !dice.length) return '';
	const faces = dice.map(d => `<span class="die" data-face="${escapeHtml(d)}">${escapeHtml(d)}</span>`).join('');
	return `<div class="dice-row">${faces}${need ? `<span class="dice-need">${escapeHtml(need)}</span>` : ''}</div>`;
}
