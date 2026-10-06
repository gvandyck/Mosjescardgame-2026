// enableArtDrag.js — drag the art inside its window to change object-position.
// onChange(focusString) fires while dragging, onDone(focusString) on release.
export function parseFocus(focus) {
  const m = /^(-?[\d.]+)%\s+(-?[\d.]+)%$/.exec(String(focus || '').trim());
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 };
}

export const formatFocus = ({ x, y }) => `${Math.round(x * 10) / 10}% ${Math.round(y * 10) / 10}%`;
const clamp = (n) => Math.min(100, Math.max(0, n));

export function enableArtDrag(card, startFocus, { onChange, onDone }) {
  const img = card.querySelector('.cv1-art');
  const win = img?.parentElement;
  if (!img || !win) return;
  let start = null;
  win.addEventListener('pointerdown', (e) => {
    const box = win.getBoundingClientRect();
    const scale = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
    start = {
      x: e.clientX, y: e.clientY, focus: parseFocus(img.style.objectPosition || startFocus),
      overflowX: img.naturalWidth * scale - box.width, overflowY: img.naturalHeight * scale - box.height,
    };
    win.setPointerCapture(e.pointerId);
    win.classList.add('dragging');
    e.preventDefault();
  });
  win.addEventListener('pointermove', (e) => {
    if (!start) return;
    const next = {
      x: start.overflowX > 0.5 ? clamp(start.focus.x - ((e.clientX - start.x) / start.overflowX) * 100) : start.focus.x,
      y: start.overflowY > 0.5 ? clamp(start.focus.y - ((e.clientY - start.y) / start.overflowY) * 100) : start.focus.y,
    };
    img.style.objectPosition = formatFocus(next);
    onChange(formatFocus(next));
  });
  const finish = () => {
    if (!start) return;
    start = null;
    win.classList.remove('dragging');
    onDone(img.style.objectPosition || startFocus);
  };
  win.addEventListener('pointerup', finish);
  win.addEventListener('pointercancel', finish);
}
