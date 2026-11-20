// buildChipHtml.js — one chip (button or span) as escaped HTML. Colours only come from CHIP_KINDS.
import { escapeHtml } from '../cardV1/escapeHtml.js';
import { CHIP_KINDS } from './chipKinds.js';

const MAX_LABEL = 14;
const DATA_KEY = /^[a-z0-9-]+$/;

export function buildChipHtml({ label = '', kind, title, data, interactive = false } = {}) {
  const kindKey = Object.prototype.hasOwnProperty.call(CHIP_KINDS, kind) ? kind : 'neutral';
  const colours = CHIP_KINDS[kindKey];
  const full = String(label);
  const shown = full.length > MAX_LABEL ? `${full.slice(0, MAX_LABEL - 1)}…` : full;
  const tip = escapeHtml(title == null ? full : title);
  const dataAttrs = Object.keys(data || {})
    .filter(k => DATA_KEY.test(k))
    .map(k => ` data-${k}="${escapeHtml(data[k])}"`)
    .join('');
  const tag = interactive ? 'button' : 'span';
  const extra = interactive ? ' type="button" tabindex="0"' : '';
  const style = `--chip-main:${colours.main};--chip-tint:${colours.tint}`;
  return `<${tag} class="chip chip--${kindKey}"${extra} title="${tip}" aria-label="${tip}" style="${style}"${dataAttrs}>${escapeHtml(shown)}</${tag}>`;
}
