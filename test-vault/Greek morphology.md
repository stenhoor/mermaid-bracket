# Greek morphology tags

Tags work anywhere, not only in diagrams. Enable the snippet at
`.obsidian/snippets/greek-morphology.css` under Settings → Appearance → CSS snippets, then read this
note in reading view.

## In ordinary prose

Ἐν ἀρχῇ^N-----DSF- ἦν^V-3IAI-S-- ὁ^RA----NSM- λόγος^N-----NSM-, καὶ^C- ὁ λόγος ἦν πρὸς^P-
τὸν^RA----ASM- θεόν^N-----ASM-.

In a list:

- πάντα^A-----NPN- δι᾽ αὐτοῦ^RP----GSM- ἐγένετο^V-3AMI-S--
- χωρὶς^P- αὐτοῦ^RP----GSM- ἐγένετο οὐδὲ ἕν^A-----NSN-

In a table:

| Word | Parse |
|---|---|
| ἀγάπη^N-----NSF- | nominative singular feminine |
| ἀγάπης^N-----GSF- | genitive singular feminine |
| ἀγάπῃ^N-----DSF- | dative singular feminine |

> A quote works too: μακάριοι^A-----NPM- οἱ^RA----NPM- πτωχοί^A-----NPM-

Hover any tagged word to see the parse. Code stays literal: `λόγος^N-----NSM-` and

```
λόγος^N-----NSM-
```

## In diagrams

```mermaid
bracket
columns NA28, Note
S
  1
  2
1:
  NA28: ὁ^RA----NSM- λόγος^N-----NSM- ἦν^V-3IAI-S-- πρὸς^P- τὸν^RA----ASM- θεόν^N-----ASM-
  Note: article and noun nominative, verb imperfect, then accusative
2:
  NA28: πάντα^A-----NPN- δι᾽ αὐτοῦ^RP----GSM- ἐγένετο^V-3AMI-S--
  Note: aorist middle indicative
```

```mermaid
sentence
subj  ὁ^RA----NSM- λόγος^N-----NSM-
verb  ἦν^V-3IAI-S--
  prep  πρὸς^P- τὸν^RA----ASM- θεόν^N-----ASM-
```

## Letting the plugin do the tagging

The tags above were typed by hand. Paste untagged Greek and run **Tag Greek morphology automatically**
from the command palette:

Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος.

Words the corpus parses one way only are tagged outright. Where the parses disagree, only the shared
features are written: πάντα becomes an adjective with no case, and καί is left untouched, because it may
be a conjunction or an adverb. Hover a tagged word to see its lemma and gloss.

## Vocabulary of a passage

Run **Create Greek glossary** with the passage selected to append a table like this one. Layout and
columns are set under Settings → Mermaid Bracket → Greek lookup.

## Making it permanent

Run **Convert Greek morphology tags to HTML** from the command palette to replace the tags in this
note with HTML spans. Select a passage first to convert only that part.
