/** Data model for the `sentence` diagram (KoineWorks / Biblearc Greek Reed–Kellogg). */

export type SlotRole = 'subj' | 'verb' | 'obj' | 'obj2' | 'comp';
export const SLOT_ORDER: readonly SlotRole[] = ['subj', 'verb', 'obj', 'obj2', 'comp'];

/** Hanger kinds. (stilt, sub, rel, voc and abs are still to come.) */
export type HangerKind = 'mod' | 'prep' | 'gen' | 'part' | 'inf' | 'rel';

/** `part` and `inf` are verbal: they hang from a word but carry complements of their own. */
export const VERBAL_KINDS: readonly HangerKind[] = ['part', 'inf'];

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
  /** Grey semantic label under a participle or infinitive, e.g. "Temporal". */
  label?: string;
  /** Complements of a participle or infinitive: its own object, second accusative, complement,
   * and for an infinitive the accusative subject that stands before the marker. */
  slots?: Partial<Record<SlotRole, Slot>>;
  /** The clause of a `rel` hanger: its own base line, linked back by a dashed line. */
  clause?: Clause;
}

export interface HangerGroup {
  kind: HangerKind;
  members: HangerMember[];
}

export interface SlotMember {
  word: Word;
  conj?: string;
  hangers: HangerGroup[];
  /** Set on the relative pronoun of a relative clause; the dashed link starts here. */
  relative?: boolean;
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
