import { describe, expect, it } from 'vitest';
import { MORPH_POS, MORPH_SLOTS, morphClasses, morphLabel, parseMorph, stripMorph, tokenizeMorph } from '../src/index.js';

describe('parseMorph', () => {
  it('accepts the MorphGNT forms and normalises them', () => {
    const v = parseMorph('V- 3AAI-P--')!;
    expect(v.code).toBe('V-3AAI-P--');
    expect(v.posName).toBe('verb');
    expect(v.parts.map((p) => [p.slot, p.name])).toEqual([
      ['person', 'third person'],
      ['tense', 'aorist'],
      ['voice', 'active'],
      ['mood', 'indicative'],
      ['number', 'plural'],
    ]);
    expect(parseMorph('v-3aai-p--')!.code).toBe('V-3AAI-P--');
    expect(parseMorph('V-3AAI-P')!.code).toBe('V-3AAI-P--'); // trailing placeholders optional
    expect(parseMorph('N-----NSF-')!.parts.map((p) => p.code)).toEqual(['N', 'S', 'F']);
    expect(parseMorph('RA')!.posName).toBe('definite article');
    expect(parseMorph('RA----GSN-')!.parts.map((p) => p.slot)).toEqual(['case', 'number', 'gender']);
  });

  it('rejects codes that are not in the scheme', () => {
    expect(parseMorph('')).toBeNull();
    expect(parseMorph('Z-')).toBeNull(); // unknown part of speech
    expect(parseMorph('V-3QAI-P--')).toBeNull(); // Q is not a tense
    expect(parseMorph('N-----NSF-X')).toBeNull(); // too long
    expect(parseMorph('V-3AAIXP--')).toBeNull(); // X is not a case
  });

  it('covers every code the SBLGNT corpus uses', () => {
    // Part-of-speech values and per-slot letters found by scripts/scan-morphgnt.mjs.
    expect(Object.keys(MORPH_POS).sort()).toEqual(['A-', 'C-', 'D-', 'I-', 'N-', 'P-', 'RA', 'RD', 'RI', 'RP', 'RR', 'V-', 'X-']);
    const letters = MORPH_SLOTS.map((s) => Object.keys(s.codes).sort().join(''));
    expect(letters).toEqual(['123', 'AFIPXY', 'AMP', 'DINOPS', 'ADGNV', 'PS', 'FMN', 'CS']);
  });
});

describe('morphClasses and morphLabel', () => {
  it('emit one class per filled slot with a configurable prefix', () => {
    const m = parseMorph('V-2PAD-S--')!;
    expect(morphClasses(m)).toEqual([
      'gk',
      'gk-pos-verb',
      'gk-person-2',
      'gk-tense-present',
      'gk-voice-active',
      'gk-mood-imperative',
      'gk-number-singular',
    ]);
    expect(morphClasses(parseMorph('N-----GSF-')!, 'morph')).toEqual([
      'morph',
      'morph-pos-noun',
      'morph-case-genitive',
      'morph-number-singular',
      'morph-gender-feminine',
    ]);
    expect(morphLabel(m)).toBe('verb · second person · present · active · imperative · singular');
  });

  it('gives the four pronoun classes a shared pronoun class', () => {
    expect(morphClasses(parseMorph('RP----GSM-')!)).toEqual([
      'gk',
      'gk-pos-personal',
      'gk-pos-pronoun',
      'gk-case-genitive',
      'gk-number-singular',
      'gk-gender-masculine',
    ]);
    for (const code of ['RD----APN-', 'RI----ASN-', 'RR----ASF-']) {
      expect(morphClasses(parseMorph(code)!)).toContain('gk-pos-pronoun');
    }
    // The article is not a pronoun, and neither is anything else.
    expect(morphClasses(parseMorph('RA----NSM-')!)).not.toContain('gk-pos-pronoun');
    expect(morphClasses(parseMorph('N-----NSM-')!)).not.toContain('gk-pos-pronoun');
  });
});

describe('tokenizeMorph', () => {
  it('attaches a code to the token before it and strips it from the text', () => {
    const segs = tokenizeMorph('ὁ^RA----NSM- λόγος^N-----NSM- ἦν');
    expect(segs.map((s) => s.text)).toEqual(['ὁ', ' ', 'λόγος', ' ἦν']);
    expect(segs[0]!.morph!.posName).toBe('definite article');
    expect(segs[2]!.morph!.code).toBe('N-----NSM-');
    expect(segs[3]!.morph).toBeUndefined();
    expect(stripMorph('ὁ^RA----NSM- λόγος^N-----NSM- ἦν')).toBe('ὁ λόγος ἦν');
  });

  it('leaves untagged text, escaped carets and bad codes alone', () => {
    expect(tokenizeMorph('plain text')).toEqual([{ text: 'plain text' }]);
    expect(stripMorph('2\\^10 is a power')).toBe('2^10 is a power');
    expect(stripMorph('word^ZZ-bad')).toBe('word^ZZ-bad');
    expect(stripMorph('^N-')).toBe('^N-'); // nothing before the sigil
  });
});
