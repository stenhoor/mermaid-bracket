import mermaid from 'mermaid';
import { bracketDiagram, createInlineFormatter, setCellFormatter } from '@mermaid-bracket/diagram';

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
await mermaid.registerExternalDiagrams([bracketDiagram], { lazyLoad: false });

// <textarea class="src" data-formatter="obmd"> renders with Style Obmd colour keys enabled.
const sources = Array.from(document.querySelectorAll<HTMLTextAreaElement>('textarea.src'));
let n = 0;
for (const ta of sources) {
  const out = document.createElement('div');
  out.className = 'out';
  ta.insertAdjacentElement('afterend', out);
  setCellFormatter(ta.dataset.formatter === 'obmd' ? createInlineFormatter({ obmdColors: true }) : null);
  try {
    const { svg } = await mermaid.render(`demo${n++}`, ta.value);
    out.innerHTML = svg;
  } catch (e) {
    out.textContent = 'ERROR: ' + (e as Error).stack;
  }
}
