// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { formatInline } from '../src/index.js';

const html = (src: string, opts = {}): string => {
  const div = document.createElement('div');
  div.appendChild(formatInline(src, document, opts));
  return div.innerHTML;
};

describe('formatInline', () => {
  it('handles the emphasis subset', () => {
    expect(html('a **b** c')).toBe('a <strong>b</strong> c');
    expect(html('*i* and _j_')).toBe('<em>i</em> and <em>j</em>');
    expect(html('~~gone~~ ==hot== `x`')).toBe('<del>gone</del> <mark>hot</mark> <code>x</code>');
  });

  it('nests and closes in order', () => {
    expect(html('**b *i* b**')).toBe('<strong>b <em>i</em> b</strong>');
  });

  it('draws the red bar and blue brackets', () => {
    expect(html('one | two')).toBe('one <span class="bracket-bar">|</span> two');
    expect(html('x {y z} w')).toBe(
      'x <span class="bracket-bkt"><span class="bracket-bkt-mark">[</span>y z<span class="bracket-bkt-mark">]</span></span> w',
    );
  });

  it('keeps literal characters with backslash escapes and inside code', () => {
    expect(html('a \\| b \\{c\\} \\*d\\*')).toBe('a | b {c} *d*');
    expect(html('`a | *b* {c}`')).toBe('<code>a | *b* {c}</code>');
  });

  it('leaves snake_case and stray closers alone', () => {
    expect(html('snake_case_name')).toBe('snake_case_name');
    expect(html('a } b')).toBe('a } b');
    expect(html('[τὰ] • plain')).toBe('[τὰ] • plain');
  });

  it('auto-closes unterminated marks at the end', () => {
    expect(html('**bold')).toBe('<strong>bold</strong>');
    expect(html('{open')).toBe('<span class="bracket-bkt"><span class="bracket-bkt-mark">[</span>open</span>');
  });

  it('passes wiki-links through verbatim, alias pipe included', () => {
    expect(html('see [[Note|alias]] and | bar')).toBe('see [[Note|alias]] and <span class="bracket-bar">|</span> bar');
    expect(html('[[**not bold**]]')).toBe('[[**not bold**]]');
  });

  it('recognises Style Obmd colour keys only when enabled', () => {
    const obmd = { obmdColors: true };
    expect(html('=={r}red==', obmd)).toBe('<mark class="cmk-mark cmk-r">red</mark>');
    expect(html('**{B}blue**', obmd)).toBe('<strong class="cmk-bold cmk-b">blue</strong>');
    expect(html('=={gray}g== **{x}nope**', obmd)).toBe(
      '<mark class="cmk-mark cmk-gray">g</mark> <strong><span class="bracket-bkt"><span class="bracket-bkt-mark">[</span>x<span class="bracket-bkt-mark">]</span></span>nope</strong>',
    );
    // Off by default: the braces are ordinary blue brackets.
    expect(html('=={r}red==')).toBe('<mark><span class="bracket-bkt"><span class="bracket-bkt-mark">[</span>r<span class="bracket-bkt-mark">]</span></span>red</mark>');
  });

  it('underlines with __ in Obmd mode, bold otherwise', () => {
    const obmd = { obmdColors: true };
    expect(html('__{r}under__', obmd)).toBe('<u class="cmk-underline cmk-r">under</u>');
    expect(html('__plain__', obmd)).toBe('<u class="cmk-underline">plain</u>');
    expect(html('__plain__')).toBe('<strong>plain</strong>');
    expect(html('snake__case')).toBe('snake__case');
    expect(html('snake__case', obmd)).toBe('snake__case');
  });
});
