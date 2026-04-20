import type { MosjeRef } from "../../types/events.js";

export interface GainMPParams {
  readonly target: MosjeRef;
  readonly amount: number;
}

export interface LoseMPParams {
  readonly target: MosjeRef;
  readonly amount: number;
  readonly isCostPayment?: boolean;
}

export interface DrainMPParams {
  readonly from: MosjeRef;
  readonly to: MosjeRef;
  readonly amount: number;
}

export interface SetMPParams {
  readonly target: MosjeRef;
  readonly value: number;
}

export interface MultiplyNextMPGainParams {
  readonly target: MosjeRef;
  readonly multiplier: number;
  readonly duration: "next_gain" | "this_turn";
}
