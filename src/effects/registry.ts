import type { Primitive } from "./primitive.js";
import { gainMP, loseMP, drainMP, setMP, multiplyNextMPGain } from "./mp/index.js";
import {
  drawCards,
  discardCards,
  revealTopDeck,
  lookAtTop,
  searchDeckAndDraw,
  returnToHand
} from "./cards/index.js";
import { destroyPlace, enterPlace, destroyPiecie, activateFaceDownPiecie } from "./board/index.js";
import { rollDie, rerollDie, chooseDieResult } from "./dice/index.js";
import { applyBuff, reduceMPLossBy, clearExpiredBuffs, negateEffect } from "./buffs/index.js";
import { ifThenElse, chain, choose, rollBranch } from "./control/index.js";

export const primitiveRegistry: Record<string, Primitive> = {
  gainMP,
  loseMP,
  drainMP,
  setMP,
  multiplyNextMPGain,
  drawCards,
  discardCards,
  revealTopDeck,
  lookAtTop,
  searchDeckAndDraw,
  returnToHand,
  destroyPlace,
  enterPlace,
  destroyPiecie,
  activateFaceDownPiecie,
  rollDie,
  rerollDie,
  chooseDieResult,
  applyBuff,
  reduceMPLossBy,
  clearExpiredBuffs,
  negateEffect,
  ifThenElse,
  chain,
  choose,
  rollBranch
};

export function resolvePrimitive(name: string): Primitive {
  const primitive = primitiveRegistry[name];
  if (primitive === undefined) {
    throw new Error(`Unknown primitive: ${name}`);
  }
  return primitive;
}
