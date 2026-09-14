/**
 * CSS injected by Mermaid into each rendered diagram (scoped to the diagram id).
 * Colours are exposed as custom properties so Obsidian CSS snippets can override them.
 */
export function bracketStyles(): string {
  return `
  .bracket-diagram {
    --bracket-coordinate: #7a9c53;
    --bracket-distinct: #d24a3a;
    --bracket-restatement: #4b7fb5;
    --bracket-contrary: #e08a2e;
    --bracket-ref: #b8962e;
    --bracket-star: #999999;
    --bracket-cell-bg: #e9eef3;
    --bracket-cell-border: #555555;
    --bracket-cell-text: #1f1f1f;
    --bracket-title: #222222;
    font-family: inherit;
  }
  .bracket-title { font-size: 15px; font-weight: 700; fill: var(--bracket-title); }
  .bracket-colhead { font-size: 11px; fill: var(--bracket-ref); text-anchor: middle; }
  .bracket-ref { font-size: 12px; fill: var(--bracket-ref); text-anchor: end; }
  .bracket-bar, .bracket-arm { fill: none; stroke-width: 1.5; }
  .bracket-label { font-size: 11px; }
  .bracket-star { font-size: 9px; fill: var(--bracket-star); }
  .bracket-coordinate.bracket-bar, .bracket-coordinate.bracket-arm { stroke: var(--bracket-coordinate); }
  .bracket-distinct.bracket-bar, .bracket-distinct.bracket-arm { stroke: var(--bracket-distinct); }
  .bracket-restatement.bracket-bar, .bracket-restatement.bracket-arm { stroke: var(--bracket-restatement); }
  .bracket-contrary.bracket-bar, .bracket-contrary.bracket-arm { stroke: var(--bracket-contrary); }
  .bracket-coordinate.bracket-label { fill: var(--bracket-coordinate); }
  .bracket-distinct.bracket-label { fill: var(--bracket-distinct); }
  .bracket-restatement.bracket-label { fill: var(--bracket-restatement); }
  .bracket-contrary.bracket-label { fill: var(--bracket-contrary); }
  .bracket-cell-box { fill: var(--bracket-cell-bg); stroke: var(--bracket-cell-border); stroke-width: 0.75; }
  .bracket-cell { font-size: 13px; line-height: 1.3; color: var(--bracket-cell-text); padding: 0; margin: 0; overflow-wrap: anywhere; }
  `;
}
