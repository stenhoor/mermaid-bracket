import { hasMorph, stripMorph, tokenizeMorph } from '../morph.js';
import { SentenceParseError, SLOT_ORDER } from './model.js';
import type { ApposMember, Clause, HangerGroup, HangerKind, HangerMember, SentenceDocument, Slot, SlotMember, SlotRole, Word } from './model.js';

const KEYWORD_RE = /^\s*sentence\s*$/;
const CONFIG_RE = /^\s*config\s+([A-Za-z][\w.]*)\s+(.+?)\s*$/;
const LINE_RE = /^(\s*)(\S+)(?:\s+(.*?))?\s*$/;
const HANGER_KINDS = new Set<string>(['mod', 'prep', 'gen', 'part', 'inf', 'rel']);
const SLOT_ROLES = new Set<string>(SLOT_ORDER);
const NOT_YET = new Set(['stilt', 'sub', 'voc', 'abs']);
/** A trailing "(Temporal)" on a participle or infinitive. */
const LABEL_RE = /\s*\(([^)]+)\)\s*$/;

interface Frame {
  indent: number;
  /** Where hangers indented under this line attach. */
  hangers: HangerGroup[] | null;
  word: Word | null;
  /** Set on a `part`/`inf` frame: slots indented under it are its own complements. */
  verbal?: HangerMember;
  /** Set on a `rel` frame: slots indented under it belong to that clause. */
  relClause?: Clause;
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
    if (NOT_YET.has(key)) {
      throw new SentenceParseError(`\`${key}\` is not supported yet`, lineNo);
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

    let { conj, body } = splitConj(rest);
    let labelText: string | undefined;
    if (key === 'part' || key === 'inf') {
      const lm = LABEL_RE.exec(body);
      if (lm) {
        labelText = lm[1]!.trim();
        body = body.slice(0, lm.index).trim();
      }
    }
    const word = parseWord(body);
    if (pendingVerse) {
      word.verse = pendingVerse;
      pendingVerse = undefined;
    }

    if (SLOT_ROLES.has(key)) {
      const role = key as SlotRole;
      const owner = parent?.relClause ?? clause ?? newClause();
      const c = owner;
      const verbal = parent?.relClause ? undefined : parent?.verbal;
      if (!verbal && !parent?.relClause && parent && parent.hangers !== null && stack.length > 0) {
        throw new SentenceParseError(`slot \`${role}\` can only be nested under \`part\`, \`inf\` or \`rel\``, lineNo);
      }
      if (verbal && role === 'verb') {
        throw new SentenceParseError('a participle or infinitive is itself the verb', lineNo);
      }
      const slots = verbal ? (verbal.slots ??= {}) : c.slots;
      const inRelative = parent?.relClause !== undefined;
      let slot = slots[role];
      if (slot && !conj) throw new SentenceParseError(`slot \`${role}\` already set; use \`+ conj\` for a compound`, lineNo);
      if (!slot) {
        if (conj) throw new SentenceParseError(`\`${role} + …\` has no previous member to join`, lineNo);
        slot = { role, members: [] } as Slot;
        slots[role] = slot;
      }
      const member: SlotMember = { word, hangers: [] };
      if (conj) member.conj = conj;
      slot.members.push(member);
      // A clause-level slot starts a new frame stack; slots of a verbal or of a relative clause
      // nest inside the frame that owns them.
      if (verbal || inRelative) stack.push({ indent, hangers: member.hangers, word });
      else stack = [{ indent, hangers: member.hangers, word }];
      continue;
    }

    if (HANGER_KINDS.has(key)) {
      const kind = key as HangerKind;
      const verbalKind = kind === 'part' || kind === 'inf';
      if (!parent || parent.hangers === null) {
        throw new SentenceParseError(`\`${kind}\` must be indented under a word`, lineNo);
      }
      const groups = parent.hangers;
      const last = groups[groups.length - 1];
      const member: HangerMember = { word, hangers: [] };
      if (verbalKind && labelText) member.label = labelText;
      if (kind === 'rel') {
        // `rel ROLE TEXT`: the pronoun fills one slot of a clause of its own.
        const parts = body.split(/\s+/);
        const role = parts.shift() as SlotRole | undefined;
        if (!role || !SLOT_ROLES.has(role)) {
          throw new SentenceParseError('`rel` needs the pronoun\'s role, e.g. `rel obj ἣν`', lineNo);
        }
        const pronoun = makeWord(parts.join(' '));
        if (!pronoun.text) throw new SentenceParseError('`rel` needs the relative pronoun', lineNo);
        member.word = pronoun;
        member.clause = { slots: { [role]: { role, members: [{ word: pronoun, hangers: [], relative: true }] } } };
      }
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
      const frame: Frame = { indent, hangers: member.hangers, word };
      if (verbalKind) frame.verbal = member;
      if (member.clause) frame.relClause = member.clause;
      stack.push(frame);
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
