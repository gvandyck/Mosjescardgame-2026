export interface EnterPlaceParams {
  readonly cardId: string;
  readonly playerId: string;
}

export interface DestroyPiecieParams {
  readonly target: {
    readonly playerId: string;
    readonly slotIndex: 0 | 1 | 2 | 3 | 4;
  };
}

export interface ActivateFaceDownPiecieParams {
  readonly playerId: string;
  readonly slotIndex: 0 | 1 | 2 | 3 | 4;
}
