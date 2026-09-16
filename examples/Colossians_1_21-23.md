# Colossians 1:21–23 (proposed `bracket` syntax)

Target output: `Colossians_1_21-23.pdf` in this folder.

```mermaid
---
title: Colossians 1:21–23
---
bracket
columns NA28, ESV

%% Tree: indentation = nesting. A line is "[*][label] target",
%% where target is a relationship keyword (opens a bracket) or a verse ref (a row).
%% "*" marks the main point. Coordinate children (S/P/A) take no label.
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

%% Rows: "ref:" then one indented line per column. Continuation lines are joined.
21-22a:
  NA28: Καὶ ὑμᾶς ποτε ὄντας ἀπηλλοτριωμένους καὶ ἐχθροὺς τῇ διανοίᾳ ἐν τοῖς
        ἔργοις τοῖς πονηροῖς, νυνὶ δὲ ἀποκατήλλαξεν ἐν τῷ σώματι τῆς σαρκὸς
        αὐτοῦ διὰ τοῦ θανάτου
  ESV:  And you, who once were alienated and hostile in mind, doing evil deeds,
        he has now reconciled in his body of flesh by his death,
22b:
  NA28: παραστῆσαι ὑμᾶς ἁγίους καὶ ἀμώμους καὶ ἀνεγκλήτους κατενώπιον αὐτοῦ,
  ESV:  in order to present you holy and blameless and above reproach before him,
23a:
  NA28: εἴ γε ἐπιμένετε τῇ πίστει
  ESV:  if indeed you continue in the faith,
23b:
  NA28: τεθεμελιωμένοι
  ESV:  stable
23c:
  NA28: καὶ ἑδραῖοι
  ESV:  and steadfast,
23d:
  NA28: καὶ μὴ μετακινούμενοι ἀπὸ τῆς ἐλπίδος τοῦ εὐαγγελίου οὗ ἠκούσατε, τοῦ
        κηρυχθέντος ἐν πάσῃ κτίσει τῇ ὑπὸ τὸν οὐρανόν, οὗ ἐγενόμην ἐγὼ Παῦλος
        διάκονος.
  ESV:  not shifting from the hope of the gospel that you heard, which has been
        proclaimed in all creation under heaven, and of which I, Paul, became a
        minister.
```

## Whole-book outline, single column (target: `Colossians.pdf`)

```mermaid
---
title: Colossians 1:1–4:18
---
bracket
columns MINE

%% Three top-level items under one P. Inference brackets (keyword Inf, labels G / ∴)
%% chain leftward: each one's ground is the previous bracket as a whole.
P
  1
  P
    3-8
    9-20
    21-23
  Inf
    Inf
      Inf
        G
          *    24-29
          G    1-5
        *∴   Inf
          *    6-15
          ∴    16-23
      *∴   1-4
    *∴   S
      5-11
      Id/Exp
        *Id  12-17
        Exp  S
          18-1
          2-6
  S
    7-9
    10-14
    15-17
    18

1: Greeting
3-8: Prayer of Thanksgiving to God the Father
9-20: Prayer that the Colossians walk in a manner worthy of the Lord
21-23: Christ's work of reconciliation
24-29: Paul rejoices in his suffering for the gospel ministry
1-5: to encourage the Colossians and prevent their delusion
6-15: Therefore walk in Christ, who made you alive together with him
16-23: Therefore don't submit to legalism
1-4: Seek and Set your minds on things that are above
5-11: Therefore put off the old self
12-17: and put on the new self
18-1: In your relationships at home and at work
2-6: Pray, walk and speak to win others to Christ
7-9: The mailmen
10-14: Shoutouts
15-17: Final instructions
18: Paul's personal closing
```

## Per-diagram options

Options are `config <key> <value>` lines anywhere in the block body. In Obsidian the plugin's settings tab sets vault-wide defaults for the same keys; a `config` line wins over the setting. (They cannot go in the Mermaid frontmatter `config:` block: Mermaid's sanitiser deletes keys it does not know.)

| Key | Values | Default | Meaning |
|---|---|---|---|
| `coordinateArms` | `ends`, `all` | `ends` | `ends` draws only the first and last arm of S/P/A brackets (middle children that are brackets, or carry a star/label, keep theirs); `all` draws every arm, as Biblearc does |
| `fontSize` | px | 13 | base size for cell text; refs, labels, title and row heights scale with it |
| `useMaxWidth` | `true`, `false` | `false` | `false` renders at actual size (the pane scrolls sideways if narrower); `true` shrinks the whole diagram to fit the pane, Mermaid's usual behaviour, which makes two-column text small |
| `columnWidth` | px | 420 | width of each text column |
| `bracketStep` | px | 46 | horizontal distance between nested bracket bars |
| `refWrapAt` | chars | 4 | refs longer than this wrap after their hyphen |

```mermaid
---
title: Colossians 3:5–11 (Biblearc-style arms, larger type)
---
bracket
config coordinateArms all
config fontSize 16
config columnWidth 360
columns ESV

G
  * S
    5-7
    8
    9a
  G P
    9b
    * 10

5-7: Put to death therefore what is earthly in you.
8: But now you must put them all away.
9a: Do not lie to one another,
9b: seeing that you have put off the old self with its practices
10: and have put on the new self.
```

## Layout rules (from the Biblearc exports)

- A parent's arm attaches to a nested bracket at that bracket's starred arm when one is marked, otherwise at the middle of its bar. Mark the main point with `*` to control where the parent connects.
- A coordinate bracket's label sits in the widest gap between its arms.
- Refs longer than 4 characters wrap after their hyphen (`21-` / `22a`).

## Inline formatting inside cells

The built-in formatter (default; identical in every Mermaid host):

| Markup | Renders as | Seen in |
|---|---|---|
| `**bold**`, `*italic*` or `_italic_`, `~~strike~~`, `` `code` `` | standard | `Colossians_3_12-17.pdf` (italic, strikethrough in 13b/13c) |
| `==text==` | yellow highlight (Obsidian syntax) | `Colossians_3_12-17.pdf` (δὲ in v14) |
| `\|` | red proposition-boundary bar | `Colossians_1_1-20.pdf` (v4, v11b-20) |
| `{text}` | blue square brackets around the text | `Colossians_2_16-23.pdf`, `Colossians_3_12-17.pdf` |
| `\x` | literal `x` (escape `\|`, `\{`, `\*`, …) | |
| `•`, `[τὰ]` | literal, no escaping needed | NA28 text |
| `word^N-----NSF-` | MorphGNT morphology tag on that word: stripped from the text, emitted as CSS classes (see `docs/greek-morphology.css`) | |
| `=={r}text==`, `**{b}text**` | Style Obmd colour keys (r o y g b p gray), in the "Built-in + Style Obmd colours" or Obsidian Markdown mode | |
| `__{r}text__`, `__text__` | coloured / plain underline, "Built-in + Style Obmd colours" mode only (elsewhere `__text__` is bold) | |

In Obsidian, the plugin setting "Cell text formatting" can switch to Obsidian's own Markdown renderer, which adds wiki-links, tags and other plugins' formatting on top of the same `|` and `{…}` marks. Links resolve relative to the active note.

Cell text cannot start a line with `%%` (Mermaid strips such lines as comments).
