# The 18 Logical Relationships

Converted from Biblearc's sheet (`documents/The18LogicalRelationshipsEng.pdf`). The definitions,
conjunction lists and examples are the sheet's own wording; the layout is linear rather than two-column,
and each relationship's shape is drawn as a live `bracket` diagram instead of the sheet's small glyph.

On the sheet, the grey dot indicates the relationship's main point. In these diagrams that is the arm
marked with a star.

| Family | Colour | Relationships |
|---|---|---|
| [Coordinate](#coordinate-relationships) | green | `S` `P` `A` |
| [Support by distinct statement](#support-by-distinct-statement) | red | `G` `∴` `BL` `Ac/Res` `Ac/Pur` `If/Th` `T` `L` |
| [Support by restatement](#support-by-restatement) | blue | `Ac/Mn` `Cf` `-/+` `Id/Exp` `Q/A` |
| [Support by contrary statement](#support-by-contrary-statement) | orange | `Csv` `Sit/R` |

---

## Coordinate Relationships

### Series (S)

Each proposition makes its own independent contribution to a whole.

- **Conjunctions:** and, moreover, likewise, neither, nor, καί, δέ.
- **Example:** warning everyone and teaching everyone with all wisdom (Colossians 1:28)

```mermaid
bracket
S
  1
  2
1: warning everyone
2: and teaching everyone with all wisdom
```

### Progression (P)

Like series, but each proposition is a further step toward a climax.

- **Conjunctions:** then, and, moreover, furthermore, καί, δέ.
- **Example:** The earth produces by itself, first the blade, then the ear, then the full grain in the ear
  (Mark 4:28)

```mermaid
bracket
P
  1
  2
  3
1: first the blade,
2: then the ear,
3: then the full grain in the ear
```

### Alternative (A)

Each proposition expresses a different possibility arising from a situation.

- **Conjunctions:** or, but, while, on the other hand, ἤ, δέ, μέν.
- **Example:** Are you the one who is to come, or shall we look for another? (Matthew 11:3)

```mermaid
bracket
A
  1
  2
1: Are you the one who is to come,
2: or shall we look for another?
```

---

## Support by Distinct Statement

### Ground (G)

A statement and the argument or reason for that statement (supporting proposition follows).

- **Conjunctions:** for, because, since, γάρ, ὅτι, ἐπεί, διότι.
- **Example:** Blessed are the poor in spirit, for theirs is the kingdom of heaven (Matthew 5:3)

```mermaid
bracket
G
  *  1
  G  2
1: Blessed are the poor in spirit,
2: for theirs is the kingdom of heaven
```

### Inference (∴)

A statement and the argument or reason for that statement (supporting proposition precedes).

- **Conjunctions:** therefore, accordingly, οὖν, διό, ὅπως.
- **Example:** The end of all things is at hand; therefore be self-controlled and sober-minded (1 Peter 4:7)

```mermaid
bracket
Inf
  Inf 1
  *   2
1: The end of all things is at hand;
2: therefore be self-controlled and sober-minded
```

### Bilateral (BL)

A proposition that supports two other propositions, one preceding and one following.

- **Conjunctions:** for, because, therefore, so, γάρ, ὅτι, οὖν, διό.
- **Example:** For the mind that is set on the flesh is hostile to God, for it does not submit to God's law;
  indeed, it cannot. Those who are in the flesh cannot please God. (Romans 8:7-8)

### Action-Result (Ac/Res)

An action and a consequence or result which accompanies that action.

- **Conjunctions:** so that, that, with the result that, ὥστε.
- **Example:** there arose a great storm on the sea, so that the boat was being swamped by the waves
  (Matthew 8:24)

```mermaid
bracket
Ac/Res
  *Ac 1
  Res 2
1: there arose a great storm on the sea,
2: so that the boat was being swamped by the waves
```

### Action-Purpose (Ac/Pur)

An action and its intended result.

- **Conjunctions:** in order that, so that, that, lest, ἵνα, εἰς τὸ.
- **Example:** I say this in order that no one may delude you with plausible arguments (Colossians 2:4)

```mermaid
bracket
Ac/Pur
  *Ac 1
  Pur 2
1: I say this
2: in order that no one may delude you with plausible arguments
```

### Conditional (If/Th)

Like Action-Result except that the existence of the action is only potential and the result is contingent
upon that action.

- **Conjunctions:** if…then, provided that, except, unless, εἰ, ἐάν, εἴτε, ἆρα.
- **Example:** if there is harm, then you shall pay life for life (Exodus 21:23)

```mermaid
bracket
If/Th
  If  1
  *Th 2
1: if there is harm,
2: then you shall pay life for life
```

### Temporal (T)

A statement and the occasion when it is true or can occur.

- **Conjunctions:** when, whenever, after, before, ὅταν, ὅτε, πρίν.
- **Example:** And when you fast, do not look gloomy (Matthew 6:16)

```mermaid
bracket
T
  T  1
  *  2
1: And when you fast,
2: do not look gloomy
```

### Locative (L)

A statement and the place where it is true or can occur.

- **Conjunctions:** where, wherever, ὅπου.
- **Example:** For where you go I will go (Ruth 1:16)

```mermaid
bracket
L
  L  1
  *  2
1: For where you go
2: I will go
```

---

## Support by Restatement

### Action-Manner (Ac/Mn)

An action and a statement indicating the way or manner that action is carried out. This relationship can
also be used to indicate means.

- **Conjunctions:** in that, by, participles.
- **Example:** he did good by giving you rains from heaven and fruitful seasons (Acts 14:17)

```mermaid
bracket
Ac/Mn
  *Ac 1
  Mn  2
1: he did good
2: by giving you rains from heaven and fruitful seasons
```

### Comparison (Cf)

An action and a statement that clarifies that action by showing what it is like.

- **Conjunctions:** even as, as...so, like, just as, ὡς, καθώς.
- **Example:** Be imitators of me, as I am of Christ (1Co 11:1)

```mermaid
bracket
Cf
  *  1
  Cf 2
1: Be imitators of me,
2: as I am of Christ
```

### Negative-Positive (-/+)

Two statements, one of which is denied so that the other is enforced. This is also the relationship
implicit in contrasting statements.

- **Conjunctions:** not…but, ἀλλά.
- **Example:** do not be foolish, but understand what the will of the Lord is (Ephesians 5:17)

```mermaid
bracket
Neg/Pos
  -  1
  *+ 2
1: do not be foolish,
2: but understand what the will of the Lord is
```

### Idea-Explanation (Id/Exp)

The relationship between an original statement and one clarifying its meaning. The clarifying proposition
may expound on only one word of the associated arc or its entirety.

- **Conjunctions:** that is, in other words, ὅτι, γάρ, ἵνα.
- **Example:** Blessed are those whose lawless deeds are forgiven, and whose sins are covered; blessed is
  the man against whom the Lord will not count his sin (Romans 4:7-8)

```mermaid
bracket
Id/Exp
  *Id 1
  Exp 2
1: Blessed are those whose lawless deeds are forgiven, and whose sins are covered;
2: blessed is the man against whom the Lord will not count his sin
```

### Question-Answer (Q/A)

The statement of a question and the answer to that question.

- **Conjunctions:** question mark.
- **Example:** what does the Scripture say? Abraham believed God, and it was counted to him as
  righteousness (Romans 4:3)

```mermaid
bracket
Q/A
  Q  1
  *A 2
1: what does the Scripture say?
2: Abraham believed God, and it was counted to him as righteousness
```

---

## Support by Contrary Statement

### Concessive (Csv)

A main clause that stands despite a contrary statement.

- **Conjunctions:** although, though, yet, nevertheless, but, however, δέ, πλήν.
- **Example:** I intend always to remind you of these qualities, though you know them (2 Peter 1:12)

```mermaid
bracket
Csv
  *   1
  Csv 2
1: I intend always to remind you of these qualities,
2: though you know them
```

### Situation-Response (Sit/R)

A situation and its surprising or counter-intuitive response.

- **Conjunctions:** and.
- **Example:** How often would I have gathered your children together as a hen gathers her brood under her
  wings, and you were not willing! (Matthew 23:37)

```mermaid
bracket
Sit/R
  Sit 1
  *R  2
1: How often would I have gathered your children together as a hen gathers her brood under her wings,
2: and you were not willing!
```

---

## Writing them

In a `bracket` diagram the keyword opens the relationship and the children carry the arm labels. `Inf` is
the ASCII spelling of `∴` and `Neg/Pos` of `-/+`; a leading `*` marks the main point.

Conjunction lists: [English](english-conjunctions.md) · [Greek](greek-conjunctions.md).
Practice sentences: [example sentences](example-sentences.md).

> Biblearc: helping to spread a passion for the glory of God through the careful study of His Word.
