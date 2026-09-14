import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT, layoutDocument, leafOrder, parseBracket } from '../src/index.js';

const SRC = `bracket
Ac/Pur
  Ac   1
  *Pur S
    2
    3
4
`;

describe('layoutDocument', () => {
  const doc = parseBracket(SRC);
  const heights = new Map([
    ['1', 10],
    ['2', 40],
    ['3', 10],
    ['4', 10],
  ]);
  const layout = layoutDocument(doc, heights);
  const cfg = DEFAULT_LAYOUT;

  it('orders rows depth-first and stacks them vertically', () => {
    expect(leafOrder(doc.items)).toEqual(['1', '2', '3', '4']);
    expect(layout.rows.map((r) => r.ref)).toEqual(['1', '2', '3', '4']);
    expect(layout.rows[0]!.y).toBe(layout.tableY);
    expect(layout.rows[1]!.y).toBe(layout.rows[0]!.y + layout.rows[0]!.height);
    expect(layout.rows[1]!.height).toBe(40 + 2 * cfg.cellPadding);
    expect(layout.rows[0]!.height).toBe(cfg.fontSize * 2);
  });

  it('places nested bracket bars one step further right', () => {
    const outer = layout.brackets.find((b) => b.rel === 'Ac/Pur')!;
    const inner = layout.brackets.find((b) => b.rel === 'S')!;
    expect(inner.x - outer.x).toBe(cfg.bracketStep);
    expect(outer.x).toBe(cfg.padding);
  });

  it('attaches a parent arm at the midpoint of the child bar and labels arms', () => {
    const outer = layout.brackets.find((b) => b.rel === 'Ac/Pur')!;
    const inner = layout.brackets.find((b) => b.rel === 'S')!;
    expect(outer.arms).toHaveLength(2);
    expect(outer.arms[1]!.y).toBe((inner.y1 + inner.y2) / 2);
    expect(outer.arms[1]!.x2).toBe(inner.x);
    expect(outer.arms[1]).toMatchObject({ label: 'Pur', star: true });
    expect(outer.arms[0]).toMatchObject({ label: 'Ac', star: false });
    expect(outer.label).toBeUndefined();
    expect(inner.label).toBe('S');
  });

  it('centres leaf arms on their row and ends them before the ref column', () => {
    const inner = layout.brackets.find((b) => b.rel === 'S')!;
    const row2 = layout.rows[1]!;
    expect(inner.arms[0]!.y).toBe(row2.y + row2.height / 2);
    expect(inner.arms[0]!.x2).toBeLessThan(layout.refX);
  });

  it('sizes the diagram to fit the table', () => {
    expect(layout.width).toBe(layout.tableX + cfg.columnWidth + cfg.padding);
    const last = layout.rows[3]!;
    expect(layout.height).toBe(last.y + last.height + cfg.padding);
  });

  it('draws only end arms on coordinate brackets by default, but keeps arms to nested brackets', () => {
    const src = `bracket
S
  1
  2
  G
    3
    G 4
  5
`;
    const d = parseBracket(src);
    const ends = layoutDocument(d, new Map());
    const s = ends.brackets.find((b) => b.rel === 'S')!;
    expect(s.arms[0]!.y).toBe(s.y1);
    expect(s.arms[2]!.y).toBe(s.y2);
    expect(s.arms).toHaveLength(3); // rows 1 and 5, plus the nested G bracket
    expect(s.arms[1]!.x2).toBe(ends.brackets.find((b) => b.rel === 'G')!.x);

    const all = layoutDocument(d, new Map(), { ...DEFAULT_LAYOUT, coordinateArms: 'all' });
    expect(all.brackets.find((b) => b.rel === 'S')!.arms).toHaveLength(4);
    // Subordinate brackets always keep every arm.
    expect(ends.brackets.find((b) => b.rel === 'G')!.arms).toHaveLength(2);
  });
});

describe('arm attachment', () => {
  it('attaches a parent arm at the child bracket\'s starred arm when one exists', () => {
    const d = parseBracket(`bracket
G
  * S
    * 1
    2
    3
  G 4
`);
    const l = layoutDocument(d, new Map());
    const g = l.brackets.find((b) => b.rel === 'G')!;
    const s = l.brackets.find((b) => b.rel === 'S')!;
    const row1 = l.rows.find((r) => r.ref === '1')!;
    expect(g.arms[0]!.y).toBe(row1.y + row1.height / 2);
    expect(g.arms[0]!.y).not.toBe((s.y1 + s.y2) / 2);
    expect(g.arms[0]!.toBracket).toBe(true);
    expect(g.arms[1]!.toBracket).toBe(false);
  });
});

describe('bar label placement', () => {
  it('puts a coordinate label in the widest gap between arms', () => {
    const d = parseBracket(`bracket
S
  1
  2
  3
`);
    const heights = new Map([
      ['1', 10],
      ['2', 10],
      ['3', 200],
    ]);
    const l = layoutDocument(d, heights, { ...DEFAULT_LAYOUT, coordinateArms: 'all' });
    const s = l.brackets[0]!;
    const [a1, a2, a3] = s.arms.map((a) => a.y) as [number, number, number];
    expect(a3 - a2).toBeGreaterThan(a2 - a1);
    expect(s.labelY).toBe((a2 + a3) / 2);
  });
});

describe('fontSize', () => {
  it('scales minimum row height, header and title with the font size', () => {
    const d = parseBracket('bracket\ncolumns A\nS\n  1\n  2\n1: a\n2: b\n');
    const small = layoutDocument({ ...d, title: 't' }, new Map(), { ...DEFAULT_LAYOUT, fontSize: 13 });
    const big = layoutDocument({ ...d, title: 't' }, new Map(), { ...DEFAULT_LAYOUT, fontSize: 26 });
    expect(big.rows[0]!.height).toBe(52);
    expect(small.rows[0]!.height).toBe(26);
    expect(big.tableY - DEFAULT_LAYOUT.padding).toBe(2 * (small.tableY - DEFAULT_LAYOUT.padding));
  });
});
