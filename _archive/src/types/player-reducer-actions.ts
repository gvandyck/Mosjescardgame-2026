import type { CardId } from "./card-id.js";
import type { EffectSource, MosjeRef } from "./events.js";

export interface DrawCardAction {
  readonly playerId: string;
}

export interface DiscardCardAction {
  readonly playerId: string;
  readonly cardId: CardId;
}

export interface PlayPiecieFaceDownAction {
  readonly playerId: string;
  readonly cardId: CardId;
  readonly slotIndex: 0 | 1 | 2 | 3 | 4;
}

export interface ActivatePiecieAction {
  readonly playerId: string;
  readonly slotIndex: 0 | 1 | 2 | 3 | 4;
  readonly isSnelle: boolean;
}

export interface SwitchActiveMosjeAction {
  readonly playerId: string;
}

export interface GainMPAction {
  readonly target: MosjeRef;
  readonly amount: number;
  readonly source: EffectSource;
}

export interface LoseMPAction {
  readonly target: MosjeRef;
  readonly amount: number;
  readonly source: EffectSource;
}

export interface LevelUpMosjeAction {
  readonly target: MosjeRef;
}
