import { loadMermaid, MarkdownView, Plugin } from 'obsidian';
import { bracketDiagram, setBracketDefaults } from '@mermaid-bracket/diagram';
import { DEFAULT_SETTINGS, MermaidBracketSettingTab } from './settings.js';
import type { MermaidBracketSettings } from './settings.js';

interface MermaidWithExternal {
  registerExternalDiagrams(diagrams: unknown[], opts?: { lazyLoad?: boolean }): Promise<void>;
}

export default class MermaidBracketPlugin extends Plugin {
  settings: MermaidBracketSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...((await this.loadData()) as Partial<MermaidBracketSettings> | null) };
    setBracketDefaults(this.settings);
    this.addSettingTab(new MermaidBracketSettingTab(this.app, this));

    const mermaid = (await loadMermaid()) as MermaidWithExternal;
    await mermaid.registerExternalDiagrams([bracketDiagram], { lazyLoad: false });
    // Blocks rendered before registration show a Mermaid "unknown diagram" error; redraw open notes.
    this.app.workspace.onLayoutReady(() => this.rerenderOpenViews());
  }

  async applySettings(): Promise<void> {
    await this.saveData(this.settings);
    setBracketDefaults(this.settings);
    this.rerenderOpenViews();
  }

  private rerenderOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      const view = leaf.view;
      if (view instanceof MarkdownView) view.previewMode.rerender(true);
    }
  }
}
