import { loadMermaid, MarkdownView, Plugin } from 'obsidian';
import { bracketDiagram, createInlineFormatter, sentenceDiagram, setBracketDefaults, setCellFormatter, setSentenceDefaults } from '@mermaid-bracket/diagram';
import { createObsidianFormatter } from './obsidian-formatter.js';
import { registerExportMenu } from './export-menu.js';
import { DEFAULT_SETTINGS, MermaidBracketSettingTab } from './settings.js';
import type { MermaidBracketSettings } from './settings.js';

interface MermaidWithExternal {
  registerExternalDiagrams(diagrams: unknown[], opts?: { lazyLoad?: boolean }): Promise<void>;
}

export default class MermaidBracketPlugin extends Plugin {
  settings: MermaidBracketSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...((await this.loadData()) as Partial<MermaidBracketSettings> | null) };
    this.applyFormatter();
    this.applyDefaults();
    this.addSettingTab(new MermaidBracketSettingTab(this.app, this));
    registerExportMenu(this);

    const mermaid = (await loadMermaid()) as MermaidWithExternal;
    await mermaid.registerExternalDiagrams([bracketDiagram, sentenceDiagram], { lazyLoad: false });
    // Blocks rendered before registration show a Mermaid "unknown diagram" error; redraw open notes.
    this.app.workspace.onLayoutReady(() => this.rerenderOpenViews());
  }

  async applySettings(): Promise<void> {
    await this.saveData(this.settings);
    this.applyFormatter();
    this.applyDefaults();
    this.rerenderOpenViews();
  }

  private applyDefaults(): void {
    setBracketDefaults(this.settings);
    // The sentence diagram shares the font size and width behaviour; its geometry has its own defaults.
    setSentenceDefaults({ fontSize: this.settings.fontSize, useMaxWidth: this.settings.useMaxWidth });
  }

  onunload(): void {
    setCellFormatter(null);
  }

  private applyFormatter(): void {
    switch (this.settings.cellFormatter) {
      case 'obsidian':
        setCellFormatter(createObsidianFormatter(this.app, this));
        break;
      case 'obmd':
        setCellFormatter(createInlineFormatter({ obmdColors: true }));
        break;
      default:
        setCellFormatter(null);
    }
  }

  private rerenderOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      const view = leaf.view;
      if (view instanceof MarkdownView) view.previewMode.rerender(true);
    }
  }
}
