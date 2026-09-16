import { describe, expect, it } from 'vitest';
import { agreedCode, decodeGreekIndex, foldGreek, lookupForm, lookupWord } from '../src/index.js';

/** A miniature index in the generated format: codes, lemmas, glosses, then form lines. */
const BLOB = [
  'N-----NSM- V-3IAI-S-- C--------- D--------- N-----ASM-',
  'λόγος εἰμί καί θεός',
  ['word, speech', 'to be', 'and', 'God'].join('\n'),
  ['ἦν|1|1', 'θεόν|4|3', 'καί|2,3|2', 'λόγος|0|0'].join('\n'),
  ['θεον|4|3', 'λογος|0|0'].join('\n'),
].join('\n===\n');

describe('decodeGreekIndex and lookupForm', () => {
  const index = decodeGreekIndex(BLOB);

  it('decodes the tables and resolves a form to parses, lemmas and glosses', () => {
    expect(index.forms.size).toBe(4);
    const info = lookupForm(index, 'λόγος')!;
    expect(info).toMatchObject({ form: 'λόγος', via: 'exact', codes: ['N-----NSM-'], lemmas: ['λόγος'] });
    expect(info.glosses).toEqual(['word, speech']);
    expect(lookupForm(index, 'οὐρανός')).toBeNull();
    // The normalized table is only consulted when the exact spelling is unknown.
    expect(lookupForm(index, 'θεον')!.via).toBe('normalized');
  });

  it('falls back to an accent- and case-folded match', () => {
    expect(foldGreek('Λόγος')).toBe('λογος');
    const info = lookupForm(index, 'Λόγος')!;
    expect(info.via).toBe('folded');
    expect(info.codes).toEqual(['N-----NSM-']);
  });
});

describe('agreedCode', () => {
  it('keeps a single attested parse as is', () => {
    expect(agreedCode(['N-----NSM-'])).toEqual({ code: 'N-----NSM-', exact: true, dropped: [] });
  });

  it('keeps only the features every candidate agrees on', () => {
    // πάντα: accusative plural neuter, accusative singular masculine, nominative plural neuter.
    expect(agreedCode(['A-----APN-', 'A-----ASM-', 'A-----NPN-'])).toEqual({
      code: 'A---------',
      exact: false,
      dropped: ['case', 'number', 'gender'],
    });
    // Same case and number, differing gender only.
    expect(agreedCode(['N-----GSM-', 'N-----GSF-'])).toEqual({
      code: 'N-----GS--',
      exact: false,
      dropped: ['gender'],
    });
  });

  it('refuses when the part of speech itself is undecidable', () => {
    expect(agreedCode(['C---------', 'D---------'])).toBeNull(); // καί
    expect(agreedCode(['A-----GSN-', 'D---------', 'RP----GSM-'])).toBeNull(); // αὐτοῦ
    expect(agreedCode([])).toBeNull();
  });
});

describe('lookupWord', () => {
  const index = decodeGreekIndex(BLOB);
  it('combines the lookup and the agreement rule', () => {
    expect(lookupWord(index, 'ἦν')!.agreed).toEqual({ code: 'V-3IAI-S--', exact: true, dropped: [] });
    expect(lookupWord(index, 'καί')!.agreed).toBeNull();
    expect(lookupWord(index, 'καί')!.candidates).toEqual(['C---------', 'D---------']);
    expect(lookupWord(index, 'nope')).toBeNull();
  });
});
