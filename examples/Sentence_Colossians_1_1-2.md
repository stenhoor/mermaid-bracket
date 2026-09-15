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
| `config fontSize 16`, `config gutter 0`, `config useMaxWidth true` | options; `slant`, `pad`, `gap`, `clauseGap` also exist |

Phase 4b will add `part`, `inf`, `stilt`, `sub`, `rel`, `voc`, `abs`.
