import { PluginSettingTab, Setting } from 'obsidian';
import type { App } from 'obsidian';
import type MermaidBracketPlugin from './main.js';

export interface MermaidBracketSettings {
  /** `builtin`: the diagram's own inline subset (portable). `obsidian`: Obsidian's Markdown renderer (wiki-links etc.). */
  cellFormatter: 'builtin' | 'obmd' | 'obsidian';
  /** Apply Greek morphology tags in ordinary note text, not only inside diagrams. */
  tagMarkdownNotes: boolean;
  coordinateArms: 'ends' | 'all';
  columnWidth: number;
  bracketStep: number;
  fontSize: number;
  useMaxWidth: boolean;
}

export const DEFAULT_SETTINGS: MermaidBracketSettings = {
  cellFormatter: 'builtin',
  tagMarkdownNotes: true,
  coordinateArms: 'ends',
  columnWidth: 420,
  bracketStep: 46,
  fontSize: 13,
  useMaxWidth: false,
};

export class MermaidBracketSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: MermaidBracketPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Cell text formatting')
      .setDesc('Built-in: bold, italic, strike, ==highlight==, `code`, | bar and {blue brackets}; identical in any Mermaid host. Built-in + Style Obmd: also =={r}…== and **{b}…** colour keys (r o y g b p gray), plus __{r}…__ coloured underlines, using the Style Obmd plugin\'s colours when it is installed. Obsidian Markdown: Obsidian\'s own renderer, adding wiki-links, tags and other plugins\' formatting (Style Obmd included), Obsidian only.')
      .addDropdown((d) =>
        d
          .addOptions({ builtin: 'Built-in subset', obmd: 'Built-in + Style Obmd colours', obsidian: 'Obsidian Markdown' })
          .setValue(this.plugin.settings.cellFormatter)
          .onChange(async (v) => {
            this.plugin.settings.cellFormatter = v === 'obsidian' ? 'obsidian' : v === 'obmd' ? 'obmd' : 'builtin';
            await this.plugin.applySettings();
          }),
      );

    new Setting(containerEl)
      .setName('Greek morphology in note text')
      .setDesc('Also apply word^CODE morphology tags outside diagrams, in ordinary reading-view text. Code blocks are left alone. Styling comes from your own CSS snippet.')
      .addToggle((t) =>
        t.setValue(this.plugin.settings.tagMarkdownNotes).onChange(async (v) => {
          this.plugin.settings.tagMarkdownNotes = v;
          await this.plugin.applySettings();
        }),
      );

    new Setting(containerEl)
      .setName('Arms on coordinate brackets')
      .setDesc('Series, Progression and Alternative brackets: draw an arm for every member (Biblearc style) or only the first and last. A "config coordinateArms" line inside a block overrides this.')
      .addDropdown((d) =>
        d
          .addOptions({ ends: 'First and last only', all: 'Every member' })
          .setValue(this.plugin.settings.coordinateArms)
          .onChange(async (v) => {
            this.plugin.settings.coordinateArms = v === 'all' ? 'all' : 'ends';
            await this.plugin.applySettings();
          }),
      );

    new Setting(containerEl)
      .setName('Font size')
      .setDesc('Base size in pixels for cell text; references, labels, title and row heights scale with it. Per block: "config fontSize 16".')
      .addText((t) =>
        t.setValue(String(this.plugin.settings.fontSize)).onChange(async (v) => {
          const n = Number(v);
          if (Number.isFinite(n) && n >= 8 && n <= 40) {
            this.plugin.settings.fontSize = n;
            await this.plugin.applySettings();
          }
        }),
      );

    new Setting(containerEl)
      .setName('Diagram width')
      .setDesc('Actual size keeps text readable and scrolls sideways in a narrow pane. Fit to pane shrinks the whole diagram to the pane width (Mermaid\'s default behaviour). Per block: "config useMaxWidth true".')
      .addDropdown((d) =>
        d
          .addOptions({ actual: 'Actual size (scroll if needed)', fit: 'Fit to pane (may shrink)' })
          .setValue(this.plugin.settings.useMaxWidth ? 'fit' : 'actual')
          .onChange(async (v) => {
            this.plugin.settings.useMaxWidth = v === 'fit';
            await this.plugin.applySettings();
          }),
      );

    new Setting(containerEl)
      .setName('Text column width')
      .setDesc('Width in pixels of each text column.')
      .addText((t) =>
        t.setValue(String(this.plugin.settings.columnWidth)).onChange(async (v) => {
          const n = Number(v);
          if (Number.isFinite(n) && n >= 80) {
            this.plugin.settings.columnWidth = n;
            await this.plugin.applySettings();
          }
        }),
      );

    new Setting(containerEl)
      .setName('Bracket nesting step')
      .setDesc('Horizontal distance in pixels between nested bracket bars.')
      .addText((t) =>
        t.setValue(String(this.plugin.settings.bracketStep)).onChange(async (v) => {
          const n = Number(v);
          if (Number.isFinite(n) && n >= 16) {
            this.plugin.settings.bracketStep = n;
            await this.plugin.applySettings();
          }
        }),
      );
  }
}
