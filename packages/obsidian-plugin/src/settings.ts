import { PluginSettingTab, Setting } from 'obsidian';
import type { App } from 'obsidian';
import type MermaidBracketPlugin from './main.js';

export interface MermaidBracketSettings {
  coordinateArms: 'ends' | 'all';
  columnWidth: number;
  bracketStep: number;
}

export const DEFAULT_SETTINGS: MermaidBracketSettings = {
  coordinateArms: 'ends',
  columnWidth: 420,
  bracketStep: 46,
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
