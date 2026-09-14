import { MarkdownRenderer } from 'obsidian';
import type { App, Component } from 'obsidian';
import { obmdKeyAt } from '@mermaid-bracket/diagram';
import type { CellFormatter, FormatContext } from '@mermaid-bracket/diagram';

/**
 * Cell formatter that runs Obsidian's own Markdown renderer, so cells get wiki-links, tags,
 * footnotes and any post-processors other plugins register. The two bracket-specific marks
 * (`|` bar and `{…}` blue brackets) are converted to inline HTML first, since Obsidian
 * Markdown has no equivalent. Backslash-escaped characters stay literal.
 *
 * Mermaid's draw hook does not receive the note path, so links resolve relative to the
 * active file; that is correct whenever the diagram is in the note being viewed.
 */
export function createObsidianFormatter(app: App, owner: Component): CellFormatter {
  return {
    async format(text: string, ctx: FormatContext): Promise<Node> {
      const host = ctx.ownerDoc.createElement('div');
      const sourcePath = app.workspace.getActiveFile()?.path ?? '';
      await MarkdownRenderer.render(app, preconvertMarks(text), host, sourcePath, owner);
      // Obsidian wraps inline text in <p>; unwrap a single paragraph so cells stay compact.
      const frag = ctx.ownerDoc.createDocumentFragment();
      const kids = Array.from(host.childNodes);
      if (kids.length === 1 && kids[0] instanceof HTMLParagraphElement) {
        for (const n of Array.from(kids[0].childNodes)) frag.appendChild(n);
      } else {
        for (const n of kids) frag.appendChild(n);
      }
      return frag;
    },
  };
}

/** `|` → red bar span, `{…}` → blue bracket spans; `\|`, `\{`, `\}` stay literal. */
export function preconvertMarks(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '\\' && i + 1 < text.length) {
      out += ch + text[i + 1];
      i++;
    } else if (ch === '[' && text[i + 1] === '[') {
      // Wiki-link: leave intact, including an alias pipe.
      const end = text.indexOf(']]', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop);
      i = stop - 1;
    } else if (ch === '|') {
      out += '<span class="bracket-bar">|</span>';
    } else if (ch === '{' && /(==|\*\*|__)$/.test(text.slice(0, i)) && obmdKeyAt(text, i)) {
      // Style Obmd colour key right after a highlight/bold opener: leave for that plugin's post-processor.
      const { length } = obmdKeyAt(text, i)!;
      out += text.slice(i, i + length);
      i += length - 1;
    } else if (ch === '{') {
      out += '<span class="bracket-bkt"><span class="bracket-bkt-mark">[</span>';
    } else if (ch === '}') {
      out += '<span class="bracket-bkt-mark">]</span></span>';
    } else {
      out += ch;
    }
  }
  return out;
}
