import type { MorphSegment } from '../morph.js';
import { SLOT_ORDER } from './model.js';
import type { ApposMember, Clause, HangerGroup, HangerMember, SentenceDocument, Slot, SlotMember, SlotRole, Word } from './model.js';

/** Returns the rendered width of `text` in px for the given class (word, label, …). */
export type Measure = (text: string, cls: string) => number;

export interface SentenceConfig {
  fontSize: number;
  /** Slant length (both dx and dy) of terraces. */
  slant: number;
  /** Horizontal padding around words on a line. */
  pad: number;
  /** Vertical gap between stacked hangers / fork members. */
  gap: number;
  /** Vertical gap between clauses. */
  clauseGap: number;
  /** Width of the verse-reference gutter; 0 hides it. */
  gutter: number;
  padding: number;
  titleHeight: number;
}

export const DEFAULT_SENTENCE: SentenceConfig = {
  fontSize: 14,
  slant: 22,
  pad: 12,
  gap: 16,
  clauseGap: 52,
  gutter: 96,
  padding: 8,
  titleHeight: 34,
};

export type LineStyle = 'base' | 'line' | 'marker' | 'dotted' | 'guide';

export interface LinePrim {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  style: LineStyle;
}
export interface TextPrim {
  kind: 'text';
  x: number;
  y: number;
  text: string;
  /** When present the renderer draws these as tspans, so morphology classes survive. */
  segments?: MorphSegment[];
  cls: 'word' | 'appos' | 'eq' | 'conj' | 'verse' | 'title' | 'gen' | 'label';
  anchor?: 'start' | 'end' | 'middle';
}
export type Prim = LinePrim | TextPrim;

export interface SentenceLayout {
  width: number;
  height: number;
  prims: Prim[];
}

/** Axis-aligned box of a laid-out word, used for collision avoidance between slots. */
interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A subtree laid out in the caller's frame: its primitives, word boxes and extents. */
type VerseList = { y: number; text: string }[];

interface Sub {
  prims: Prim[];
  boxes: Box[];
  /** Verse labels found in this subtree, in the same frame as prims. */
  verses: VerseList;
  /** Height below the attach line. */
  height: number;
  right: number;
  left: number;
}

export function layoutSentence(doc: SentenceDocument, measure: Measure, cfg: SentenceConfig = DEFAULT_SENTENCE): SentenceLayout {
  const prims: Prim[] = [];
  const fs = cfg.fontSize;
  const x0 = cfg.padding + cfg.gutter;
  let y = cfg.padding + (doc.title ? cfg.titleHeight : 0);
  if (doc.title) prims.push({ kind: 'text', x: cfg.padding, y: cfg.padding + fs + 4, text: doc.title, cls: 'title' });
  let maxRight = x0;
  const verses: VerseList = [];

  for (const clause of doc.clauses) {
    const conjSpace = clause.conj ? measure(clause.conj, 'conj') + cfg.pad : 0;
    // Lay out at base line y=0, then drop the whole clause so its highest content clears `y`.
    const c = layoutClause(clause, measure, cfg, x0 + conjSpace, 0);
    const dy = y - Math.min(c.top, -fs * 1.4);
    prims.push(...c.prims.map((p) => shiftPrim(p, 0, dy)));
    verses.push(...c.verses.map((v) => ({ y: v.y + dy, text: v.text })));
    maxRight = Math.max(maxRight, c.right);
    y = c.bottom + dy + cfg.clauseGap;
  }

  const height = y - cfg.clauseGap + cfg.padding;
  if (cfg.gutter > 0) {
    const gx = cfg.padding + cfg.gutter - 12;
    prims.push({ kind: 'line', x1: gx, y1: cfg.padding, x2: gx, y2: height - cfg.padding, style: 'guide' });
    for (const v of verses) prims.push({ kind: 'text', x: cfg.padding, y: v.y, text: v.text, cls: 'verse' });
  }
  return { width: maxRight + cfg.padding, height, prims };
}

interface ClauseOut {
  prims: Prim[];
  verses: VerseList;
  boxes?: Box[];
  right: number;
  /** Highest (smallest y) content, relative to the base line. */
  top: number;
  bottom: number;
  /** Where the relative pronoun sits, when this clause is a relative one. */
  relAnchor?: { x: number; y: number };
}

function layoutClause(clause: Clause, measure: Measure, cfg: SentenceConfig, x0: number, baseY: number): ClauseOut {
  const fs = cfg.fontSize;
  const prims: Prim[] = [];
  const verses: VerseList = [];
  const placed: Box[] = [];
  let x = x0;
  let bottom = baseY + fs * 0.7;
  let right = x0;

  if (clause.conj) {
    // Short slant rising up-right from the start of the base line; the conjunction sits to its left.
    prims.push({ kind: 'line', x1: x0, y1: baseY, x2: x0 + cfg.slant, y2: baseY - cfg.slant, style: 'line' });
    prims.push({ kind: 'text', x: x0 - 3, y: baseY - cfg.slant + fs * 0.35, text: clause.conj, cls: 'conj', anchor: 'end' });
  }

  const roles = SLOT_ORDER.filter((r) => clause.slots[r]);
  let top = baseY - fs * 1.4;
  let relAnchor: { x: number; y: number } | undefined;
  const drawMarker = (mx: number, role: SlotRole): void => {
    const h = fs * 1.15;
    if (role === 'verb') prims.push({ kind: 'line', x1: mx, y1: baseY - h, x2: mx, y2: baseY + fs * 0.6, style: 'marker' });
    else if (role === 'obj') prims.push({ kind: 'line', x1: mx, y1: baseY - h, x2: mx, y2: baseY, style: 'marker' });
    else if (role === 'obj2') {
      prims.push({ kind: 'line', x1: mx - 2, y1: baseY - h, x2: mx - 2, y2: baseY, style: 'marker' });
      prims.push({ kind: 'line', x1: mx + 2, y1: baseY - h, x2: mx + 2, y2: baseY, style: 'marker' });
    } else if (role === 'comp') prims.push({ kind: 'line', x1: mx + h * 0.8, y1: baseY, x2: mx, y2: baseY - h, style: 'marker' });
  };

  // Every slot after the subject is preceded by its marker. A missing subject still gets the
  // predicate marker at the clause start; a subject-only (verbless) clause gets one after it.
  let subjectDone = false;
  let lineStart = x0;
  let lineEnd: number | null = null; // set when a rightward fork ends the base line
  for (const role of roles) {
    const slot = clause.slots[role]!;
    if (role !== 'subj') {
      if (!subjectDone) {
        x += cfg.pad;
        subjectDone = true;
      }
      drawMarker(x, role);
      x += cfg.pad * 1.25 + (role === 'comp' ? fs * 0.9 : 0);
    }
    const sub = layoutSlot(slot, measure, cfg, role === 'subj');
    const relMember = slot.members.findIndex((mm) => mm.relative);
    sub.slotWidth = Math.max(sub.slotWidth, fs * 2.6, slot.members[0]!.word.text ? 0 : fs * 0.5 + cfg.slant + cfg.pad * 1.5);
    // Push this slot right until its word boxes clear everything already placed beneath the line.
    let dx = x;
    for (let guard = 0; guard < 400; guard++) {
      const conflict = sub.boxes.some((b) => placed.some((p) => overlaps(shift(b, dx, baseY), p, cfg.pad)));
      if (!conflict) break;
      dx += cfg.pad;
    }
    x = dx;
    if (sub.fork) {
      if (sub.fork.leftward) lineStart = x + sub.fork.tipX;
      else if (lineEnd === null) lineEnd = x + sub.fork.tipX;
    }
    if (relMember >= 0) relAnchor = { x: x + cfg.pad, y: baseY - fs * 0.3 };
    prims.push(...sub.prims.map((p) => shiftPrim(p, x, baseY)));
    verses.push(...sub.verses.map((v) => ({ y: v.y + baseY, text: v.text })));
    placed.push(...sub.boxes.map((b) => shift(b, x, baseY)));
    for (const b of sub.boxes) top = Math.min(top, baseY + b.y0 - 2);
    bottom = Math.max(bottom, baseY + sub.height);
    right = Math.max(right, x + sub.right);
    x += sub.slotWidth;
    if (role === 'subj') {
      subjectDone = true;
      if (!roles.includes('verb')) {
        x += cfg.pad;
        drawMarker(x, 'verb');
        x += cfg.pad;
      }
    }
  }
  const end = lineEnd ?? Math.max(x + cfg.pad, right);
  prims.unshift({ kind: 'line', x1: lineStart, y1: baseY, x2: end, y2: baseY, style: 'base' });
  const out: ClauseOut = { prims, verses, right: Math.max(right, end), top, bottom };
  if (relAnchor) out.relAnchor = relAnchor;
  return out;
}

interface SlotSub extends Sub {
  /** Horizontal room the slot takes on the base line. */
  slotWidth: number;
  /** For forks: x of the convergence point relative to the slot start, and which way it opens. */
  fork?: { tipX: number; leftward: boolean };
}

/**
 * One slot: a single word, or a fork of members. Frame origin = slot start on the base line.
 * Object-side forks open rightwards from the origin; the subject fork converges rightwards into
 * the predicate marker, so its members sit to the left of the convergence point (as Biblearc draws it).
 */
function layoutSlot(slot: { members: SlotMember[] }, measure: Measure, cfg: SentenceConfig, leftward: boolean): SlotSub {
  if (slot.members.length === 1) {
    const m = slot.members[0]!;
    const w = layoutWordOnLine(m.word, m.hangers, measure, cfg, 0, 0);
    const out: SlotSub = { ...w, slotWidth: w.lineWidth };
    if (w.apposForkX !== undefined) out.fork = { tipX: w.apposForkX, leftward: false };
    return out;
  }
  const fs = cfg.fontSize;
  const conjW = Math.max(0, ...slot.members.map((m) => (m.conj ? measure(m.conj, 'conj') : 0)));
  const fd = Math.max(fs * 4.6, conjW * 1.9 + 18);
  const members = slot.members.map((m) => layoutWordOnLine(m.word, m.hangers, measure, cfg, 0, 0, cfg.slant * 0.5));
  const shelfYs = forkShelfYs(members, fs);
  const prims: Prim[] = [];
  const boxes: Box[] = [];
  const verses: VerseList = [];
  let bottom = 0;
  const widest = Math.max(...members.map((m) => Math.max(m.lineWidth, m.right)));

  if (leftward) {
    // Members' shelves end at x = widest; diagonals converge to (widest + fd, 0).
    const cx = widest + fd;
    members.forEach((m, i) => {
      const y = shelfYs[i]!;
      const x0 = widest - m.lineWidth;
      prims.push({ kind: 'line', x1: widest, y1: y, x2: cx, y2: 0, style: 'line' });
      prims.push({ kind: 'line', x1: x0, y1: y, x2: widest, y2: y, style: 'line' });
      prims.push(...m.prims.map((p) => shiftPrim(p, x0, y)));
      boxes.push(...m.boxes.map((b) => shift(b, x0, y)));
      verses.push(...m.verses.map((v) => ({ y: v.y + y, text: v.text })));
      bottom = Math.max(bottom, y + m.height);
      const conj = slot.members[i]!.conj;
      if (conj && i > 0) {
        prims.push({ kind: 'line', x1: widest, y1: shelfYs[i - 1]!, x2: widest, y2: y, style: 'dotted' });
        prims.push({ kind: 'text', x: widest + fd * 0.42, y: (shelfYs[i - 1]! + y) / 2 + fs * 0.35, text: conj, cls: 'conj', anchor: 'middle' });
      }
    });
    return { prims, boxes, verses, height: bottom, right: cx, left: 0, slotWidth: cx + cfg.pad, fork: { tipX: cx, leftward: true } };
  }

  const fork = forkRight(members, slot.members.map((m) => m.conj), shelfYs, fd, fs);
  return { ...fork, slotWidth: fork.right + cfg.pad, fork: { tipX: 0, leftward: false } };
}

interface ForkOut extends Sub {
  /** Horizontal room the fork takes on the line it opens from. */
  width: number;
}

/** Rightward fork from (0,0): members' shelves start at fd, stacked at shelfYs; conjunction inside the triangle. */
function forkRight(members: WordSub[], conjs: (string | undefined)[], shelfYs: number[], fd: number, fs: number): ForkOut {
  const prims: Prim[] = [];
  const boxes: Box[] = [];
  const verses: VerseList = [];
  let right = 0;
  let bottom = 0;
  members.forEach((m, i) => {
    const y = shelfYs[i]!;
    prims.push({ kind: 'line', x1: 0, y1: 0, x2: fd, y2: y, style: 'line' });
    prims.push({ kind: 'line', x1: fd, y1: y, x2: fd + m.lineWidth, y2: y, style: 'line' });
    prims.push(...m.prims.map((p) => shiftPrim(p, fd, y)));
    boxes.push(...m.boxes.map((b) => shift(b, fd, y)));
    verses.push(...m.verses.map((v) => ({ y: v.y + y, text: v.text })));
    right = Math.max(right, fd + Math.max(m.right, m.lineWidth));
    bottom = Math.max(bottom, y + m.height);
    const conj = conjs[i];
    if (conj && i > 0) {
      prims.push({ kind: 'line', x1: fd, y1: shelfYs[i - 1]!, x2: fd, y2: y, style: 'dotted' });
      prims.push({ kind: 'text', x: fd * 0.58, y: (shelfYs[i - 1]! + y) / 2 + fs * 0.35, text: conj, cls: 'conj', anchor: 'middle' });
    }
  });
  return { prims, boxes, verses, height: bottom, right, left: 0, width: right };
}

/** Member spacing and centred shelf positions for a fork. */
function forkShelfYs(members: WordSub[], fs: number): number[] {
  const steps = members.map((m) => Math.max(fs * 2.6, m.height + fs * 2.0));
  const total = steps.slice(0, -1).reduce((a, b) => a + b, 0);
  const ys: number[] = [];
  let sy = -total / 2;
  for (const st of steps) {
    ys.push(sy);
    sy += st;
  }
  return ys;
}

interface WordSub extends Sub {
  lineWidth: number;
  /** Set when the word ends in a compound appositive: x (relative) where the base line must stop. */
  apposForkX?: number;
}

/**
 * A word sitting on a line whose left end is at (ox, oy): draws the word (and appositives),
 * then its hangers beneath. Coordinates are in the caller's frame.
 */
function layoutWordOnLine(word: Word, hangers: HangerGroup[], measure: Measure, cfg: SentenceConfig, ox: number, oy: number, textInset = 0): WordSub {
  const fs = cfg.fontSize;
  const prims: Prim[] = [];
  const boxes: Box[] = [];
  const verses: VerseList = [];
  const textY = oy - fs * 0.3;
  let x = ox + textInset + cfg.pad * 0.5;
  const tw = measure(word.text, 'word');
  if (word.text) {
    const wordPrim: TextPrim = { kind: 'text', x, y: textY, text: word.text, cls: 'word' };
    if (word.segments) wordPrim.segments = word.segments;
    prims.push(wordPrim);
    boxes.push({ x0: x, y0: textY - fs, x1: x + tw, y1: oy });
  }
  if (word.verse) verses.push({ y: textY, text: word.verse });
  // The stem (and every slash foot) sits at the word's left edge; empty slots get a small offset.
  const anchorX = x + (tw > 0 ? 2 : fs * 0.5);
  x += tw;
  let height = fs * 0.7;
  let right = x;
  let left = ox;
  const h = layoutHangers(hangers, measure, cfg, anchorX, oy);
  let apposForkX: number | undefined;
  if (word.appos.length > 0) {
    const isFork = word.appos.some((a) => a.conj);
    // A compound appositive's "=" and fork sit to the right of the head's own terraces, as in Biblearc.
    if (isFork) x = Math.max(x, h.right + cfg.pad * 0.5);
    x += cfg.pad;
    prims.push({ kind: 'text', x, y: textY, text: '=', cls: 'eq' });
    x += measure('=', 'eq') + cfg.pad * 0.5;
    if (isFork) {
      apposForkX = x;
      const laid = word.appos.map((a) => layoutWordOnLine(a.word, a.hangers, measure, cfg, 0, 0, cfg.slant * 0.5));
      const conjW = Math.max(0, ...word.appos.map((a) => (a.conj ? measure(a.conj, 'conj') : 0)));
      const fd = Math.max(fs * 4.6, conjW * 1.9 + 18);
      const fork = forkRight(laid, word.appos.map((a) => a.conj), forkShelfYs(laid, fs), fd, fs);
      prims.push(...fork.prims.map((p) => shiftPrim(p, x, oy)));
      boxes.push(...fork.boxes.map((b) => shift(b, x, oy)));
      verses.push(...fork.verses.map((v) => ({ y: v.y + oy, text: v.text })));
      height = Math.max(height, fork.height);
      x += fork.width;
      right = Math.max(right, x);
    } else {
      for (const a of word.appos) {
        const w = layoutWordOnLine(a.word, a.hangers, measure, cfg, x - cfg.pad * 0.5, oy);
        prims.push(...w.prims);
        boxes.push(...w.boxes);
        verses.push(...w.verses);
        height = Math.max(height, w.height);
        x += w.lineWidth - cfg.pad;
        right = Math.max(right, w.right);
        left = Math.min(left, w.left);
      }
    }
  }
  const lineWidth = x - ox + cfg.pad;

  prims.push(...h.prims);
  boxes.push(...h.boxes);
  verses.push(...h.verses);
  const out: WordSub = {
    prims,
    boxes,
    verses,
    height: Math.max(height, h.height),
    right: Math.max(right, h.right),
    left: Math.min(left, h.left),
    lineWidth,
  };
  if (apposForkX !== undefined) out.apposForkX = apposForkX;
  return out;
}

/**
 * A participle or infinitive hanging from a word: it sits on its own shelf and carries the
 * complements of a verb. An infinitive is preceded by the double-bar marker, with its accusative
 * subject, when there is one, to the left of that marker. A grey semantic label sits beneath.
 */
function layoutVerbal(
  member: HangerMember,
  kind: 'part' | 'inf',
  measure: Measure,
  cfg: SentenceConfig,
  ox: number,
  oy: number,
): WordSub {
  const fs = cfg.fontSize;
  const prims: Prim[] = [];
  const boxes: Box[] = [];
  const verses: VerseList = [];
  const textY = oy - fs * 0.3;
  const slots = member.slots ?? {};
  let x = ox + cfg.pad * 0.5;

  const drawWord = (word: Word): number => {
    const w = measure(word.text, 'word');
    const prim: TextPrim = { kind: 'text', x, y: textY, text: word.text, cls: 'word' };
    if (word.segments) prim.segments = word.segments;
    prims.push(prim);
    boxes.push({ x0: x, y0: textY - fs, x1: x + w, y1: oy });
    if (word.verse) verses.push({ y: textY, text: word.verse });
    return w;
  };

  let below = 0; // depth of anything hanging from the complements

  /** A complement word with whatever hangs beneath it. */
  const place = (m: { word: Word; hangers: HangerGroup[] }): void => {
    const w = layoutWordOnLine(m.word, m.hangers, measure, cfg, x - cfg.pad * 0.5, oy);
    prims.push(...w.prims);
    boxes.push(...w.boxes);
    verses.push(...w.verses);
    below = Math.max(below, w.height);
    x += w.lineWidth - cfg.pad;
  };

  // Infinitive: an accusative subject, then the double-bar marker.
  if (kind === 'inf') {
    const subj = slots.subj?.members[0];
    if (subj) {
      place(subj);
      x += cfg.pad;
    }
    const h = fs * 1.15;
    prims.push({ kind: 'line', x1: x, y1: oy - h, x2: x, y2: oy, style: 'marker' });
    prims.push({ kind: 'line', x1: x + 4, y1: oy - h, x2: x + 4, y2: oy, style: 'marker' });
    x += 4 + cfg.pad;
  }

  const anchorX = x + 2;
  x += drawWord(member.word);

  // Complements, each behind its own marker, as on a base line.
  const withMarker = (slot: Slot | undefined, role: SlotRole): void => {
    const m = slot?.members[0];
    if (!m) return;
    const compound = (slot?.members.length ?? 0) > 1;
    const h = fs * 1.15;
    x += cfg.pad;
    if (role === 'comp') {
      prims.push({ kind: 'line', x1: x + h * 0.8, y1: oy, x2: x, y2: oy - h, style: 'marker' });
      x += h * 0.8;
    } else if (role === 'obj2') {
      prims.push({ kind: 'line', x1: x - 2, y1: oy - h, x2: x - 2, y2: oy, style: 'marker' });
      prims.push({ kind: 'line', x1: x + 2, y1: oy - h, x2: x + 2, y2: oy, style: 'marker' });
    } else {
      prims.push({ kind: 'line', x1: x, y1: oy - h, x2: x, y2: oy, style: 'marker' });
    }
    x += cfg.pad;
    if (!compound) {
      place(m);
      return;
    }
    // Compound complement: a rightward fork opening from the marker.
    const laid = slot!.members.map((mm) =>
      layoutWordOnLine(mm.word, mm.hangers, measure, cfg, 0, 0, cfg.slant * 0.5),
    );
    const conjW = Math.max(0, ...slot!.members.map((mm) => (mm.conj ? measure(mm.conj, 'conj') : 0)));
    const fd = Math.max(fs * 4.6, conjW * 1.9 + 18);
    // Members are stacked around the shelf, so the first sits above the line rather than on it.
    const shelfYs = forkShelfYs(laid, fs);
    const fork = forkRight(laid, slot!.members.map((mm) => mm.conj), shelfYs, fd, fs);
    prims.push(...fork.prims.map((pp) => shiftPrim(pp, x, oy)));
    boxes.push(...fork.boxes.map((b) => shift(b, x, oy)));
    verses.push(...fork.verses.map((v) => ({ y: v.y + oy, text: v.text })));
    below = Math.max(below, fork.height);
    x += fork.width;
  };
  withMarker(slots.obj, 'obj');
  withMarker(slots.obj2, 'obj2');
  withMarker(slots.comp, 'comp');

  const lineWidth = x - ox + cfg.pad;
  let height = fs * 0.9;
  if (member.label) {
    const ly = oy + fs * 1.15;
    prims.push({ kind: 'text', x: ox + cfg.pad * 0.5, y: ly, text: `(${member.label})`, cls: 'label' });
    boxes.push({ x0: ox, y0: oy, x1: ox + measure(`(${member.label})`, 'label'), y1: ly + fs * 0.3 });
    height = Math.max(height, fs * 1.5);
  }

  // The participle's own modifiers hang beneath it, from just under its first word.
  // The verbal's own modifiers hang below its label, and below anything its complements carry.
  const h = layoutHangers(member.hangers, measure, cfg, anchorX, oy + (member.label ? fs * 1.35 : 0));
  prims.push(...h.prims);
  boxes.push(...h.boxes);
  verses.push(...h.verses);

  return {
    prims,
    boxes,
    verses,
    height: Math.max(height, below, (member.label ? fs * 1.35 : 0) + h.height),
    right: Math.max(x, h.right),
    left: ox,
    lineWidth,
  };
}

/** Hangers stacked down a stem from the anchor (ax, ay) on the head's line. */
function layoutHangers(groups: HangerGroup[], measure: Measure, cfg: SentenceConfig, ax: number, ay: number): Sub {
  const fs = cfg.fontSize;
  const d = cfg.slant;
  const prims: Prim[] = [];
  const boxes: Box[] = [];
  const verses: VerseList = [];
  let right = ax;
  let left = ax;
  let cursor = ay;
  let firstFoot: number | null = null;
  let lastFoot: number | null = null;
  let stemTop: number | null = null;
  let stemBottom = ay;

  for (const g of groups) {
    if (g.kind === 'gen') {
      // Slash chain directly under the head: "/ a / b"; each member may carry appositives and hangers.
      let x = ax - 2;
      const ty = cursor + fs * 1.25;
      let subBottom = ty + fs * 0.45;
      let apposRow = ty + fs * 1.35; // appositives of a genitive drop to the next row
      for (const m of g.members) {
        const label = `/ ${m.word.text}`;
        const genPrim: TextPrim = { kind: 'text', x, y: ty, text: label, cls: 'gen' };
        if (m.word.segments) genPrim.segments = [{ text: '/ ' }, ...m.word.segments];
        prims.push(genPrim);
        const w = measure(label, 'gen');
        boxes.push({ x0: x, y0: ty - fs, x1: x + w, y1: ty + fs * 0.3 });
        if (m.word.verse) verses.push({ y: ty, text: m.word.verse });
        const ex = x + w;
        // An appositive of a genitive is written on the row beneath it, as the exports do.
        for (const a of m.word.appos) {
          let axx = x + cfg.pad;
          prims.push({ kind: 'text', x: axx, y: apposRow, text: '=', cls: 'eq' });
          axx += measure('=', 'eq') + cfg.pad;
          const aw = layoutWordOnLine(a.word, a.hangers, measure, cfg, axx - cfg.pad * 0.5, apposRow);
          prims.push(...aw.prims);
          boxes.push(...aw.boxes);
          verses.push(...aw.verses);
          right = Math.max(right, aw.right);
          subBottom = Math.max(subBottom, apposRow + aw.height);
          apposRow += fs * 1.35 + aw.height;
        }
        const hs = layoutHangers(m.hangers, measure, cfg, x + fs * 0.9, ty + fs * 0.35);
        prims.push(...hs.prims);
        boxes.push(...hs.boxes);
        verses.push(...hs.verses);
        subBottom = Math.max(subBottom, ty + fs * 0.35 + hs.height);
        right = Math.max(right, ex, hs.right);
        x = ex + cfg.pad * 0.5;
      }
      cursor = subBottom + cfg.gap;
      continue;
    }

    if (g.kind === 'rel') {
      // A relative clause has a base line of its own, set below and slightly right of the word it
      // modifies, with a dashed line from its pronoun back up to that word.
      for (const m of g.members) {
        if (!m.clause) continue;
        const cx = ax + cfg.slant * 1.5;
        const cy = cursor + fs * 2.2;
        const c = layoutClause(m.clause, measure, cfg, 0, 0);
        prims.push(...c.prims.map((p) => shiftPrim(p, cx, cy)));
        verses.push(...c.verses.map((v) => ({ y: v.y + cy, text: v.text })));
        if (c.relAnchor) {
          prims.push({
            kind: 'line',
            x1: ax,
            y1: ay,
            x2: cx + c.relAnchor.x,
            y2: cy + c.relAnchor.y - fs * 0.9,
            style: 'dotted',
          });
        }
        right = Math.max(right, cx + c.right);
        cursor = cy + c.bottom + cfg.gap;
      }
      continue;
    }

    if (g.kind === 'part' || g.kind === 'inf') {
      // Verbal: it hangs from a vertical stem dropped from the head, one stem for all of them,
      // with each verbal's shelf attached to it. The stem is drawn once, after the loop.
      const py = cursor + d;
      if (stemTop === null) stemTop = ay;
      stemBottom = py;
      let bottom = py;
      for (const m of g.members) {
        const v = layoutVerbal(m, g.kind, measure, cfg, ax, py);
        const shelfEnd = ax + v.lineWidth + cfg.pad * 1.5;
        prims.push({ kind: 'line', x1: ax, y1: py, x2: shelfEnd, y2: py, style: 'line' });
        prims.push(...v.prims);
        boxes.push(...v.boxes);
        verses.push(...v.verses);
        right = Math.max(right, v.right, shelfEnd);
        bottom = Math.max(bottom, py + v.height);
      }
      cursor = bottom + cfg.gap;
      continue;
    }

    // Terrace. The first one hangs on a single slant from the head line down to the shelf's left
    // end (long if genitive rows sit between). Later ones branch off a stem dropped from that foot,
    // each with a short slash whose foot is on the stem. Shelves run right from the foot.
    const sy = cursor;
    const px = ax;
    const py = sy + d;
    if (firstFoot === null) {
      prims.push({ kind: 'line', x1: ax + d, y1: ay, x2: px, y2: py, style: 'line' });
      firstFoot = py;
    } else {
      prims.push({ kind: 'line', x1: px, y1: py, x2: px + d, y2: sy, style: 'line' });
      lastFoot = py;
    }
    left = Math.min(left, px);
    if (g.members.length === 1) {
      const m = g.members[0]!;
      const w = layoutWordOnLine(m.word, m.hangers, measure, cfg, px, py, d);
      const shelfEnd = px + w.lineWidth + cfg.pad;
      prims.push({ kind: 'line', x1: px, y1: py, x2: shelfEnd, y2: py, style: 'line' });
      prims.push(...w.prims);
      boxes.push(...w.boxes);
      verses.push(...w.verses);
      right = Math.max(right, w.right, shelfEnd);
      cursor = py + Math.max(fs * 0.9, w.height) + cfg.gap;
    } else {
      const fork = layoutHangerFork(g.members, measure, cfg, px, py);
      prims.push(...fork.prims);
      boxes.push(...fork.boxes);
      verses.push(...fork.verses);
      right = Math.max(right, fork.right);
      cursor = py + fork.height + cfg.gap;
    }
  }
  if (firstFoot !== null && lastFoot !== null) prims.push({ kind: 'line', x1: ax, y1: firstFoot, x2: ax, y2: lastFoot, style: 'line' });
  // One stem carries every verbal hanging from this word, as the exports draw it.
  if (stemTop !== null) prims.unshift({ kind: 'line', x1: ax, y1: stemTop, x2: ax, y2: stemBottom, style: 'line' });
  return { prims, boxes, verses, height: Math.max(0, cursor - cfg.gap - ay), right, left };
}

/** Fork of hanger members opening rightwards from (fx, fy); members stacked from fy downwards. */
function layoutHangerFork(members: HangerMember[], measure: Measure, cfg: SentenceConfig, fx: number, fy: number): Sub {
  const conjW = Math.max(0, ...members.map((m) => (m.conj ? measure(m.conj, 'conj') : 0)));
  const fd = Math.max(cfg.fontSize * 3.6, conjW * 1.6 + 16);
  const laid = members.map((m) => layoutWordOnLine(m.word, m.hangers, measure, cfg, 0, 0, cfg.slant * 0.5));
  const prims: Prim[] = [];
  const boxes: Box[] = [];
  const verses: VerseList = [];
  let sy = fy;
  let right = fx;
  let bottom = fy;
  const shelfYs: number[] = [];
  laid.forEach((w, i) => {
    shelfYs.push(sy);
    prims.push({ kind: 'line', x1: fx, y1: fy, x2: fx + fd, y2: sy, style: 'line' });
    prims.push({ kind: 'line', x1: fx + fd, y1: sy, x2: fx + fd + w.lineWidth + fd, y2: sy, style: 'line' });
    prims.push(...w.prims.map((p) => shiftPrim(p, fx + fd, sy)));
    boxes.push(...w.boxes.map((b) => shift(b, fx + fd, sy)));
    verses.push(...w.verses.map((v) => ({ y: v.y + sy, text: v.text })));
    right = Math.max(right, fx + fd + Math.max(w.right, w.lineWidth + fd));
    const conj = members[i]!.conj;
    if (conj && i > 0) {
      prims.push({ kind: 'line', x1: fx + fd, y1: shelfYs[i - 1]!, x2: fx + fd, y2: sy, style: 'dotted' });
      prims.push({ kind: 'text', x: fx + fd * 0.58, y: (shelfYs[i - 1]! + sy) / 2 + cfg.fontSize * 0.35, text: conj, cls: 'conj', anchor: 'middle' });
    }
    bottom = Math.max(bottom, sy + w.height);
    sy += Math.max(cfg.fontSize * 2.6, w.height + cfg.fontSize * 2.0);
  });
  return { prims, boxes, verses, height: bottom - fy, right, left: fx };
}

function shift(b: Box, dx: number, dy: number): Box {
  return { x0: b.x0 + dx, y0: b.y0 + dy, x1: b.x1 + dx, y1: b.y1 + dy };
}
function shiftPrim(p: Prim, dx: number, dy: number): Prim {
  if (p.kind === 'line') return { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy };
  return { ...p, x: p.x + dx, y: p.y + dy };
}
function overlaps(a: Box, b: Box, gap: number): boolean {
  return a.x0 < b.x1 + gap && b.x0 < a.x1 + gap && a.y0 < b.y1 && b.y0 < a.y1;
}
