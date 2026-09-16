import { hasMorph, stripMorph, tokenizeMorph } from '../morph.js';
import { SentenceParseError, SLOT_ORDER } from './model.js';
import type { ApposMember, Clause, HangerGroup, HangerKind, HangerMember, SentenceDocument, Slot, SlotMember, SlotRole, Word } from './model.js';

const KEYWORD_RE = /^\s*sentence\s*$/;
const CONFIG_RE = /^\s*config\s+([A-Za-z][\w.]*)\s+(.+?)\s*$/;
const LINE_RE = /^(\s*)(\S+)(?:\s+(.*?))?\s*$/;
const HANGER_KINDS = new Set<string>(['mod', 'prep', 'gen']);
const SLOT_ROLES = new Set<string>(SLOT_ORDER);
const PHASE_4B = new Set(['part', 'inf', 'stilt', 'sub', 'rel', 'voc', 'abs']);

interface Frame {
  indent: number;
  /** Where hangers indented under this line attach. */
  hangers: HangerGroup[] | null;
  word: Word | null;
}

export function parseSentence(text: string): SentenceDocument {
  const doc: SentenceDocument = { options: {}, clauses: [] };
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let clause: Clause | null = null;
  let stack: Frame[] = [];
  let pendingVerse: string | undefined;
  let keywordSeen = false;

  const newClause = (): Clause => {
    clause = { slots: {} };
    doc.clauses.push(clause);
    stack = [];
    return clause;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    const lineNo = i + 1;
    if (raw.trim() === '') continue;
    if (!keywordSeen && KEYWORD_RE.test(raw)) {
      keywordSeen = true;
      continue;
    }
    if (/^\s*%%/.test(raw)) continue;
    const cfg = CONFIG_RE.exec(raw);
    if (cfg && !/^\s/.test(raw)) {
      doc.options[cfg[1]!] = coerce(cfg[2]!);
      continue;
    }
    const m = LINE_RE.exec(raw);
    if (!m) continue;
    const indent = leadingIndent(m[1]!);
    const key = m[2]!;
    const rest = (m[3] ?? '').trim();

    if (key === 'clause') {
      newClause();
      if (rest) throw new SentenceParseError('`clause` takes no text in phase 4a', lineNo);
      continue;
    }
    if (key === 'verse') {
      if (!rest) throw new SentenceParseError('`verse` needs a reference', lineNo);
      pendingVerse = rest;
      continue;
    }
    if (PHASE_4B.has(key)) {
      throw new SentenceParseError(`\`${key}\` is not supported yet (phase 4b)`, lineNo);
    }

    // Pop frames to find the parent for this indent.
    while (stack.length && stack[stack.length - 1]!.indent >= indent) stack.pop();
    const parent = stack[stack.length - 1];

    if (key === 'conj') {
      const c = clause ?? newClause();
      if (!rest) throw new SentenceParseError('`conj` needs text', lineNo);
      c.conj = rest;
      continue;
    }
    if (key === '=') {
      // Appositive line, indented under its head; `= + καί …` forks with the previous appositive.
      const head = parent?.word;
      if (!head) throw new SentenceParseError('`=` must be indented under the word it renames', lineNo);
      if (!rest) throw new SentenceParseError('`=` needs text', lineNo);
      const { conj: aconj, body: abody } = splitConj(rest);
      const member: ApposMember = { word: makeWord(abody), hangers: [] };
      if (aconj) {
        if (head.appos.length === 0) throw new SentenceParseError('`= + …` has no previous appositive to join', lineNo);
        member.conj = aconj;
      }
      if (pendingVerse) {
        member.word.verse = pendingVerse;
        pendingVerse = undefined;
      }
      head.appos.push(member);
      stack.push({ indent, hangers: member.hangers, word: member.word });
      continue;
    }

    const { conj, body } = splitConj(rest);
    const word = parseWord(body);
    if (pendingVerse) {
      word.verse = pendingVerse;
      pendingVerse = undefined;
    }

    if (SLOT_ROLES.has(key)) {
      const role = key as SlotRole;
      const c = clause ?? newClause();
      if (parent && parent.hangers !== null && stack.length > 0) {
        throw new SentenceParseError(`slot \`${role}\` cannot be nested under a hanger in phase 4a`, lineNo);
      }
      let slot = c.slots[role];
      if (slot && !conj) throw new SentenceParseError(`slot \`${role}\` already set; use \`+ conj\` for a compound`, lineNo);
      if (!slot) {
        if (conj) throw new SentenceParseError(`\`${role} + …\` has no previous member to join`, lineNo);
        slot = { role, members: [] } as Slot;
        c.slots[role] = slot;
      }
      const member: SlotMember = { word, hangers: [] };
      if (conj) member.conj = conj;
      slot.members.push(member);
      stack = [{ indent, hangers: member.hangers, word }];
      continue;
    }

    if (HANGER_KINDS.has(key)) {
      const kind = key as HangerKind;
      if (!parent || parent.hangers === null) {
        throw new SentenceParseError(`\`${kind}\` must be indented under a word`, lineNo);
      }
      const groups = parent.hangers;
      const last = groups[groups.length - 1];
      const member: HangerMember = { word, hangers: [] };
      if (conj) {
        if (!last || last.kind !== kind) throw new SentenceParseError(`\`${kind} + …\` has no previous \`${kind}\` to join`, lineNo);
        member.conj = conj;
        last.members.push(member);
      } else if (kind === 'gen' && last?.kind === 'gen') {
        // Consecutive genitives chain on one line: "/ a / b".
        last.members.push(member);
      } else {
        groups.push({ kind, members: [member] });
      }
      stack.push({ indent, hangers: member.hangers, word });
      continue;
    }

    throw new SentenceParseError(`unknown keyword "${key}"`, lineNo);
  }

  for (const c of doc.clauses) {
    if (!c.slots.verb && !c.slots.subj) throw new SentenceParseError('a clause needs at least a `subj` or `verb`');
  }
  if (doc.clauses.length === 0) throw new SentenceParseError('no clause found');
  return doc;
}

/** "+ καί τὴν ἀγάπην" → { conj: 'καί', body: 'τὴν ἀγάπην' }; "+ x" → supplied conjunction. */
function splitConj(rest: string): { conj?: string; body: string } {
  const m = /^\+\s+(\S+)\s*(.*)$/.exec(rest);
  if (!m) return { body: rest };
  // A morphology tag on the conjunction marker is stripped: the fork conjunction is drawn as a
  // single label (class `sd-conj`), not as a taggable word.
  return { conj: stripMorph(m[1]!), body: (m[2] ?? '').trim() };
}

/** "τῷ θεῷ = πατρὶ = ὁ πατήρ" → word with inline appositives. Empty text is allowed (empty slot). */
function parseWord(body: string): Word {
  const parts = body.split(/\s+=\s+|^=\s+/).map((p) => p.trim());
  const head = makeWord(parts.shift() ?? '');
  head.appos = parts.filter(Boolean).map((t) => ({ word: makeWord(t), hangers: [] }));
  return head;
}

/** Strips `^CODE` morphology tags into segments; `text` is what gets measured and drawn. */
function makeWord(raw: string): Word {
  const word: Word = { text: stripMorph(raw), appos: [] };
  if (hasMorph(raw)) word.segments = tokenizeMorph(raw);
  return word;
}

function leadingIndent(ws: string): number {
  let n = 0;
  for (const ch of ws) n += ch === '\t' ? 4 : 1;
  return n;
}

function coerce(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}
