// fitFirstName.js — font size (reference px) so a first name fits on one line.
// 40px by default (the 2.0 face passes 36 / 22 / 280); long names shrink to the minimum, never wrap or clip.
// `available` is the width (reference px) the name may use.
const AVAILABLE = 440 - 42 - 40;
const GLYPH = 0.64; // Sora 800 average glyph width, as a fraction of font size

export function fitFirstName(name, max = 40, min = 24, available = AVAILABLE) {
  const length = Math.max(1, String(name || '').length);
  const size = Math.floor((available / (length * GLYPH)) * 10) / 10;
  return Math.max(min, Math.min(max, size));
}
