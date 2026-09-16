# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project goal

Build a **custom, reusable Mermaid diagram type** for Biblearc-style bracketing diagrams. Input is Mermaid-conformant text (a fenced code block with a new diagram keyword); output renders wherever Mermaid renders and reproduces the look of the diagrams in `examples/`.

Requirements:
1. Support all 18 logical relationships defined in `documents/`.
2. Bracketing layouts with arbitrary multi-level nesting (a whole-book bracket nests pericope brackets).
3. Text blocks per proposition, with Markdown-style inline formatting inside them.
4. Multi-column text layouts so one row can show several translations side by side, including Greek/original-language text (Unicode, polytonic).

**Initial target environment is Obsidian, as an Obsidian plugin, preferably extending an existing one.** No cloud or CDN rendering service; everything runs locally inside the vault. Obsidian bundles Mermaid (11.13 as of Obsidian 1.13.4) and exposes it to plugins via `loadMermaid()`; Mermaid's `registerExternalDiagrams` works on that instance. Design the parser/renderer so they are not tied to Obsidian; other rendering targets are planned for later phases.

## Roadmap (agreed 2026-09-13)

1. **Proof of concept — DONE 2026-09-13, verified by the user in Obsidian 1.13.7.** Registration on Obsidian's bundled Mermaid via `loadMermaid()` works, foreignObject row measurement works, ordinary Mermaid blocks are unaffected. Nested brackets, group colours, multiple columns, stars/labels and the `config` option line landed here too.
2. **Full bracket features — largely done 2026-09-13; see "Phase 2 leftovers" below.** Arbitrary nesting, forests (multiple top-level items), per-child labels and stars, stacked labels, all 18 relationships with group colours (coordinate green, distinct statement red, restatement blue, contrary orange), inference/bilateral glyphs, verse-ref column with wrapping, multiple text columns with headers, title from frontmatter, stable CSS class names and CSS variables.
3. **Text formatting — done 2026-09-13 (built-in and Obsidian formatters; link-click behaviour inside foreignObject awaits user confirmation).** Built-in inline subset (bold, italic, strike, `==highlight==`, `|` bar, `{blue brackets}`) behind a pluggable formatter interface; then an Obsidian-side formatter using `MarkdownRenderer`. Verify DOMPurify survival and internal-link click handling before relying on it. Embeds and callouts inside cells are out of scope.

4. **Sentence diagramming — 4a done 2026-09-14 (base line slots/markers, mod/prep/gen hangers, `=` appositives, forks, sentence conj, verse gutter); 4b (part, inf, stilt, sub, rel, voc, abs, compound clauses) next.** Target is the KoineWorks/Sowell Greek Reed–Kellogg system as implemented by Biblearc's Diagram module; the six `examples/SENTENCE_Colossians*.pdf` exports (they have a text layer) are the target output. Design input is `documents/sentence-diagramming-research.md` (§2b shape catalogue with Sowell's names, §5 syntax with two worked Colossians transcriptions, §6 layout sketch, §7 sub-phases 4a–4c). Planned as a second external diagram `sentence` registered by the same plugin, native SVG text (no foreignObject).

Phase 2 leftovers: a star on a top-level bracket is parsed but not drawn (nothing to attach it to); the parent-arm attachment point is an approximation of Biblearc's (starred arm, else midpoint) and may want a per-diagram option; the bilateral relationship renders generically with three children and no special glyph.

Keep the parser and layout free of Obsidian imports throughout; only the plugin adapter and the phase-3 formatter may touch the Obsidian API.

## Decisions (2026-09-13)

- **Layout:** npm workspaces, two packages. `packages/diagram` is the framework-free Mermaid external diagram (parser, layout, SVG); `packages/obsidian-plugin` is the thin adapter. Only the plugin package may import from `obsidian`.
- **Keyword:** blocks start with `bracket` inside a normal ```mermaid fence.
- **Plugin id:** `mermaid-bracket`, MIT licence.
- **Test vault:** `test-vault/` in the repo; the plugin build copies `main.js`, `manifest.json`, `styles.css` into `test-vault/.obsidian/plugins/mermaid-bracket/`. Open it in Obsidian (installed locally, 1.13.x, bundled Mermaid 11.13). Never run the `obsidian` binary from a script: it launches the GUI and blocks.
- **Toolchain:** Node 26, npm only (no pnpm/bun). TypeScript + esbuild for the plugin, vitest for parser/layout tests. Depend on `mermaid` for types only (`^11`, matching Obsidian's bundled major); nothing from Mermaid is bundled at runtime.

## Commands

```
npm install                 # once; npm workspaces (packages/diagram, packages/obsidian-plugin)
npm test                    # vitest: parser, layout, and a jsdom integration test through real Mermaid
npx vitest run packages/diagram/test/parser.test.ts   # single test file
npm run typecheck           # tsc --noEmit for both packages
                            # plugin unit tests import 'obsidian' via the stub in packages/obsidian-plugin/test/obsidian-stub.ts (vitest alias)
npm run build               # builds the plugin and copies it into test-vault/.obsidian/plugins/mermaid-bracket/
npm run dev                 # esbuild watch mode, same copy step after each rebuild
```

`packages/diagram/demo/` renders the diagram outside Obsidian (see its README); bundle with esbuild, serve over HTTP, and `firefox --headless --screenshot` gives a quick visual check without launching Obsidian.

Then open `test-vault/` in Obsidian and reload the plugin (or the app) after a rebuild. `test-vault/PoC.md` and `test-vault/Colossians 1_21-23.md` are the manual checks.

## Architecture

- `packages/diagram/src/index.ts` exports `bracketDiagram`, a Mermaid `ExternalDiagramDefinition` (`id`, `detector`, `loader`). Mermaid types are imported for type-checking only; nothing from Mermaid is bundled.
- Pipeline per block: Mermaid strips frontmatter/comments and hands the title to `db.ts` → `parser.ts` builds a `BracketDocument` (columns, tree of `TreeNode`, rows keyed by verse ref; see `model.ts`) → `renderer.ts` creates foreignObject cells in the live SVG, measures their heights, calls `layout.ts` (pure geometry, unit-tested), then draws bars, arms, labels and stars.
- `relationships.ts` holds the 18 relationships, their group (drives colour), and keyword/label aliases. `styles.ts` is the CSS Mermaid injects per diagram; colours are CSS custom properties.
- `packages/obsidian-plugin/src/main.ts` is the whole adapter: `loadMermaid()` → `registerExternalDiagrams` → rerender open Markdown views.
- Per-diagram options are `config <key> <value>` lines in the block body (`doc.options`), overriding `DEFAULT_LAYOUT` in `layout.ts`; `setBracketDefaults()` lets the host set vault-wide defaults. **Mermaid's frontmatter `config:` cannot carry them**: `sanitizeDirective` deletes every key absent from Mermaid's config schema, so a `bracket:` section is silently dropped. `coordinateArms` (`ends` default, `all` = Biblearc look), `fontSize` (sets `--bracket-font-size` on the root group; all text and row heights derive from it), and `useMaxWidth` (default **false**, unlike Mermaid: a shrunk text table is unreadable; the plugin CSS makes the container scroll sideways) are the main ones; the table is in `examples/Colossians_1_21-23.md`.
- **Sentence diagram** lives in `packages/diagram/src/sentence/` and is exported from the same index. `parser.ts` builds a `SentenceDocument` (clauses → slots → members → hanger groups; `model.ts`). `layout.ts` is pure: it takes a `Measure` callback and returns line/text primitives (`Prim[]`), so tests use a fake measurer and the renderer (`renderer.ts`, native `<text>`, no foreignObject) just draws primitives and measures with a hidden probe. Layout rules (all checked against `SENTENCE_Colossians _1_1_8.pdf`): slots in fixed order with markers, the complement marker leaning back toward the subject (`\\`); the first terrace under a word is one long slant from the head line to the shelf foot (long when `gen` rows sit between), later terraces branch off a stem dropped from that foot with short slashes; `gen` chains are one text line under the head; forks stack members with the conjunction inside the fork triangle on a dotted line, subject forks converge rightward into the predicate marker, object-side forks open rightward; the base line runs only from the subject fork tip to the first rightward fork tip; appositives are members (`ApposMember`) that can carry hangers, and a compound appositive is a rightward fork opening from the `=`, placed right of the head's own terraces; slots are pushed right until their word boxes clear earlier slots' hangers; clauses are laid out at y=0 then dropped so content above the base line clears the previous clause. The plugin registers both diagrams and shares fontSize/useMaxWidth with `setSentenceDefaults()`.
- Layout rules distilled from the Biblearc PDFs (all in `layout.ts`): a parent's arm attaches to a child bracket at the child's starred arm if any, else the bar midpoint; a coordinate bar's label sits in the widest gap between its arms; leaf arms end just left of the ref column; refs longer than `refWrapAt` wrap after the hyphen.
- **Greek morphology**: `morph.ts` holds the MorphGNT code dictionary (13 parts of speech, 8 parsing slots), derived from a full scan of the SBLGNT corpus — `scripts/scan-morphgnt.mjs` reproduces the counts from a checkout of github.com/morphgnt/sblgnt. `word^CODE` in any bracket cell or sentence word is stripped from the text and emitted as classes (`gk`, `gk-pos-…`, `gk-case-…`, …) plus `data-morph` and a tooltip: a `<span>` in HTML cells (both formatters), a `<tspan>` with a `<title>` child in sentence SVG. `docs/greek-morphology.css` is the sample snippet users copy; the plugin ships no morphology styling of its own.
- Cell text goes through a `CellFormatter` (`formatter.ts`): `defaultFormatter` is the host-independent inline subset; `setCellFormatter()` swaps in another. The plugin's `obsidian-formatter.ts` pre-converts `|` and `{…}` to spans, then runs `MarkdownRenderer.render` (source path = active file, since Mermaid's draw hook has no note context). `draw` is async for this reason. `createInlineFormatter({ obmdColors: true })` adds Style Obmd colour keys (`=={r}…==`, `**{b}…**`), emitting that plugin's `cmk-*` classes so its CSS and colour settings apply in Obsidian, with fallback colours in `styles.ts`; in that mode `__{r}text__`/`__text__` are (coloured) underlines, an extension Style Obmd lacks; the plugin offers three modes: builtin, obmd, obsidian. DOMPurify under Mermaid's strict level keeps `strong/mark/span[class]` and `a.internal-link[data-href]` (covered by tests).
- Export: right-click on a rendered diagram (`export-menu.ts`, capture-phase contextmenu listener) offers copy as PNG, copy SVG markup, save SVG/PNG to the vault's attachment folder. `svg-export.ts` (no Obsidian imports, jsdom-tested) clones the svg with namespaces, pixel size, resolved font family and Style Obmd variables inlined, **flattens every foreignObject cell into native `<text>` runs** using per-character client rects from the live DOM (`flattenCells`; keeps weight/style/colour/decoration and highlight rects), then rasterises via blob URL → Image → canvas. Flattening is required: Chromium taints a canvas drawn from an SVG containing foreignObject ("Tainted canvases may not be exported"), and office tools ignore foreignObject. Chromium's clipboard cannot hold image/svg+xml, hence markup-as-text. Verified in headless Firefox via the two-stage localStorage harness (Firefox's `--screenshot` does not wait for top-level await).
- Vault-wide defaults come from the plugin settings tab (`packages/obsidian-plugin/src/settings.ts`) via `setBracketDefaults()`; `config` lines in a block override them.
- Mermaid's `%%` comment lines are stripped before our parser sees the text, so cell text cannot start a line with `%%`.

## What "bracketing" is

Bracketing is a Bible-study method (from Biblearc) that splits a passage into numbered propositions (e.g. `21-22a`, `22b`, `23a`) and joins them with nested brackets, each labelled with one of **18 logical relationships**. Relationships fall into four groups:

- **Coordinate**: Series (S), Progression (P), Alternative (A)
- **Support by Distinct Statement**: Ground (G), Inference (∴), Bilateral (BL), Action-Result (Ac/Res), Action-Purpose (Ac/Pur), Conditional (If/Th), Temporal (T), Locative (L)
- **Support by Restatement**: Action-Manner (Ac/Mn), Comparison (Cf), Negative-Positive (-/+), Idea-Explanation (Id/Exp), Question-Answer (Q/A)
- **Support by Contrary Statement**: Concessive (Csv), Situation-Response (Sit/R)

Coordinate relationships join 2+ equal siblings under one label. Subordinate relationships pair exactly two halves, each with its own sub-label (e.g. `Ac` over `Pur`), and one half is the **main point**, marked with a star (★). BL is Ground + Inference combined around a middle proposition.

## Reference material

`documents/sentence-diagramming-research.md` — design doc for the planned `sentence` diagram (Reed–Kellogg).

`documents/` — the authoritative definitions for bracketing; consult these before inventing labels or abbreviations:
- `The18LogicalRelationshipsEng.pdf` — definitions, abbreviations, conjunctions, and a Bible example for each relationship.
- `Englishcongunctionsbracketingcheetsheetnewlogo.pdf` / `Greekconjunctions...pdf` — conjunction → relationship lookup tables (note "and" is ambiguous and can map to any relationship).
- `Logicalrelationshipexamplesentencesnewlogo.pdf` — plain-English example sentence per relationship (birthday-party theme), useful for tests and docs.

`examples/Colossians_1_21-23.md` — the input syntax, worked for one pericope and the whole-book outline, with the option and inline-formatting tables. `examples/Colossians_3_1-4.md` — richer fixture (five-deep nesting, stacked labels). `examples/Sentence_Colossians_1_1-2.md` — sentence-diagram fixture and 4a keyword table (transcribed from the Biblearc export). `examples.test.ts` parses every block in these files, so they must stay valid.

`examples/SENTENCE_Colossians*.pdf` — Biblearc Diagram (sentence diagram) exports, target for the planned `sentence` diagram; `pdftotext` works on these.

`examples/Colossians*.pdf` — target output for `bracket`. These are Biblearc jsPDF exports of Colossians brackets (one per pericope plus a whole-book outline in `Colossians.pdf`). They have **no text layer**; view them as images (the `Read` tool renders PDF pages). Conventions visible in them:
- Layout: bracket tree on the left, verse references in a column, then one or more text columns (e.g. NA28 Greek + ESV, or a single "MINE" summary column) in a bordered table, one row per proposition.
- Brackets are colour-coded by group: coordinate = green, distinct statement = red, restatement = blue. (Contrary-statement colour is not shown in the examples.)
- Labels sit on the bracket's vertical bar (coordinate) or on each horizontal arm (subordinate); the star marks the main-point arm. Nesting is arbitrary depth; a whole-book bracket nests pericope brackets.
- Verse refs use ranges and letter suffixes (`1-5`, `23b`); whole-book views drop the chapter number in the ref column.

`pdftotext` works on `documents/*.pdf` (layout is two-column, so text interleaves); it returns nothing for `examples/*.pdf`.
