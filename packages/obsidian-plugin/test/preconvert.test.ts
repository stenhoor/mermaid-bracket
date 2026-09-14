import { describe, expect, it } from 'vitest';
import { preconvertMarks } from '../src/obsidian-formatter.js';

describe('preconvertMarks', () => {
  it('converts bar and braces to spans', () => {
    expect(preconvertMarks('a | b {c}')).toBe(
      'a <span class="bracket-bar">|</span> b <span class="bracket-bkt"><span class="bracket-bkt-mark">[</span>c<span class="bracket-bkt-mark">]</span></span>',
    );
  });
  it('leaves escapes and wiki-link aliases alone', () => {
    expect(preconvertMarks('\\| [[Note|alias]] |')).toBe('\\| [[Note|alias]] <span class="bracket-bar">|</span>');
  });
  it('leaves Style Obmd colour keys after == or ** for that plugin', () => {
    expect(preconvertMarks('=={r}red== **{gray}g** __{b}u__ {x}')).toBe(
      '=={r}red== **{gray}g** __{b}u__ <span class="bracket-bkt"><span class="bracket-bkt-mark">[</span>x<span class="bracket-bkt-mark">]</span></span>',
    );
  });
});
