import { loadMermaid, MarkdownView, Notice, Plugin } from 'obsidian';
import type { Editor } from 'obsidian';
import { bracketDiagram, createInlineFormatter, sentenceDiagram, setBracketDefaults, setCellFormatter, setMorphInfoProvider, setSentenceDefaults } from '@mermaid-bracket/diagram';
import { createObsidianFormatter } from './obsidian-formatter.js';
import { registerExportMenu } from './export-menu.js';
import { bakeMorphTags, tagMorphInElement } from './markdown-morph.js';
import { autoTagGreek, buildGlossary, FUNCTION_WORD_POS, greekIndex, renderGlossary, wordInfo } from './greek.js';
import type { GlossaryOptions } from './greek.js';
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
    this.applyGreekProvider();
    this.applyDefaults();
    this.addSettingTab(new MermaidBracketSettingTab(this.app, this));
    registerExportMenu(this);

    // Morphology tags in ordinary note text (reading view).
    this.registerMarkdownPostProcessor((el) => {
      if (this.settings.tagMarkdownNotes) tagMorphInElement(el);
    });

    this.addCommand({
      id: 'auto-tag-greek',
      name: 'Tag Greek morphology automatically',
      checkCallback: (checking: boolean) => {
        if (!this.settings.greekLookup) return false;
        if (checking) return true;
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;
        const editor = view.editor;
        const selection = editor.getSelection();
        const { text, tagged, partial, skipped } = autoTagGreek(selection || editor.getValue(), greekIndex());
        if (tagged + partial === 0) {
          new Notice('No untagged Greek words could be matched');
          return true;
        }
        if (selection) editor.replaceSelection(text);
        else editor.setValue(text);
        const left = [...skipped.values()].reduce((a, b) => a + b, 0);
        new Notice(
          `Tagged ${tagged} word${tagged === 1 ? '' : 's'}` +
            (partial ? `, ${partial} partially` : '') +
            (left ? `; ${left} ambiguous left untagged` : ''),
        );
        return true;
      },
    });

    this.addCommand({
      id: 'greek-glossary',
      name: 'Create Greek glossary',
      checkCallback: (checking: boolean) => {
        if (!this.settings.greekLookup || !this.settings.greekGlossary) return false;
        if (checking) return true;
        return this.insertGlossary({});
      },
    });

    this.addCommand({
      id: 'greek-glossary-frequency',
      name: 'Create Greek glossary by frequency',
      checkCallback: (checking: boolean) => {
        if (!this.settings.greekLookup || !this.settings.greekGlossary) return false;
        if (checking) return true;
        return this.insertGlossary({ sort: 'frequency', excludePos: FUNCTION_WORD_POS });
      },
    });

    this.addCommand({
      id: 'bake-morph-tags',
      name: 'Convert Greek morphology tags to HTML',
      editorCallback: (editor: Editor) => {
        const selection = editor.getSelection();
        const source = selection || editor.getValue();
        const { text, count } = bakeMorphTags(source);
        if (count === 0) {
          new Notice('No Greek morphology tags found');
          return;
        }
        if (selection) editor.replaceSelection(text);
        else editor.setValue(text);
        new Notice(`Converted ${count} morphology tag${count === 1 ? '' : 's'} to HTML`);
      },
    });

    const mermaid = (await loadMermaid()) as MermaidWithExternal;
    await mermaid.registerExternalDiagrams([bracketDiagram, sentenceDiagram], { lazyLoad: false });
    // Blocks rendered before registration show a Mermaid "unknown diagram" error; redraw open notes.
    this.app.workspace.onLayoutReady(() => this.rerenderOpenViews());
  }

  async applySettings(): Promise<void> {
    await this.saveData(this.settings);
    this.applyFormatter();
    this.applyGreekProvider();
    this.applyDefaults();
    this.rerenderOpenViews();
  }

  /** Build a glossary of the selection or the note and insert it after the cursor's line. */
  private insertGlossary(opts: GlossaryOptions): boolean {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return false;
    const editor = view.editor;
    const rows = buildGlossary(editor.getSelection() || editor.getValue(), greekIndex(), opts);
    if (rows.length === 0) {
      new Notice('No Greek words found');
      return true;
    }
    const table = renderGlossary(rows, {
      style: this.settings.glossaryStyle,
      includeCounts: this.settings.glossaryCounts,
      includeForms: this.settings.glossaryForms,
    });
    const cursor = editor.getCursor('to');
    editor.replaceRange(`\n\n${table}\n`, { line: cursor.line, ch: editor.getLine(cursor.line).length });
    new Notice(`Glossary: ${rows.length} lemma${rows.length === 1 ? '' : 's'}`);
    return true;
  }

  /** The hover lexicon is only consulted when both toggles are on. */
  private applyGreekProvider(): void {
    const on = this.settings.greekLookup && this.settings.greekHoverGloss;
    setMorphInfoProvider(on ? (word) => wordInfo(word) : null);
  }

  private applyDefaults(): void {
    setBracketDefaults(this.settings);
    // The sentence diagram shares the font size and width behaviour; its geometry has its own defaults.
    setSentenceDefaults({ fontSize: this.settings.fontSize, useMaxWidth: this.settings.useMaxWidth });
  }

  onunload(): void {
    setCellFormatter(null);
    setMorphInfoProvider(null);
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
