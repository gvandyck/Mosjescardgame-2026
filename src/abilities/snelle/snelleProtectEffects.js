// snelleProtectEffects - Card List 2.0 reaction Snelle that shrink a loss or stop a Welloe (Phase 60). Effects: (state, playerId, ctx).
// They only queue one-shot entries on state.reactionMods; the held action then replays and the loss pipeline (§2g) consumes them.
import { loseMP } from '../../engine/mpManager.js';
import { addReactionMod } from '../../engine/reactions/addReactionMod.js';
import { pickMosje, clearPicks } from './pickMosje.js';

const clone = (s) => JSON.parse(JSON.stringify(s));
const stars = (slot, trait) => slot?.traits?.[trait] || 0;

// Slots of the responder that the open window says are about to lose MP (or die).
function threatenedSlots(reaction) {
	const p = reaction?.preview;
	return p ? [...new Set([...Object.keys(p.mpLoss || {}).map(Number), ...(p.getemt || [])])] : [];
}

// Pick one threatened Mosje, then run `apply(state, slot)`; { state, needChoice } while the player still has to pick.
function onThreatened(gameState, pid, ctx, key, prompt, apply, filter = () => true) {
	const state = clone(gameState);
	const slots = threatenedSlots(ctx?.reaction);
	const pick = pickMosje(state, pid, key, 'own', prompt, (m, i) => slots.includes(i) && filter(m, i));
	if (pick.none) return state;
	if (pick.needChoice) return { state, needChoice: pick.needChoice };
	const out = apply(state, state.players[pid].activeSlots[pick.slot.slotIndex], pick.slot.slotIndex);
	clearPicks(state, pid, key);
	return out || state;
}

const reduce = (pid, slotIndex, amount) => ({ kind: 'reduce', playerId: pid, slotIndex, amount });

export function effect_snelle_emergency_healings(gameState, pid, ctx = {}) {
	return onThreatened(gameState, pid, ctx, 'heal_slot', 'Emergency Healings: which Mosje gains MP first?', (state, slot, i) => {
		addReactionMod(state, { kind: 'gainFirst', playerId: pid, slotIndex: i, amount: stars(slot, 'resilient') >= 2 ? 35 : 25 });
	});
}

export function effect_snelle_the_protector(gameState, pid, ctx = {}) {
	return onThreatened(gameState, pid, ctx, 'protector_slot', 'The Protector: which Mosje loses 30 less?', (state, _slot, i) => {
		addReactionMod(state, reduce(pid, i, 30));
	});
}

// Perfect Dodge: the attacked Mosje (Needs Physical 2) loses 20 less, Physical 3: 30 less.
export function effect_snelle_perfect_dodge(gameState, pid, ctx = {}) {
	const state = clone(gameState);
	const target = ctx.reaction?.action?.args?.[1];
	const slot = target && target.targetPlayerId === pid ? state.players[pid].activeSlots[target.targetSlotIndex] : null;
	if (!slot) return state;
	addReactionMod(state, reduce(pid, target.targetSlotIndex, stars(slot, 'physical') >= 3 ? 30 : 20));
	return state;
}

// Drain Reversal: the threatened Mosje loses 20 less and one opponent Mosje loses a fixed 10.
export function effect_snelle_drain_reversal(gameState, pid, ctx = {}) {
	const slots = threatenedSlots(ctx?.reaction);
	let state = clone(gameState);
	const own = pickMosje(state, pid, 'reversal_own', 'own', 'Drain Reversal: which Mosje loses 20 less?', (m, i) => slots.includes(i));
	if (own.needChoice) return { state, needChoice: own.needChoice };
	const opp = pickMosje(state, pid, 'reversal_opp', 'opp', 'Drain Reversal: which opponent Mosje loses 10 MP?');
	if (opp.needChoice) return { state, needChoice: opp.needChoice };
	clearPicks(state, pid, 'reversal_own', 'reversal_opp');
	if (own.slot) addReactionMod(state, reduce(pid, own.slot.slotIndex, 20));
	if (opp.slot) state = loseMP(state, opp.slot.playerId, opp.slot.slotIndex, 10, 'SNELLE', false, pid);
	return state;
}

// Not Today!: the Mosje about to go to the Welloe pile (a sideways one) stays, at 5 MP at least.
export function effect_snelle_negate_elimination(gameState, pid, ctx = {}) {
	return onThreatened(gameState, pid, ctx, 'save_slot', 'Not Today!: which Mosje stays out of the Welloe pile?', (state, _slot, i) => {
		addReactionMod(state, { kind: 'save', playerId: pid, slotIndex: i });
	}, (m) => m.sideways === true);
}
