// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { diagramTitle, fileBasename, findBracketSvg, flattenCells, svgSize, toStandaloneSvg } from '../src/svg-export.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function makeDiagram(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('id', 'd1');
  svg.setAttribute('viewBox', '0 0 640 120');
  svg.setAttribute('width', '100%');
  svg.setAttribute('style', 'max-width: 640px;');
  svg.innerHTML =
    '<style>#d1 .x{}</style><g class="bracket-diagram" style="--bracket-font-size:13px">' +
    '<text class="bracket-title">Colossians 1:21–23</text>' +
    '<foreignObject width="100" height="20"><div xmlns="http://www.w3.org/1999/xhtml" class="bracket-cell">a<br/>b</div></foreignObject></g>';
  document.body.appendChild(svg);
  return svg;
}

describe('svg export helpers', () => {
  it('finds the diagram svg from any descendant, and ignores other svgs', () => {
    const svg = makeDiagram();
    expect(findBracketSvg(svg.querySelector('.bracket-cell'))).toBe(svg);
    const other = document.createElementNS(SVG_NS, 'svg');
    document.body.appendChild(other);
    expect(findBracketSvg(other)).toBeNull();
    expect(findBracketSvg(null)).toBeNull();
  });

  it('reads size from the viewBox and the title from the diagram', () => {
    const svg = makeDiagram();
    expect(svgSize(svg)).toEqual({ width: 640, height: 120 });
    svg.setAttribute('viewBox', '0 0 640.2 119.7');
    expect(svgSize(svg)).toEqual({ width: 641, height: 120 });
    expect(diagramTitle(svg)).toBe('Colossians 1:21–23');
  });

  it('produces a standalone document with namespaces, pixel size and inlined variables', () => {
    document.body.style.setProperty('--style-obmd-r', '#ff0000');
    const svg = makeDiagram();
    const out = toStandaloneSvg(svg);
    expect(out.width).toBe(640);
    expect(out.markup.startsWith('<?xml version="1.0"')).toBe(true);
    expect(out.markup).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(out.markup).toContain('width="640"');
    expect(out.markup).toContain('height="120"');
    expect(out.markup).not.toContain('max-width');
    expect(out.markup).toContain('--style-obmd-r:#ff0000');
    expect(out.markup).toContain('xmlns="http://www.w3.org/1999/xhtml"');
    expect(out.markup).toContain('.bracket-cell{font-family:inherit}');
    // Source svg untouched
    expect(svg.getAttribute('style')).toBe('max-width: 640px;');
  });

  it('makes safe file basenames', () => {
    expect(fileBasename('Colossians 1:21–23')).toBe('Colossians 1_21-23');
    expect(fileBasename('a/b\\c*d?e"f<g>h|i#j^k[l]')).toBe('a_b_c_d_e_f_g_h_i_j_k_l_');
    expect(fileBasename('   ')).toBe('bracket');
  });

  it('leaves foreignObject in place when no layout data is available (jsdom)', () => {
    const svg = makeDiagram();
    const clone = svg.cloneNode(true) as SVGSVGElement;
    flattenCells(svg, clone);
    expect(clone.querySelectorAll('foreignObject')).toHaveLength(1);
    expect(toStandaloneSvg(svg).markup).toContain('foreignObject');
    expect(toStandaloneSvg(svg, { flatten: false }).markup).toContain('foreignObject');
  });
});
