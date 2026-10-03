// fitFirstName.js — font size (reference px) so a first name fits on one line.
// 40px by default; long names shrink to a 24px minimum, never wrap or clip.
const AVAILABLE = 440 - 42 - 40;
const GLYPH = 0.64; // Sora 800 average glyph width, as a fraction of font size

export function fitFirstName(name, max = 40, min = 24) {
  const length = Math.max(1, String(name || '').length);
  const size = Math.floor((AVAILABLE / (length * GLYPH)) * 10) / 10;
  return Math.max(min, Math.min(max, size));
}
