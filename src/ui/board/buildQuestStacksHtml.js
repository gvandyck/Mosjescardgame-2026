// buildQuestStacksHtml.js — the 3 Quest stacks of the middle strip as HTML (63-UI-SPEC "Quest stacks", D-09, spec U5).
// Per stack (Fighting / Digital / Artistic): the 2.0 Quest tile (the 62 field-tile builder, fail pips filled from
// stack.tokens) on two visible card edges, plus a count tab "11 left". A stack without a face-up Quest is a dashed
// outline reading "Empty". Hooks: data-quest-stack, data-stack, data-quest, data-stack-count (cards left in the deck).
// Every interpolated value goes through escapeHtml.
import { QUEST_STACK_IDS } from '../../engine/setup/setupRules.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { buildCardV1 } from '../cardV1/buildCardV1.js';
import { escapeHtml } from '../cardV1/escapeHtml.js';
import { TYPE_COLORS } from '../cardV1/typeColors.js';

const STACK_LABEL = { FIGHTING: 'Fighting', DIGITAL: 'Digital', ARTISTIC: 'Artistic' };

function stackAttrs(stackId, left, extra = '') {
	const id = escapeHtml(stackId);
	const colors = TYPE_COLORS[stackId];
	return `data-quest-stack="${id}" data-stack="${id}"${extra} data-stack-count="${left}" style="--stack-color:${escapeHtml(colors.main)};--stack-tint:${escapeHtml(colors.tint)}"`;
}

function buildEmptyStack(stackId, left) {
	const label = escapeHtml(STACK_LABEL[stackId]);
	return `<div class="quest-stack quest-stack--empty" ${stackAttrs(stackId, left)} aria-label="${label} Quests: empty">
		<div class="quest-stack__slot"></div>
		<div class="quest-stack__count">Empty</div>
	</div>`;
}

function buildStack(stackId, stack) {
	const left = Array.isArray(stack?.deck) ? stack.deck.length : 0;
	const quest = stack?.faceUp ? getQuestDef(stack.faceUp) : null;
	if (!quest) return buildEmptyStack(stackId, left);
	// The tile reads card.failTokens to fill its 2 fail pips.
	const face = buildCardV1({ ...quest, cardId: quest.id, type: 'QUEST', failTokens: stack.tokens || 0 }, { fieldMode: true });
	if (!face) return buildEmptyStack(stackId, left);
	const name = escapeHtml(quest.name);
	const label = `${escapeHtml(STACK_LABEL[stackId])} Quest: ${name}, ${left} left`;
	return `<div class="quest-stack" ${stackAttrs(stackId, left, ` data-quest="${escapeHtml(quest.id)}"`)} role="button" tabindex="0" aria-label="${label}">
		<i class="quest-stack__edge quest-stack__edge--back"></i>
		<i class="quest-stack__edge quest-stack__edge--front"></i>
		<article class="card card--quest card--quest-general ${escapeHtml(face.className)}" data-card-id="${escapeHtml(quest.id)}" data-tier="${escapeHtml(face.dataTier)}" data-cv1-diamonds="${escapeHtml(face.diamonds)}">${face.html}</article>
		<div class="quest-stack__count">${left} left</div>
	</div>`;
}

export function buildQuestStacksHtml(questStacks) {
	return QUEST_STACK_IDS.map((stackId) => buildStack(stackId, questStacks?.[stackId])).join('');
}
