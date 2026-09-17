# The 18 logical relationships

Every bracket joins propositions with one of eighteen relationships. They fall into four families, and the
family decides the colour a bracket is drawn in. Definitions here are written for this reference; the
originals are Biblearc's sheets in `documents/`.

The grey star marks the **main point** of a relationship: the proposition the other one serves. Coordinate
relationships have no main point, because their members are equals.

| | Family | Colour | Relationships |
|---|---|---|---|
| 1 | [Coordinate](#coordinate) | green | `S` `P` `A` |
| 2 | [Support by distinct statement](#support-by-distinct-statement) | red | `G` `∴` `BL` `Ac/Res` `Ac/Pur` `If/Th` `T` `L` |
| 3 | [Support by restatement](#support-by-restatement) | blue | `Ac/Mn` `Cf` `-/+` `Id/Exp` `Q/A` |
| 4 | [Support by contrary statement](#support-by-contrary-statement) | orange | `Csv` `Sit/R` |

---

## Coordinate

Members of equal rank. Two or more propositions sit side by side under one label, and no member is
subordinate to another.

### Series — `S`

Each proposition makes its own independent contribution to a single whole. Order could be changed without
damage.

- **Look for:** and, moreover, likewise, neither, nor · καί, δέ
- **Scripture:** Colossians 1:28

```mermaid
bracket
S
  1
  2
1: warning everyone
2: teaching everyone with all wisdom
```

### Progression — `P`

Like Series, but the members advance: each is a further step toward a climax, so their order matters.

- **Look for:** then, next, furthermore, finally · καί, δέ, τότε
- **Scripture:** Mark 4:28

```mermaid
bracket
P
  1
  2
  3
1: first the blade
2: then the ear
3: then the full grain in the ear
```

### Alternative — `A`

Each member is a different possibility arising from one situation. One or the other, not both.

- **Look for:** or, whether … or · ἤ, εἴτε
- **Scripture:** Matthew 11:3

```mermaid
bracket
A
  1
  2
1: Are you the one who is to come,
2: or shall we look for another?
```

---

## Support by distinct statement

A supporting proposition that adds new content, rather than restating what has been said.

### Ground — `G`

A statement followed by the reason for it. The supporting proposition comes second; the main point is first.

- **Look for:** for, because, since · γάρ, ὅτι, ἐπεί, διότι
- **Scripture:** Matthew 5:3

```mermaid
bracket
G
  *  1
  G  2
1: Blessed are the poor in spirit,
2: for theirs is the kingdom of heaven.
```

### Inference — `∴`

The mirror of Ground: the reason comes first and the conclusion follows. The main point is the conclusion.

- **Look for:** therefore, so, accordingly · οὖν, διό, ἄρα
- **Scripture:** 1 Peter 4:7

```mermaid
bracket
Inf
  Inf 1
  *   2
1: The end of all things is at hand;
2: therefore be self-controlled and sober-minded.
```

### Bilateral — `BL`

One proposition supporting two others, one before it and one after. It is Ground and Inference combined,
which is why the conjunction sheets leave it out.

- **Look for:** for, because, therefore, so · γάρ, ὅτι, οὖν, διό
- **Scripture:** Romans 8:7–8

### Action-Result — `Ac/Res`

An action and the consequence that follows from it, whether or not anyone intended it.

- **Look for:** so that, with the result that · ὥστε
- **Scripture:** Matthew 8:24

```mermaid
bracket
Ac/Res
  *Ac 1
  Res 2
1: there arose a great storm on the sea,
2: so that the boat was being swamped by the waves
```

### Action-Purpose — `Ac/Pur`

An action and its intended result. Purpose differs from result in that it looks forward to an aim.

- **Look for:** in order that, so that, lest · ἵνα, ὅπως, εἰς τό, μήποτε
- **Scripture:** Colossians 2:4

```mermaid
bracket
Ac/Pur
  *Ac 1
  Pur 2
1: I say this
2: in order that no one may delude you with plausible arguments.
```

### Conditional — `If/Th`

Like Action-Result, except that the action is only potential and the result depends on it.

- **Look for:** if … then, unless, provided that · εἰ, ἐάν, εἴτε
- **Scripture:** Exodus 21:23

```mermaid
bracket
If/Th
  If  1
  *Th 2
1: if there is harm,
2: then you shall pay life for life.
```

### Temporal — `T`

A statement and the time at which it holds or occurs.

- **Look for:** when, whenever, after, before, while · ὅταν, ὅτε, πρίν, ἕως
- **Scripture:** Matthew 6:16

```mermaid
bracket
T
  T  1
  *  2
1: And when you fast,
2: do not look gloomy.
```

### Locative — `L`

A statement and the place where it holds or occurs.

- **Look for:** where, wherever · ὅπου, οὗ
- **Scripture:** Ruth 1:16

```mermaid
bracket
L
  L  1
  *  2
1: For where you go
2: I will go.
```

---

## Support by restatement

A supporting proposition that says the same thing again, from another angle.

### Action-Manner — `Ac/Mn`

An action and a statement of the way it is carried out. Also used for means.

- **Look for:** by, in that, through, participles · participles, οὕτως
- **Scripture:** Acts 14:17

```mermaid
bracket
Ac/Mn
  *Ac 1
  Mn  2
1: he did good
2: by giving you rains from heaven and fruitful seasons
```

### Comparison — `Cf`

An action clarified by showing what it is like.

- **Look for:** as, just as, like, even as · ὡς, καθώς, ὥσπερ, καθάπερ
- **Scripture:** 1 Corinthians 11:1

```mermaid
bracket
Cf
  *  1
  Cf 2
1: Be imitators of me,
2: as I am of Christ.
```

### Negative-Positive — `-/+`

Two statements, one denied so that the other stands out. This is also the shape of any contrasting pair.

- **Look for:** not … but, rather · ἀλλά, οὐ … ἀλλά
- **Scripture:** Ephesians 5:17

```mermaid
bracket
Neg/Pos
  -  1
  *+ 2
1: do not be foolish,
2: but understand what the will of the Lord is.
```

### Idea-Explanation — `Id/Exp`

A statement and a second one that clarifies its meaning. The explanation may expound the whole idea or a
single word of it.

- **Look for:** that is, in other words, namely · ὅτι, γάρ, ἵνα
- **Scripture:** Romans 4:7–8

```mermaid
bracket
Id/Exp
  *Id 1
  Exp 2
1: Blessed are those whose lawless deeds are forgiven,
2: and whose sins are covered.
```

### Question-Answer — `Q/A`

A question and its answer.

- **Look for:** a question mark · εἰ, τίς, πόθεν
- **Scripture:** Romans 4:3

```mermaid
bracket
Q/A
  Q  1
  *A 2
1: What does the Scripture say?
2: Abraham believed God, and it was counted to him as righteousness.
```

---

## Support by contrary statement

A supporting proposition that cuts against the main one, and in doing so strengthens it.

### Concessive — `Csv`

A main clause that stands despite something that might have overturned it.

- **Look for:** although, though, yet, nevertheless, however · δέ, πλήν, καίπερ, καίτοι
- **Scripture:** 2 Peter 1:12

```mermaid
bracket
Csv
  *   1
  Csv 2
1: I intend always to remind you of these qualities,
2: though you know them.
```

### Situation-Response — `Sit/R`

A situation and a response to it that is surprising or counter-intuitive.

- **Look for:** and · καί
- **Scripture:** Matthew 23:37

```mermaid
bracket
Sit/R
  Sit 1
  *R  2
1: How often would I have gathered your children together,
2: and you were not willing!
```

---

## Writing them

In a `bracket` diagram the keyword opens the relationship and the children carry the arm labels. `Inf` is
the ASCII spelling of `∴` and `Neg/Pos` of `-/+`; a leading `*` marks the main point.

Full syntax: [Colossians 1:21–23 worked example](../../examples/Colossians_1_21-23.md).
Conjunctions: [English](english-conjunctions.md) · [Greek](greek-conjunctions.md).
