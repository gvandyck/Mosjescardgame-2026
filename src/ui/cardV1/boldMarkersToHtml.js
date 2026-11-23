// boldMarkersToHtml.js — card texts mark a bold lead with ** ("**Attach:** +10 Power."). Takes text that is ALREADY
// HTML-escaped and returns it with <b> around each marked part. Formatting only.
export function boldMarkersToHtml(escapedText) {
  return String(escapedText ?? '').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}
