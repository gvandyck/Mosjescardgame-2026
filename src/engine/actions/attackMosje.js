// attackMosje — "taksen": the attacker's Power is an MP loss on the target (can getemt).
import { withReactionWindow } from '../reactions/withReactionWindow.js';
import { hitOneTarget } from '../attack/hitOneTarget.js';
import { otherHitTarget } from '../attack/otherHitTarget.js';
import { checkVictory } from '../victoryChecker.js';
import { getPower } from '../mp/getPower.js';
import { isFresh } from '../fresh/isFresh.js';
import { canMosjeTakeAction } from './canMosjeTakeAction.js';
import { isValidAttackTarget } from './isValidAttackTarget.js';

export function attackMosje(state, playerId, params, opts = {}) {
  return withReactionWindow(state, playerId, { type: 'attack', args: [playerId, params], skipReactions: opts.skipReactions },
    (st) => attackCore(st, playerId, params));
}

function attackCore(state, playerId, { attackerSlotIndex, targetPlayerId, targetSlotIndex }) {
  const fail = (error) => ({ state, ok: false, error });
  const gate = canMosjeTakeAction(state, playerId, attackerSlotIndex);
  if (!gate.ok) return fail(gate.error);
  if (isFresh(state.players[playerId].activeSlots[attackerSlotIndex])) return fail('A fresh Mosje cannot attack');
  if (!isValidAttackTarget(state, playerId, targetPlayerId, targetSlotIndex)) return fail('Invalid attack target');

  let s = JSON.parse(JSON.stringify(state));
  const attacker = s.players[playerId].activeSlots[attackerSlotIndex];
  attacker.actedThisTurn = true;
  attacker.attackedThisTurn = true;
  const power = getPower(attacker, state, playerId);
  let final = 0;
  const hitBoth = attacker.hitBothOpponents === true; // Dikke Taks: its next attack this turn
  delete attacker.hitBothOpponents;
  if (power > 0) {
    const base = { attackerPlayerId: playerId, attackerSlotIndex, targetPlayerId, power };
    const first = hitOneTarget(s, { ...base, targetSlotIndex });
    s = first.state;
    final = first.final;
    const other = hitBoth ? otherHitTarget(s, targetPlayerId, targetSlotIndex) : -1;
    if (other >= 0) s = hitOneTarget(s, { ...base, targetSlotIndex: other }).state;
  }
  console.log(`[ATTACK] ${attacker.name} taksed ${s.players[targetPlayerId].activeSlots[targetSlotIndex]?.name} for ${final}`);
  s = checkVictory(s);
  return { state: s, ok: true, power, final };
}
