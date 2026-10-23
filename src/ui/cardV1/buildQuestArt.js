// buildQuestArt.js — placeholder art for a 2.0 Quest with no real art (D-08): the window shows the stack colour
// with the seigaiha pattern (CSS) and this big die. Static inline SVG, no image file, nothing interpolated.
// Styling: styles/card-face-2-0.css (.cv2-quest-art).
export function buildQuestArt() {
  return '<i class="cv2-quest-art" aria-hidden="true"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" focusable="false">'
    + '<rect x="8" y="8" width="84" height="84" rx="18" fill="none" stroke="currentColor" stroke-width="6"/>'
    + '<circle cx="30" cy="30" r="7"/><circle cx="70" cy="30" r="7"/><circle cx="50" cy="50" r="7"/>'
    + '<circle cx="30" cy="70" r="7"/><circle cx="70" cy="70" r="7"/>'
    + '</svg></i>';
}
