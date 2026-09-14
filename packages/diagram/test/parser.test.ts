import { describe, expect, it } from 'vitest';
import { BracketParseError, parseBracket } from '../src/index.js';

const COL_1_21_23 = `bracket
columns NA28, ESV

Ac/Pur
  Ac   21-22a
  *Pur If/Th
    Th   22b
    If   G
      *    23a
      G    S
        23b
        23c
        23d

21-22a:
  NA28: Καὶ ὑμᾶς ποτε ὄντας ἀπηλλοτριωμένους
        καὶ ἐχθροὺς τῇ διανοίᾳ
  ESV:  And you, who once were alienated
22b:
  NA28: παραστῆσαι ὑμᾶς ἁγίους
  ESV:  in order to present you holy
23a:
  ESV:  if indeed you continue in the faith,
23b:
  ESV:  stable
23c:
  ESV:  and steadfast,
23d:
  ESV:  not shifting from the hope
`;

describe('parseBracket', () => {
  it('parses columns, tree and rows of the Colossians 1:21-23 example', () => {
    const doc = parseBracket(COL_1_21_23);
    expect(doc.columns).toEqual(['NA28', 'ESV']);
    expect(doc.items).toHaveLength(1);
    const top = doc.items[0]!;
    expect(top.kind).toBe('bracket');
    if (top.kind !== 'bracket') return;
    expect(top.rel.key).toBe('Ac/Pur');
    expect(top.rel.group).toBe('distinct');
    expect(top.children.map((c) => c.label)).toEqual(['Ac', 'Pur']);
    expect(top.children.map((c) => c.star)).toEqual([false, true]);
    const ifTh = top.children[1]!;
    if (ifTh.kind !== 'bracket') throw new Error('expected bracket');
    const g = ifTh.children[1]!;
    if (g.kind !== 'bracket') throw new Error('expected bracket');
    expect(g.children[0]).toMatchObject({ kind: 'row', ref: '23a', star: true });
    expect(g.children[0]!.label).toBeUndefined();
    const s = g.children[1]!;
    if (s.kind !== 'bracket') throw new Error('expected bracket');
    expect(s.rel.coordinate).toBe(true);
    expect(s.children.map((c) => (c.kind === 'row' ? c.ref : ''))).toEqual(['23b', '23c', '23d']);

    const r = doc.rows.get('21-22a')!;
    expect(r.cells[0]).toBe('Καὶ ὑμᾶς ποτε ὄντας ἀπηλλοτριωμένους καὶ ἐχθροὺς τῇ διανοίᾳ');
    expect(r.cells[1]).toBe('And you, who once were alienated');
    expect(doc.rows.get('23a')!.cells).toEqual(['', 'if indeed you continue in the faith,']);
  });

  it('supports single-column shorthand and a flat document without a tree', () => {
    const doc = parseBracket(`bracket
1: Greeting
3-8: Prayer of Thanksgiving
`);
    expect(doc.columns).toEqual(['']);
    expect(doc.items.map((i) => (i.kind === 'row' ? i.ref : ''))).toEqual(['1', '3-8']);
    expect(doc.rows.get('3-8')!.cells).toEqual(['Prayer of Thanksgiving']);
  });

  it('accepts multiple top-level items (a forest) and keyword aliases', () => {
    const doc = parseBracket(`bracket
S
  1
  2
∴
  G  3
  *∴ 4
-/+
  -  5
  +  6
`);
    expect(doc.items).toHaveLength(3);
    const inf = doc.items[1]!;
    if (inf.kind !== 'bracket') throw new Error('expected bracket');
    expect(inf.rel.key).toBe('Inf');
    expect(inf.children[1]!.label).toBe('∴');
    const np = doc.items[2]!;
    if (np.kind !== 'bracket') throw new Error('expected bracket');
    expect(np.rel.key).toBe('Neg/Pos');
    expect(np.children[0]!.label).toBe('−');
  });

  it('rejects rows with text that are not placed in the tree', () => {
    expect(() =>
      parseBracket(`bracket
S
  1
  2
1: a
2: b
3: orphan
`),
    ).toThrow(BracketParseError);
  });

  it('rejects unknown keywords and children under a leaf', () => {
    expect(() => parseBracket('bracket\nFoo\n  1\n  2\n')).toThrow(/neither a relationship keyword/);
    expect(() => parseBracket('bracket\nS\n  1\n    2\n')).toThrow(/cannot have children/);
    expect(() => parseBracket('bracket\nS\n')).toThrow(/no children/);
  });

  it('collects config lines and coerces their values', () => {
    const doc = parseBracket(`bracket
config coordinateArms all
config columnWidth 360
config useMaxWidth false
S
  1
  2
`);
    expect(doc.options).toEqual({ coordinateArms: 'all', columnWidth: 360, useMaxWidth: false });
  });

  it('ignores %% comment lines and tolerates a missing keyword line', () => {
    const doc = parseBracket(`%% note
S
  1
  2
`);
    expect(doc.items).toHaveLength(1);
  });
});
