/**
 * Cell text formatting. The renderer asks the active formatter for DOM nodes for each cell,
 * so a host (e.g. the Obsidian plugin) can substitute its own Markdown engine.
 */

export interface FormatContext {
  ownerDoc: Document;
  /** Column name as declared by `columns`, or '' for the unnamed single column. */
  column: string;
  ref: string;
}

export interface CellFormatter {
  format(text: string, ctx: FormatContext): Node | Promise<Node>;
}

import { lastTokenStart, morphClasses, morphLabel, MORPH_CODE_RE, parseMorph } from './morph.js';

const XHTML_NS = 'http://www.w3.org/1999/xhtml';

/**
 * Built-in inline subset, host-independent:
 *   **bold** or __bold__  *italic* or _italic_  ~~strike~~  ==highlight==  `code`
 *   |   red proposition-boundary bar
 *   {…} blue square brackets around the text
 *   \x  literal x
 *   word^V-3AAI-P--  MorphGNT morphology tag on the preceding token (see morph.ts)
 */
export interface InlineOptions {
  /**
   * Recognise Style Obmd colour keys (https://github.com/penyt/obsidian-style-obmd):
   * `=={r}text==` and `**{b}text**` with keys r o y g b p gray. Emits the same
   * `cmk-mark`/`cmk-bold` + `cmk-<key>` classes as that plugin so its stylesheet and colour
   * settings apply in Obsidian; the diagram ships fallback colours for other hosts.
   * Also turns `__text__` into an underline (`__{r}text__` coloured), an extension Style Obmd lacks.
   */
  obmdColors?: boolean;
}

/** Underline extension of the Obmd mode: `__{r}text__` (coloured) or `__text__` (plain). */
const UNDERLINE: Mark = { tag: 'u', cls: 'cmk-underline' };

export function createInlineFormatter(opts: InlineOptions = {}): CellFormatter {
  return {
    format(text, ctx) {
      return formatInline(text, ctx.ownerDoc, opts);
    },
  };
}

export const defaultFormatter: CellFormatter = createInlineFormatter();

const OBMD_KEYS = new Set(['r', 'o', 'y', 'g', 'b', 'p', 'gray']);
const OBMD_KEY_RE = /^\{([A-Za-z]+)\}/;

/** Colour key immediately following a `==` or `**` opener, or null. */
export function obmdKeyAt(text: string, i: number): { key: string; length: number } | null {
  const m = OBMD_KEY_RE.exec(text.slice(i, i + 8));
  if (!m) return null;
  const key = m[1]!.toLowerCase();
  return OBMD_KEYS.has(key) ? { key, length: m[0].length } : null;
}

let activeFormatter: CellFormatter = defaultFormatter;

export function setCellFormatter(formatter: CellFormatter | null): void {
  activeFormatter = formatter ?? defaultFormatter;
}

export function getCellFormatter(): CellFormatter {
  return activeFormatter;
}

type Mark = { tag: string; cls?: string };
const MARKS: Record<string, Mark> = {
  '**': { tag: 'strong' },
  '__': { tag: 'strong' },
  '*': { tag: 'em' },
  '_': { tag: 'em' },
  '~~': { tag: 'del' },
  '==': { tag: 'mark' },
  '`': { tag: 'code' },
};

export function formatInline(text: string, ownerDoc: Document, opts: InlineOptions = {}): DocumentFragment {
  const frag = ownerDoc.createDocumentFragment();
  const stack: { token: string; el: Element }[] = [];
  let container: Node = frag;
  let buf = '';

  const mk = (tag: string, cls?: string): Element => {
    const e = ownerDoc.createElementNS(XHTML_NS, tag);
    if (cls) e.setAttribute('class', cls);
    return e;
  };
  const flush = (): void => {
    if (buf) container.appendChild(ownerDoc.createTextNode(buf));
    buf = '';
  };
  const open = (token: string, mark: Mark): void => {
    flush();
    const el = mk(mark.tag, mark.cls);
    container.appendChild(el);
    stack.push({ token, el });
    container = el;
  };
  const close = (): void => {
    flush();
    stack.pop();
    container = stack.length ? stack[stack.length - 1]!.el : frag;
  };
  const innermost = (): string | undefined => stack[stack.length - 1]?.token;
  const inCode = (): boolean => innermost() === '`';

  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    const two = text.slice(i, i + 2);

    if (ch === '\\' && i + 1 < text.length) {
      buf += text[i + 1];
      i += 2;
      continue;
    }
    if (two === '[[') {
      // Wiki-link: pass through verbatim so a host Markdown renderer (or plain text) gets it intact.
      const end = text.indexOf(']]', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      buf += text.slice(i, stop);
      i = stop;
      continue;
    }
    if (inCode()) {
      if (ch === '`') close();
      else buf += ch;
      i++;
      continue;
    }
    if (ch === '^') {
      // Morphology tag: `word^V-3AAI-P--` becomes a span of classes around the preceding token.
      const m = MORPH_CODE_RE.exec(text.slice(i));
      const morph = m ? parseMorph(m[1]!) : null;
      const start = lastTokenStart(buf);
      if (morph && buf.slice(start)) {
        const token = buf.slice(start);
        buf = buf.slice(0, start);
        flush();
        const span = mk('span', morphClasses(morph).join(' '));
        span.setAttribute('data-morph', morph.code);
        span.setAttribute('title', morphLabel(morph));
        span.textContent = token;
        container.appendChild(span);
        i += m![0].length;
        continue;
      }
    }
    if (MARKS[two] && (two !== '__' || isWordBoundaryUnderscore(text, i, 2))) {
      if (innermost() === two) {
        close();
        i += 2;
        continue;
      }
      const base = opts.obmdColors && two === '__' ? UNDERLINE : MARKS[two]!;
      const colour = opts.obmdColors && (two === '==' || two === '**' || two === '__') ? obmdKeyAt(text, i + 2) : null;
      if (colour) {
        const kind = two === '==' ? 'cmk-mark' : two === '**' ? 'cmk-bold' : 'cmk-underline';
        open(two, { tag: base.tag, cls: `${kind} cmk-${colour.key}` });
        i += 2 + colour.length;
      } else {
        open(two, base);
        i += 2;
      }
      continue;
    }
    if (MARKS[ch] && (ch !== '_' || isWordBoundaryUnderscore(text, i))) {
      if (innermost() === ch) close();
      else open(ch, MARKS[ch]!);
      i++;
      continue;
    }
    if (ch === '|') {
      flush();
      const bar = mk('span', 'bracket-bar');
      bar.textContent = '|';
      container.appendChild(bar);
      i++;
      continue;
    }
    if (ch === '{') {
      flush();
      const wrap = mk('span', 'bracket-bkt');
      const l = mk('span', 'bracket-bkt-mark');
      l.textContent = '[';
      wrap.appendChild(l);
      container.appendChild(wrap);
      stack.push({ token: '{', el: wrap });
      container = wrap;
      i++;
      continue;
    }
    if (ch === '}' && innermost() === '{') {
      flush();
      const r = mk('span', 'bracket-bkt-mark');
      r.textContent = ']';
      container.appendChild(r);
      close();
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return frag;
}

/** `_` / `__` only toggle at a word boundary, so snake_case and dunder__names stay literal. */
function isWordBoundaryUnderscore(text: string, i: number, width = 1): boolean {
  const prev = text[i - 1] ?? ' ';
  const next = text[i + width] ?? ' ';
  return /\s|^$|[(\[{"']/.test(prev) || /\s|[)\]}.,;:!?"']/.test(next);
}
