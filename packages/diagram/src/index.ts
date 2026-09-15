import type { ExternalDiagramDefinition } from 'mermaid';
import { BracketDb } from './db.js';
import { injectUtils } from './mermaidUtils.js';
import { parseBracket } from './parser.js';
import { draw } from './renderer.js';
export { setBracketDefaults } from './renderer.js';
export { defaultFormatter, createInlineFormatter, formatInline, obmdKeyAt, setCellFormatter, getCellFormatter } from './formatter.js';
export type { CellFormatter, FormatContext, InlineOptions } from './formatter.js';
export type { BracketConfig } from './renderer.js';
import { bracketStyles } from './styles.js';

export const id = 'bracket';

/** Mermaid calls this with the comment-stripped block text to decide which diagram owns it. */
export const detector = (text: string): boolean => /^\s*bracket\s*$/m.test(text.split('\n', 1)[0] ?? '') || /^\s*bracket\b/.test(text);

const db = new BracketDb();

export const diagram = {
  db,
  parser: {
    parse: (text: string): void => {
      db.setDocument(parseBracket(text));
    },
  },
  renderer: { draw },
  styles: bracketStyles,
  injectUtils,
};

/** Pass to `mermaid.registerExternalDiagrams([bracketDiagram])`. */
export const bracketDiagram: ExternalDiagramDefinition = {
  id,
  detector,
  loader: async () => ({ id, diagram }),
};

export { parseBracket } from './parser.js';
export { layoutDocument, leafOrder, DEFAULT_LAYOUT } from './layout.js';
export type { Layout, LayoutConfig, BracketBox, ArmBox, RowBox } from './layout.js';
export { RELATIONSHIPS, lookupRelationship } from './relationships.js';
export type { BracketDocument, TreeNode, BracketNode, LeafNode, Row, RelationshipGroup } from './model.js';
export { BracketParseError } from './model.js';

// Second diagram type: sentence diagrams (KoineWorks / Biblearc Greek Reed–Kellogg).
export * from './sentence/index.js';
