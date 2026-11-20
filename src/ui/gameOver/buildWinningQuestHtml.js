// buildWinningQuestHtml.js - the winning Personal Quest block of the game-over card (D-16, T-72-21). Pure; everything escaped.
// Leaves an empty card slot div.go-winning-quest__card[data-card-id]; rewardOverlay.js mounts the card face into it.
import { escapeHtml as esc } from '../cardV1/escapeHtml.js';
import { buildDiceRowHtml } from '../dice/buildDiceRowHtml.js';

export function buildWinningQuestHtml(info) {
	const { mosje } = info;
	const parts = [];
	if (mosje.level !== null && mosje.level !== undefined) parts.push(`Level ${mosje.level}`);
	if (mosje.mp !== null && mosje.mp !== undefined) parts.push(`${mosje.mp} MP`);
	const detail = parts.length ? `<span class="go-winning-quest__stats">${esc(parts.join(', '))}</span>` : '';
	return `
		<section class="go-winning-quest" data-quest-id="${esc(info.questCardId)}">
			<div class="go-winning-quest__card" data-card-id="${esc(info.questCardId)}"></div>
			<div class="go-winning-quest__side">
				<p class="go-winning-quest__mosje"><span class="go-winning-quest__mosje-name">${esc(mosje.name)}</span>${detail}</p>
				${buildDiceRowHtml(info.dice)}
			</div>
		</section>`;
}
