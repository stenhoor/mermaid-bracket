import mermaid from 'mermaid';
import { bracketDiagram } from '@mermaid-bracket/diagram';

const src = (document.getElementById('src') as HTMLTextAreaElement).value;
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
await mermaid.registerExternalDiagrams([bracketDiagram], { lazyLoad: false });
try {
  const { svg } = await mermaid.render('demo1', src);
  document.getElementById('out')!.innerHTML = svg;
} catch (e) {
  document.getElementById('out')!.textContent = 'ERROR: ' + (e as Error).stack;
}
