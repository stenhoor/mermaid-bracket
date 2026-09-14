// Minimal stand-in so plugin modules that import 'obsidian' can be unit-tested outside the app.
export class MarkdownRenderer {
  static render(): Promise<void> {
    return Promise.resolve();
  }
}
