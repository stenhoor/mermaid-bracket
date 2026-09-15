import { describe, expect, it } from 'vitest';
import { parseSentence, SentenceParseError } from '../src/index.js';

describe('parseSentence', () => {
  it('parses slots, appositives, hangers, gen chains and forks', () => {
    const doc = parseSentence(`sentence
config fontSize 16
verse 1:3
clause
  conj  οὖν
  verb  Εὐχαριστοῦμεν
    mod   πάντοτε
    mod   τῷ θεῷ = πατρὶ
      gen   τοῦ κυρίου
      gen   ἡμῶν
      = Ἰησοῦ Χριστοῦ
  obj   τὴν πίστιν
  obj   + καὶ τὴν ἀγάπην
    prep  ἐν Χριστῷ
    prep  + καὶ ἐν ἀγάπῃ
`);
    expect(doc.options).toEqual({ fontSize: 16 });
    expect(doc.clauses).toHaveLength(1);
    const c = doc.clauses[0]!;
    expect(c.conj).toBe('οὖν');
    expect(c.slots.subj).toBeUndefined();
    const verb = c.slots.verb!.members[0]!;
    expect(verb.word.text).toBe('Εὐχαριστοῦμεν');
    expect(verb.word.verse).toBe('1:3');
    expect(verb.hangers.map((g) => g.kind)).toEqual(['mod', 'mod']);
    const theo = verb.hangers[1]!.members[0]!;
    expect(theo.word.text).toBe('τῷ θεῷ');
    // Inline appositive plus a `=` line at the gen lines' indent, which renames the head τῷ θεῷ.
    expect(theo.word.appos.map((a) => a.word.text)).toEqual(['πατρὶ', 'Ἰησοῦ Χριστοῦ']);
    expect(theo.hangers).toHaveLength(1);
    expect(theo.hangers[0]!.kind).toBe('gen');
    expect(theo.hangers[0]!.members.map((m) => m.word.text)).toEqual(['τοῦ κυρίου', 'ἡμῶν']);
    const obj = c.slots.obj!;
    expect(obj.members.map((m) => [m.word.text, m.conj])).toEqual([
      ['τὴν πίστιν', undefined],
      ['τὴν ἀγάπην', 'καὶ'],
    ]);
    const preps = obj.members[1]!.hangers[0]!;
    expect(preps.kind).toBe('prep');
    expect(preps.members.map((m) => m.conj)).toEqual([undefined, 'καὶ']);
  });

  it('starts an implicit clause and allows empty slots and (X)', () => {
    const doc = parseSentence('sentence\nsubj (X)\nverb λαλεῖ\nobj\n');
    expect(doc.clauses).toHaveLength(1);
    expect(doc.clauses[0]!.slots.subj!.members[0]!.word.text).toBe('(X)');
    expect(doc.clauses[0]!.slots.obj!.members[0]!.word.text).toBe('');
  });

  it('separates clauses and keeps their order', () => {
    const doc = parseSentence('sentence\nclause\n  verb a\nclause\n  verb b\n');
    expect(doc.clauses.map((c) => c.slots.verb!.members[0]!.word.text)).toEqual(['a', 'b']);
  });

  it('rejects bad structure with line numbers', () => {
    expect(() => parseSentence('sentence\nmod x\n')).toThrow(/line 2: `mod` must be indented under a word/);
    expect(() => parseSentence('sentence\nverb a\nverb b\n')).toThrow(/already set/);
    expect(() => parseSentence('sentence\nverb a\n  prep + καί b\n')).toThrow(/no previous `prep`/);
    expect(() => parseSentence('sentence\nverb a\n  part b\n')).toThrow(/phase 4b/);
    expect(() => parseSentence('sentence\nfoo a\n')).toThrow(SentenceParseError);
    expect(() => parseSentence('sentence\n')).toThrow(/no clause/);
  });

  it('forks appositives and lets each carry hangers', () => {
    const doc = parseSentence(`sentence
verb
obj τοῖς
  prep ἐν Κολοσσαῖς
  = ἁγίοις
  = + καὶ ἀδελφοῖς
    mod πιστοῖς
`);
    const tois = doc.clauses[0]!.slots.obj!.members[0]!;
    expect(tois.hangers.map((g) => g.kind)).toEqual(['prep']);
    expect(tois.word.appos.map((a) => [a.word.text, a.conj])).toEqual([
      ['ἁγίοις', undefined],
      ['ἀδελφοῖς', 'καὶ'],
    ]);
    expect(tois.word.appos[1]!.hangers[0]!.members[0]!.word.text).toBe('πιστοῖς');
    expect(() => parseSentence('sentence\nverb v\nobj o\n  = + καὶ a\n')).toThrow(/no previous appositive/);
    expect(() => parseSentence('sentence\n= a\n')).toThrow(/indented under/);
  });
});
