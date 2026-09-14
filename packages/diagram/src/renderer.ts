import type { BracketDb } from './db.js';
import { DEFAULT_LAYOUT, layoutDocument } from './layout.js';
import type { Layout, LayoutConfig } from './layout.js';
import type { BracketDocument } from './model.js';
import { getConfig, log } from './mermaidUtils.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const STAR = '★';

export interface BracketConfig extends Partial<LayoutConfig> {
  useMaxWidth?: boolean;
}

let programmaticDefaults: BracketConfig = {};

/**
 * Host-level defaults (e.g. from an Obsidian settings tab). Precedence, lowest to highest:
 * DEFAULT_LAYOUT → these defaults → Mermaid `getConfig().bracket` (if the host allows it) →
 * `config` lines inside the diagram.
 */
export function setBracketDefaults(defaults: BracketConfig): void {
  programmaticDefaults = { ...defaults };
}

/** Mermaid DrawDefinition: render the parsed document into the SVG element Mermaid created. */
export function draw(_text: string, id: string, _version: string, diagObj: { db: unknown }): void {
  const svg = findSvg(id);
  if (!svg) throw new Error(`bracket: svg #${id} not found`);
  const db = diagObj.db as BracketDb;
  const doc = db.getDocument();
  const title = db.getDiagramTitle() || doc.title;
  const mermaidCfg = (getConfig().bracket ?? {}) as BracketConfig;
  const userCfg: BracketConfig = {
    ...stripUndefined(programmaticDefaults),
    ...stripUndefined(mermaidCfg),
    ...(doc.options as BracketConfig),
  };
  const cfg: LayoutConfig = { ...DEFAULT_LAYOUT, ...stripUndefined(userCfg) };
  const ownerDoc = svg.ownerDocument;

  const root = el(ownerDoc, 'g', { class: 'bracket-diagram' });
  svg.appendChild(root);

  // 1. Create cells and measure their text heights in the live DOM.
  const cellWidth = cfg.columnWidth - 2 * cfg.cellPadding;
  const cells = new Map<string, { fo: SVGForeignObjectElement; div: HTMLElement; col: number }[]>();
  const heights = new Map<string, number>();
  for (const row of doc.rows.values()) {
    const list: { fo: SVGForeignObjectElement; div: HTMLElement; col: number }[] = [];
    let tallest = 0;
    row.cells.forEach((text, col) => {
      if (!text) return;
      const fo = el(ownerDoc, 'foreignObject', { x: 0, y: 0, width: cellWidth, height: 10000 }) as SVGForeignObjectElement;
      const div = ownerDoc.createElementNS(XHTML_NS, 'div') as HTMLElement;
      div.setAttribute('class', `bracket-cell bracket-col-${col} bracket-col-${cssToken(doc.columns[col] ?? '')}`);
      div.setAttribute('style', `width:${cellWidth}px`);
      div.textContent = text;
      fo.appendChild(div);
      root.appendChild(fo);
      list.push({ fo, div, col });
      tallest = Math.max(tallest, measureHeight(div, text, cellWidth));
    });
    cells.set(row.ref, list);
    heights.set(row.ref, tallest);
  }

  // 2. Lay out.
  const layout = layoutDocument({ ...doc, title }, heights, cfg);

  // 3. Table: header, cell boxes, cells, refs.
  if (title) {
    root.appendChild(text(ownerDoc, cfg.padding, cfg.padding + 18, title, 'bracket-title'));
  }
  const headerY = layout.tableY - 5;
  doc.columns.forEach((name, i) => {
    if (!name) return;
    root.appendChild(text(ownerDoc, layout.columnXs[i]! + cfg.columnWidth / 2, headerY, name, 'bracket-colhead'));
  });
  for (const rowBox of layout.rows) {
    doc.columns.forEach((_, col) => {
      root.appendChild(
        el(ownerDoc, 'rect', {
          class: 'bracket-cell-box',
          x: layout.columnXs[col]!,
          y: rowBox.y,
          width: cfg.columnWidth,
          height: rowBox.height,
        }),
      );
    });
    for (const c of cells.get(rowBox.ref) ?? []) {
      c.fo.setAttribute('x', String(layout.columnXs[c.col]! + cfg.cellPadding));
      c.fo.setAttribute('y', String(rowBox.y + cfg.cellPadding));
      c.fo.setAttribute('height', String(Math.max(1, rowBox.height - 2 * cfg.cellPadding)));
      root.appendChild(c.fo); // move above the rects
    }
    root.appendChild(refText(ownerDoc, layout.refX, rowBox.y + 16, rowBox.ref, cfg.refWrapAt));
  }

  // 4. Brackets.
  drawBrackets(ownerDoc, root, layout);

  // 5. Size the svg.
  svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
  if (userCfg.useMaxWidth ?? true) {
    svg.setAttribute('width', '100%');
    svg.setAttribute('style', `max-width: ${layout.width}px;`);
  } else {
    svg.setAttribute('width', String(layout.width));
    svg.setAttribute('height', String(layout.height));
  }
  log.debug('bracket: rendered', { rows: layout.rows.length, brackets: layout.brackets.length });
}

function drawBrackets(ownerDoc: Document, root: SVGElement, layout: Layout): void {
  for (const b of layout.brackets) {
    const g = el(ownerDoc, 'g', { class: `bracket bracket-${b.group}` });
    g.appendChild(el(ownerDoc, 'path', { class: `bracket-bar bracket-${b.group}`, d: `M ${b.x} ${b.y1} V ${b.y2}` }));
    for (const arm of b.arms) {
      g.appendChild(el(ownerDoc, 'path', { class: `bracket-arm bracket-${b.group}`, d: `M ${arm.x1} ${arm.y} H ${arm.x2}` }));
      // Coordinate brackets carry their label on the bar, so push arm markers right to clear it.
      let lx = arm.x1 + (b.coordinate ? 14 : 4);
      if (arm.star) {
        g.appendChild(text(ownerDoc, lx, arm.y - 3, STAR, 'bracket-star'));
        lx += 10;
      }
      if (arm.label) {
        g.appendChild(text(ownerDoc, lx, arm.y - 3, arm.label, `bracket-label bracket-${b.group}`));
      }
    }
    if (b.label) {
      g.appendChild(text(ownerDoc, b.x + 5, b.labelY + 4, b.label, `bracket-label bracket-${b.group}`));
    }
    root.appendChild(g);
  }
}

/** Verse reference; long ranges wrap after the hyphen ("21-" / "22a") as in Biblearc exports. */
function refText(ownerDoc: Document, x: number, y: number, ref: string, wrapAt: number): SVGTextElement {
  const t = el(ownerDoc, 'text', { x, y, class: 'bracket-ref' }) as SVGTextElement;
  const m = ref.length > wrapAt ? /^([^-–]+[-–])(.+)$/.exec(ref) : null;
  if (!m) {
    t.textContent = ref;
    return t;
  }
  const first = el(ownerDoc, 'tspan', { x, dy: 0 });
  first.textContent = m[1]!;
  const second = el(ownerDoc, 'tspan', { x, dy: '1.15em' });
  second.textContent = m[2]!;
  t.appendChild(first);
  t.appendChild(second);
  return t;
}

function cssToken(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'unnamed';
}

function findSvg(id: string): SVGSVGElement | null {
  if (typeof document === 'undefined') return null;
  const iframe = document.getElementById(`i${id}`) as HTMLIFrameElement | null; // sandbox mode
  const doc = iframe?.contentDocument ?? document;
  return doc.getElementById(id) as SVGSVGElement | null;
}

/** Height of a cell's text. Uses the live layout when available, otherwise a rough estimate. */
function measureHeight(div: HTMLElement, textContent: string, width: number): number {
  let h = 0;
  try {
    h = div.getBoundingClientRect().height;
  } catch {
    h = 0;
  }
  if (h > 0) return h;
  const charsPerLine = Math.max(10, Math.floor(width / 7));
  const lines = Math.max(1, Math.ceil(textContent.length / charsPerLine));
  return lines * 17;
}

function el(ownerDoc: Document, name: string, attrs: Record<string, string | number>): SVGElement {
  const node = ownerDoc.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function text(ownerDoc: Document, x: number, y: number, content: string, cls: string): SVGTextElement {
  const t = el(ownerDoc, 'text', { x, y, class: cls }) as SVGTextElement;
  t.textContent = content;
  return t;
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export type { BracketDocument };
