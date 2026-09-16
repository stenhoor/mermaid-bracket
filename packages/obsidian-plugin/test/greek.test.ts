import { describe, expect, it } from 'vitest';
import { autoTagGreek, buildGlossary, greekIndex, renderGlossary, wordInfo } from '../src/greek.js';

const index = greekIndex();
const JOHN = 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.';

describe('the bundled index', () => {
  it('decodes to the whole corpus', () => {
    expect(index.forms.size).toBeGreaterThan(19000);
    expect(index.normalized.size).toBeGreaterThan(1000);
    expect(index.codes.length).toBe(602);
    expect(index.lemmas.length).toBeGreaterThan(5000);
  });

  it('gives the lemma and gloss of a word', () => {
    expect(wordInfo('λόγος')).toEqual({ lemma: 'λόγος', gloss: 'a word, speech, divine utterance, analogy' });
    expect(wordInfo('ἦν')!.lemma).toBe('εἰμί');
    expect(wordInfo('Xyzzy')).toBeNull();
  });
});

describe('autoTagGreek', () => {
  it('tags what the corpus attests once and leaves ambiguous words alone', () => {
    const { text, tagged, partial, skipped } = autoTagGreek(JOHN, index);
    expect(text).toContain('ἀρχῇ^N-----DSF-');
    expect(text).toContain('λόγος^N-----NSM-');
    expect(text).toContain('ἦν^V-3IAI-S--');
    expect(text).toContain('θεόν^N-----ASM-');
    // καί is a conjunction or an adverb: the part of speech is undecidable, so it is not tagged.
    expect(text).toContain('καὶ ὁ');
    expect(skipped.has('καὶ')).toBe(true);
    expect(tagged).toBeGreaterThan(8);
    expect(partial).toBe(0);
  });

  it('writes only the agreed features when candidates differ, unless that is switched off', () => {
    const on = autoTagGreek('πάντα δι᾽ αὐτοῦ ἐγένετο', index);
    expect(on.text).toContain('πάντα^A---------'); // adjective, but case, number and gender vary
    expect(on.text).toContain('ἐγένετο^V-3AMI-S--');
    expect(on.text).toContain('αὐτοῦ '); // four candidate parts of speech: untouched
    expect(on.partial).toBe(1);

    const off = autoTagGreek('πάντα δι᾽ αὐτοῦ ἐγένετο', index, { allowPartial: false });
    expect(off.text).not.toContain('πάντα^');
    expect(off.partial).toBe(0);
  });

  it('leaves existing tags, code blocks and inline code alone', () => {
    const src = ['λόγος^N-----NSM- λόγος', '```', 'λόγος', '```', 'and `λόγος` here'].join('\n');
    const { text, tagged } = autoTagGreek(src, index);
    expect(text.split('\n')[0]).toBe('λόγος^N-----NSM- λόγος^N-----NSM-');
    expect(tagged).toBe(1);
    expect(text.split('\n')[2]).toBe('λόγος');
    expect(text).toContain('`λόγος`');
  });
});

describe('buildGlossary and renderGlossary', () => {
  const rows = buildGlossary(JOHN, index);

  it('lists each lemma once with its gloss and frequency', () => {
    const logos = rows.find((r) => r.lemma === 'λόγος')!;
    expect(logos.count).toBe(3);
    expect(logos.gloss).toContain('word');
    expect(rows.find((r) => r.lemma === 'θεός')!.forms).toEqual(['θεόν', 'θεὸς']);
    expect(rows.map((r) => r.lemma)).toContain('εἰμί');
  });

  it('renders a table or a list, with the optional columns', () => {
    const table = renderGlossary(rows, { style: 'table', includeCounts: true, includeForms: false });
    expect(table.split('\n')[0]).toBe('| Lemma | Gloss | Count |');
    expect(table).toMatch(/\| λόγος \| [^|]+ \| 3 \|/);

    const plain = renderGlossary(rows, { style: 'table', includeCounts: false, includeForms: false });
    expect(plain.split('\n')[0]).toBe('| Lemma | Gloss |');

    const list = renderGlossary(rows, { style: 'list', includeCounts: true, includeForms: true });
    expect(list).toMatch(/^- \*\*/m);
    expect(list).toContain('×3');
    expect(renderGlossary([], { style: 'table', includeCounts: true, includeForms: true })).toBe('');
  });
});
