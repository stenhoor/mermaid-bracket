/**
 * The bundled MorphGNT index: automatic tagging, hover glosses and passage glossaries.
 *
 * Matching is on the word, never on its position. A word is tagged only when the corpus attests a
 * single parse for it, or when the candidate parses agree on some features, in which case only the
 * agreed features are written. Anything else is left for you to tag by hand.
 */
import { decodeGreekIndex, GREEK_WORD_RE, lookupWord, MORPH_CODE_RE } from '@mermaid-bracket/diagram';
import type { GreekIndex, MorphInfo, WordInfo } from '@mermaid-bracket/diagram';
import { GREEK_DATA } from './data/greek-data.js';
import { mapOutsideCode } from './markdown-morph.js';

let cached: GreekIndex | null = null;

/** Decoded on first use, so a vault that never touches Greek pays nothing. */
export function greekIndex(): GreekIndex {
  if (!cached) cached = decodeGreekIndex(GREEK_DATA);
  return cached;
}

/** Lemma and gloss for a word, for the hover tooltip. */
export function wordInfo(word: string): MorphInfo | null {
  const found = lookupWord(greekIndex(), word);
  if (!found) return null;
  const info: MorphInfo = {};
  if (found.lemmas.length) info.lemma = found.lemmas.slice(0, 3).join(' / ');
  if (found.glosses.length) info.gloss = found.glosses.slice(0, 3).join('; ');
  return info.lemma || info.gloss ? info : null;
}

export interface AutoTagResult {
  text: string;
  /** Words given a full parse, because the corpus attests only one. */
  tagged: number;
  /** Words given a partial parse, because the candidates agreed on some features only. */
  partial: number;
  /** Forms left alone, and how often each occurred. */
  skipped: Map<string, number>;
}

export interface AutoTagOptions {
  /** Write partial codes when candidate parses agree on some features. Default true. */
  allowPartial?: boolean;
  /** Re-tag words that already carry a hand-written code. Default false. */
  overwrite?: boolean;
}

/**
 * Add `^CODE` tags to the Greek words in Markdown text, leaving code blocks and inline code alone.
 */
export function autoTagGreek(markdown: string, index: GreekIndex, opts: AutoTagOptions = {}): AutoTagResult {
  const allowPartial = opts.allowPartial ?? true;
  let tagged = 0;
  let partial = 0;
  const skipped = new Map<string, number>();
  const miss = (form: string): void => {
    skipped.set(form, (skipped.get(form) ?? 0) + 1);
  };

  const text = mapOutsideCode(markdown, (chunk) => {
    GREEK_WORD_RE.lastIndex = 0;
    let out = '';
    let last = 0;
    for (const m of chunk.matchAll(GREEK_WORD_RE)) {
      const word = m[0];
      const start = m.index ?? 0;
      const after = chunk.slice(start + word.length);
      out += chunk.slice(last, start) + word;
      last = start + word.length;

      const alreadyTagged = MORPH_CODE_RE.test(after);
      if (alreadyTagged && !opts.overwrite) continue;

      const found: WordInfo | null = lookupWord(index, word);
      const agreed = found?.agreed;
      if (!agreed || (!agreed.exact && !allowPartial)) {
        miss(word);
        continue;
      }
      if (alreadyTagged) {
        const existing = MORPH_CODE_RE.exec(after)![0];
        last += existing.length;
      }
      out += `^${agreed.code}`;
      if (agreed.exact) tagged++;
      else partial++;
    }
    return out + chunk.slice(last);
  });

  return { text, tagged, partial, skipped };
}

export interface GlossaryRow {
  lemma: string;
  gloss: string;
  count: number;
  forms: string[];
  /** The part of speech this lemma is used as most often in the corpus, e.g. "C-" or "RA". */
  pos: string;
  /** True when the forms could belong to more than one lemma. */
  uncertain: boolean;
}

export interface GlossaryOptions {
  /** Alphabetical by lemma (the default) or commonest first. */
  sort?: 'lemma' | 'frequency';
  /** Parts of speech to leave out, e.g. ['C-', 'RA'] for conjunctions and the article. */
  excludePos?: readonly string[];
}

/** Collect the vocabulary of a passage: one row per lemma, with its gloss and frequency. */
export function buildGlossary(markdown: string, index: GreekIndex, opts: GlossaryOptions = {}): GlossaryRow[] {
  const exclude = new Set(opts.excludePos ?? []);
  const byLemma = new Map<string, GlossaryRow>();
  mapOutsideCode(markdown, (chunk) => {
    for (const m of chunk.matchAll(GREEK_WORD_RE)) {
      const word = m[0];
      const found = lookupWord(index, word);
      if (!found?.lemmas.length) continue;
      const lemma = found.lemmas[0]!;
      const pos = found.lemmaPos[0] ?? '';
      if (exclude.has(pos)) continue;
      let row = byLemma.get(lemma);
      if (!row) {
        byLemma.set(
          lemma,
          (row = {
            lemma,
            gloss: found.glosses[0] ?? '',
            count: 0,
            forms: [],
            pos,
            uncertain: found.lemmas.length > 1,
          }),
        );
      }
      row.count++;
      if (!row.forms.includes(word)) row.forms.push(word);
      if (found.lemmas.length > 1) row.uncertain = true;
    }
    return chunk;
  });
  const rows = [...byLemma.values()];
  return opts.sort === 'frequency'
    ? rows.sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma, 'el'))
    : rows.sort((a, b) => a.lemma.localeCompare(b.lemma, 'el'));
}

/** Conjunctions and the definite article: what the frequency glossary leaves out. */
export const FUNCTION_WORD_POS = ['C-', 'RA'] as const;

export interface GlossaryFormat {
  style: 'table' | 'list';
  includeCounts: boolean;
  includeForms: boolean;
}

export function renderGlossary(rows: GlossaryRow[], fmt: GlossaryFormat): string {
  if (rows.length === 0) return '';
  const mark = (r: GlossaryRow): string => (r.uncertain ? `${r.lemma} (?)` : r.lemma);
  if (fmt.style === 'list') {
    return rows
      .map((r) => {
        const bits = [`**${mark(r)}** — ${r.gloss || '(no gloss)'}`];
        if (fmt.includeCounts) bits.push(`×${r.count}`);
        if (fmt.includeForms) bits.push(`_${r.forms.join(', ')}_`);
        return `- ${bits.join(' · ')}`;
      })
      .join('\n');
  }
  const head = ['Lemma', 'Gloss'];
  if (fmt.includeCounts) head.push('Count');
  if (fmt.includeForms) head.push('Forms');
  const lines = [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`];
  for (const r of rows) {
    const cells = [mark(r), r.gloss || ''];
    if (fmt.includeCounts) cells.push(String(r.count));
    if (fmt.includeForms) cells.push(r.forms.join(', '));
    lines.push(`| ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}
