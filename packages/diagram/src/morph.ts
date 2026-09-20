/**
 * Greek morphology tagging, using the MorphGNT scheme (https://github.com/morphgnt/sblgnt).
 *
 * The dictionary below is derived from a scan of the whole SBLGNT corpus (137,554 words; see
 * `scripts/scan-morphgnt.mjs`, which reproduces it). Every part-of-speech value and every letter
 * that occurs in each of the eight parsing positions is listed, with its corpus count in a comment.
 * A word is tagged in diagram text by appending `^CODE` to it, e.g. `ἐπεχείρησαν^V-3AAI-P--`.
 * The code is stripped from the rendered text and turned into CSS classes so a stylesheet can
 * format by morphology.
 *
 * MorphGNT's parsing data is CC BY-SA; only its code scheme is reproduced here.
 */

export type MorphSlotName = 'person' | 'tense' | 'voice' | 'mood' | 'case' | 'number' | 'gender' | 'degree';

export interface CodeEntry {
  /** Human-readable name, used in the title attribute. */
  name: string;
  /** Class suffix, appended to `<prefix>-<slot>-`. */
  cls: string;
  /** Broader class emitted alongside `cls`, so a stylesheet can select the whole family. */
  group?: string;
}

/** Part of speech: the first column of a MorphGNT line. Counts are corpus occurrences. */
export const MORPH_POS: Readonly<Record<string, CodeEntry>> = {
  'A-': { name: 'adjective', cls: 'adjective' }, // 9,127
  'C-': { name: 'conjunction', cls: 'conjunction' }, // 18,219
  'D-': { name: 'adverb', cls: 'adverb' }, // 6,171
  'I-': { name: 'interjection', cls: 'interjection' }, // 18
  'N-': { name: 'noun', cls: 'noun' }, // 28,237
  'P-': { name: 'preposition', cls: 'preposition' }, // 10,877
  RA: { name: 'definite article', cls: 'article' }, // 19,770
  RD: { name: 'demonstrative pronoun', cls: 'demonstrative', group: 'pronoun' }, // 1,740
  RI: { name: 'interrogative/indefinite pronoun', cls: 'interrogative', group: 'pronoun' }, // 1,160
  RP: { name: 'personal pronoun', cls: 'personal', group: 'pronoun' }, // 11,523
  RR: { name: 'relative pronoun', cls: 'relative', group: 'pronoun' }, // 1,677
  'V-': { name: 'verb', cls: 'verb' }, // 28,056
  'X-': { name: 'particle', cls: 'particle' }, // 979
};

/** The eight positions of the parsing code, in order. `-` means "not applicable". */
export const MORPH_SLOTS: readonly { slot: MorphSlotName; codes: Readonly<Record<string, CodeEntry>> }[] = [
  {
    slot: 'person',
    codes: {
      '1': { name: 'first person', cls: '1' }, // 2,937
      '2': { name: 'second person', cls: '2' }, // 3,474
      '3': { name: 'third person', cls: '3' }, // 12,720
    },
  },
  {
    slot: 'tense',
    codes: {
      P: { name: 'present', cls: 'present' }, // 11,530
      I: { name: 'imperfect', cls: 'imperfect' }, // 1,670
      F: { name: 'future', cls: 'future' }, // 1,624
      A: { name: 'aorist', cls: 'aorist' }, // 11,572
      X: { name: 'perfect', cls: 'perfect' }, // 1,572
      Y: { name: 'pluperfect', cls: 'pluperfect' }, // 88
    },
  },
  {
    slot: 'voice',
    codes: {
      A: { name: 'active', cls: 'active' }, // 20,658
      M: { name: 'middle', cls: 'middle' }, // 3,846
      P: { name: 'passive', cls: 'passive' }, // 3,552
    },
  },
  {
    slot: 'mood',
    codes: {
      I: { name: 'indicative', cls: 'indicative' }, // 15,589
      D: { name: 'imperative', cls: 'imperative' }, // 1,618
      S: { name: 'subjunctive', cls: 'subjunctive' }, // 1,856
      O: { name: 'optative', cls: 'optative' }, // 68
      N: { name: 'infinitive', cls: 'infinitive' }, // 2,285
      P: { name: 'participle', cls: 'participle' }, // 6,640
    },
  },
  {
    slot: 'case',
    codes: {
      N: { name: 'nominative', cls: 'nominative' }, // 24,236
      G: { name: 'genitive', cls: 'genitive' }, // 19,569
      D: { name: 'dative', cls: 'dative' }, // 12,125
      A: { name: 'accusative', cls: 'accusative' }, // 23,276
      V: { name: 'vocative', cls: 'vocative' }, // 668
    },
  },
  {
    slot: 'number',
    codes: {
      S: { name: 'singular', cls: 'singular' }, // 69,465
      P: { name: 'plural', cls: 'plural' }, // 29,540
    },
  },
  {
    slot: 'gender',
    codes: {
      M: { name: 'masculine', cls: 'masculine' }, // 41,584
      F: { name: 'feminine', cls: 'feminine' }, // 18,837
      N: { name: 'neuter', cls: 'neuter' }, // 13,904
    },
  },
  {
    slot: 'degree',
    codes: {
      C: { name: 'comparative', cls: 'comparative' }, // 265
      S: { name: 'superlative', cls: 'superlative' }, // 42
    },
  },
];

export interface Morph {
  /** Normalised code as written by MorphGNT, e.g. "V-3AAI-P--". */
  code: string;
  pos: string;
  posName: string;
  parts: { slot: MorphSlotName; code: string; name: string; cls: string }[];
}

const POS_KEYS = new Set(Object.keys(MORPH_POS));

/**
 * Parse a MorphGNT code. Accepts the two-character part of speech alone (`N-`, `RA`) or followed by
 * the parsing code with or without a space (`V- 3AAI-P--`, `V-3AAI-P--`), in any case, with trailing
 * `-` placeholders omitted (`V-3AAI` is padded). Returns null when the code is not valid.
 */
export function parseMorph(raw: string): Morph | null {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (s.length < 2) return null;
  const pos = s.slice(0, 2);
  if (!POS_KEYS.has(pos)) return null;
  let rest = s.slice(2);
  if (rest.length > 8) return null;
  rest = rest.padEnd(8, '-');
  if (!/^[A-Z1-3-]{8}$/.test(rest)) return null;

  const parts: Morph['parts'] = [];
  for (let i = 0; i < MORPH_SLOTS.length; i++) {
    const ch = rest[i]!;
    if (ch === '-') continue;
    const entry = MORPH_SLOTS[i]!.codes[ch];
    if (!entry) return null;
    parts.push({ slot: MORPH_SLOTS[i]!.slot, code: ch, name: entry.name, cls: entry.cls });
  }
  return { code: pos + rest, pos, posName: MORPH_POS[pos]!.name, parts };
}

/**
 * CSS classes for a parsed code: a marker class, the part of speech, its family where it has one
 * (the four pronoun classes also emit `-pos-pronoun`), and one class per filled slot.
 */
export function morphClasses(m: Morph, prefix = 'gk'): string[] {
  const pos = MORPH_POS[m.pos]!;
  const out = [prefix, `${prefix}-pos-${pos.cls}`];
  if (pos.group) out.push(`${prefix}-pos-${pos.group}`);
  for (const p of m.parts) out.push(`${prefix}-${p.slot}-${p.cls}`);
  return out;
}

/** Readable summary, e.g. "verb · aorist · active · indicative · third person · plural". */
export function morphLabel(m: Morph): string {
  return [m.posName, ...m.parts.map((p) => p.name)].join(' · ');
}

export interface MorphSegment {
  text: string;
  morph?: Morph;
  /** Inline marks around this run: strong, em, del, mark. */
  marks?: string[];
}

/** `**bold**`, `*italic*`, `~~strike~~`, `==highlight==` inside a diagram word. */
const INLINE_MARKS: Record<string, string> = { '**': 'strong', '*': 'em', '~~': 'del', '==': 'mark' };

/**
 * Split text on the inline marks, keeping any morphology segments intact. Marks nest, so a run
 * carries every mark open around it.
 */
export function tokenizeInline(segments: MorphSegment[]): MorphSegment[] {
  const out: MorphSegment[] = [];
  const open: string[] = [];
  for (const seg of segments) {
    if (seg.morph) {
      out.push(open.length ? { ...seg, marks: [...open] } : seg);
      continue;
    }
    let buf = '';
    const flush = (): void => {
      if (!buf) return;
      out.push(open.length ? { text: buf, marks: [...open] } : { text: buf });
      buf = '';
    };
    for (let i = 0; i < seg.text.length; i++) {
      const two = seg.text.slice(i, i + 2);
      const one = seg.text[i]!;
      const token = INLINE_MARKS[two] ? two : INLINE_MARKS[one] ? one : '';
      if (token) {
        flush();
        const at = open.lastIndexOf(INLINE_MARKS[token]!);
        if (at >= 0) open.splice(at, 1);
        else open.push(INLINE_MARKS[token]!);
        i += token.length - 1;
        continue;
      }
      buf += one;
    }
    flush();
  }
  return out;
}

/** The text with inline marks removed, for measuring. */
export function stripInline(text: string): string {
  return text.replace(/\*\*|~~|==|\*/g, '');
}

/** A word may carry a code: `λόγος^N-----NSM-`. Backslash escapes the sigil. */
export const MORPH_CODE_RE = /^\^([A-Za-z]{1,2}-?[A-Za-z1-3-]{0,8})/;

/** Index in `s` where the last whitespace-delimited token begins. */
export function lastTokenStart(s: string): number {
  const m = /\s(?=\S*$)/.exec(s);
  return m ? m.index + 1 : 0;
}

/**
 * Split text into segments, attaching each `^CODE` to the token immediately before it. Tokens are
 * runs of non-space characters. An unparseable code is left in the text untouched.
 */
export function tokenizeMorph(text: string): MorphSegment[] {
  if (!text.includes('^')) return [{ text }];
  const segments: MorphSegment[] = [];
  let buf = '';
  let tokenStart = 0; // index in buf where the current token began
  let i = 0;
  const flush = (): void => {
    if (buf) segments.push({ text: buf });
    buf = '';
    tokenStart = 0;
  };
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === '\\' && text[i + 1] === '^') {
      buf += '^';
      i += 2;
      continue;
    }
    if (ch === '^') {
      const m = MORPH_CODE_RE.exec(text.slice(i));
      const parsed = m ? parseMorph(m[1]!) : null;
      if (parsed && buf.slice(tokenStart)) {
        const before = buf.slice(0, tokenStart);
        const token = buf.slice(tokenStart);
        if (before) segments.push({ text: before });
        segments.push({ text: token, morph: parsed });
        buf = '';
        tokenStart = 0;
        i += m![0].length;
        continue;
      }
      buf += ch;
      i += 1;
      continue;
    }
    buf += ch;
    if (/\s/.test(ch)) tokenStart = buf.length;
    i += 1;
  }
  flush();
  return segments.length ? segments : [{ text: '' }];
}

/** The text as it should be displayed and measured, with codes removed. */
export function stripMorph(text: string): string {
  return tokenizeMorph(text)
    .map((s) => s.text)
    .join('');
}

/** True when the text carries at least one valid code. */
export function hasMorph(text: string): boolean {
  return tokenizeMorph(text).some((s) => s.morph);
}

/* ---------------------------------------------------------------------------------------------
 * Optional lexicon hook. The diagram package ships no word list; a host (the Obsidian plugin)
 * installs a provider so tagged words can also show their lemma and gloss.
 * ------------------------------------------------------------------------------------------- */

export interface MorphInfo {
  lemma?: string;
  gloss?: string;
}

export type MorphInfoProvider = (word: string) => MorphInfo | null;

let infoProvider: MorphInfoProvider | null = null;

export function setMorphInfoProvider(provider: MorphInfoProvider | null): void {
  infoProvider = provider;
}

export function morphInfo(word: string): MorphInfo | null {
  if (!infoProvider) return null;
  try {
    return infoProvider(word);
  } catch {
    return null;
  }
}

/** Tooltip for a tagged word: "λόγος — word, speech · noun · nominative · singular · masculine". */
export function morphTitle(word: string, m: Morph): string {
  const info = morphInfo(word);
  const head = [info?.lemma, info?.gloss].filter(Boolean).join(' — ');
  return head ? `${head} · ${morphLabel(m)}` : morphLabel(m);
}

/** The attributes every tagged word carries, in every renderer. */
export function morphAttributes(word: string, m: Morph): Record<string, string> {
  const info = morphInfo(word);
  const attrs: Record<string, string> = {
    class: morphClasses(m).join(' '),
    'data-morph': m.code,
    title: morphTitle(word, m),
  };
  if (info?.lemma) attrs['data-lemma'] = info.lemma;
  if (info?.gloss) attrs['data-gloss'] = info.gloss;
  return attrs;
}
