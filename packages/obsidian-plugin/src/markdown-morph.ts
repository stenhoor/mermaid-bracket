/**
 * Morphology tags in ordinary note text, not just in diagrams.
 *
 * `tagMorphInElement` runs over rendered reading-view markup and wraps `word^CODE` tokens in spans;
 * `bakeMorphTags` does the same to the note's source text, so the formatting survives export or
 * uninstalling the plugin. Neither imports from `obsidian`, so both are unit-testable.
 */
import { morphAttributes, tokenizeMorph } from '@mermaid-bracket/diagram';
import type { Morph } from '@mermaid-bracket/diagram';

/** Elements whose text must be left alone: code, existing diagrams, already-tagged spans. */
const SKIP_SELECTOR = 'code, pre, svg, .bracket-cell, .gk, .internal-link, .cm-inline-code';

export function spanAttributes(m: Morph, word: string): Record<string, string> {
  return morphAttributes(word, m);
}

/** Wrap every tagged token inside `el` in a span. Returns how many tags were applied. */
export function tagMorphInElement(el: HTMLElement): number {
  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      const text = node.nodeValue ?? '';
      if (!text.includes('^')) return NodeFilter.FILTER_REJECT;
      if ((node.parentElement as Element | null)?.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) targets.push(node as Text);

  let applied = 0;
  for (const textNode of targets) {
    const segments = tokenizeMorph(textNode.nodeValue ?? '');
    if (!segments.some((s) => s.morph)) continue;
    const frag = doc.createDocumentFragment();
    for (const seg of segments) {
      if (!seg.text) continue;
      if (!seg.morph) {
        frag.appendChild(doc.createTextNode(seg.text));
        continue;
      }
      const span = doc.createElement('span');
      for (const [k, v] of Object.entries(spanAttributes(seg.morph, seg.text))) span.setAttribute(k, v);
      span.textContent = seg.text;
      frag.appendChild(span);
      applied++;
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
  return applied;
}

const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})/;

/**
 * Apply `fn` to every stretch of Markdown that is not a fenced code block or inline code, leaving
 * those untouched. Shared by the bake command and by automatic tagging.
 */
export function mapOutsideCode(markdown: string, fn: (text: string) => string): string {
  let fence: string | null = null;
  return markdown
    .split('\n')
    .map((line) => {
      const m = FENCE_RE.exec(line);
      if (fence) {
        if (m && line.trim().startsWith(fence)) fence = null;
        return line;
      }
      if (m) {
        fence = m[1]!.slice(0, 3);
        return line;
      }
      return line
        .split(/(`+[^`]*`+)/g)
        .map((part, i) => (i % 2 === 1 ? part : fn(part)))
        .join('');
    })
    .join('\n');
}

/**
 * Rewrite tags in Markdown source as HTML spans, skipping fenced code blocks and inline code.
 * Returns the new text and the number of tags converted.
 */
export function bakeMorphTags(markdown: string): { text: string; count: number } {
  let count = 0;
  const text = mapOutsideCode(markdown, (part) => {
    if (!part.includes('^')) return part;
    const segments = tokenizeMorph(part);
    if (!segments.some((s) => s.morph)) return part;
    return segments
      .map((seg) => {
        if (!seg.morph) return seg.text;
        count++;
        const attrs = Object.entries(spanAttributes(seg.morph, seg.text))
          .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
          .join(' ');
        return `<span ${attrs}>${escapeText(seg.text)}</span>`;
      })
      .join('');
  });
  return { text, count };
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
