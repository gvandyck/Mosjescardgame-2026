// Dev-only: single-line JS literal for plain data (strings via JSON.stringify).
export function toJsLiteral(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(toJsLiteral).join(', ')}]`;
  if (value && typeof value === 'object') {
    const parts = Object.entries(value).map(([k, v]) => {
      if (!/^([A-Za-z_$][\w$]*|\d+)$/.test(k)) throw new Error(`toJsLiteral: non-identifier key ${k}`);
      return `${k}: ${toJsLiteral(v)}`;
    });
    return parts.length ? `{ ${parts.join(', ')} }` : '{}';
  }
  throw new Error(`toJsLiteral: unsupported value ${String(value)}`);
}
