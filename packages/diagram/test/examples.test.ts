import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { layoutDocument, layoutSentence, parseBracket, parseSentence } from '../src/index.js';

const roots = [path.resolve(__dirname, '../../../examples'), path.resolve(__dirname, '../../../docs/reference')];
const files = roots.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f)),
);

/** Every ```mermaid block in examples/*.md must parse and lay out. Frontmatter is stripped as Mermaid would. */
describe('every diagram in examples/ and docs/reference/', () => {
  for (const file of files) {
    const blocks = [...readFileSync(file, 'utf8').matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]!);
    it(`${path.basename(path.dirname(file))}/${path.basename(file)} has ${blocks.length} parseable block(s)`, () => {
      // Reference pages may be prose only; fixtures in examples/ must carry at least one diagram.
      if (file.includes('/examples/')) expect(blocks.length).toBeGreaterThan(0);
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
