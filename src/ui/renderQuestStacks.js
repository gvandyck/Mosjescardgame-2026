// renderQuestStacks — the 3 face-up Quests (Fighting / Digital / Artistic) in the middle of the board.
import { getQuestDef } from '../engine/quests/getQuestDef.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STACK_LABEL = { FIGHTING: 'Fighting', DIGITAL: 'Digital', ARTISTIC: 'Artistic' };

export function renderQuestStacks(container, state) {
	if (!container) return;
	const stacks = state?.questStacks || {};
	container.innerHTML = Object.keys(STACK_LABEL).map(stackId => {
		const stack = stacks[stackId];
		const q = stack?.faceUp ? getQuestDef(stack.faceUp) : null;
		if (!q) return `<div class="quest-stack quest-stack--empty" data-stack="${stackId}">${STACK_LABEL[stackId]}: empty</div>`;
		return `<div class="quest-stack" data-stack="${stackId}" data-quest="${esc(q.id)}">
			<div class="quest-stack__kind">${STACK_LABEL[stackId]}</div>
			<div class="quest-stack__name">${esc(q.name)}</div>
			<div class="quest-stack__band">${esc(q.band)} · roll ${esc(q.rollTrait)}</div>
			<div class="quest-stack__stakes">+${q.win} / -${Math.abs(q.lose ?? 0)}</div>
			${q.costText ? `<div class="quest-stack__cost">${esc(q.costText)}</div>` : ''}
			<div class="quest-stack__tokens">Fail tokens: ${stack.tokens || 0}/2</div>
		</div>`;
	}).join('');
}
