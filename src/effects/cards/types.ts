export interface DrawCardsParams {
  readonly playerId: string;
  readonly count: number;
}

export interface DiscardCardsParams {
  readonly playerId: string;
  readonly count: number;
  readonly mode: "choose" | "random";
  readonly chosenCardIds?: ReadonlyArray<string>;
}

export interface RevealTopDeckParams {
  readonly playerId: string;
  readonly targetDeckOwner: string;
  readonly count: number;
}

export interface LookAtTopParams {
  readonly playerId: string;
  readonly targetDeckOwner: string;
  readonly count: number;
}

export interface CardFilter {
  readonly byType?: string;
  readonly byName?: string;
  readonly byCost?: number;
}

export interface SearchDeckAndDrawParams {
  readonly playerId: string;
  readonly filter: CardFilter;
}

export interface ReturnToHandParams {
  readonly playerId: string;
  readonly zone: "discard" | "welloe";
  readonly cardId: string;
}
