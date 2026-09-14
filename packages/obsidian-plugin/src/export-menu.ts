import { Menu, Notice } from 'obsidian';
import type { Plugin } from 'obsidian';
import { fileBasename, findBracketSvg, svgToPngBlob, toStandaloneSvg } from './svg-export.js';

/** Right-click on a rendered bracket diagram: copy or save it. */
export function registerExportMenu(plugin: Plugin): void {
  plugin.registerDomEvent(
    document,
    'contextmenu',
    (evt: MouseEvent) => {
      const svg = findBracketSvg(evt.target as Element | null);
      if (!svg) return;
      evt.preventDefault();
      evt.stopPropagation();
      const menu = new Menu();
      menu.addItem((i) =>
        i
          .setTitle('Copy diagram as PNG')
          .setIcon('image')
          .onClick(() => void run(copyPng(svg))),
      );
      menu.addItem((i) =>
        i
          .setTitle('Copy diagram SVG markup')
          .setIcon('code')
          .onClick(() => void run(copySvg(svg))),
      );
      menu.addSeparator();
      menu.addItem((i) =>
        i
          .setTitle('Save diagram as SVG to vault')
          .setIcon('save')
          .onClick(() => void run(saveToVault(plugin, svg, 'svg'))),
      );
      menu.addItem((i) =>
        i
          .setTitle('Save diagram as PNG to vault')
          .setIcon('save')
          .onClick(() => void run(saveToVault(plugin, svg, 'png'))),
      );
      menu.showAtMouseEvent(evt);
    },
    { capture: true },
  );
}

async function run(p: Promise<string>): Promise<void> {
  try {
    new Notice(await p);
  } catch (e) {
    console.error('[mermaid-bracket] export failed', e);
    new Notice(`Mermaid Bracket: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function copyPng(svg: SVGSVGElement): Promise<string> {
  const png = await svgToPngBlob(toStandaloneSvg(svg), svg.ownerDocument);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
  return 'Diagram copied as PNG';
}

async function copySvg(svg: SVGSVGElement): Promise<string> {
  await navigator.clipboard.writeText(toStandaloneSvg(svg).markup);
  return 'Diagram SVG markup copied';
}

async function saveToVault(plugin: Plugin, svg: SVGSVGElement, kind: 'svg' | 'png'): Promise<string> {
  const standalone = toStandaloneSvg(svg);
  const active = plugin.app.workspace.getActiveFile();
  const path = await plugin.app.fileManager.getAvailablePathForAttachment(
    `${fileBasename(standalone.title)}.${kind}`,
    active?.path,
  );
  if (kind === 'svg') {
    await plugin.app.vault.create(path, standalone.markup);
  } else {
    const png = await svgToPngBlob(standalone, svg.ownerDocument);
    await plugin.app.vault.createBinary(path, await png.arrayBuffer());
  }
  return `Saved ${path}`;
}
