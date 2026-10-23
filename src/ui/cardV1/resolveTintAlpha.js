// resolveTintAlpha.js — the frosted-box tint alpha, never below the contrast floor (unit-tested).
import { TEXTBOX_TINT_ALPHA, TINT_ALPHA_FLOOR } from './faceTokens.js';

export function resolveTintAlpha(alpha) {
  const a = Number(alpha);
  return Math.min(1, Math.max(TINT_ALPHA_FLOOR, Number.isFinite(a) ? a : TEXTBOX_TINT_ALPHA));
}
