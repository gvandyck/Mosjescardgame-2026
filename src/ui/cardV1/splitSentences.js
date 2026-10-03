// splitSentences.js — split card text into display lines at sentence breaks.
// Formatting only: every character of the original text is kept, in order.
// A break is whitespace that follows ". ", "! " or "? " and precedes an
// upper-case letter, a digit, "+" or an opening bracket/quote. Text inside
// brackets "(...)" is never split, so "(Level 1+ only)" stays attached.
export function splitSentences(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    let depth = 0;
    let start = 0;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      const atBreak = depth === 0 && /[.!?]/.test(ch) && line[i + 1] === ' ';
      if (atBreak) {
        const rest = line.slice(i + 2);
        if (/^[A-Z0-9+("'\[]/.test(rest)) {
          out.push(line.slice(start, i + 1));
          start = i + 2;
        }
      }
    }
    out.push(line.slice(start));
  }
  return out;
}
