export interface BuffTargetRef {
  readonly playerId: string;
  readonly instanceId?: string;
}

export interface ApplyBuffParams {
  readonly target: BuffTargetRef;
  readonly buffId: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly expiryTurn: number;
}

export interface ReduceMPLossByParams {
  readonly target: { readonly playerId: string; readonly instanceId: string };
  readonly amount: number;
  readonly duration: number;
}

export interface NegateEffectParams {
  readonly pendingEffectId: string;
}
