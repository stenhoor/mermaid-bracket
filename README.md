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

**Reference pages** for the method itself are in [`docs/reference/`](docs/reference/index.md): the eighteen
relationships with a diagram each, and the English and Greek conjunction lists.

Syntax reference and worked examples: `examples/Colossians_1_21-23.md` (bracket) and
`examples/Sentence_Colossians_1_1-2.md` (sentence). Target renderings from Biblearc are the PDFs in
`examples/`.

## Features

- Nested brackets to any depth, forests, per-arm labels and main-point stars, group colours
- Text cells with a built-in inline formatting subset, optional Style Obmd colour keys, or full Obsidian Markdown
- Per-diagram `config` lines and a settings tab for vault-wide defaults (font size, column width, arm style, width behaviour)
- Right-click export: copy as PNG, copy SVG markup, save SVG/PNG to the vault (cells are flattened to plain SVG text so the files open in Word, Inkscape and browsers)

## Greek morphology

Any word in either diagram can carry a [MorphGNT](https://github.com/morphgnt/sblgnt) parsing code,
appended with a caret:

```
sentence
subj  ὁ^RA----NSM- λόγος^N-----NSM-
verb  ἦν^V-3IAI-S--
```

Tags also work in ordinary note text, not only in diagrams: write `ὁ^RA----NSM- λόγος^N-----NSM-` in a
paragraph, list, table or quote and reading view styles it the same way. Code blocks are left alone, and the
behaviour can be switched off in the plugin settings. The command **Convert Greek morphology tags to HTML**
rewrites the tags in the current note (or just the selection) as plain HTML spans, so the formatting survives
export, publishing, or removing the plugin.

**Two ways to carry a tag.** `word^CODE` is compact but only renders in reading view, and the codes clutter
the text while you edit. **Tag Greek morphology as HTML** instead writes each word as a `<span>` with the same
classes, so the formatting and the hover tooltip appear in editing view as well. **Remove Greek morphology
tags** undoes either form.

**You do not have to type the codes.** The plugin bundles the MorphGNT corpus and the Dodson lexicon, so
the command **Tag Greek morphology automatically** looks each word up and writes the code for you. Matching is
on the word itself, never on its position: a word is tagged only when the corpus attests a single parse for
it. When the candidate parses disagree, only the features they all share are written, so `πάντα` becomes
`πάντα^A---------` (an adjective, case and number undecidable) and `καί`, which may be a conjunction or an
adverb, is left alone for you to decide. About two thirds of running words are tagged outright.

Hovering a tagged word also shows its dictionary form and a short gloss, and two commands list the vocabulary of a
note or selection: **Create Greek glossary**, alphabetical by lemma, and **Create Greek glossary by
frequency**, commonest first and leaving out conjunctions and the definite article. Both render as a table
or a bullet list. Everything in this
paragraph has its own switch under Settings → Mermaid Bracket → Greek lookup, including whether glosses appear
on hover and which columns the glossary includes.

The code is stripped from the rendered text and turned into CSS classes (`gk-pos-noun`,
`gk-case-nominative`, `gk-tense-imperfect`, …; the four pronoun classes also carry `gk-pos-pronoun`) plus a `data-morph` attribute and a hover tooltip
naming the parse. Formatting is then entirely yours: copy `docs/greek-morphology.css` into your
vault's snippets folder and edit it. The code dictionary in `packages/diagram/src/morph.ts` covers
every value used in the SBLGNT corpus; `scripts/scan-morphgnt.mjs` regenerates the counts from a
checkout of the corpus.

## Install (manual, until it is in the community list)

1. Build: `npm install && npm run build`
2. Copy `packages/obsidian-plugin/main.js`, `manifest.json` and `styles.css` into
   `<vault>/.obsidian/plugins/mermaid-bracket/`
3. Enable **Mermaid Bracket** under Settings → Community plugins, then reload Obsidian.

## Releasing

Releases are cut by tag. In `packages/obsidian-plugin`, run `npm version 0.2.0` (bumps `package.json`,
`manifest.json` and `versions.json` together), then `git push && git push --tags`. The
`Release Obsidian plugin` workflow checks the tag against `manifest.json`, runs the tests, builds, and attaches
`main.js`, `manifest.json` and `styles.css` to a GitHub release, which is what
[BRAT](https://github.com/TfTHacker/obsidian42-brat) and the community plugin list install from.

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

## Bundled data

`packages/obsidian-plugin/src/data/greek-data.ts` is generated by `scripts/build-greek-data.mjs` from two
open sources, and is the only data the plugin ships:

- [MorphGNT SBLGNT](https://github.com/morphgnt/sblgnt) — parsing and lemmas, CC BY-SA
- [Dodson Greek lexicon](https://github.com/biblicalhumanities/Dodson-Greek-lexicon) — brief glosses, CC0

137,554 words reduce to 19,335 surface forms, 2,328 extra normalized spellings, 602 parse codes and 5,461
lemmas, 5,021 of which carry a gloss.

## Acknowledgements

Bracketing and the diagram conventions follow [Biblearc](https://biblearc.com); the sentence-diagram shapes
follow Eric Sowell's *An Intermediate Guide to Greek Diagramming* (KoineWorks, 2002) and Reed & Kellogg's
*Higher Lessons in English* (1877). This project is not affiliated with Biblearc.

## License

MIT for the code. The bundled Greek data keeps the licences of its sources: MorphGNT's parsing data is
CC BY-SA, and the Dodson lexicon is CC0.
