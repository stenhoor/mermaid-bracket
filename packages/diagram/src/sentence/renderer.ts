import { getConfig, log } from '../mermaidUtils.js';
import type { SentenceDb } from './db.js';
import { DEFAULT_SENTENCE, layoutSentence } from './layout.js';
import type { Measure, Prim, SentenceConfig } from './layout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface SentenceUserConfig extends Partial<SentenceConfig> {
  useMaxWidth?: boolean;
}

let programmaticDefaults: SentenceUserConfig = {};
export function setSentenceDefaults(defaults: SentenceUserConfig): void {
  programmaticDefaults = { ...defaults };
}

export function drawSentence(_text: string, id: string, _version: string, diagObj: { db: unknown }): void {
  const svg = findSvg(id);
  if (!svg) throw new Error(`sentence: svg #${id} not found`);
  const db = diagObj.db as SentenceDb;
  const doc = db.getDocument();
  const title = db.getDiagramTitle() || doc.title;
  const mermaidCfg = (getConfig().sentence ?? {}) as SentenceUserConfig;
  const user: SentenceUserConfig = { ...strip(programmaticDefaults), ...strip(mermaidCfg), ...(doc.options as SentenceUserConfig) };
  const cfg: SentenceConfig = { ...DEFAULT_SENTENCE, ...strip(user) };
  const ownerDoc = svg.ownerDocument;

  const root = el(ownerDoc, 'g', { class: 'sentence-diagram', style: `--sentence-font-size:${cfg.fontSize}px` });
  svg.appendChild(root);

  const probe = el(ownerDoc, 'text', { x: -10000, y: -10000 }) as SVGTextElement;
  root.appendChild(probe);
  const layout = layoutSentence({ ...doc, title }, makeMeasure(probe, cfg.fontSize), cfg);
  probe.remove();
  for (const p of layout.prims) root.appendChild(prim(ownerDoc, p));

  const w = Math.ceil(layout.width);
  const h = Math.ceil(layout.height);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  if (user.useMaxWidth ?? false) {
    svg.setAttribute('width', '100%');
    svg.setAttribute('style', `max-width: ${w}px;`);
  } else {
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
  }
  log.debug('sentence: rendered', { prims: layout.prims.length });
}

/** Measures with a hidden <text> in the live svg; falls back to an estimate when layout is unavailable. */
function makeMeasure(probe: SVGTextElement, fs: number): Measure {
  const cache = new Map<string, number>();
  return (text, cls) => {
    const key = `${cls}|${text}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    probe.setAttribute('class', `sd-${cls}`);
    probe.textContent = text;
    let w = 0;
    try {
      w = typeof probe.getComputedTextLength === 'function' ? probe.getComputedTextLength() : 0;
    } catch {
      w = 0;
    }
    if (!(w > 0)) w = text.length * fs * 0.55;
    cache.set(key, w);
    return w;
  };
}

function prim(ownerDoc: Document, p: Prim): SVGElement {
  if (p.kind === 'line') {
    return el(ownerDoc, 'line', { class: `sd-${p.style}`, x1: r(p.x1), y1: r(p.y1), x2: r(p.x2), y2: r(p.y2) });
  }
  const t = el(ownerDoc, 'text', { class: `sd-${p.cls}`, x: r(p.x), y: r(p.y) });
  if (p.anchor) t.setAttribute('text-anchor', p.anchor);
  t.setAttribute('xml:space', 'preserve');
  t.textContent = p.text;
  return t;
}

function r(n: number): string {
  return String(Math.round(n * 10) / 10);
}

function findSvg(id: string): SVGSVGElement | null {
  if (typeof document === 'undefined') return null;
  const iframe = document.getElementById(`i${id}`) as HTMLIFrameElement | null;
  const doc = iframe?.contentDocument ?? document;
  return doc.getElementById(id) as SVGSVGElement | null;
}

function el(ownerDoc: Document, name: string, attrs: Record<string, string | number>): SVGElement {
  const node = ownerDoc.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function strip<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
