/**
 * Regenerates the provenance for packages/diagram/src/morph.ts: downloads the MorphGNT SBLGNT
 * corpus and reports every part-of-speech value and every letter used in each of the eight parsing
 * positions, with occurrence counts. Run: node scripts/scan-morphgnt.mjs [path-to-sblgnt-checkout]
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/scan-morphgnt.mjs <path to a checkout of github.com/morphgnt/sblgnt>');
  process.exit(2);
}

const SLOTS = ['person', 'tense', 'voice', 'mood', 'case', 'number', 'gender', 'degree'];
const pos = new Map();
const slots = SLOTS.map(() => new Map());
let rows = 0;

const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

for (const file of readdirSync(dir).filter((f) => f.endsWith('-morphgnt.txt')).sort()) {
  for (const line of readFileSync(path.join(dir, file), 'utf8').split('\n')) {
    const parts = line.split(' ');
    if (parts.length < 7) continue;
    rows++;
    bump(pos, parts[1]);
    const code = parts[2];
    if (code.length !== 8) throw new Error(`unexpected code length in ${file}: ${code}`);
    [...code].forEach((ch, i) => {
      if (ch !== '-') bump(slots[i], ch);
    });
  }
}

console.log(`words: ${rows.toLocaleString()}`);
console.log('part of speech:', Object.fromEntries([...pos].sort()));
SLOTS.forEach((name, i) => console.log(`${name}:`, Object.fromEntries([...slots[i]].sort())));
