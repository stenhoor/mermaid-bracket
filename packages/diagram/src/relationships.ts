import type { RelationshipInfo } from './model.js';

const R = (key: string, name: string, group: RelationshipInfo['group'], coordinate = false): RelationshipInfo => ({
  key,
  name,
  group,
  coordinate,
});

/** The 18 logical relationships (documents/The18LogicalRelationshipsEng.pdf). */
export const RELATIONSHIPS: readonly RelationshipInfo[] = [
  R('S', 'Series', 'coordinate', true),
  R('P', 'Progression', 'coordinate', true),
  R('A', 'Alternative', 'coordinate', true),
  R('G', 'Ground', 'distinct'),
  R('Inf', 'Inference', 'distinct'),
  R('BL', 'Bilateral', 'distinct'),
  R('Ac/Res', 'Action-Result', 'distinct'),
  R('Ac/Pur', 'Action-Purpose', 'distinct'),
  R('If/Th', 'Conditional', 'distinct'),
  R('T', 'Temporal', 'distinct'),
  R('L', 'Locative', 'distinct'),
  R('Ac/Mn', 'Action-Manner', 'restatement'),
  R('Cf', 'Comparison', 'restatement'),
  R('Neg/Pos', 'Negative-Positive', 'restatement'),
  R('Id/Exp', 'Idea-Explanation', 'restatement'),
  R('Q/A', 'Question-Answer', 'restatement'),
  R('Csv', 'Concessive', 'contrary'),
  R('Sit/R', 'Situation-Response', 'contrary'),
];

/** Alternate spellings accepted for relationship keywords. */
const KEYWORD_ALIASES: Record<string, string> = {
  '∴': 'Inf',
  '-/+': 'Neg/Pos',
  '−/+': 'Neg/Pos',
  '–/+': 'Neg/Pos',
};

const byKey = new Map(RELATIONSHIPS.map((r) => [r.key, r]));

export function lookupRelationship(token: string): RelationshipInfo | undefined {
  return byKey.get(KEYWORD_ALIASES[token] ?? token);
}

/** Alternate spellings accepted for arm labels, mapped to the glyph that is drawn. */
const LABEL_ALIASES: Record<string, string> = {
  Inf: '∴',
  '-': '−',
  '–': '−',
};

export function normalizeLabel(label: string): string {
  return LABEL_ALIASES[label] ?? label;
}
