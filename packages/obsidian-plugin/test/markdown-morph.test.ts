// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { bakeMorphTags, tagMorphInElement } from '../src/markdown-morph.js';

const render = (html: string): HTMLElement => {
  const el = document.createElement('div');
  el.innerHTML = html;
  tagMorphInElement(el);
  return el;
};

describe('tagMorphInElement', () => {
  it('wraps tagged tokens in paragraph text and leaves the rest alone', () => {
    const el = render('<p>In the beginning was ὁ^RA----NSM- λόγος^N-----NSM-, and so on.</p>');
    const spans = el.querySelectorAll('span');
    expect(spans).toHaveLength(2);
    expect(spans[1]!.textContent).toBe('λόγος');
    expect(spans[1]!.getAttribute('data-morph')).toBe('N-----NSM-');
    expect(spans[1]!.getAttribute('class')).toContain('gk-case-nominative');
    expect(spans[1]!.getAttribute('title')).toBe('noun · nominative · singular · masculine');
    expect(el.textContent).toBe('In the beginning was ὁ λόγος, and so on.');
  });

  it('works inside lists, tables and quotes, and reports how many it applied', () => {
    const el = document.createElement('div');
    el.innerHTML = '<ul><li>ἦν^V-3IAI-S--</li></ul><blockquote><p>θεός^N-----NSM-</p></blockquote>';
    expect(tagMorphInElement(el)).toBe(2);
    expect(el.querySelectorAll('span.gk')).toHaveLength(2);
  });

  it('skips code, existing diagrams and already-tagged spans', () => {
    const el = render('<p><code>x^N-----NSM-</code></p><pre>y^N-----NSM-</pre><svg><text>z^N-</text></svg>');
    expect(el.querySelectorAll('span')).toHaveLength(0);
    expect(el.textContent).toContain('x^N-----NSM-');
    const twice = render('<p><span class="gk">λόγος^N-----NSM-</span></p>');
    expect(twice.querySelectorAll('span')).toHaveLength(1);
  });

  it('leaves footnote references and unparseable codes untouched', () => {
    const el = render('<p>text[^1] and x^ZZ- and 2\\^10</p>');
    expect(el.querySelectorAll('span')).toHaveLength(0);
    expect(el.textContent).toContain('[^1]');
  });
});

describe('bakeMorphTags', () => {
  it('rewrites tags as spans and counts them', () => {
    const { text, count } = bakeMorphTags('was ὁ^RA----NSM- λόγος^N-----NSM- here');
    expect(count).toBe(2);
    expect(text).toBe(
      'was <span class="gk gk-pos-article gk-case-nominative gk-number-singular gk-gender-masculine"' +
        ' data-morph="RA----NSM-" title="definite article · nominative · singular · masculine">ὁ</span>' +
        ' <span class="gk gk-pos-noun gk-case-nominative gk-number-singular gk-gender-masculine"' +
        ' data-morph="N-----NSM-" title="noun · nominative · singular · masculine">λόγος</span> here',
    );
  });

  it('skips fenced code blocks, including mermaid diagrams, and inline code', () => {
    const src = [
      'before λόγος^N-----NSM-',
      '```mermaid',
      'sentence',
      'subj λόγος^N-----NSM-',
      '```',
      'after `λόγος^N-----NSM-` done',
      '~~~',
      'λόγος^N-----NSM-',
      '~~~',
    ].join('\n');
    const { text, count } = bakeMorphTags(src);
    expect(count).toBe(1);
    expect(text.split('\n')[3]).toBe('subj λόγος^N-----NSM-');
    expect(text).toContain('`λόγος^N-----NSM-`');
    expect(text.split('\n')[7]).toBe('λόγος^N-----NSM-');
  });

  it('is a no-op when there is nothing to convert, and escapes markup in the token', () => {
    expect(bakeMorphTags('plain text')).toEqual({ text: 'plain text', count: 0 });
    expect(bakeMorphTags('a<b^N-----NSM-').text).toContain('>a&lt;b</span>');
  });
});
