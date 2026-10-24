// renderQuestStacks — the 3 face-up Quests (Fighting / Digital / Artistic) in the middle strip of the board, drawn as
// 2.0 Quest tiles on visible stacks (63-UI-SPEC "Quest stacks", D-09). The HTML comes from buildQuestStacksHtml.
// onTap(stackId, questId) is called for a tap / Enter on a stack. A stack whose face-up Quest changed since the last render
// (a win or the 2nd fail replaced it) gets the 250 ms slide-up class quest-stack--new.
import { buildQuestStacksHtml } from './board/buildQuestStacksHtml.js';

const _lastFaceUp = new Map(); // stack id -> the Quest id that was face up at the previous render

export function renderQuestStacks(container, { questStacks, onTap } = {}) {
	if (!container) return;
	container.innerHTML = buildQuestStacksHtml(questStacks);

	const changed = new Set();
	for (const [stackId, stack] of Object.entries(questStacks || {})) {
		const faceUp = stack?.faceUp ?? null;
		if (_lastFaceUp.has(stackId) && _lastFaceUp.get(stackId) !== faceUp && faceUp) changed.add(stackId);
		_lastFaceUp.set(stackId, faceUp);
	}

	// The unit tests hand in a plain { innerHTML } container: nothing to wire there.
	if (typeof container.querySelectorAll !== 'function') return;
	for (const el of container.querySelectorAll('.quest-stack')) {
		const stackId = el.dataset.questStack;
		if (changed.has(stackId)) el.classList.add('quest-stack--new');
		if (!el.dataset.quest || typeof onTap !== 'function') continue;
		const tap = () => onTap(stackId, el.dataset.quest);
		el.addEventListener('click', tap);
		el.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			tap();
		});
	}
}
