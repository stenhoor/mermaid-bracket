import type { ExternalDiagramDefinition } from 'mermaid';
import { injectUtils } from '../mermaidUtils.js';
import { SentenceDb } from './db.js';
import { parseSentence } from './parser.js';
import { drawSentence } from './renderer.js';
import { sentenceStyles } from './styles.js';

export const sentenceId = 'sentence';

export const sentenceDetector = (text: string): boolean => /^\s*sentence\b/.test(text);

const db = new SentenceDb();

export const sentenceDiagramDefinition = {
  db,
  parser: {
    parse: (text: string): void => {
      db.setDocument(parseSentence(text));
    },
  },
  renderer: { draw: drawSentence },
  styles: sentenceStyles,
  injectUtils,
};

/** Pass to `mermaid.registerExternalDiagrams([sentenceDiagram])`. */
export const sentenceDiagram: ExternalDiagramDefinition = {
  id: sentenceId,
  detector: sentenceDetector,
  loader: async () => ({ id: sentenceId, diagram: sentenceDiagramDefinition }),
};

export { parseSentence } from './parser.js';
export { layoutSentence, DEFAULT_SENTENCE } from './layout.js';
export type { SentenceLayout, SentenceConfig, Prim, LinePrim, TextPrim, Measure } from './layout.js';
export { setSentenceDefaults } from './renderer.js';
export type { SentenceUserConfig } from './renderer.js';
export type { SentenceDocument, Clause, Slot, SlotMember, HangerGroup, HangerMember, Word, SlotRole, HangerKind } from './model.js';
export { SentenceParseError } from './model.js';
