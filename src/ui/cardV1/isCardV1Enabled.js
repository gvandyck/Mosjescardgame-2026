// isCardV1Enabled.js — card frame v1 is on by default; append ?cardv1=off to the
// URL to see the previous faces (coexistence until the redesign is approved).
export function isCardV1Enabled() {
  try {
    return new URLSearchParams(window.location.search).get('cardv1') !== 'off';
  } catch {
    return true;
  }
}
