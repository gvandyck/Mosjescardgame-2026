// makePiecieState.js — engine state with one ready Piecie for player_1 (not a test file).
import { makeEngineState } from './makeEngineState.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';

const def = MOSJES.find((m) => m.id === 'mosje_gandoe_wizard');
const other = MOSJES.find((m) => m.id !== 'mosje_gandoe_wizard');

export function makePiecieState({ piecieId, own = {}, foe = {}, foeMod } = {}) {
  const mine = createMosjeSlot(def, { level: 1, mp: 50, ...own });
  mine.entryProtected = false;
  const theirs = createMosjeSlot(other, { level: 1, mp: 50, ...foe });
  theirs.entryProtected = false;
  if (foeMod) foeMod(theirs);
  return makeEngineState({
    turnNumber: 5,
    players: {
      player_1: {
        activeSlots: [mine, null],
        piecieSlots: [
          { cardId: piecieId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 },
          null, null, null,
        ],
      },
      player_2: { activeSlots: [theirs, null] },
    },
  });
}
