// snelleCancelEffects - Jensen!, Frenssen!, Blensen!, Counter Strikka, Jammertje Gepakt! (Card List 2.0, Phase 60).
// They queue one-shot reactionMods entries on the window's held card: { kind: 'cancel', dest } / { kind: 'retarget', to }.
// The held action then replays (takeHeldMod in turnManager / resumePiecieChoice / resumeSnelleChoice). Energy stays spent.
import { loseMP } from '../../engine/mpManager.js';
import { addReactionMod } from '../../engine/reactions/addReactionMod.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { pickMosje, clearPicks } from './pickMosje.js';
import { counterStrikkaOptions } from './counterStrikkaOptions.js';

const clone = (s) => JSON.parse(JSON.stringify(s));
const HELD_CARDS = ['activatePiecie', 'activatePiecieFree', 'resumePiecie', 'playSnelle', 'resumeSnelle'];
const hasStars = (state, pid, trait, n) => (state.players[pid]?.activeSlots || []).some(s => s && !s.isDefeated && (s.traits?.[trait] || 0) >= n);
const cancelMod = (state, pid, actorId, dest) => addReactionMod(state, { kind: 'cancel', playerId: actorId, slotIndex: null, dest, by: pid });

// Jensen!: the opponent's Piecie or Snelle that targets your Mosje is cancelled (to its owner's discard pile).
export function effect_snelle_jensen(gameState, pid, ctx = {}) {
	const state = clone(gameState);
	state.jensenPlayedTurn = state.turnNumber;
	if (ctx.reaction?.actorId) cancelMod(state, pid, ctx.reaction.actorId, 'discard');
	return state;
}

// Frenssen!: cancels the Jensen! (the held card resolves) and one Mosje of the Jensen! player loses 10 MP.
export function effect_snelle_frenssen(gameState, pid) {
	let state = clone(gameState);
	const oppId = Object.keys(state.players).find(id => id !== pid);
	const pick = pickMosje(state, pid, 'frenssen_opp', 'opp', 'Frenssen!: which Mosje loses 10 MP?');
	if (pick.needChoice) return { state, needChoice: pick.needChoice };
	const mods = state.reactionMods || [];
	for (let i = mods.length - 1; i >= 0; i--) {
		if (mods[i].kind === 'cancel' && mods[i].by === oppId) { mods.splice(i, 1); break; }
	}
	state.jensenPlayedTurn = state.turnNumber;
	clearPicks(state, pid, 'frenssen_opp');
	if (pick.slot) state = loseMP(state, pick.slot.playerId, pick.slot.slotIndex, 10, 'SNELLE', false, pid);
	return state;
}

// Blensen!: until the end of the turn opponent cards can't target your Mosjes (attacks still can). In a targeted window
// the held card's hit fizzles too. The card stays in its slot until the end of the turn (data: stays 'endOfTurn').
export function effect_snelle_blensen(gameState, pid, ctx = {}) {
	const state = clone(gameState);
	state.blensenShield = { playerId: pid, turnNumber: state.turnNumber };
	const r = ctx.reaction;
	if (r?.actorId && r.moments?.includes('targeted') && HELD_CARDS.includes(r.action?.type)) cancelMod(state, pid, r.actorId, 'discard');
	return state;
}

// Counter Strikka (Needs Mental 2): the held card hits another Mosje it can legally target; Mental 3: also draw 1.
// A Piecie with chosen targets moves its pick (counterStrikkaOptions); a paused Snelle pick moves pc.key. A card with
// no other legal target can't be moved (the Energy is still spent).
export function effect_snelle_counter_strikka(gameState, pid, ctx = {}) {
	const state = clone(gameState);
	const held = ctx.reaction?.action;
	const actorId = ctx.reaction?.actorId;
	const pc = held?.type === 'resumeSnelle' && held.args?.[0]?.choiceKind === 'mosje' ? held.args[0] : null;
	const piecie = pc ? null : counterStrikkaOptions(state, pid, actorId, held);
	const key = pc ? pc.key : piecie?.key;
	const options = pc ? (pc.options || []).filter(o => JSON.stringify(o) !== JSON.stringify(state.players[pc.playerId]?._pendingTargets?.[pc.key])) : piecie?.options || [];
	if (key && options.length) {
		const given = state.players[pid]._pendingTargets?.counter_strikka_to;
		const to = options.length === 1 ? options[0] : options.find(o => given && o.playerId === given.playerId && o.slotIndex === given.slotIndex);
		if (!to) return { state, needChoice: { playerId: pid, key: 'counter_strikka_to', options, choiceKind: 'mosje', prompt: 'Counter Strikka: which Mosje is hit instead?' } };
		const value = key === 'any_target' ? { playerId: to.playerId, slotIndex: to.slotIndex } : to.slotIndex;
		addReactionMod(state, pc ? { kind: 'retarget', playerId: actorId, slotIndex: null, to } : { kind: 'retarget', playerId: actorId, slotIndex: null, key, value });
		clearPicks(state, pid, 'counter_strikka_to');
	}
	return hasStars(state, pid, 'mental', 3) ? drawFromEffect(state, pid, 1) : state;
}

// Jammertje Gepakt! (Needs Mental 2, Piecies only): the Piecie goes to the bottom of its owner's deck; Mental 3: also draw 1.
export function effect_snelle_jammertje_gepakt(gameState, pid, ctx = {}) {
	const state = clone(gameState);
	if (ctx.reaction?.actorId) cancelMod(state, pid, ctx.reaction.actorId, 'deckBottom');
	return hasStars(state, pid, 'mental', 3) ? drawFromEffect(state, pid, 1) : state;
}
