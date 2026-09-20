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
    expect(() => parseSentence('sentence\nverb a\n  rel ἣν\n')).toThrow(/needs the pronoun/);
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

  it('strips morphology tags into segments and ignores one on a fork conjunction', () => {
    const doc = parseSentence('sentence\nsubj χάρις^N-----NSF-\nsubj + καὶ^C- εἰρήνη\nverb ἦν^V-3IAI-S--\n');
    const subj = doc.clauses[0]!.slots.subj!;
    expect(subj.members[0]!.word.text).toBe('χάρις');
    expect(subj.members[0]!.word.segments![0]!.morph!.code).toBe('N-----NSF-');
    expect(subj.members[1]!.conj).toBe('καὶ');
    expect(doc.clauses[0]!.slots.verb!.members[0]!.word.text).toBe('ἦν');
  });

  it('parses participles and infinitives with their labels and complements', () => {
    const doc = parseSentence(`sentence
verb  Εὐχαριστοῦμεν
  part  προσευχόμενοι (Temporal)
    prep  περὶ ὑμῶν
  part  ἀκούσαντες (Causal)
    obj   τὴν πίστιν
  inf   περιπατῆσαι (Purpose)
    mod   ἀξίως
`);
    const hangers = doc.clauses[0]!.slots.verb!.members[0]!.hangers;
    expect(hangers.map((h) => h.kind)).toEqual(['part', 'part', 'inf']);
    const [first, second, third] = hangers as [typeof hangers[0], typeof hangers[0], typeof hangers[0]];
    expect(first.members[0]!.word.text).toBe('προσευχόμενοι');
    expect(first.members[0]!.label).toBe('Temporal');
    expect(first.members[0]!.hangers[0]!.kind).toBe('prep');
    expect(second.members[0]!.slots!.obj!.members[0]!.word.text).toBe('τὴν πίστιν');
    expect(third.members[0]!.label).toBe('Purpose');
    expect(third.members[0]!.hangers[0]!.members[0]!.word.text).toBe('ἀξίως');
  });

  it('gives an infinitive its accusative subject and refuses a verb inside one', () => {
    const doc = parseSentence('sentence\nverb Θέλω\n  inf εἰδέναι\n    subj ὑμᾶς\n    obj τὸ μυστήριον\n');
    const inf = doc.clauses[0]!.slots.verb!.members[0]!.hangers[0]!.members[0]!;
    expect(inf.slots!.subj!.members[0]!.word.text).toBe('ὑμᾶς');
    expect(inf.slots!.obj!.members[0]!.word.text).toBe('τὸ μυστήριον');
    expect(() => parseSentence('sentence\nverb a\n  part b\n    verb c\n')).toThrow(/itself the verb/);
    expect(() => parseSentence('sentence\nverb a\n  mod b\n    obj c\n')).toThrow(/only be nested under/);
  });

  it('opens a relative clause and flags its pronoun', () => {
    const doc = parseSentence('sentence\nverb ἀκούσαντες\nobj τὴν ἀγάπην\n  rel obj ἣν\n    verb ἔχετε\n      prep εἰς τοὺς ἁγίους\n');
    const rel = doc.clauses[0]!.slots.obj!.members[0]!.hangers[0]!;
    expect(rel.kind).toBe('rel');
    const clause = rel.members[0]!.clause!;
    expect(clause.slots.obj!.members[0]).toMatchObject({ relative: true });
    expect(clause.slots.obj!.members[0]!.word.text).toBe('ἣν');
    expect(clause.slots.verb!.members[0]!.word.text).toBe('ἔχετε');
    expect(clause.slots.verb!.members[0]!.hangers[0]!.kind).toBe('prep');
    expect(() => parseSentence('sentence\nverb v\nobj x\n  rel ἣν\n')).toThrow(/needs the pronoun/);
  });

  it('parses subordinate clauses, stilts, floating shelves and joined clauses', () => {
    const doc = parseSentence(`sentence
clause
  voc   κύριε
  abs   αὐτοῦ ἐκπορευομένου
  verb  περιπατεῖτε
    sub   καθὼς
      verb  ἐδιδάχθητε
clause + καὶ
  verb  Θέλω
  obj   stilt
    verb  εἰδέναι
    subj  ὑμᾶς
`);
    const [first, second] = doc.clauses as [(typeof doc.clauses)[0], (typeof doc.clauses)[0]];
    expect(first.floating!.map((f) => [f.kind, f.word.text])).toEqual([
      ['voc', 'κύριε'],
      ['abs', 'αὐτοῦ ἐκπορευομένου'],
    ]);
    const sub = first.slots.verb!.members[0]!.hangers[0]!;
    expect(sub.kind).toBe('sub');
    expect(sub.members[0]!.conjLabel).toBe('καθὼς');
    expect(sub.members[0]!.clause!.slots.verb!.members[0]!.word.text).toBe('ἐδιδάχθητε');
    expect(second.join).toBe('καὶ');
    const stilt = second.slots.obj!.members[0]!;
    expect(stilt.stilt!.clause!.slots.verb!.members[0]!.word.text).toBe('εἰδέναι');
    expect(stilt.stilt!.clause!.slots.subj!.members[0]!.word.text).toBe('ὑμᾶς');
    expect(() => parseSentence('sentence\nverb v\n  sub\n')).toThrow(/needs its conjunction/);
    expect(() => parseSentence('sentence\nclause + καὶ\n  verb v\n')).toThrow(/no previous clause/);
  });
});
