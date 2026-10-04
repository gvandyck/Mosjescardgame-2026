// hideHoverPanel.js — remove the hover panel if one is showing.
export function hideHoverPanel() {
  document.querySelectorAll('.cv1-hover-panel').forEach((el) => el.remove());
}
