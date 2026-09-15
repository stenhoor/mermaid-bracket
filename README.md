# Mermaid Bracket

Custom [Mermaid](https://mermaid.js.org) diagram types for Bible study, delivered as an [Obsidian](https://obsidian.md) plugin:

- **`bracket`** — Biblearc-style bracketing diagrams of a passage's logical structure using the 18 logical
  relationships (Series, Ground, Inference, Action–Purpose, …), with nested brackets, verse references and
  multi-column text (e.g. Greek beside English).
- **`sentence`** — Greek sentence diagrams in the Reed–Kellogg tradition as adapted for the New Testament
  (KoineWorks / Biblearc "Diagram"): base lines with predicate, object and complement markers, terraces,
  slash genitives, appositives, forks. Under construction; see the roadmap in `CLAUDE.md`.

Both render inside ordinary ```` ```mermaid ```` code blocks. The plugin registers them on Obsidian's own
bundled Mermaid, so nothing is fetched from the network and no external service is involved.

## Example

````markdown
```mermaid
---
title: Colossians 1:21–23
---
bracket
columns NA28, ESV

Ac/Pur
  Ac   21-22a
  *Pur If/Th
    Th   22b
    If   G
      *    23a
      G    S
        23b
        23c
        23d

21-22a:
  NA28: Καὶ ὑμᾶς ποτε ὄντας ἀπηλλοτριωμένους …
  ESV:  And you, who once were alienated …
22b:
  NA28: παραστῆσαι ὑμᾶς ἁγίους …
  ESV:  in order to present you holy …
```
````

Syntax reference and worked examples: `examples/Colossians_1_21-23.md` (bracket) and
`examples/Sentence_Colossians_1_1-2.md` (sentence). Target renderings from Biblearc are the PDFs in
`examples/`.

## Features

- Nested brackets to any depth, forests, per-arm labels and main-point stars, group colours
- Text cells with a built-in inline formatting subset, optional Style Obmd colour keys, or full Obsidian Markdown
- Per-diagram `config` lines and a settings tab for vault-wide defaults (font size, column width, arm style, width behaviour)
- Right-click export: copy as PNG, copy SVG markup, save SVG/PNG to the vault (cells are flattened to plain SVG text so the files open in Word, Inkscape and browsers)

## Install (manual, until it is in the community list)

1. Build: `npm install && npm run build`
2. Copy `packages/obsidian-plugin/main.js`, `manifest.json` and `styles.css` into
   `<vault>/.obsidian/plugins/mermaid-bracket/`
3. Enable **Mermaid Bracket** under Settings → Community plugins, then reload Obsidian.

## Development

```
npm install
npm test            # vitest: parser, layout, jsdom run through real Mermaid
npm run typecheck
npm run build       # also copies the plugin into test-vault/
npm run dev         # watch mode
```

Open `test-vault/` in Obsidian to try changes. `packages/diagram` is the framework-free diagram code (usable
with any Mermaid 11 host via `mermaid.registerExternalDiagrams`); `packages/obsidian-plugin` is the adapter.
`CLAUDE.md` holds the architecture notes and roadmap.

## Acknowledgements

Bracketing and the diagram conventions follow [Biblearc](https://biblearc.com); the sentence-diagram shapes
follow Eric Sowell's *An Intermediate Guide to Greek Diagramming* (KoineWorks, 2002) and Reed & Kellogg's
*Higher Lessons in English* (1877). This project is not affiliated with Biblearc.

## License

MIT
