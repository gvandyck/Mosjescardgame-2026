// needKinds - registry: Need kind name -> { check(ctx, need) -> { ok, reason?, picks? } }. Pure: reads the state only.
// ctx = { state, playerId, slotIndex (the Mosje), cardId (the card with the Needs), choice? }. Kinds live in kinds/.
import { placeInPlay } from './kinds/placeInPlay.js';
import { readyPiecie } from './kinds/readyPiecie.js';
import { mosjeMinMP } from './kinds/mosjeMinMP.js';
import { mosjeLostMPSinceLastTurnStart } from './kinds/mosjeLostMPSinceLastTurnStart.js';
import { mosjesOnField } from './kinds/mosjesOnField.js';
import { handSizeOther } from './kinds/handSizeOther.js';
import { opponentHandMax } from './kinds/opponentHandMax.js';

export const NEED_KINDS = Object.freeze({
	placeInPlay,
	readyPiecie,
	mosjeMinMP,
	mosjeLostMPSinceLastTurnStart,
	mosjesOnField,
	handSizeOther,
	opponentHandMax,
});
