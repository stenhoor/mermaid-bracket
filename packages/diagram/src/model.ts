/** Data model produced by the parser and consumed by layout/renderer. */

export type RelationshipGroup = 'coordinate' | 'distinct' | 'restatement' | 'contrary';

export interface RelationshipInfo {
  /** Canonical keyword as written in the tree (e.g. "Ac/Pur"). */
  key: string;
  name: string;
  group: RelationshipGroup;
  /** Whether the bracket is coordinate (one label on the bar) or subordinate (labels per arm). */
  coordinate: boolean;
}

export interface LeafNode {
  kind: 'row';
  ref: string;
  label?: string;
  star: boolean;
}

export interface BracketNode {
  kind: 'bracket';
  rel: RelationshipInfo;
  label?: string;
  star: boolean;
  children: TreeNode[];
}

export type TreeNode = LeafNode | BracketNode;

export interface Row {
  ref: string;
  /** One entry per declared column; missing cells are empty strings. */
  cells: string[];
}

export interface BracketDocument {
  title?: string;
  /** Per-diagram options from `config <key> <value>` lines; values are coerced to number/boolean when they look like one. */
  options: Record<string, string | number | boolean>;
  columns: string[];
  items: TreeNode[];
  rows: Map<string, Row>;
}

export class BracketParseError extends Error {
  constructor(message: string, public readonly line?: number) {
    super(line === undefined ? message : `line ${line}: ${message}`);
    this.name = 'BracketParseError';
  }
}
