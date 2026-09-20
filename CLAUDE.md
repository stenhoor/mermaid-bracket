# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Two custom Mermaid diagram types for Bible study, delivered as an Obsidian plugin:

- **`bracket`** — Biblearc-style bracketing of a passage's logical structure using the 18 logical
  relationships, with nested brackets, a verse-reference column and multi-column text.
- **`sentence`** — Greek sentence diagrams in the KoineWorks/Sowell adaptation of Reed–Kellogg, as
  implemented by Biblearc's Diagram module.

Both render inside ordinary ```mermaid fences. The plugin registers them on Obsidian's own bundled
Mermaid via `loadMermaid()` + `registerExternalDiagrams`; nothing is fetched from the network and no
cloud service is involved.

## Working with the user

**Check every factual claim before writing it, including the ones that feel incidental.** Dates,
timescales, "this matches the target", "that is already documented", "I verified it". Code gets tested
here; prose has not been, and that is backwards, because the prose is what the user actually reads. If
a claim cannot be checked in the moment, say what was not checked rather than asserting it.

- **Comparisons must be shown, not asserted.** Never say a render matches a target without putting
  them side by side. Crop the PDF with `pdftoppm`, stack it above a headless render, look at it, and
  send the image.
- **If a check or a screenshot is claimed, deliver it in the same message.**
- **When the user corrects something, the correction stands.** Fix it and say what was wrong. Do not
  argue about how they characterised the mistake, and do not follow an error with a pivot to the next
  task; that combination reads as dismissive, and in this session it did.

This is recorded because the pattern happened repeatedly on 2026-09-20: an unchecked claim, then a
defence of the wording, then a quick apology and a move on. The user named it as unacceptable.

## Ground rules

- **No cloud, no CDN.** Everything runs locally in the vault.
- **Keep `packages/diagram` free of Obsidian imports.** Only `packages/obsidian-plugin` may import
  from `obsidian`, so the diagrams work in any Mermaid 11 host.
- **Diagrams are separate entities** (decided 2026-09-17). The note-text Greek features — automatic
  tagging, the bake command, the reading-view post-processor, both glossaries — never read or write
  inside fenced code blocks, Mermaid ones included. `mapOutsideCode` and the post-processor's skip
  selector enforce it and a test asserts it. Do not propose extending them into diagram blocks.
- **Never run the `obsidian` binary from a script**: it launches the GUI and blocks.

## Commands

```
npm install                 # once; npm workspaces (packages/diagram, packages/obsidian-plugin)
npm test                    # vitest: parser, layout, jsdom runs through real Mermaid
npx vitest run packages/diagram/test/parser.test.ts   # a single file
npm run typecheck           # tsc --noEmit for both packages
npm run build               # builds the plugin and copies it into test-vault/.obsidian/plugins/
npm run dev                 # esbuild watch, same copy step
```

Plugin unit tests import `obsidian` through the stub at `packages/obsidian-plugin/test/obsidian-stub.ts`
(a vitest alias). `packages/diagram/demo/` renders diagrams outside Obsidian: bundle with esbuild,
serve over HTTP, then `firefox --headless --screenshot` for a visual check. Firefox's `--screenshot`
does not wait for top-level await, so a page that renders asynchronously needs the two-stage
localStorage harness. After a rebuild, reload the plugin in `test-vault/`.

Releases: in `packages/obsidian-plugin`, `npm version x.y.z` then `git push && git push --tags`. The
tag must equal `manifest.json`'s version; the workflow checks it, runs tests and typecheck, builds,
and attaches `main.js`, `manifest.json` and `styles.css` to a GitHub release.

## Layout of the repository

| Path | What it holds |
|---|---|
| `packages/diagram/src/` | `bracket` diagram: `parser.ts`, `layout.ts` (pure geometry), `renderer.ts`, `relationships.ts`, `formatter.ts`, `morph.ts`, `morph-lookup.ts` |
| `packages/diagram/src/sentence/` | `sentence` diagram: same shape, native SVG text |
| `packages/obsidian-plugin/src/` | the adapter: `main.ts`, `settings.ts`, `greek.ts`, `markdown-morph.ts`, `export-menu.ts`, `svg-export.ts`, `data/greek-data.ts` (generated) |
| `docs/reference/` | the Biblearc sheets converted to Markdown, with live diagrams |
| `docs/greek-morphology.css` | the user's morphology stylesheet (HTML rules plus an SVG layer) |
| `examples/` | target PDFs from Biblearc and the transcribed fixtures |
| `documents/` | the source PDFs and the sentence-diagramming research doc |
| `scripts/` | `build-greek-data.mjs`, `scan-morphgnt.mjs` |
| `test-vault/` | an Obsidian vault for manual checks; the build installs the plugin into it |

## The bracket diagram

Pipeline: Mermaid strips frontmatter and comments and hands the title to `db.ts` → `parser.ts` builds
a `BracketDocument` (columns, a tree of `TreeNode`, rows keyed by verse reference) → `renderer.ts`
creates foreignObject cells in the live SVG, measures them, calls `layout.ts`, then draws bars, arms,
labels and stars.

Layout rules distilled from the Biblearc PDFs: a parent's arm attaches to a child bracket at the
child's starred arm if any, else the bar midpoint; a coordinate bar's label sits in the widest gap
between its arms; leaf arms end just left of the reference column; references longer than `refWrapAt`
wrap after the hyphen.

Per-diagram options are `config <key> <value>` lines in the block body, overriding `DEFAULT_LAYOUT`.
**Mermaid's frontmatter `config:` cannot carry them**: `sanitizeDirective` deletes every key absent
from Mermaid's own schema, so a `bracket:` section is silently dropped. The main options are
`coordinateArms` (`ends` default, `all` for the Biblearc look), `fontSize` and `useMaxWidth` (default
**false**, unlike Mermaid, because a shrunk text table is unreadable; the plugin CSS scrolls the
container sideways instead). The full table is in `examples/Colossians_1_21-23.md`.

Cell text goes through a `CellFormatter`. `defaultFormatter` is the host-independent inline subset;
the plugin's `obsidian-formatter.ts` pre-converts `|` and `{…}` to spans and then runs
`MarkdownRenderer.render`, which is why `draw` is async. `createInlineFormatter({ obmdColors: true })`
adds Style Obmd colour keys and, as an extension that plugin lacks, `__{r}text__` underlines. Three
modes: builtin, obmd, obsidian.

Known leftovers: a star on a top-level bracket is parsed but not drawn; the arm attachment point is an
approximation; bilateral renders generically with no special glyph.

## The sentence diagram

`parser.ts` builds a `SentenceDocument` (clauses → slots → members → hanger groups). `layout.ts` is
pure: it takes a `Measure` callback and returns line and text primitives, so tests use a fake measurer
and `renderer.ts` only draws primitives, measuring with a hidden probe. Text is native `<text>` and
`<tspan>`, never foreignObject.

Keywords: `clause` (`+ CONJ` joins the previous one), `conj`, `verse`, `key`, the slots `subj` `verb`
`obj` `obj2` `comp`, `=` appositives, the hangers `mod` `prep` `gen` `part` `inf` `rel` `sub`, the
slot filler `stilt`, and `voc`/`abs`. Any of them takes `+ CONJ` to fork. `part`/`inf` accept a
trailing `(Label)` and carry their own complements; `inf` puts an indented `subj` before its double
bar; `rel ROLE TEXT` names the slot its pronoun fills.

Layout rules, all checked against `SENTENCE_Colossians _1_1_8.pdf`:

- Slots run in fixed order with their markers, the complement marker leaning back toward the subject.
- The first terrace under a word hangs on one long slant; later ones branch off a stem dropped from
  that foot. A terrace that follows a genitive chain is set **beside** the chain, not below it.
- `gen` chains are one text line under the head; an appositive of a genitive drops to the next row.
- Forks stack members with the conjunction inside the triangle on a dotted line. Subject forks
  converge rightward into the predicate marker; object-side forks open rightward. The base line runs
  only from the subject fork tip to the first rightward fork tip.
- Verbals (`part`, `inf`) hang on a vertical stem — one stem for all of them — each on its own shelf,
  with the grey label beneath.
- **Subordinate and relative clauses are deferred.** `layoutHangers` collects them into
  `Sub.deferred`; every stage must forward that list alongside prims, boxes and verses, or the clause
  silently disappears. `layoutClause` then places them below everything it owns and draws the slant or
  the dashed link back to the anchor.
- Slots are pushed right until their boxes clear earlier slots' hangers; clauses are laid out at y=0
  then dropped so content above the base line clears the previous clause.

Presentation: `key NAME COLOUR LABEL` plus `word@NAME` colours referents and draws the key top right.
The colour is written as an inline `style`, because the injected stylesheet's `fill` beats a
presentation attribute. Inline marks (`**`, `*`, `~~`, `==`) become tspan classes and are stripped
from the measured text. `config style sowell` puts a preposition on the slant with an object marker.

Four of the six Biblearc exports have a transcribed fixture. What remains is transcription, not code.
Against the exports, the differences left are proportion and the author's hand placement.

## Greek morphology

`morph.ts` holds the MorphGNT code dictionary (13 parts of speech, 8 parsing slots), derived from a
full scan of the SBLGNT corpus; `scripts/scan-morphgnt.mjs` reproduces the counts. `word^CODE` in a
bracket cell, a sentence word or ordinary note text is stripped from the text and emitted as classes
(`gk`, `gk-pos-…`, `gk-case-…`) plus `data-morph` and a tooltip: a `<span>` in HTML, a `<tspan>` with
a `<title>` child in sentence SVG. The four pronoun classes also carry `gk-pos-pronoun`. The corpus
never marks person on a pronoun, so first, second and third person are only reachable via
`data-lemma`.

`morph-lookup.ts` (data-free) decodes the bundled index and resolves a word: exact spelling, then the
normalized table, then accent-folded. `agreedCode` reduces candidate parses to the features they all
share and returns null when even the part of speech differs, which is why `καί` is never tagged.

The data is `packages/obsidian-plugin/src/data/greek-data.ts`, generated by `scripts/build-greek-data.mjs`
from a MorphGNT checkout plus Dodson's lexicon (CC BY-SA and CC0). Surface and normalized form tables
are kept **separate**: merging them collapses spellings the corpus distinguishes and silently costs
precision. A sixth section stores each lemma's dominant part of speech, which is how the frequency
glossary drops conjunctions and the article.

`greek.ts` wraps it: `autoTagGreek` writes `^CODE` tags, `tagGreekAsHtml` writes `<span>` markup so
formatting shows in editing view too (honouring a hand-written code over the lookup and never
double-wrapping), `stripGreekTags` undoes either, `buildGlossary`/`renderGlossary` produce the
vocabulary list, `wordInfo` feeds the lexicon into `setMorphInfoProvider` for tooltips. Every piece
has a settings toggle and the commands use `checkCallback`, so they vanish from the palette when off.
`markdown-morph.ts` does the same for note text.

`docs/greek-morphology.css` is the user's stylesheet. **Its SVG rules must stay scoped to `text.` and
`tspan.` selectors**: bracket cells are HTML inside the diagram's own `<svg>`, so an `svg .gk-…`
selector would match them too and double up effects. Translations used: `background-color` →
`paint-order: stroke fill` with a stroke halo, `text-shadow` → `filter: drop-shadow()`,
`transform: skewX` → `font-style: oblique <angle>`.

## Export

Right-click a rendered diagram: copy as PNG, copy SVG markup, save either to the vault.
`svg-export.ts` clones the SVG with namespaces, pixel size, resolved font family and Style Obmd
variables inlined, then **flattens every foreignObject cell into native `<text>` runs** using
per-character client rects. Flattening is required: Chromium taints a canvas drawn from an SVG
containing foreignObject, and office tools ignore foreignObject entirely. Chromium's clipboard cannot
hold `image/svg+xml`, hence markup-as-text.

## What "bracketing" is

A Bible-study method (Biblearc) that splits a passage into numbered propositions and joins them with
nested brackets, each labelled with one of 18 logical relationships in four families:

- **Coordinate** (green): Series `S`, Progression `P`, Alternative `A`
- **Support by distinct statement** (red): `G` `∴` `BL` `Ac/Res` `Ac/Pur` `If/Th` `T` `L`
- **Support by restatement** (blue): `Ac/Mn` `Cf` `-/+` `Id/Exp` `Q/A`
- **Support by contrary statement** (orange): `Csv` `Sit/R`

Coordinate relationships join two or more equals under one label. Subordinate ones pair exactly two
halves, each with its own label, one of which is the main point and carries a star. `BL` is Ground and
Inference combined around a middle proposition. Full definitions:
`docs/reference/18-logical-relationships.md`.

## Reference material

- `docs/reference/` — the four Biblearc sheets converted to Markdown: the 18 relationships with a live
  diagram each, the English (62) and Greek (64) conjunction tables, and the example sentences. The
  conjunction tables were parsed from the PDFs **by word position**, because the sheets centre each
  headword across its rows and a plain text dump binds rows to the wrong word. `examples.test.ts`
  parses every diagram on these pages, so they cannot drift from the parser.
- `documents/sentence-diagramming-research.md` — the design doc: shape catalogue with Sowell's names,
  syntax proposal, layout sketch.
- `documents/*.pdf` — the original sheets. `pdftotext` works on them, but drops accented Greek and the
  fi/fl ligatures, which is why the converted pages restore them by hand.
- `examples/Colossians*.pdf` — bracket targets. No text layer; view them as images.
- `examples/SENTENCE_Colossians*.pdf` — sentence targets. These do have a text layer.
- `examples/*.md` — the transcribed fixtures, which double as the syntax reference.
