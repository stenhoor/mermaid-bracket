/** Data model for the `sentence` diagram (KoineWorks / Biblearc Greek Reed–Kellogg). */

export type SlotRole = 'subj' | 'verb' | 'obj' | 'obj2' | 'comp';
export const SLOT_ORDER: readonly SlotRole[] = ['subj', 'verb', 'obj', 'obj2', 'comp'];

/** Hanger kinds supported in phase 4a. (part, inf, stilt, sub, rel, voc, abs arrive in 4b.) */
export type HangerKind = 'mod' | 'prep' | 'gen';

import type { MorphSegment } from '../morph.js';

export interface Word {
  /** Display text, with any `^CODE` morphology tags stripped. */
  text: string;
  /** Set when the text carried morphology tags; used by the renderer to emit tagged tspans. */
  segments?: MorphSegment[];
  /** Appositives joined by "=" after the word: a chain, or a fork when members carry `conj`. */
  appos: ApposMember[];
  /** Verse reference attached to this word (from a preceding `verse` line). */
  verse?: string;
}

export interface ApposMember {
  word: Word;
  conj?: string;
  hangers: HangerGroup[];
}

export interface HangerMember {
  word: Word;
  /** Conjunction joining this member to the previous one in a fork (`+ καί`). */
  conj?: string;
  hangers: HangerGroup[];
}

export interface HangerGroup {
  kind: HangerKind;
  members: HangerMember[];
}

export interface SlotMember {
  word: Word;
  conj?: string;
  hangers: HangerGroup[];
}

export interface Slot {
  role: SlotRole;
  members: SlotMember[];
}

export interface Clause {
  /** Sentence-level conjunction drawn on the up-left slant (`conj οὖν`). */
  conj?: string;
  slots: Partial<Record<SlotRole, Slot>>;
  verse?: string;
}

export interface SentenceDocument {
  title?: string;
  options: Record<string, string | number | boolean>;
  clauses: Clause[];
}

export class SentenceParseError extends Error {
  constructor(message: string, public readonly line?: number) {
    super(line === undefined ? message : `line ${line}: ${message}`);
    this.name = 'SentenceParseError';
  }
}
