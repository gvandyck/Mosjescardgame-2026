// Dev-only: read a markdown doc from docs/obby-2.0/ as LF text.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function readDoc(fileName) {
  const url = new URL(`../../docs/obby-2.0/${fileName}`, import.meta.url);
  return fs.readFileSync(fileURLToPath(url), 'utf8').replace(/\r/g, '');
}
