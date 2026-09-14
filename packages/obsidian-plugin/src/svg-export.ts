/**
 * Turn a rendered bracket diagram <svg> into a standalone document and raster it.
 * No Obsidian imports here so it can be unit-tested in jsdom.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const OBMD_KEYS = ['r', 'o', 'y', 'g', 'b', 'p', 'gray'];

export interface StandaloneSvg {
  markup: string;
  width: number;
  height: number;
  title: string;
}

/** Is this element (or an ancestor) a bracket diagram's svg? */
export function findBracketSvg(target: Element | null): SVGSVGElement | null {
  const svg = target?.closest('svg') ?? null;
  return svg && svg.querySelector('.bracket-diagram') ? (svg as SVGSVGElement) : null;
}

/**
 * Clone the svg with explicit pixel size, XML namespaces, the resolved font family and any
 * Style Obmd colour variables inlined, so it renders the same outside Obsidian. By default the
 * HTML cells are flattened to native SVG text (see flattenCells) so the result is portable.
 */
export function toStandaloneSvg(svg: SVGSVGElement, opts: { flatten?: boolean } = {}): StandaloneSvg {
  const view = svg.ownerDocument.defaultView;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const { width, height } = svgSize(svg);
  if (opts.flatten ?? true) flattenCells(svg, clone);

  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.removeAttribute('style');
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const root = clone.querySelector('.bracket-diagram') as SVGElement | null;
  if (root && view) {
    const decl: string[] = [root.getAttribute('style') ?? ''];
    const cell = svg.querySelector('.bracket-cell');
    const font = cell ? view.getComputedStyle(cell).fontFamily : view.getComputedStyle(svg).fontFamily;
    if (font) decl.push(`font-family:${font}`);
    const bodyStyle = view.getComputedStyle(svg.ownerDocument.body);
    for (const k of OBMD_KEYS) {
      const v = bodyStyle.getPropertyValue(`--style-obmd-${k}`).trim();
      if (v) decl.push(`--style-obmd-${k}:${v}`);
    }
    root.setAttribute('style', decl.filter(Boolean).join(';'));
  }
  // The plugin stylesheet is not part of the svg; carry the one rule that matters.
  const style = svg.ownerDocument.createElementNS(SVG_NS, 'style');
  style.textContent = '.bracket-cell{font-family:inherit}';
  clone.insertBefore(style, clone.firstChild);

  const markup = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
  return { markup, width, height, title: diagramTitle(svg) };
}

export function svgSize(svg: SVGSVGElement): { width: number; height: number } {
  const vb = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  if (vb.length === 4 && vb.every((n) => Number.isFinite(n)) && vb[2]! > 0 && vb[3]! > 0) {
    return { width: Math.ceil(vb[2]!), height: Math.ceil(vb[3]!) };
  }
  const rect = svg.getBoundingClientRect();
  return { width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)) };
}

export function diagramTitle(svg: SVGSVGElement): string {
  return svg.querySelector('.bracket-title')?.textContent?.trim() || 'bracket';
}

/** Safe file basename from a diagram title, e.g. "Colossians 1:21–23" → "Colossians 1_21-23". */
export function fileBasename(title: string): string {
  return (
    title
      .replace(/[–—]/g, '-')
      .replace(/[\\/:*?"<>|#^[\]]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'bracket'
  );
}

/**
 * Replace each foreignObject cell in `clone` with native SVG text, using the line boxes the
 * browser laid out in `live`. Keeps font, weight, style, colour, underline/strike and highlight
 * backgrounds. Needed because Chromium taints a canvas drawn from an SVG that contains
 * foreignObject, and because office tools ignore foreignObject entirely. When layout data is
 * unavailable (e.g. jsdom) the foreignObject is left in place.
 */
export function flattenCells(live: SVGSVGElement, clone: SVGSVGElement): void {
  const doc = live.ownerDocument;
  const view = doc.defaultView;
  const ctm = live.getScreenCTM?.();
  if (!view || !ctm) return;
  const inverse = ctm.inverse();
  const toUser = (x: number, y: number): { x: number; y: number } => {
    const pt = new DOMPoint(x, y).matrixTransform(inverse);
    return { x: pt.x, y: pt.y };
  };

  const liveFos = Array.from(live.querySelectorAll('foreignObject'));
  const cloneFos = Array.from(clone.querySelectorAll('foreignObject'));
  if (liveFos.length !== cloneFos.length) return;

  liveFos.forEach((fo, idx) => {
    const g = doc.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'bracket-cell-flat');
    let fragments = 0;
    for (const run of textRuns(fo, view)) {
      const tl = toUser(run.left, run.top);
      const br = toUser(run.right, run.bottom);
      const w = br.x - tl.x;
      const h = br.y - tl.y;
      if (w <= 0 || h <= 0) continue;
      const fontPx = parseFloat(run.style.fontSize) * (h / (run.bottom - run.top)); // scale to user units
      if (run.background) {
        const rect = doc.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', fmt(tl.x));
        rect.setAttribute('y', fmt(tl.y));
        rect.setAttribute('width', fmt(w));
        rect.setAttribute('height', fmt(h));
        rect.setAttribute('fill', run.background);
        g.appendChild(rect);
      }
      const t = doc.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', fmt(tl.x));
      // Baseline sits about one descent above the bottom of the glyph box.
      t.setAttribute('y', fmt(br.y - fontPx * 0.22));
      t.setAttribute('font-family', run.style.fontFamily);
      t.setAttribute('font-size', fmt(fontPx));
      if (run.style.fontWeight !== '400' && run.style.fontWeight !== 'normal') t.setAttribute('font-weight', run.style.fontWeight);
      if (run.style.fontStyle !== 'normal') t.setAttribute('font-style', run.style.fontStyle);
      t.setAttribute('fill', run.style.color);
      const deco = run.style.textDecorationLine;
      if (deco && deco !== 'none') {
        t.setAttribute('text-decoration', deco);
        t.setAttribute('style', `text-decoration:${deco};text-decoration-color:${run.style.textDecorationColor}`);
      }
      t.setAttribute('xml:space', 'preserve');
      t.textContent = run.text;
      g.appendChild(t);
      fragments++;
    }
    if (fragments > 0) cloneFos[idx]!.replaceWith(g);
  });
}

interface TextRun {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  style: CSSStyleDeclaration;
  background: string | null;
}

/** Split every text node under `root` into per-line runs using per-character client rects. */
function textRuns(root: Element, view: Window): TextRun[] {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const runs: TextRun[] = [];
  const range = doc.createRange();
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue ?? '';
    const parent = node.parentElement;
    if (!parent || !text) continue;
    const style = view.getComputedStyle(parent);
    const background = highlightBackground(parent, view);
    let current: TextRun | null = null;
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue; // collapsed whitespace
      if (r.width === 0 && /\s/.test(text[i]!)) continue; // space swallowed at a wrap
      if (current && Math.abs(r.top - current.top) < 1) {
        current.text += text[i];
        current.right = Math.max(current.right, r.right);
        current.bottom = Math.max(current.bottom, r.bottom);
      } else {
        current = { text: text[i]!, left: r.left, top: r.top, right: r.right, bottom: r.bottom, style, background };
        runs.push(current);
      }
    }
  }
  return runs;
}

/** Background of the nearest highlighted ancestor (mark or coloured span), or null. */
function highlightBackground(el: Element, view: Window): string | null {
  let e: Element | null = el;
  while (e && !e.classList.contains('bracket-cell')) {
    const bg = view.getComputedStyle(e).backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
    e = e.parentElement;
  }
  return null;
}

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Rasterise standalone svg markup to a PNG blob; `scale` 2 gives crisp text in documents. */
export async function svgToPngBlob(
  standalone: StandaloneSvg,
  doc: Document,
  scale = 2,
  background = '#ffffff',
): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([standalone.markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('could not load the diagram as an image'));
      img.src = url;
    });
    const canvas = doc.createElement('canvas');
    canvas.width = Math.ceil(standalone.width * scale);
    canvas.height = Math.ceil(standalone.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
