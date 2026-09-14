# Cell formatting

Built-in subset (works in any Mermaid host):

```mermaid
---
title: Inline formatting
---
bracket
columns Sample, Notes

S
  1
  2
  3
  4

1:
  Sample: **bold**, *italic*, _italic_, ~~strike~~, ==highlight==, `code`
  Notes:  Standard marks. Nesting works: **bold with *italic* inside**
2:
  Sample: teaching and admonishing | singing psalms | with thankfulness
  Notes:  A bare pipe draws the red proposition bar
3:
  Sample: put on love, {which binds everything together in perfect harmony}
  Notes:  Braces draw blue square brackets around the text
4:
  Sample: literal \| and \{braces\} and \*stars\*, [τὰ] and • stay as typed
  Notes:  Backslash escapes; plain square brackets and bullets need none
```

Style Obmd colour keys (Settings → Mermaid Bracket → Cell text formatting → Built-in + Style Obmd colours, or Obsidian Markdown with the Style Obmd plugin installed):

```mermaid
bracket
columns Sample, Notes
S
  1
  2
  3
1:
  Sample: =={r}red== =={o}orange== =={y}yellow== =={g}green== =={b}blue== =={p}purple== =={gray}gray==
  Notes:  Highlights at 30% of the key colour
2:
  Sample: **{r}red** **{o}orange** **{y}yellow** **{g}green** **{b}blue** **{p}purple** **{gray}gray** and plain **bold**
  Notes:  Bold text in the key colour; Style Obmd's own colour settings apply when it is installed
3:
  Sample: __{r}red__ __{o}orange__ __{y}yellow__ __{g}green__ __{b}blue__ __{p}purple__ __{gray}gray__ and __plain__
  Notes:  Underlines in the key colour (a Mermaid Bracket extension; in plain built-in mode \_\_text\_\_ is bold)
```

Obsidian Markdown mode (Settings → Mermaid Bracket → Cell text formatting → Obsidian Markdown) adds wiki-links and tags. This block is plain text in built-in mode and links in Obsidian mode:

```mermaid
bracket
1: See [[PoC]] and [[Colossians 3_1-4|Col 3:1-4]] #bracketing, still with **bold** and a | bar
```
