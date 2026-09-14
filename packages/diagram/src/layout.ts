import type { BracketDocument, BracketNode, RelationshipGroup, TreeNode } from './model.js';

export interface LayoutConfig {
  /** Horizontal distance between nested bracket bars. */
  bracketStep: number;
  /** Width reserved for the verse-reference column. */
  refWidth: number;
  /** Width of each text column. */
  columnWidth: number;
  /** Vertical padding inside a cell (added to measured text height). */
  cellPadding: number;
  /** Height of the column-header line (0 when there are no named columns). */
  headerHeight: number;
  /** Height of the title line (0 when there is no title). */
  titleHeight: number;
  /** Outer margin around the whole diagram. */
  padding: number;
  /** Minimum row height. */
  minRowHeight: number;
  /**
   * Arms drawn for coordinate brackets (S, P, A). `all` draws one per child as Biblearc does;
   * `ends` draws only the first and last, plus any middle child that is itself a bracket or carries
   * a star or label.
   */
  coordinateArms: 'all' | 'ends';
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  bracketStep: 46,
  refWidth: 44,
  columnWidth: 420,
  cellPadding: 6,
  headerHeight: 18,
  titleHeight: 30,
  padding: 8,
  minRowHeight: 26,
  coordinateArms: 'ends',
};

export interface RowBox {
  ref: string;
  y: number;
  height: number;
}

export interface ArmBox {
  y: number;
  x1: number;
  x2: number;
  label?: string;
  star: boolean;
}

export interface BracketBox {
  rel: string;
  group: RelationshipGroup;
  coordinate: boolean;
  x: number;
  y1: number;
  y2: number;
  /** Label on the bar itself (coordinate brackets). */
  label?: string;
  star: boolean;
  arms: ArmBox[];
}

export interface Layout {
  width: number;
  height: number;
  /** x where verse references are right-aligned. */
  refX: number;
  /** x where the text table starts. */
  tableX: number;
  /** y of the first row. */
  tableY: number;
  columnXs: number[];
  rows: RowBox[];
  brackets: BracketBox[];
}

/** Row refs in reading order (depth-first leaf order). */
export function leafOrder(items: TreeNode[]): string[] {
  const out: string[] = [];
  const visit = (n: TreeNode): void => {
    if (n.kind === 'row') out.push(n.ref);
    else n.children.forEach(visit);
  };
  items.forEach(visit);
  return out;
}

function maxDepth(items: TreeNode[]): number {
  let max = 0;
  const visit = (n: TreeNode, d: number): void => {
    if (n.kind === 'bracket') {
      max = Math.max(max, d + 1);
      n.children.forEach((c) => visit(c, d + 1));
    }
  };
  items.forEach((n) => visit(n, 0));
  return max;
}

/**
 * Compute positions for every row and bracket. `textHeights` gives the measured height of
 * the tallest cell in each row (excluding padding); rows without a measurement get the minimum.
 */
export function layoutDocument(
  doc: BracketDocument,
  textHeights: ReadonlyMap<string, number>,
  cfg: LayoutConfig = DEFAULT_LAYOUT,
): Layout {
  const depth = maxDepth(doc.items);
  const hasHeader = doc.columns.some((c) => c !== '');
  const headerHeight = hasHeader ? cfg.headerHeight : 0;
  const titleHeight = doc.title ? cfg.titleHeight : 0;

  const treeWidth = depth * cfg.bracketStep;
  const refX = cfg.padding + treeWidth + cfg.refWidth;
  const tableX = refX + 6;
  const tableY = cfg.padding + titleHeight + headerHeight;
  const columnXs = doc.columns.map((_, i) => tableX + i * cfg.columnWidth);

  const rows: RowBox[] = [];
  const centerOf = new Map<string, number>();
  let y = tableY;
  for (const ref of leafOrder(doc.items)) {
    const text = textHeights.get(ref) ?? 0;
    const height = Math.max(cfg.minRowHeight, text + 2 * cfg.cellPadding);
    rows.push({ ref, y, height });
    centerOf.set(ref, y + height / 2);
    y += height;
  }

  const brackets: BracketBox[] = [];
  // Returns the y at which a parent's arm attaches to this node.
  const place = (node: TreeNode, d: number): number => {
    if (node.kind === 'row') return centerOf.get(node.ref)!;
    const x = cfg.padding + d * cfg.bracketStep;
    const childX = cfg.padding + (d + 1) * cfg.bracketStep;
    const allArms: ArmBox[] = node.children.map((child) => {
      const attachY = place(child, d + 1);
      const arm: ArmBox = {
        y: attachY,
        x1: x,
        x2: child.kind === 'row' ? refX - cfg.refWidth + 2 : childX,
        star: child.star,
      };
      if (child.label !== undefined) arm.label = child.label;
      return arm;
    });
    const y1 = allArms[0]!.y;
    const y2 = allArms[allArms.length - 1]!.y;
    const trimMiddle = node.rel.coordinate && cfg.coordinateArms === 'ends';
    const arms = trimMiddle
      ? allArms.filter((arm, i) => {
          const child = node.children[i]!;
          const isEnd = i === 0 || i === allArms.length - 1;
          return isEnd || child.kind === 'bracket' || arm.star || arm.label !== undefined;
        })
      : allArms;
    const box: BracketBox = {
      rel: node.rel.key,
      group: node.rel.group,
      coordinate: node.rel.coordinate,
      x,
      y1,
      y2,
      star: node.star,
      arms,
    };
    const barLabel = bracketLabel(node);
    if (barLabel !== undefined) box.label = barLabel;
    brackets.push(box);
    return (y1 + y2) / 2;
  };
  doc.items.forEach((n) => place(n, 0));

  const width = tableX + doc.columns.length * cfg.columnWidth + cfg.padding;
  const height = y + cfg.padding;
  return { width, height, refX, tableX, tableY, columnXs, rows, brackets };
}

/** Coordinate brackets show their keyword on the bar; subordinate ones label their arms instead. */
function bracketLabel(node: BracketNode): string | undefined {
  if (node.rel.coordinate) return node.rel.key;
  return undefined;
}
