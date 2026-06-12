export interface RollDieParams {
  readonly modifier?: number;
}

export interface ChooseDieResultParams {
  readonly chosenValue: 1 | 2 | 3 | 4 | 5 | 6;
}
