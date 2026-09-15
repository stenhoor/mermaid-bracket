import type { SentenceDocument } from './model.js';

export class SentenceDb {
  private doc: SentenceDocument | null = null;
  private title = '';
  private accTitle = '';
  private accDescription = '';

  clear(): void {
    this.doc = null;
    this.title = '';
  }
  setDocument(doc: SentenceDocument): void {
    this.doc = doc;
  }
  getDocument(): SentenceDocument {
    if (!this.doc) throw new Error('sentence diagram has not been parsed');
    return this.doc;
  }
  setDiagramTitle(t: string): void {
    this.title = t;
  }
  getDiagramTitle(): string {
    return this.title;
  }
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
