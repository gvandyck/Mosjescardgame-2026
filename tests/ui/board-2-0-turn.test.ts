// Phase 63-07: the pure helpers behind End Turn, the cooldown copy and the reaction prompt
// (63-UI-SPEC "End Turn" + "Reaction prompt", D-11, D-19, D-20, UI-05).
import { describe, it, expect } from 'vitest';
// @ts-expect-error JS module without type declarations
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-expect-error JS module without type declarations
import { mkSlot } from '../helpers/quest56.js';
// @ts-expect-error JS module without type declarations
import { countActionsLeft } from '../../src/ui/board/countActionsLeft.js';
// @ts-expect-error JS module without type declarations
import { confirmEndTurn } from '../../src/ui/board/confirmEndTurn.js';
// @ts-expect-error JS module without type declarations
import { renderEndTurnButton } from '../../src/ui/board/renderEndTurnButton.js';
// @ts-expect-error JS module without type declarations
import { describeReactionContext } from '../../src/ui/board/describeReactionContext.js';
// @ts-expect-error JS module without type declarations
import { promptReaction } from '../../src/ui/actions/promptReaction.js';
// @ts-expect-error JS module without type declarations
import { initModalManager } from '../../src/ui/modalManager.js';
// @ts-expect-error JS module without type declarations
import { pickStatusMessage } from '../../src/ui/board/pickStatusMessage.js';
// @ts-expect-error JS module without type declarations
import { COOLDOWN_TEXT } from '../../src/ui/board/cooldownText.js';
// @ts-expect-error JS module without type declarations
import { getPower } from '../../src/engine/mp/getPower.js';

const stacks = () => {
	const o: any = {};
	for (const id of ['FIGHTING', 'DIGITAL', 'ARTISTIC']) o[id] = { deck: [], faceUp: id === 'FIGHTING' ? 'quest_tough_it_out' : null, tokens: 0, discard: [] };
	return o;
};
const board = (mine: any[], theirs: any[], over: any = {}) => makeEngineState({
	questStacks: stacks(),
	players: { player_1: { activeSlots: mine }, player_2: { activeSlots: theirs } },
	...over,
});
const foe = () => [mkSlot({ mp: 40 }), null];

describe('countActionsLeft (D-11)', () => {
	it('counts every own Mosje that can still attack or Quest', () => {
		expect(countActionsLeft(board([mkSlot({ mp: 40 }), mkSlot({ mp: 40 })], foe()), 'player_1')).toBe(2);
		expect(countActionsLeft(board([mkSlot({ mp: 40 }), null], foe()), 'player_1')).toBe(1);
		expect(countActionsLeft(board([null, null], foe()), 'player_1')).toBe(0);
	});

	it('a Mosje that already acted no longer counts, so a fully spent board is 0', () => {
		expect(countActionsLeft(board([mkSlot({ mp: 40, actedThisTurn: true }), mkSlot({ mp: 40 })], foe()), 'player_1')).toBe(1);
		expect(countActionsLeft(board([mkSlot({ mp: 40, actedThisTurn: true }), mkSlot({ mp: 40, actedThisTurn: true })], foe()), 'player_1')).toBe(0);
	});

	it('a fresh Mosje still counts (it can Quest) and a sideways one does not (it cannot act)', () => {
		expect(countActionsLeft(board([mkSlot({ mp: 40, entryProtected: true }), null], foe()), 'player_1')).toBe(1);
		expect(countActionsLeft(board([mkSlot({ mp: 40, sideways: true }), null], foe()), 'player_1')).toBe(0);
	});

	it('is 0 off-turn, on a cooldown turn and in a finished game', () => {
		const mine = () => [mkSlot({ mp: 40 }), mkSlot({ mp: 40 })];
		expect(countActionsLeft(board(mine(), foe(), { activePlayerId: 'player_2' }), 'player_1')).toBe(0);
		const cooling = board(mine(), foe());
		cooling.players.player_1.cooldownTurn = true;
		expect(countActionsLeft(cooling, 'player_1')).toBe(0);
		expect(countActionsLeft(board(mine(), foe(), { status: 'FINISHED' }), 'player_1')).toBe(0);
	});

	it('counts a Mosje that can only Quest (no legal attack target) and drops one with neither option', () => {
		const noTarget = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40, entryProtected: true }), null]);
		expect(countActionsLeft(noTarget, 'player_1')).toBe(1); // the Quest is still open
		const nothing = board([mkSlot({ mp: 40 }), null], [mkSlot({ mp: 40, entryProtected: true }), null], { questStacks: { FIGHTING: { deck: [], faceUp: null, tokens: 0, discard: [] }, DIGITAL: { deck: [], faceUp: null, tokens: 0, discard: [] }, ARTISTIC: { deck: [], faceUp: null, tokens: 0, discard: [] } } });
		expect(countActionsLeft(nothing, 'player_1')).toBe(0);
	});

	it('handles a missing state without throwing', () => {
		expect(countActionsLeft(null, 'player_1')).toBe(0);
		expect(countActionsLeft({}, 'player_1')).toBe(0);
	});
});

describe('confirmEndTurn (D-11)', () => {
	const modalWith = (answer: string | null) => {
		const calls: any[] = [];
		return { calls, showOptionSelect: async (cfg: any) => { calls.push(cfg); return answer; } };
	};

	it('ends at once, without any modal, when no Mosje can act', async () => {
		const modal = modalWith('keep');
		expect(await confirmEndTurn(modal, 0)).toBe(true);
		expect(modal.calls).toHaveLength(0);
	});

	it("asks 'A Mosje can still act: end turn anyway?' with End turn / Keep playing in big rows, no cancel", async () => {
		const modal = modalWith('end');
		expect(await confirmEndTurn(modal, 2)).toBe(true);
		expect(modal.calls).toHaveLength(1);
		expect(modal.calls[0]).toMatchObject({ title: 'End turn?', prompt: 'A Mosje can still act: end turn anyway?', variant: 'reaction', allowCancel: false });
		expect(modal.calls[0].options).toEqual([{ id: 'end', label: 'End turn' }, { id: 'keep', label: 'Keep playing' }]);
	});

	it('Keep playing (or a dismissed modal) does not end the turn', async () => {
		expect(await confirmEndTurn(modalWith('keep'), 1)).toBe(false);
		expect(await confirmEndTurn(modalWith(null), 1)).toBe(false);
	});
});

// A tiny stand-in for the button DOM: children as plain objects, textContent = '' clears them.
function fakeButton() {
	const children: any[] = [];
	const button: any = {
		dataset: {} as Record<string, string>,
		children,
		appendChild: (c: any) => { children.push(c); },
		querySelector: (sel: string) => children.find((c) => `.${c.className}` === sel) ?? null,
	};
	Object.defineProperty(button, 'textContent', { set: (v: string) => { if (v === '') children.length = 0; }, get: () => children.map((c) => c.textContent).join(' ') });
	return button;
}

describe('renderEndTurnButton (D-11)', () => {
	const withDom = (fn: () => void) => {
		const g: any = globalThis;
		const had = 'document' in g;
		const before = g.document;
		g.document = { createElement: () => ({ className: '', textContent: '' }) };
		try { fn(); } finally { if (had) g.document = before; else delete g.document; }
	};

	it('writes the label, the data-actions-left count and the plural hint', () => {
		withDom(() => {
			const b = fakeButton();
			renderEndTurnButton(b, 2);
			expect(b.dataset.actionsLeft).toBe('2');
			expect(b.children.map((c: any) => c.textContent)).toEqual(['End Turn', '2 actions left']);
		});
	});

	it("says '1 action left' for one and shows no hint at 0", () => {
		withDom(() => {
			const b = fakeButton();
			renderEndTurnButton(b, 1);
			expect(b.children[1].textContent).toBe('1 action left');
			renderEndTurnButton(b, 0);
			expect(b.dataset.actionsLeft).toBe('0');
			expect(b.children.map((c: any) => c.textContent)).toEqual(['End Turn']);
		});
	});

	it('leaves the DOM alone when nothing changed, and tolerates a missing button', () => {
		withDom(() => {
			const b = fakeButton();
			renderEndTurnButton(b, 3);
			const first = b.children[1];
			renderEndTurnButton(b, 3);
			expect(b.children[1]).toBe(first);
			expect(() => renderEndTurnButton(null, 1)).not.toThrow();
		});
	});
});

describe('cooldown copy (D-19)', () => {
	it('the status strip and the greyed hand share one sentence', () => {
		const s = board([mkSlot({ mp: 40 }), null], foe());
		s.players.player_1.cooldownTurn = true;
		expect(pickStatusMessage(s, 'player_1')).toEqual({ kind: 'cooldown', text: COOLDOWN_TEXT });
		expect(COOLDOWN_TEXT).toBe('Cooldown turn: you can only place face-down Piecies');
	});
});

describe('describeReactionContext (D-20, U6)', () => {
	const named = (name: string, over: any = {}) => { const s = mkSlot({ mp: 50, ...over }); s.name = name; return s; };
	const attackWindow = (preview: any = { getemt: [], toWelloe: false, mpLoss: {} }, targetSlot = 0) => {
		const s = board([named('Binti, The Maker'), null], [named('Alyssa, The Bulldozer', { level: 2 }), null], { activePlayerId: 'player_2' });
		s.pendingReaction = {
			moments: ['attacked'], responderId: 'player_1', actorId: 'player_2', eligible: ['snelle_the_protector'], preview,
			action: { type: 'attack', args: ['player_2', { attackerSlotIndex: 0, targetPlayerId: 'player_1', targetSlotIndex: targetSlot }] },
		};
		return s;
	};

	it("an attack window reads '<attacker> attacks <target>: −n MP' with first names", () => {
		const s = attackWindow({ getemt: [], toWelloe: false, mpLoss: { 0: 30 } });
		expect(describeReactionContext(s)).toBe('Alyssa attacks Binti: −30 MP');
	});

	it("uses the window's preview loss for the target's slot when it has one", () => {
		expect(describeReactionContext(attackWindow({ getemt: [], toWelloe: false, mpLoss: { 0: 20 } }))).toMatch(/−20 MP$/);
	});

	it("falls back to the attacker's live Power when the preview has no loss for the target", () => {
		const s = attackWindow();
		const power = getPower(s.players.player_2.activeSlots[0], s, 'player_2');
		expect(describeReactionContext(s)).toBe(`Alyssa attacks Binti: −${power} MP`);
	});

	it('any other window, a missing window or a vanished Mosje gives an empty line', () => {
		const other = attackWindow();
		other.pendingReaction.action = { type: 'activatePiecie', args: ['player_2', 0] };
		expect(describeReactionContext(other)).toBe('');
		expect(describeReactionContext(board([mkSlot()], foe()))).toBe('');
		expect(describeReactionContext(null)).toBe('');
		const gone = attackWindow();
		gone.players.player_1.activeSlots[0] = null;
		expect(describeReactionContext(gone)).toBe('');
	});
});

describe('promptReaction (D-20, U6)', () => {
	const modalFor = (answer: string | null) => {
		const calls: any[] = [];
		return { calls, showOptionSelect: async (cfg: any) => { calls.push(cfg); return answer; } };
	};
	const attacked = () => {
		const s = board([mkSlot({ mp: 50 }), null], [mkSlot({ mp: 50 }), null], { activePlayerId: 'player_2' });
		s.players.player_2.activeSlots[0].name = 'Alyssa, The Bulldozer';
		s.players.player_1.activeSlots[0].name = 'Binti, The Maker';
		s.pendingReaction = {
			moments: ['attacked'], responderId: 'player_1', actorId: 'player_2', eligible: ['snelle_the_protector'], preview: { getemt: [], toWelloe: false, mpLoss: { 0: 30 } },
			action: { type: 'attack', args: ['player_2', { attackerSlotIndex: 0, targetPlayerId: 'player_1', targetSlotIndex: 0 }] },
		};
		return s;
	};

	it('shows the attack line, the Snelle as <Name> · N Energy, and a No reaction row, in the reaction variant', async () => {
		const modal = modalFor('__pass__');
		const out = await promptReaction(modal, attacked(), 'player_1');
		expect(out).toBeNull();
		const cfg = modal.calls[0];
		expect(cfg).toMatchObject({ title: 'Reaction', prompt: 'Alyssa attacks Binti: −30 MP', variant: 'reaction', allowCancel: false });
		expect(cfg.options[0].label).toMatch(/^The Protector · \d+ Energy$/);
		expect(cfg.options[0].metaLabel.length).toBeGreaterThan(0);
		expect(cfg.options[cfg.options.length - 1]).toEqual({ id: '__pass__', label: 'No reaction' });
		expect(cfg.options.some((o: any) => o.label === 'Pass')).toBe(false);
	});

	it('returns the chosen Snelle id, and null for No reaction or a dismissed prompt', async () => {
		expect(await promptReaction(modalFor('snelle_the_protector'), attacked(), 'player_1')).toBe('snelle_the_protector');
		expect(await promptReaction(modalFor(null), attacked(), 'player_1')).toBeNull();
	});

	it('a window that is not an attack keeps the moment question as its prompt', async () => {
		const s = attacked();
		s.pendingReaction.moments = ['afterQuestRoll'];
		s.pendingReaction.action = { type: 'playSnelle', args: [] };
		const modal = modalFor('__pass__');
		await promptReaction(modal, s, 'player_1');
		expect(modal.calls[0].prompt).toBe('Your opponent just rolled a Quest. Play a Snelle?');
	});

	it('T-63-11: a hostile Mosje name reaches the real option modal as text, never as markup', async () => {
		const evil = '<img src=x onerror=alert(1)>';
		const s = attacked();
		s.players.player_2.activeSlots[0].name = `${evil}, The Evil`;
		const container: any = { innerHTML: '', classList: { add() {}, remove() {} }, querySelectorAll: () => [], querySelector: () => null };
		const modal = initModalManager(container);
		void promptReaction(modal, s, 'player_1'); // stays open until a row is tapped: only the markup matters here
		expect(container.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt; attacks');
		expect(container.innerHTML).not.toContain('<img');
	});
});

describe('showOptionSelect variant (D-20)', () => {
	const open = (config: any) => {
		const container: any = { innerHTML: '', classList: { add() {}, remove() {} }, querySelectorAll: () => [], querySelector: () => null };
		void initModalManager(container).showOptionSelect({ title: 'T', options: [{ id: 'a', label: 'A' }], ...config });
		return container.innerHTML as string;
	};

	it('adds modal-card--<variant> to the card and changes nothing else', () => {
		const plain = open({});
		const reaction = open({ variant: 'reaction' });
		expect(plain).toContain('<section class="modal-card" role="dialog"');
		expect(reaction).toContain('<section class="modal-card modal-card--reaction" role="dialog"');
		expect(reaction.replace(' modal-card--reaction', '')).toBe(plain);
	});

	it('strips anything but letters, digits and dashes from the variant name', () => {
		expect(open({ variant: 'x" onclick="boom' })).toContain('class="modal-card modal-card--xonclickboom"');
	});
});
