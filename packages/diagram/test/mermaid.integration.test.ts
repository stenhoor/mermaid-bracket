// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

/**
 * End-to-end check against the real Mermaid 11 API: register the external diagram,
 * then let Mermaid detect, parse and draw a `bracket` block. jsdom has no layout engine,
 * so row heights come from the renderer's estimate; geometry is not asserted here.
 */
describe('mermaid integration', () => {
  it('registers, detects and renders a bracket block through mermaid.render', async () => {
    const mermaid = (await import('mermaid')).default;
    const { bracketDiagram } = await import('../src/index.js');
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    await mermaid.registerExternalDiagrams([bracketDiagram], { lazyLoad: false });

    const src = `---
title: Colossians 3:5–11 (outline)
---
bracket
G
  * S
    5-7
    8
    9a
  G P
    9b
    * 10

5-7: Put to death what is earthly in you.
8: But now you must put them all away.
9a: Do not lie to one another,
9b: seeing that you have put off the old self
10: and have put on the new self.
`;
    expect(await mermaid.detectType(src)).toBe('bracket');
    const { svg } = await mermaid.render('bracket-test', src);
    expect(svg).toContain('bracket-diagram');
    expect(svg).toContain('Colossians 3:5–11 (outline)');
    expect((svg.match(/class="bracket-bar/g) ?? []).length).toBe(3);
    expect(svg).toContain('foreignObject');
    expect(svg).toContain('Put to death what is earthly in you.');
    expect(svg).toContain('★');
    // Default coordinateArms=ends: S (3 children) draws 2 arms, P and G draw 2 each.
    expect((svg.match(/class="bracket-arm/g) ?? []).length).toBe(6);

    // Options come from `config` lines in the body: Mermaid's sanitiser drops unknown frontmatter config keys.
    const all = await mermaid.render('bracket-test-all', src.replace('bracket\n', 'bracket\nconfig coordinateArms all\n'));
    expect((all.svg.match(/class="bracket-arm/g) ?? []).length).toBe(7);
  });

  it('does not claim other diagram types', async () => {
    const mermaid = (await import('mermaid')).default;
    // jsdom lacks getBBox, so built-in diagrams cannot render here; detection is enough.
    expect(await mermaid.detectType('flowchart LR\n a --> b')).toBe('flowchart-v2');
    expect(await mermaid.detectType('pie\n "a": 1')).toBe('pie');
    // Mermaid reports "no diagram type" by throwing; our detector must not claim this text.
    await expect(Promise.resolve().then(() => mermaid.detectType('bracketing is not a keyword\n'))).rejects.toThrow(
      /No diagram type detected/,
    );
  });
});

describe('cell formatting through mermaid (strict security level)', () => {
  it('keeps built-in inline formatting after DOMPurify', async () => {
    const mermaid = (await import('mermaid')).default;
    const { bracketDiagram } = await import('../src/index.js');
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    await mermaid.registerExternalDiagrams([bracketDiagram], { lazyLoad: false });
    const { svg } = await mermaid.render(
      'fmt-test',
      'bracket\n1: **bold** ==hi== one | two {three}\n',
    );
    expect(svg).toContain('<strong>bold</strong>');
    expect(svg).toContain('<mark>hi</mark>');
    expect(svg).toContain('class="bracket-bar"');
    expect(svg).toContain('class="bracket-bkt-mark"');
  });

  it('keeps Obsidian-style internal-link markup from a host formatter after DOMPurify', async () => {
    const mermaid = (await import('mermaid')).default;
    const { bracketDiagram, setCellFormatter } = await import('../src/index.js');
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    await mermaid.registerExternalDiagrams([bracketDiagram], { lazyLoad: false });
    setCellFormatter({
      format(text, ctx) {
        const p = ctx.ownerDoc.createElement('p');
        p.innerHTML = `<a data-href="Other note" href="Other note" class="internal-link" target="_blank" rel="noopener">${text}</a>`;
        return p;
      },
    });
    try {
      const { svg } = await mermaid.render('fmt-host-test', 'bracket\n1: linked\n');
      expect(svg).toContain('class="internal-link"');
      expect(svg).toContain('data-href="Other note"');
      expect(svg).toContain('href="Other note"');
    } finally {
      setCellFormatter(null);
    }
  });
});
