import { BracketParseError } from './model.js';
import type { BracketDocument, BracketNode, LeafNode, Row, TreeNode } from './model.js';
import { lookupRelationship, normalizeLabel } from './relationships.js';

const KEYWORD_RE = /^\s*bracket\s*$/;
const COLUMNS_RE = /^\s*columns\s+(.+?)\s*$/;
const CONFIG_RE = /^\s*config\s+([A-Za-z][\w.]*)\s+(.+?)\s*$/;
const ROW_START_RE = /^([^\s:]+):(?:\s*(.*))?$/;
const CELL_RE = /^\s+([^\s:]+):\s*(.*)$/;
const REF_RE = /^[0-9][0-9a-z]*(?:[-–][0-9a-z]+)?$/i;

interface StackEntry {
  indent: number;
  node: BracketNode | null; // null = document root or a leaf sentinel
  children: TreeNode[];
  /** Set when this entry is a leaf row; anything nested under it is an error. */
  leaf?: string;
}

/**
 * Parse the body of a `bracket` diagram. The text may or may not still contain the
 * leading `bracket` keyword line; frontmatter and %% comments are stripped by Mermaid
 * before this runs, but blank lines are tolerated everywhere.
 */
export function parseBracket(text: string): BracketDocument {
  const doc: BracketDocument = { options: {}, columns: [], items: [], rows: new Map() };
  const lines = text.replace(/\r\n?/g, '\n').split('\n');

  const stack: StackEntry[] = [{ indent: -1, node: null, children: doc.items }];
  let currentRow: Row | null = null;
  let currentCell = -1;
  let keywordSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    const lineNo = i + 1;
    if (raw.trim() === '') {
      currentRow = null;
      continue;
    }
    if (!keywordSeen && KEYWORD_RE.test(raw)) {
      keywordSeen = true;
      continue;
    }
    if (/^\s*%%/.test(raw)) continue;

    const columnsMatch = COLUMNS_RE.exec(raw);
    if (columnsMatch && !currentRow && !/^\s/.test(raw)) {
      doc.columns = columnsMatch[1]!.split(',').map((c) => c.trim()).filter(Boolean);
      continue;
    }
    const configMatch = CONFIG_RE.exec(raw);
    if (configMatch && !currentRow && !/^\s/.test(raw)) {
      doc.options[configMatch[1]!] = coerce(configMatch[2]!);
      continue;
    }

    // Row body: indented cell or continuation line.
    if (currentRow && /^\s/.test(raw)) {
      const cell = CELL_RE.exec(raw);
      if (cell && doc.columns.includes(cell[1]!)) {
        currentCell = doc.columns.indexOf(cell[1]!);
        currentRow.cells[currentCell] = cell[2] ?? '';
      } else {
        if (currentCell < 0) currentCell = 0;
        const prev = currentRow.cells[currentCell] ?? '';
        currentRow.cells[currentCell] = prev ? `${prev} ${raw.trim()}` : raw.trim();
      }
      continue;
    }
    currentRow = null;

    // Row start: "ref:" or "ref: text" at column 0.
    const rowStart = ROW_START_RE.exec(raw);
    if (rowStart && !/^\s/.test(raw)) {
      const ref = rowStart[1]!;
      if (doc.rows.has(ref)) throw new BracketParseError(`duplicate row "${ref}"`, lineNo);
      const row: Row = { ref, cells: [] };
      const inline = (rowStart[2] ?? '').trim();
      if (inline) row.cells[0] = inline;
      doc.rows.set(ref, row);
      currentRow = row;
      currentCell = inline ? 0 : -1;
      continue;
    }

    // Otherwise a tree line.
    const indent = leadingIndent(raw);
    const node = parseTreeLine(raw.trim(), lineNo);
    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) stack.pop();
    const parent = stack[stack.length - 1]!;
    if (parent.leaf) {
      throw new BracketParseError(`"${raw.trim()}" is nested under verse ${parent.leaf}, which cannot have children`, lineNo);
    }
    parent.children.push(node);
    if (node.kind === 'bracket') {
      stack.push({ indent, node, children: node.children });
    } else {
      stack.push({ indent, node: null, children: [], leaf: node.ref });
    }
  }

  validate(doc);
  return doc;
}

function coerce(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function leadingIndent(line: string): number {
  let n = 0;
  for (const ch of line) {
    if (ch === ' ') n += 1;
    else if (ch === '\t') n += 4;
    else break;
  }
  return n;
}

function parseTreeLine(line: string, lineNo: number): TreeNode {
  const tokens = line.split(/\s+/);
  if (tokens.length > 2) {
    throw new BracketParseError(`expected "[*][label] target" but got "${line}"`, lineNo);
  }
  let star = false;
  let label: string | undefined;
  let target = tokens[tokens.length - 1]!;

  if (tokens.length === 2) {
    let l = tokens[0]!;
    if (l === '*') {
      star = true;
    } else {
      if (l.startsWith('*')) {
        star = true;
        l = l.slice(1);
      } else if (l.endsWith('*')) {
        star = true;
        l = l.slice(0, -1);
      }
      label = normalizeLabel(l);
    }
  } else if (target.startsWith('*') && target.length > 1) {
    star = true;
    target = target.slice(1);
  }

  const rel = lookupRelationship(target);
  if (rel) {
    const node: BracketNode = { kind: 'bracket', rel, star, children: [] };
    if (label !== undefined) node.label = label;
    return node;
  }
  if (REF_RE.test(target)) {
    const node: LeafNode = { kind: 'row', ref: target, star };
    if (label !== undefined) node.label = label;
    return node;
  }
  throw new BracketParseError(`"${target}" is neither a relationship keyword nor a verse reference`, lineNo);
}

function validate(doc: BracketDocument): void {
  const referenced = new Set<string>();
  const visit = (nodes: TreeNode[]): void => {
    for (const n of nodes) {
      if (n.kind === 'row') {
        if (referenced.has(n.ref)) throw new BracketParseError(`row "${n.ref}" appears twice in the tree`);
        referenced.add(n.ref);
      } else {
        if (n.children.length === 0) throw new BracketParseError(`bracket ${n.rel.key} has no children`);
        visit(n.children);
      }
    }
  };
  visit(doc.items);

  if (doc.items.length === 0) {
    // No tree: rows become a flat list in the order written.
    for (const row of doc.rows.values()) doc.items.push({ kind: 'row', ref: row.ref, star: false });
  } else {
    for (const ref of doc.rows.keys()) {
      if (!referenced.has(ref)) throw new BracketParseError(`row "${ref}" has text but is not placed in the tree`);
    }
  }

  if (doc.columns.length === 0) doc.columns = [''];
  for (const row of doc.rows.values()) {
    while (row.cells.length < doc.columns.length) row.cells.push('');
    for (let i = 0; i < row.cells.length; i++) row.cells[i] = row.cells[i] ?? '';
  }
}
