# Colossians 1:1–2 (sentence diagram)

Target: page 1 of `SENTENCE_Colossians _1_1_8.pdf`. Phase 4a features only: verbless clauses with the
predicate marker, compound subjects, appositives with `=`, slash genitives, prepositional terraces.

```mermaid
---
title: Diagram of Colossians 1:1–2
---
sentence
verse 1:1
clause
  subj  ἀπόστολος = Παῦλος
    gen   Χριστοῦ Ἰησοῦ
    prep  διὰ θελήματος
      gen   θεοῦ
  subj  + καὶ ὁ ἀδελφὸς = Τιμόθεος
  verb
  obj   τοῖς
    prep  ἐν Κολοσσαῖς
    = ἁγίοις
    = + καὶ ἀδελφοῖς
      mod   πιστοῖς
        prep  ἐν Χριστῷ

verse 1:2
clause
  subj  χάρις
  subj  + καὶ εἰρήνη
  verb
    prep  ἀπὸ θεοῦ
      gen   πατρὸς
      gen   ἡμῶν
  comp  ὑμῖν
```

Notes on the transcription: Biblearc writes the appositive first in 1:1 (`ἀπόστολος = Παῦλος`) and `=` simply
joins the two on the line; `τοῖς` is the object and its appositive is the compound `ἁγίοις καὶ ἀδελφοῖς`,
so the `=` lines fork; `ὑμῖν` sits on the base line after the complement backslash (the verb is elided).

## Phase 4a keywords

| Line | Draws |
|---|---|
| `clause` | a new base line (the first clause is implicit) |
| `conj οὖν` | sentence conjunction on the up-right slant at the clause start |
| `verse 1:2` | gold reference in the left gutter beside the next word |
| `subj T`, `verb T`, `obj T`, `obj2 T`, `comp T` | slots in fixed order with predicate, object, double-accusative and complement markers; text may be empty or `(X)` |
| `T = A` inline, or `= A` lines indented under the head | appositive joined by `=`; `= + καί B` makes a compound appositive (a fork from the `=`); hangers indent under a `=` line |
| `mod T` | slant + shelf under the word above it (adjective, adverb, dative) |
| `prep T` | slant + shelf carrying the whole phrase |
| `gen T` (consecutive lines chain) | `/ T / T` written directly under the head |
| `role + καί T` | fork: joins the previous member of the same role/hanger kind, conjunction on the dotted line |
| `word^V-3AAI-P--` | MorphGNT morphology tag on that word (any slot text) |
| `config fontSize 16`, `config gutter 0`, `config useMaxWidth true` | options; `slant`, `pad`, `gap`, `clauseGap` also exist |

`part` and `inf` are in as well; see [Colossians 1:3–4a](Sentence_Colossians_1_3-4.md).

| Line | Draws |
|---|---|
| `part T (Label)` | participle: a vertical connector down to its own shelf, with a grey label beneath |
| `inf T (Label)` | infinitive: the double-bar marker then the verb; an indented `subj` sits before the marker |
| `obj`, `obj2`, `comp` indented under either | the verbal's own complements, each behind its marker on that shelf |

| `rel ROLE T` | relative clause below the antecedent, dashed link from its pronoun |
| `sub CONJ` | subordinate clause on a slant labelled with the conjunction |
| `obj stilt` | the slot is filled by a clause raised on a standard |
| `voc T`, `abs T` | vocative or absolute on a floating shelf above the clause |
| `clause + CONJ` | joins this clause to the previous one |

See [Colossians 2:6–7](Sentence_Colossians_2_6-7.md) for those.

## With morphology tags

Codes are stripped from the drawn text and become CSS classes; see `docs/greek-morphology.css`. A tag on a
`+ conj` marker is ignored, since the fork conjunction is drawn as one label (style `.sd-conj` instead).

```mermaid
---
title: Colossians 1:2 with morphology
---
sentence
subj  χάρις^N-----NSF-
subj  + καὶ εἰρήνη^N-----NSF-
verb
  prep  ἀπὸ^P- θεοῦ^N-----GSM-
    gen   πατρὸς^N-----GSM-
    gen   ἡμῶν^RP----GP--
comp  ὑμῖν^RP----DP--
```
