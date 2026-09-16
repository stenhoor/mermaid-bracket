/**
 * Looking a Greek word up in a bundled index of the MorphGNT corpus.
 *
 * The index is keyed on the word itself, never on its position: Greek word order carries no
 * grammatical function, so a form is tagged only when the corpus attests exactly one parse for it,
 * or when the candidate parses agree on some features (see `agreedCode`).
 *
 * This module holds no data. The host passes the encoded blob to `decodeGreekIndex`.
 */
import { MORPH_SLOTS, parseMorph } from './morph.js';
import type { Morph } from './morph.js';

export interface GreekIndex {
  codes: string[];
  lemmas: string[];
  glosses: string[];
  /** Forms exactly as the corpus writes them. Consulted first, because it is the more precise key. */
  forms: Map<string, { codes: number[]; lemmas: number[] }>;
  /** Normalized spellings, consulted only when the exact spelling is unknown. */
  normalized: Map<string, { codes: number[]; lemmas: number[] }>;
  /** Accent- and case-folded keys, built on first use as a fallback for other editions' spelling. */
  folded?: Map<string, string[]>;
}

export interface FormInfo {
  /** The key that matched, which may differ from what was looked up. */
  form: string;
  /** How the match was found: the exact spelling, the normalized one, or after folding accents. */
  via: 'exact' | 'normalized' | 'folded';
  codes: string[];
  lemmas: string[];
  glosses: string[];
}

const SECTION = '\n===\n';

export function decodeGreekIndex(blob: string): GreekIndex {
  const [codesRaw = '', lemmasRaw = '', glossesRaw = '', formsRaw = '', normalRaw = ''] = blob.split(SECTION);
  const table = (raw: string): Map<string, { codes: number[]; lemmas: number[] }> => {
    const map = new Map<string, { codes: number[]; lemmas: number[] }>();
    for (const line of raw ? raw.split('\n') : []) {
      const bar = line.indexOf('|');
      const bar2 = line.indexOf('|', bar + 1);
      if (bar < 1 || bar2 < 0) continue;
      map.set(line.slice(0, bar), {
        codes: line
          .slice(bar + 1, bar2)
          .split(',')
          .map((n) => parseInt(n, 36)),
        lemmas: line
          .slice(bar2 + 1)
          .split(',')
          .map((n) => parseInt(n, 36)),
      });
    }
    return map;
  };
  return {
    codes: codesRaw ? codesRaw.split(' ') : [],
    lemmas: lemmasRaw ? lemmasRaw.split(' ') : [],
    glosses: glossesRaw.split('\n'),
    forms: table(formsRaw),
    normalized: table(normalRaw),
  };
}

export function foldGreek(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[’᾽ʼ']/g, '')
    .toLowerCase();
}

/** Look a word up: the exact spelling first, then ignoring accents, breathing and case. */
export function lookupForm(index: GreekIndex, word: string): FormInfo | null {
  const build = (key: string, via: FormInfo['via']): FormInfo | null => {
    const entry = via === 'normalized' ? index.normalized.get(key) : index.forms.get(key) ?? index.normalized.get(key);
    if (!entry) return null;
    const lemmas = entry.lemmas.map((i) => index.lemmas[i] ?? '');
    return {
      form: key,
      via,
      codes: entry.codes.map((i) => index.codes[i] ?? ''),
      lemmas,
      glosses: entry.lemmas.map((i) => index.glosses[i] ?? '').filter(Boolean),
    };
  };

  const exact =
    (index.forms.has(word) && build(word, 'exact')) ||
    (index.forms.has(word.normalize('NFC')) && build(word.normalize('NFC'), 'exact')) ||
    (index.forms.has(word.normalize('NFD')) && build(word.normalize('NFD'), 'exact'));
  if (exact) return exact;
  const normalized = build(word, 'normalized') ?? build(word.normalize('NFC'), 'normalized');
  if (normalized) return normalized;

  if (!index.folded) {
    index.folded = new Map();
    for (const key of [...index.forms.keys(), ...index.normalized.keys()]) {
      const f = foldGreek(key);
      const list = index.folded.get(f);
      if (list) list.push(key);
      else index.folded.set(f, [key]);
    }
  }
  const keys = index.folded.get(foldGreek(word));
  if (!keys?.length) return null;
  const merged: FormInfo = { form: keys[0]!, via: 'folded', codes: [], lemmas: [], glosses: [] };
  for (const key of keys) {
    const info = build(key, 'folded');
    if (!info) continue;
    for (const c of info.codes) if (!merged.codes.includes(c)) merged.codes.push(c);
    for (const l of info.lemmas) if (!merged.lemmas.includes(l)) merged.lemmas.push(l);
    for (const g of info.glosses) if (!merged.glosses.includes(g)) merged.glosses.push(g);
  }
  return merged.codes.length ? merged : null;
}

export interface AgreedCode {
  code: string;
  /** True when the corpus attests exactly one parse; false when features were dropped. */
  exact: boolean;
  /** Slots that the candidate parses disagreed on, and which are therefore left unset. */
  dropped: string[];
}

/**
 * Reduce candidate parses to what they all agree on. Returns null when they disagree on the part of
 * speech, since there is then nothing safe to say about the word.
 */
export function agreedCode(codes: string[]): AgreedCode | null {
  const parsed = codes.map((c) => parseMorph(c)).filter((m): m is Morph => m !== null);
  if (parsed.length === 0) return null;
  if (parsed.length === 1) return { code: parsed[0]!.code, exact: true, dropped: [] };

  const pos = parsed[0]!.pos;
  if (parsed.some((m) => m.pos !== pos)) return null;

  const dropped: string[] = [];
  let tail = '';
  for (let i = 0; i < MORPH_SLOTS.length; i++) {
    const chars = new Set(codes.map((c) => c[2 + i]));
    if (chars.size === 1) {
      tail += [...chars][0]!;
    } else {
      tail += '-';
      dropped.push(MORPH_SLOTS[i]!.slot);
    }
  }
  return { code: pos + tail, exact: false, dropped };
}

/** Everything known about one word: its agreed parse, its lemma and its gloss. */
export interface WordInfo {
  form: string;
  agreed: AgreedCode | null;
  lemmas: string[];
  glosses: string[];
  candidates: string[];
  via: FormInfo['via'];
}

export function lookupWord(index: GreekIndex, word: string): WordInfo | null {
  const info = lookupForm(index, word);
  if (!info) return null;
  return {
    form: info.form,
    agreed: agreedCode(info.codes),
    lemmas: info.lemmas,
    glosses: info.glosses,
    candidates: info.codes,
    via: info.via,
  };
}

/** Matches a Greek word, including an elision mark, in running text. */
export const GREEK_WORD_RE = /\p{Script=Greek}[\p{Script=Greek}’᾽ʼ']*/gu;
