import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { layoutDocument, layoutSentence, parseBracket, parseSentence } from '../src/index.js';

const dir = path.resolve(__dirname, '../../../examples');
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));

/** Every ```mermaid block in examples/*.md must parse and lay out. Frontmatter is stripped as Mermaid would. */
describe('examples/*.md', () => {
  for (const file of files) {
    const blocks = [...readFileSync(path.join(dir, file), 'utf8').matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]!);
    it(`${file} has ${blocks.length} parseable block(s)`, () => {
      expect(blocks.length).toBeGreaterThan(0);
      for (const block of blocks) {
        const body = block.replace(/^---\n[\s\S]*?\n---\n/, '');
        if (/^\s*sentence\b/.test(body)) {
          const doc = parseSentence(body);
          const layout = layoutSentence(doc, (t) => t.length * 8);
          expect(layout.prims.length).toBeGreaterThan(0);
        } else {
          const doc = parseBracket(body);
          const layout = layoutDocument(doc, new Map());
          expect(layout.rows.length).toBe(doc.rows.size);
        }
      }
    });
  }
});
