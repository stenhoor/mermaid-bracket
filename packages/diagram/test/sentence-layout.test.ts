import { describe, expect, it } from 'vitest';
import { DEFAULT_SENTENCE, layoutSentence, parseSentence } from '../src/index.js';
import type { LinePrim, Prim, TextPrim } from '../src/index.js';

const measure = (text: string): number => text.length * 8;
const texts = (prims: Prim[]): TextPrim[] => prims.filter((p): p is TextPrim => p.kind === 'text');
const lines = (prims: Prim[]): LinePrim[] => prims.filter((p): p is LinePrim => p.kind === 'line');
const find = (prims: Prim[], t: string): TextPrim => {
  const p = texts(prims).find((x) => x.text === t);
  if (!p) throw new Error(`text "${t}" not laid out`);
  return p;
};

describe('layoutSentence', () => {
  it('orders slots left to right on one base line with the right markers', () => {
    const doc = parseSentence('sentence\ncomp \\\\c\nobj o\nverb v\nsubj s\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const s = find(l.prims, 's');
    const v = find(l.prims, 'v');
    const o = find(l.prims, 'o');
    const c = find(l.prims, '\\\\c');
    expect(s.x).toBeLessThan(v.x);
    expect(v.x).toBeLessThan(o.x);
    expect(o.x).toBeLessThan(c.x);
    expect(new Set([s.y, v.y, o.y, c.y]).size).toBe(1);
    const base = lines(l.prims).find((x) => x.style === 'base')!;
    const markers = lines(l.prims).filter((x) => x.style === 'marker');
    // predicate marker crosses the line, object marker stops at it, complement marker slants up-right.
    const pred = markers.find((m) => m.x1 === m.x2 && m.y2 > base.y1)!;
    const objm = markers.find((m) => m.x1 === m.x2 && m.y2 === base.y1)!;
    // Complement marker: bottom on the base line, top leaning back toward the subject.
    const compm = markers.find((m) => m.x1 !== m.x2)!;
    expect(compm.y1).toBe(base.y1);
    expect(compm.x2).toBeLessThan(compm.x1);
    expect(compm.y2).toBeLessThan(compm.y1);
    expect(pred.x1).toBeGreaterThan(s.x);
    expect(pred.x1).toBeLessThan(v.x);
    expect(objm.x1).toBeGreaterThan(v.x);
    expect(objm.x1).toBeLessThan(o.x);
    expect(compm.x1).toBeGreaterThan(o.x);
  });

  it('hangs modifiers below their head on a slant with a shelf, stacked down a stem', () => {
    const doc = parseSentence('sentence\nverb λαλεῖ\n  mod φανερῶς\n  prep ἐν πνεύματι\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const head = find(l.prims, 'λαλεῖ');
    const m1 = find(l.prims, 'φανερῶς');
    const m2 = find(l.prims, 'ἐν πνεύματι');
    expect(m1.y).toBeGreaterThan(head.y);
    expect(m2.y).toBeGreaterThan(m1.y);
    expect(m1.x).toBeGreaterThan(head.x);
    const headLineY = head.y + DEFAULT_SENTENCE.fontSize * 0.3;
    // First terrace: one slant from the head line down-left to its shelf foot.
    const slant = lines(l.prims).find((x) => x.style === 'line' && x.x2 < x.x1 && x.y1 === headLineY)!;
    expect(slant).toBeDefined();
    const foot = { x: slant.x2, y: slant.y2 };
    // Second terrace: short slash whose foot is on the stem below the first foot.
    const slash = lines(l.prims).find((x) => x.style === 'line' && x.x2 > x.x1 && x.y2 < x.y1 && x.x1 === foot.x && x.y1 > foot.y)!;
    expect(slash).toBeDefined();
    const stem = lines(l.prims).find((x) => x.style === 'line' && x.x1 === x.x2 && x.x1 === foot.x)!;
    expect(stem.y1).toBe(foot.y);
    expect(stem.y2).toBe(slash.y1);
    const shelves = lines(l.prims).filter((x) => x.style === 'line' && x.y1 === x.y2 && x.x1 === foot.x);
    expect(shelves).toHaveLength(2);
  });

  it('writes genitive chains as slash text directly under the head and hangs nothing else on that row', () => {
    const doc = parseSentence('sentence\nverb ἔχετε\nobj τὴν πίστιν\n  gen ὑμῶν\n  gen τοῦ θεοῦ\n    mod πάσης\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const head = find(l.prims, 'τὴν πίστιν');
    const g1 = find(l.prims, '/ ὑμῶν');
    const g2 = find(l.prims, '/ τοῦ θεοῦ');
    expect(g1.y).toBe(g2.y);
    expect(g1.y).toBeGreaterThan(head.y);
    expect(g2.x).toBeGreaterThan(g1.x);
    expect(find(l.prims, 'πάσης').y).toBeGreaterThan(g2.y);
  });

  it('forks compound slots and hangers with the conjunction on a dotted vertical', () => {
    const doc = parseSentence('sentence\nsubj χάρις\nsubj + καὶ εἰρήνη\nverb\n  prep ἀπὸ θεοῦ\n  prep + καὶ ἀπὸ κυρίου\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const a = find(l.prims, 'χάρις');
    const b = find(l.prims, 'εἰρήνη');
    expect(a.y).toBeLessThan(b.y);
    expect(texts(l.prims).filter((t) => t.text === 'καὶ')).toHaveLength(2);
    const dotted = lines(l.prims).filter((x) => x.style === 'dotted');
    expect(dotted).toHaveLength(2);
    expect(find(l.prims, 'ἀπὸ κυρίου').y).toBeGreaterThan(find(l.prims, 'ἀπὸ θεοῦ').y);
  });

  it('pushes a slot right when its hangers would collide with the previous slot\'s hangers', () => {
    const src = 'sentence\nsubj s\n  mod a-very-long-modifier-under-the-subject\nverb v\n  mod under-verb\n';
    const l = layoutSentence(parseSentence(src), measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const long = find(l.prims, 'a-very-long-modifier-under-the-subject');
    const uv = find(l.prims, 'under-verb');
    expect(uv.x).toBeGreaterThanOrEqual(long.x + measure(long.text) + DEFAULT_SENTENCE.pad);
  });

  it('places verse references in the gutter at the height of their word and draws the guide', () => {
    const doc = parseSentence('sentence\nverse 1:1\nsubj Παῦλος\nverb\nclause\nverse 1:2\nsubj χάρις\nverb\n');
    const l = layoutSentence(doc, measure);
    const v1 = find(l.prims, '1:1');
    const v2 = find(l.prims, '1:2');
    expect(v1.y).toBe(find(l.prims, 'Παῦλος').y);
    expect(v2.y).toBe(find(l.prims, 'χάρις').y);
    expect(v1.x).toBeLessThan(find(l.prims, 'Παῦλος').x);
    expect(lines(l.prims).some((x) => x.style === 'guide')).toBe(true);
    expect(l.height).toBeGreaterThan(v2.y);
  });

  it('draws the sentence conjunction on an up-right slant left of the clause', () => {
    const l = layoutSentence(parseSentence('sentence\nconj οὖν\nverb παρελάβετε\n'), measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const c = find(l.prims, 'οὖν');
    const v = find(l.prims, 'παρελάβετε');
    expect(c.anchor).toBe('end');
    expect(c.x).toBeLessThan(v.x);
    expect(c.y).toBeLessThan(v.y);
    const up = lines(l.prims).find((x) => x.style === 'line' && x.x2 > x.x1 && x.y2 < x.y1)!;
    expect(up).toBeDefined();
  });

  it('does not draw the base line through forks', () => {
    const doc = parseSentence('sentence\nsubj a\nsubj + καὶ b\nverb v\nobj c\nobj + καὶ d\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const base = lines(l.prims).find((x) => x.style === 'base')!;
    const a = find(l.prims, 'a');
    const c = find(l.prims, 'c');
    expect(base.x1).toBeGreaterThan(a.x + measure('a'));
    expect(base.x2).toBeLessThan(c.x);
    expect(find(l.prims, 'v').x).toBeGreaterThan(base.x1);
    expect(find(l.prims, 'v').x).toBeLessThan(base.x2);
  });

  it('draws a compound appositive as a fork opening from the equals sign', () => {
    const doc = parseSentence('sentence\nverb v\nobj τοῖς\n  = ἁγίοις\n  = + καὶ ἀδελφοῖς\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const tois = find(l.prims, 'τοῖς');
    const eq = texts(l.prims).find((t) => t.cls === 'eq')!;
    const a = find(l.prims, 'ἁγίοις');
    const b = find(l.prims, 'ἀδελφοῖς');
    expect(eq.x).toBeGreaterThan(tois.x);
    expect(a.x).toBeGreaterThan(eq.x);
    expect(a.y).toBeLessThan(tois.y);
    expect(b.y).toBeGreaterThan(tois.y);
    expect(find(l.prims, 'καὶ').x).toBeGreaterThan(eq.x);
  });

  it('ends the base line at a compound appositive and starts the fork right of the head\'s hangers', () => {
    const doc = parseSentence('sentence\nverb v\nobj τοῖς\n  prep ἐν Κολοσσαῖς\n  = ἁγίοις\n  = + καὶ ἀδελφοῖς\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const base = lines(l.prims).find((x) => x.style === 'base')!;
    const eq = texts(l.prims).find((t) => t.cls === 'eq')!;
    expect(base.x2).toBeLessThanOrEqual(eq.x + measure('=') + DEFAULT_SENTENCE.pad);
    const kol = find(l.prims, 'ἐν Κολοσσαῖς');
    expect(eq.x).toBeGreaterThan(kol.x + measure(kol.text));
    expect(find(l.prims, 'ἀδελφοῖς').x).toBeGreaterThan(eq.x);
  });
});

describe('participles and infinitives', () => {
  it('drops a vertical connector, not a slant, and puts the label beneath', () => {
    const doc = parseSentence('sentence\nverb Εὐχαριστοῦμεν\n  part προσευχόμενοι (Temporal)\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const head = find(l.prims, 'Εὐχαριστοῦμεν');
    const part = find(l.prims, 'προσευχόμενοι');
    const label = find(l.prims, '(Temporal)');
    expect(part.y).toBeGreaterThan(head.y);
    expect(label.y).toBeGreaterThan(part.y);
    expect(label.cls).toBe('label');
    // A vertical connector from the head line down to the participle's shelf.
    const connector = lines(l.prims).find((x) => x.style === 'line' && x.x1 === x.x2 && x.y2 > x.y1)!;
    expect(connector).toBeDefined();
    // No slant is drawn for a verbal hanger.
    expect(lines(l.prims).some((x) => x.style === 'line' && x.x1 !== x.x2 && x.y1 !== x.y2)).toBe(false);
  });

  it('marks an infinitive with a double bar and sets its subject before it', () => {
    const doc = parseSentence('sentence\nverb Θέλω\n  inf εἰδέναι\n    subj ὑμᾶς\n    obj τὸ μυστήριον\n');
    const l = layoutSentence(doc, measure, { ...DEFAULT_SENTENCE, gutter: 0 });
    const subj = find(l.prims, 'ὑμᾶς');
    const inf = find(l.prims, 'εἰδέναι');
    const obj = find(l.prims, 'τὸ μυστήριον');
    expect(subj.x).toBeLessThan(inf.x);
    expect(inf.x).toBeLessThan(obj.x);
    const markers = lines(l.prims).filter((x) => x.style === 'marker');
    // Two bars for the infinitive marker, one for its object, plus the clause's own predicate marker.
    expect(markers.length).toBeGreaterThanOrEqual(3);
    const pair = markers.filter((m) => m.x1 > subj.x && m.x1 < inf.x);
    expect(pair).toHaveLength(2);
  });
});
