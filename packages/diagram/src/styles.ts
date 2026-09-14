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
    --bracket-highlight: #fff3a0;
    font-family: inherit;
  }
  .bracket-title { font-size: calc(var(--bracket-font-size, 13px) + 2px); font-weight: 700; fill: var(--bracket-title); }
  .bracket-colhead { font-size: calc(var(--bracket-font-size, 13px) - 2px); fill: var(--bracket-ref); text-anchor: middle; }
  .bracket-ref { font-size: calc(var(--bracket-font-size, 13px) - 1px); fill: var(--bracket-ref); text-anchor: end; }
  .bracket-bar, .bracket-arm { fill: none; stroke-width: 1.5; }
  .bracket-label { font-size: calc(var(--bracket-font-size, 13px) - 2px); }
  .bracket-star { font-size: calc(var(--bracket-font-size, 13px) - 4px); fill: var(--bracket-star); }
  .bracket-coordinate.bracket-bar, .bracket-coordinate.bracket-arm { stroke: var(--bracket-coordinate); }
  .bracket-distinct.bracket-bar, .bracket-distinct.bracket-arm { stroke: var(--bracket-distinct); }
  .bracket-restatement.bracket-bar, .bracket-restatement.bracket-arm { stroke: var(--bracket-restatement); }
  .bracket-contrary.bracket-bar, .bracket-contrary.bracket-arm { stroke: var(--bracket-contrary); }
  .bracket-coordinate.bracket-label { fill: var(--bracket-coordinate); }
  .bracket-distinct.bracket-label { fill: var(--bracket-distinct); }
  .bracket-restatement.bracket-label { fill: var(--bracket-restatement); }
  .bracket-contrary.bracket-label { fill: var(--bracket-contrary); }
  .bracket-cell-box { fill: var(--bracket-cell-bg); stroke: var(--bracket-cell-border); stroke-width: 0.75; }
  .bracket-cell { font-size: var(--bracket-font-size, 13px); line-height: 1.3; color: var(--bracket-cell-text); padding: 0; margin: 0; overflow-wrap: anywhere; }
  .bracket-cell p { margin: 0; }
  .bracket-cell mark { background: var(--bracket-highlight); color: inherit; padding: 0 1px; }
  .bracket-cell code { font-size: 0.92em; }
  .bracket-cell .bracket-bar { color: var(--bracket-distinct); font-weight: 700; margin: 0 1px; }
  .bracket-cell .bracket-bkt-mark { color: var(--bracket-restatement); font-weight: 700; }
  /* Style Obmd colour keys; the plugin's own body-level variables win when it is installed. */
  .bracket-cell u.cmk-underline { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 2px; }
  .bracket-cell u.cmk-r { text-decoration-color: var(--style-obmd-r, #fb4646); }
  .bracket-cell u.cmk-o { text-decoration-color: var(--style-obmd-o, #e9783f); }
  .bracket-cell u.cmk-y { text-decoration-color: var(--style-obmd-y, #e0ac00); }
  .bracket-cell u.cmk-g { text-decoration-color: var(--style-obmd-g, #44cf6e); }
  .bracket-cell u.cmk-b { text-decoration-color: var(--style-obmd-b, #5389df); }
  .bracket-cell u.cmk-p { text-decoration-color: var(--style-obmd-p, #be75ff); }
  .bracket-cell u.cmk-gray { text-decoration-color: var(--style-obmd-gray, #9e9e9e); }
  .bracket-cell mark.cmk-r { background: color-mix(in srgb, var(--style-obmd-r, #fb4646) 30%, transparent); }
  .bracket-cell strong.cmk-r { color: var(--style-obmd-r, #fb4646); }
  .bracket-cell mark.cmk-o { background: color-mix(in srgb, var(--style-obmd-o, #e9783f) 30%, transparent); }
  .bracket-cell strong.cmk-o { color: var(--style-obmd-o, #e9783f); }
  .bracket-cell mark.cmk-y { background: color-mix(in srgb, var(--style-obmd-y, #e0ac00) 30%, transparent); }
  .bracket-cell strong.cmk-y { color: var(--style-obmd-y, #e0ac00); }
  .bracket-cell mark.cmk-g { background: color-mix(in srgb, var(--style-obmd-g, #44cf6e) 30%, transparent); }
  .bracket-cell strong.cmk-g { color: var(--style-obmd-g, #44cf6e); }
  .bracket-cell mark.cmk-b { background: color-mix(in srgb, var(--style-obmd-b, #5389df) 30%, transparent); }
  .bracket-cell strong.cmk-b { color: var(--style-obmd-b, #5389df); }
  .bracket-cell mark.cmk-p { background: color-mix(in srgb, var(--style-obmd-p, #be75ff) 30%, transparent); }
  .bracket-cell strong.cmk-p { color: var(--style-obmd-p, #be75ff); }
  .bracket-cell mark.cmk-gray { background: color-mix(in srgb, var(--style-obmd-gray, #9e9e9e) 30%, transparent); }
  .bracket-cell strong.cmk-gray { color: var(--style-obmd-gray, #9e9e9e); }
  `;
}
