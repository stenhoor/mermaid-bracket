# Sentence diagramming: research and Mermaid layout recommendations

Written 2026-09-14 as the design input for a second custom Mermaid diagram type alongside `bracket`.

## 1. What "sentence diagramming" means in this domain

Four visual systems are in use, and only one of them is what Bible-study users mean by the term:

| System | What it shows | Shape | Relevance |
|---|---|---|---|
| **Reed–Kellogg (RK)** | Grammatical function of every word: subject, predicate, complements, modifiers, phrases, clauses | Horizontal baselines with vertical dividers; modifiers hang on slanted lines; clauses on supports; dotted lines for connectives | **The target.** Reed & Kellogg, *Higher Lessons in English* (1877, public domain); used for Greek NT by Leedy (BibleWorks/Logos), Kantenwein, and most seminary courses |
| Biblearc Phrasing / block diagramming | Flow of thought by indenting subordinate phrases under what they modify, with arrows and semantic labels | Indented text lines | Different tool; already close to what the bracket diagram covers. Not RK |
| Constituency / dependency trees (linguistics) | Phrase structure or head–dependent arcs | Trees / arcs | Academic; Mermaid flowcharts can already draw trees. Not what the user asked for |
| Thought-flow / propositional display (Kaiser) | Clause-level outline | Indented clauses | Adjacent to bracketing; not RK |

Leedy's own definition of the goal is worth keeping: "a method that at least roughly approximates the one developed by Alonzo Reed and Brainerd Kellogg". RK "abstracts away from actual word order" to show function, which is exactly why it suits Greek.

## 2. Reed–Kellogg conventions (from the primary source)

Geometry catalogued from *Higher Lessons in English* (Reed & Kellogg 1877, Project Gutenberg #7188) with the book's own wording where it settles a shape. Modern summaries agree.

### 2.1 The baseline

- **Subject | Predicate.** "Draw a heavy line and divide it into two parts"; the divider is a vertical bar that crosses the baseline.
- **Object complement.** The direct object continues the predicate line; the divider is a vertical bar that stops at the baseline ("the object line ... a continuation of the predicate line").
- **Attribute complement** (predicate nominative/adjective): same continuation, but the divider "slants toward the subject" — a backslash `\`.
- **Objective complement** ("made him *king*"): after the direct object, a divider that "slants toward the object complement" — another backslash, further right.
- **Understood subject**: written in parentheses, `(you)`; Greek practice writes `(X)` for any elided subject.
- **Independent elements** (vocative, interjection, expletive *there*, absolute phrase): "must stand by itself" on a short horizontal line above the clause; Greek practice joins it with a dotted vertical line.
- **Appositive** ("explanatory modifier"): "enclosed in curves, on a short line placed after" the word it explains: `Cromwell (Protector)`.

### 2.2 Modifiers under the baseline

- **Adjective / adverb**: a slanted line hanging from the word modified, the word written along the slant. Several modifiers stack left to right under one word; the book notes they can be numbered by rank.
- **Prepositional phrase**: "a slanting line standing for the introductory word, and a horizontal line representing the principal word. Under the latter are drawn the lines which represent the modifiers of the principal word." Nesting is unlimited (phrase under phrase).
- **Indirect object**: drawn like a prepositional phrase with the preposition slot empty or `(to)`; Greek dative practice marks the empty slot `(X)`.
- **Modifier of a whole phrase** ("*only* modifies the whole phrase"): the slant hangs from the phrase's own slanted line.

### 2.3 Compounds

- Compound subject / predicate / object / modifier: each member on its own short horizontal line, the lines joined by a fork; the conjunction sits on a **dotted vertical line** between members; `x` marks an understood conjunction. Shared modifiers attach to the line segment that "represents the entire subject".
- Compound sentences: each clause on its own heavy baseline, stacked; the conjunction on a dotted vertical line linking the baselines (Leedy: `καί` between the two clauses of Matt 1:21, bracket-style fork on the left).

### 2.4 Clauses

- **Adjective (relative) clause**: full baseline of its own below; the relative pronoun occupies its grammatical slot in the clause and a **dotted line** joins it to its antecedent ("This office is shown by the dotted line").
- **Adverb clause**: baseline below; the subordinating conjunction on a **dotted slanted line** from the verb it modifies down to the clause's verb. Conjunctive adverbs (*when, where*) get a line "made up of two parts": upper part connective, lower part adverb.
- **Noun clause**: its baseline sits on a **support** (pedestal) rising from the slot it fills (subject, object, object of preposition). Introductory *that* on a short line above the clause.
- Elliptical clauses (*than, as*): omitted words supplied in parentheses.

### 2.5 Verbals

- **Participle**: "the line ... is broken; one part slants to represent the adjective nature ... and the other is horizontal to represent its verbal nature" — a bent line; its objects and modifiers continue from the horizontal part.
- **Gerund**: "the first part represents the participle as a noun, and the other as a verb" — a stair-step line, standing on a support in the noun slot.
- **Infinitive**: *to* on a slant, verb on a horizontal (like a prepositional phrase); when used as a noun, on a support in the slot ("drawn above the complement line, on which it is made to rest by means of a support"). Adverbial infinitives hang like prepositional phrases.
- **Absolute phrase**: independent element, noun with participle, standing by itself.

### 2.6 Greek-specific practice (Leedy, Matt 1:21 sample)

- Articles stay with their noun on the same line; `(X)` for understood subjects; sentence conjunctions above the clause; preposition and object share a line with a bar between them.

## 2b. The actual target: the KoineWorks / Biblearc system

The six `examples/SENTENCE_Colossians*.pdf` exports (added 2026-09-14) come from Biblearc's Diagram module, which implements the Greek adaptation of Reed–Kellogg documented in Eric Sowell, *An Intermediate Guide to Greek Diagramming* (Lexel/KoineWorks, 2002; free PDF at inthebeginning.org). Sowell names every shape, and Biblearc's own grammar course uses the same names ("shelf", "stilt", "floating shelf", "double lines"). This, not the English textbook set, is what the `sentence` diagram must reproduce.

| Element | Sowell's name | Geometry | Seen in the exports |
|---|---|---|---|
| Clause line | base line | heavy horizontal | every clause |
| Subject / verb divider | predicate marker | vertical through the base line | `ἡμεῖς │ παυόμεθα`; subject slot may be empty (`│ Εὐχαριστοῦμεν`) or `(X)` |
| Direct object divider | object marker | vertical down to the base line only | `κρινέτω │ ὑμᾶς` |
| Predicate nominative / adjective | complement marker | backslash `\` down to the base line | `ἐστιν \ ἡ κεφαλή` |
| Second accusative (person–thing) | double accusative marker | `‖` down to the base line | `παραστῆσαι │ ὑμᾶς` … |
| Appositive | equals sign | `= word` on the same line, right of the head | `ἀπόστολος = Παῦλος`, `τῷ θεῷ = πατρί`; also used for article + attributive participle: `διὰ τὴν ἐλπίδα = τὴν` with the participle hanging below |
| Adjective, adverb, dative, genitive (Sowell) | left-slant terrace | slant down-left from the head, word on a horizontal shelf | `πάντοτε`, `νυνί`, `οὐ`, `τῇ πίστει` |
| Genitive chain (Biblearc variant) | — | `/ word / word` written on the line directly under the head, no slant | `/ Χριστοῦ Ἰησοῦ`, `/ τοῦ κυρίου / ἡμῶν`, `/ τῆς δόξης / τοῦ μυστηρίου / τούτου` |
| Prepositional phrase | left-slant terrace + object marker | slant, then shelf; Sowell puts the preposition on the slant and a bar before the object, Biblearc writes the whole phrase on the shelf | `ἐν Κολοσσαῖς`, `ἀπὸ θεοῦ` with `/ πατρός / ἡμῶν` below |
| Attributive / adverbial participle | vertical connector + shelf | vertical drop from the head, participle on a horizontal shelf, its own objects/modifiers continuing right/below; Biblearc adds a grey semantic label in parentheses under it | `προσευχόμενοι (Temporal)`, `ἀκούσαντες (Causal)`, `καρποφοροῦντες (Result)`, `ὄντας (Concession)` |
| Substantival participle / infinitive / clause in a slot | standard (stilt) | small triangle on a stem rising from the slot; the substantive's own base line sits on top | `Θέλω ⟂△` → `ὑμᾶς ‖ εἰδέναι`; `ἠθέλησεν △` → `γνωρίσαι` |
| Infinitive | infinitive marker | `‖` through the line just before the infinitive; accusative subject to its left | `‖ παραστῆσαι │ ὑμᾶς`, `(Purpose) ‖ περιπατῆσαι` |
| Coordinated members | branch with dotted conjunction line | members on parallel shelves joined by a fork; conjunction on the dotted vertical; `x` or `[καί]` when supplied | `τὴν πίστιν / καὶ / τὴν ἀγάπην`; three-way `ἐρριζωμένοι / καὶ / ἐποικοδομούμενοι / καὶ / βεβαιούμενοι`; `ἢ` for alternatives, `εἴτε…εἴτε` on slants |
| Compound predicates sharing an object | fork of verbs converging on one object marker | `ἠκούσατε / καὶ / ἐπέγνωτε` → `│ τὴν χάριν` |
| Subordinate (adverbial) clause | right-slant terrace with conjunction | Sowell: slant down-right from the main verb; **Biblearc: slant down-left** from under the main verb to the left end of the subordinate base line, conjunction written beside the slant | `ἵνα`, `καθώς`, `ὅτι`, `εἰ`, `γάρ`, `ἀλλά` |
| Substantival ὅτι/ἵνα clause | standard with conjunction on the stem | triangle in the slot, conjunction on the stem, clause base line above | `ὅτι` under `εἰδότες` (Sowell) |
| Relative clause | own base line + dotted link | relative pronoun in its own slot; dashed line from it to the antecedent, routed around other content | `ἔχετε │ ἣν` ⇢ `τὴν ἀγάπην`; long grey dashed routes across the page |
| Sentence-level conjunction (οὖν, δέ, γάρ, καί) | shelf above with dotted link (Sowell) | **Biblearc: short slant rising up-left from the start of the base line** with the conjunction on it | `οὖν ╱ παρελάβετε`, `δὲ`, `Καὶ` |
| Vocative, ἰδού, pendent nominative, absolute | floating shelf | above the clause, dotted line to the verb; absolutes in square brackets | not in the Colossians set |
| Supplied / bracketed text | — | `(X)`, `(αὐτός)`, `[ἐν]`, `[διʼ αὐτοῦ]`, `[καί]` rendered as written | 1:19, 2:13, 2:23 |

Presentation features in the exports that are not grammar: a title line "Diagram of Colossians 1:1–8"; gold verse references in the left margin at the height of each verse's first word, with a dashed vertical guide; a colour key (God the Father green, Jesus Christ blue, Holy Spirit magenta, Colossians orange) applied to individual words; user highlights (yellow) and strikethrough; the Biblearc wordmark.

## 3. Existing tools and text notations

- **No open text DSL exists.** ConceptViz, Vizcept, SentenceVizu are GUI/NLP web tools; 1aiway parses English; covertcj's iPad app is touch-based; UCF SenDraw is offline; ConceptDraw ships stencils; Logos and Biblearc have GUI editors; Leedy distributes a PowerPoint template; KoineWorks (2002) was a Windows product. No LaTeX package. A text-first format is new ground.
- Biblearc exports carry a text layer (Chrome "Save as PDF"), so transcription of the six examples into the new syntax can start from `pdftotext` output rather than from the images.

## 4. Can Mermaid do this?

- **Not with a built-in diagram.** Slanted text lines, half-height dividers, stilts, and dotted links between arbitrary words are outside flowchart, mindmap and block diagrams, and a graph layout engine would fight the convention.
- **Yes as a second external diagram**, exactly like `bracket`: Mermaid provides detection, frontmatter title, theming, sanitising, and the Obsidian pipeline; we compute all geometry. Registration, `config` lines, settings defaults and export carry over unchanged.
- **Native SVG text, not foreignObject.** Words never wrap, so `<text>` measured with `getComputedTextLength()` is simpler and exports without flattening.

## 5. Recommended syntax

One keyword per shape in §2b, indentation for attachment, the same conventions as `bracket` (`config` lines, `%%` comments, frontmatter title).

### 5.1 Keywords

Baseline slots (drawn left to right in this order regardless of source order):

| Keyword | Shape |
|---|---|
| `subj TEXT` | subject; omit the line, or write `subj (X)`, for an unexpressed subject |
| `verb TEXT` | verb; the predicate marker is drawn between `subj` and `verb` |
| `obj TEXT` | direct object after the object marker |
| `obj2 TEXT` | second accusative after the double accusative marker `‖` |
| `comp TEXT` | predicate complement after the complement marker `\` |
| `= TEXT` | appositive appended to the previous slot or hanger (`obj τὸν Χριστὸν Ἰησοῦν = τὸν κύριον` may also be written inline) |

Hangers, indented under the word they modify (a slot line or another hanger):

| Keyword | Shape |
|---|---|
| `mod TEXT` | left-slant terrace (adjective, adverb, dative, Sowell-style genitive) |
| `gen TEXT` | Biblearc slash chain under the head; several `gen` lines chain as `/ a / b` |
| `prep TEXT` | slant + shelf carrying the whole phrase; `config style sowell` puts the preposition on the slant with an object marker |
| `part TEXT [(Label)]` | vertical connector + shelf; a trailing parenthesised label is drawn grey beneath |
| `inf TEXT` | infinitive marker `‖` + shelf; `subj` under it becomes the accusative subject left of the marker |
| `stilt` | wraps the next clause/`inf`/`part` on a standard in the current slot (`obj stilt` then an indented clause) |
| `sub CONJ` | subordinate clause hung down-left on a slant labelled CONJ; its own slot lines follow, indented |
| `rel TEXT` | relative clause; TEXT is the relative pronoun's slot spelled as `rel obj ἣν` etc.; dashed link to the parent word |
| `conj TEXT` | sentence-level conjunction on the up-left slant of this clause |
| `voc TEXT`, `abs TEXT` | floating shelf above (vocative / bracketed absolute) with dotted link |

Coordination: a sibling line starting with `+ CONJ` joins the previous same-role line into a fork with CONJ on the dotted vertical; `+ x` for a supplied conjunction, `+ [καί]` keeps the brackets. Works for slots (`obj`, `verb`), hangers (`part`, `prep`) and whole clauses (`clause` … `clause + καί`).

Presentation: `verse 1:3` on its own line marks the following words as verse 1:3 (gold margin reference); `config key father=#2a9d3f christ=#3357d5 spirit=#c026d3 colossians=#e8632c` defines colour tags and `θεοῦ@father` colours a word; `==…==`, `~~…~~` and the Style Obmd keys work inside TEXT as in `bracket` cells (phase 3 formatter, inline only).

### 5.2 Worked example: Colossians 2:6–7 from `SENTENCE_Colossians _2_6_15.pdf`

```mermaid
---
title: Diagram of Colossians 2:6–7
---
sentence
verse 2:6
clause
  conj  οὖν
  verb  περιπατεῖτε
    prep  ἐν αὐτῷ
    sub   Ὡς
      verb  παρελάβετε
      obj   τὸν Χριστὸν Ἰησοῦν = τὸν κύριον
    verse 2:7
    part  ἐρριζωμένοι
    part  + καὶ ἐποικοδομούμενοι
      prep  ἐν αὐτῷ
    part  + καὶ βεβαιούμενοι
      mod   τῇ πίστει
    sub   καθὼς
      verb  ἐδιδάχθητε
        part  περισσεύοντες
          prep  ἐν εὐχαριστίᾳ
```

Biblearc placed the `Ὡς` clause above the main clause because its editor allows free placement; the auto layout hangs every `sub` below-left, which is the position the same export uses for `καθώς`, `ἵνα` and `ὅτι`.

### 5.3 Second example: Colossians 1:3–5a (participles with labels, compound object, relative clause, slash genitives, appositive)

```mermaid
sentence
verse 1:3
clause
  verb  Εὐχαριστοῦμεν
    mod   πάντοτε
    mod   τῷ θεῷ = πατρὶ
      gen   τοῦ κυρίου
      gen   ἡμῶν
      = Ἰησοῦ Χριστοῦ
    part  προσευχόμενοι (Temporal)
      prep  περὶ ὑμῶν
    verse 1:4
    part  ἀκούσαντες (Causal)
      obj   τὴν πίστιν
        gen   ὑμῶν
        prep  ἐν Χριστῷ Ἰησοῦ
      obj   + καὶ τὴν ἀγάπην
        rel   obj ἣν
          verb  ἔχετε
            prep  εἰς τοὺς ἁγίους
              mod   πάντας
      verse 1:5
      prep  διὰ τὴν ἐλπίδα = τὴν
        part  ἀποκειμένην
          obj   ὑμῖν
          prep  ἐν τοῖς οὐρανοῖς
```

## 6. Layout algorithm sketch

Recursive box layout, bottom-up, no graph engine:

1. **Measure** every word with `getComputedTextLength()` on a hidden `<text>` (cache by font/size/string).
2. **Base line box**: slot widths + marker gaps; markers per slot (full bar, half bar, backslash, double bar, `=`). Sentence conjunction adds a short up-left slant at the left end.
3. **Hangers** under a word are laid left to right from the word's left edge; each is a slant of fixed angle whose foot starts the shelf; `part` uses a vertical connector instead of a slant; `gen` chains are a single text line directly beneath. Sibling hangers are separated by tracking the rightmost extent per depth (a contour, as in tree layout).
4. **Forks**: members stacked with a fixed gap; two diagonals converge on the shared line; conjunction text centred on the dotted vertical between members.
5. **Stilts**: the substantive's full box is computed first, then the slot reserves its width and the box is raised on a stem with the triangle; conjunction text on the stem when present.
6. **Subordinate clauses**: full box computed, then placed below-left of the parent clause with a slant from beneath the parent verb to the child's left end; conjunction text beside the slant. Consecutive `sub` lines stack downward.
7. **Dotted links** (relative → antecedent, floating shelf → verb) are drawn last from stored anchors with a simple orthogonal route, so they never affect layout.
8. **Verse references** are placed in a left gutter at the y of the first word carrying that verse tag; a dashed vertical guide runs the height of the diagram.

Estimated size: parser ~300 lines, layout ~600, renderer ~350, on top of shared utilities lifted from `bracket` (config merge, injectUtils, styles, export, inline formatter).

## 7. Delivery recommendation

- **Phase 4a — core:** base line slots and markers, `mod`, `gen`, `prep`, `=`, `conj`, `+` forks for slots and hangers, `(X)`/brackets pass-through, verse gutter, title. Covers Col 1:1–2 and most single clauses.
- **Phase 4b — clauses and verbals:** `part` with labels, `inf` with marker and accusative subject, `stilt`, `sub`, `rel` with dotted links, compound clauses. This is the bulk of the six exports.
- **Phase 4c — presentation:** colour key tags, inline formatting in words, `config style sowell` variants (preposition on the slant, right-slant subordinate clauses), export reuse, transcription of all six exports as fixtures with a parse-and-layout test like `examples.test.ts`.
- Register both diagram types from the one plugin; share the settings tab and export menu.

## Sources

- Reed & Kellogg, *Higher Lessons in English* (1877), Project Gutenberg #7188 — primary source for §2.
- Wikipedia, "Reed–Kellogg sentence diagram".
- Eric Sowell, *An Intermediate Guide to Greek Diagramming* (Lexel Software / KoineWorks, 2002), PDF at inthebeginning.org — the system Biblearc's Diagram module implements; shape names in §2b are his.
- Biblearc Equip grammar course lessons "Introduction to Diagramming", "The Genitive", "Apposition" — confirm the shelf / stilt / floating-shelf / double-line vocabulary.
- `examples/SENTENCE_Colossians*.pdf` — six Biblearc Diagram exports supplied by the user on 2026-09-14; the target output.
- Randy Leedy, "A Case for Greek New Testament Sentence Diagramming" (2020, PDF at ntgreekguy.com) — Matt 1:21 sample diagram; Sharper Iron, "Eight Benefits of Greek NT Sentence Diagramming".
- koineworkbook.wordpress.com, "diagramming a Greek sentence" posts — Greek conventions.
- Kantenwein, *Diagrammatical Analysis* (BMH, 1979/1991) — English/Greek/Hebrew RK adaptation (not consulted directly; summarised from listings).
- Biblearc Phrasing course pages; Naselli, "Phrasing: My Favorite Way to Trace an Argument" — for the contrast in §1.
- Tool survey: ConceptViz, Vizcept, SentenceVizu, 1aiway Reed-Kellogg Diagrammer, covertcj/Reed-Kellogg (GitHub), UCF SenDraw, ConceptDraw stencils, Logos sentence diagramming.
