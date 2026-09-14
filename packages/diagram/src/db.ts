import type { BracketDocument } from './model.js';

/** Mermaid DiagramDB for the bracket diagram. One instance is shared; Mermaid calls clear() before each parse. */
export class BracketDb {
  private doc: BracketDocument | null = null;
  private title = '';

  clear(): void {
    this.doc = null;
    this.title = '';
  }

  setDocument(doc: BracketDocument): void {
    this.doc = doc;
  }

  getDocument(): BracketDocument {
    if (!this.doc) throw new Error('bracket diagram has not been parsed');
    return this.doc;
  }

  setDiagramTitle(title: string): void {
    this.title = title;
  }

  getDiagramTitle(): string {
    return this.title;
  }

  // Accessibility hooks Mermaid may call; kept minimal.
  private accTitle = '';
  private accDescription = '';
  setAccTitle(t: string): void {
    this.accTitle = t;
  }
  getAccTitle(): string {
    return this.accTitle;
  }
  setAccDescription(d: string): void {
    this.accDescription = d;
  }
  getAccDescription(): string {
    return this.accDescription;
  }
}
