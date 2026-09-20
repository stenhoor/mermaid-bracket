/** CSS Mermaid injects for each sentence diagram (scoped to the diagram id). */
export function sentenceStyles(): string {
  return `
  .sentence-diagram {
    --sentence-ink: #333333;
    --sentence-verse: #b8962e;
    --sentence-conj: #333333;
    --sentence-gen: #333333;
    --sentence-guide: #bbbbbb;
    --sentence-label: #9a9a9a;
    --sentence-title: #222222;
    font-family: inherit;
  }
  .sd-base { stroke: var(--sentence-ink); stroke-width: 1.7; }
  .sd-line { stroke: var(--sentence-ink); stroke-width: 1.4; }
  .sd-marker { stroke: var(--sentence-ink); stroke-width: 1.5; }
  .sd-dotted { stroke: var(--sentence-ink); stroke-width: 1; stroke-dasharray: 2 3; }
  .sd-guide { stroke: var(--sentence-guide); stroke-width: 1; stroke-dasharray: 4 4; }
  .sd-word, .sd-appos { font-size: var(--sentence-font-size, 14px); fill: var(--sentence-ink); }
  .sd-gen { font-size: var(--sentence-font-size, 14px); fill: var(--sentence-gen); }
  .sd-eq { font-size: var(--sentence-font-size, 14px); fill: var(--sentence-ink); font-weight: 700; }
  .sd-conj { font-size: calc(var(--sentence-font-size, 14px) - 1px); fill: var(--sentence-conj); }
  .sd-strong { font-weight: 700; }
  .sd-em { font-style: italic; }
  .sd-del { text-decoration: line-through; }
  .sd-mark { fill: #8a6d00; }
  .sd-label { font-size: calc(var(--sentence-font-size, 14px) - 2px); fill: var(--sentence-label); }
  .sd-verse { font-size: calc(var(--sentence-font-size, 14px) - 2px); fill: var(--sentence-verse); }
  .sd-title { font-size: calc(var(--sentence-font-size, 14px) + 1px); font-weight: 700; font-style: italic; fill: var(--sentence-title); }
  `;
}
