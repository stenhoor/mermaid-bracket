import { describe, expect, it } from 'vitest';
import { autoTagGreek, buildGlossary, FUNCTION_WORD_POS, greekIndex, renderGlossary, stripGreekTags, tagGreekAsHtml, wordInfo } from '../src/greek.js';
import { setMorphInfoProvider } from '@mermaid-bracket/diagram';

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

  it('can sort by frequency and leave out conjunctions and the article', () => {
    const freq = buildGlossary(JOHN, index, { sort: 'frequency', excludePos: FUNCTION_WORD_POS });
    const counts = freq.map((r) => r.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(freq[0]!.count).toBeGreaterThanOrEqual(3);
    // ὁ is an article and καί a conjunction: both are dropped, by the lemma's own part of speech.
    expect(freq.map((r) => r.lemma)).not.toContain('ὁ');
    expect(freq.map((r) => r.lemma)).not.toContain('καί');
    // Content words survive, and the alphabetical glossary still keeps everything.
    expect(freq.map((r) => r.lemma)).toContain('λόγος');
    const all = buildGlossary(JOHN, index);
    expect(all.map((r) => r.lemma)).toContain('ὁ');
    expect(all.find((r) => r.lemma === 'ὁ')!.pos).toBe('RA');
    expect(all.find((r) => r.lemma === 'καί')!.pos).toBe('C-');
  });

  it('never reads a diagram: Greek inside a mermaid block is invisible to both glossaries', () => {
    const note = [
      'Prose before: ἀγάπη.',
      '',
      '```mermaid',
      'sentence',
      'subj  χάρις',
      'verb  ἦν',
      '```',
      '',
      '```mermaid',
      'bracket',
      '1: εἰρήνη ὑμῖν',
      '```',
      '',
      'Prose after: ἀγάπη.',
    ].join('\n');
    const lemmas = buildGlossary(note, index).map((r) => r.lemma);
    expect(lemmas).toEqual(['ἀγάπη']);
    expect(buildGlossary(note, index)[0]!.count).toBe(2); // both prose occurrences, neither diagram
    expect(buildGlossary(note, index, { sort: 'frequency', excludePos: FUNCTION_WORD_POS }).map((r) => r.lemma)).toEqual([
      'ἀγάπη',
    ]);
    // Tagging leaves the diagrams untouched as well.
    const { text } = autoTagGreek(note, index);
    expect(text).toContain('subj  χάρις\n');
    expect(text).toContain('1: εἰρήνη ὑμῖν');
    expect(text).toContain('ἀγάπη^N-----NSF-');
  });

  it('writes HTML spans instead of codes, so editing view shows the formatting too', () => {
    const { text, tagged, skipped } = tagGreekAsHtml('Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ θεὸς ἦν.', index);
    expect(text).toContain('<span class="gk gk-pos-noun gk-case-dative gk-number-singular gk-gender-feminine" data-morph="N-----DSF-" title="noun · dative · singular · feminine">ἀρχῇ</span>');
    expect(text).toContain('>ἦν</span>');
    expect(text).not.toContain('^N-----DSF-');
    expect(tagged).toBeGreaterThan(4);
    expect(skipped.has('καὶ')).toBe(true); // still never guesses
    expect(text).toContain(', καὶ ');
  });

  it('honours a hand-written code, and never double-wraps or touches diagrams', () => {
    const src = [
      'λόγος^RA----NSM- and λόγος',
      '<span class="gk gk-pos-noun" data-morph="N-----NSM-">λόγος</span>',
      '```mermaid',
      'sentence',
      'subj λόγος',
      '```',
    ].join('\n');
    const { text, fromExistingTags, tagged } = tagGreekAsHtml(src, index);
    // The hand-written (deliberately wrong) code is kept, not replaced by the lookup.
    expect(text).toContain('data-morph="RA----NSM-"');
    expect(text.slice(0, text.indexOf('</span>'))).toContain('gk-pos-article');
    expect(text).not.toContain('^RA----NSM-');
    expect(fromExistingTags).toBe(1);
    expect(tagged).toBe(1);
    expect(text.split('\n')[1]).toBe('<span class="gk gk-pos-noun" data-morph="N-----NSM-">λόγος</span>');
    expect(text.split('\n')[4]).toBe('subj λόγος');
  });

  it('adds lemma and gloss attributes when the lexicon provider is installed', () => {
    setMorphInfoProvider((w) => wordInfo(w));
    try {
      const { text } = tagGreekAsHtml('λόγος', index);
      expect(text).toContain('data-lemma="λόγος"');
      expect(text).toContain('title="λόγος — a word, speech, divine utterance, analogy · noun · nominative · singular · masculine"');
    } finally {
      setMorphInfoProvider(null);
    }
  });

  it('strips both kinds of tag back to plain text', () => {
    const tagged = tagGreekAsHtml('Ἐν ἀρχῇ ἦν ὁ λόγος.', index).text;
    const back = stripGreekTags(tagged);
    expect(back.text).toBe('Ἐν ἀρχῇ ἦν ὁ λόγος.');
    expect(back.removed).toBeGreaterThan(3);
    expect(stripGreekTags('λόγος^N-----NSM- plain').text).toBe('λόγος plain');
    expect(stripGreekTags('nothing here')).toEqual({ text: 'nothing here', removed: 0 });
  });
});
