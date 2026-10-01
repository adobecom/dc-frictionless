/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
/* eslint-disable compat/compat */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const source = readFileSync(resolve(__dirname, '../../dc-shared/scripts/scripts.js'), 'utf8');
const start = source.indexOf('function replaceDotMedia(');
const end = source.indexOf('\nreplaceDotMedia(document);', start);
const functionSource = source.slice(start, end);
const origin = 'https://stage.acrobat.adobe.com';
const imagePath = './media_test.png?width=2000&format=webply&optimize=medium';
const sourcePath = './media_test.webp?width=800';

// Run the actual function without triggering unrelated page initialization.
function rewrite(pathname, prefix = '') {
  const area = document.createElement('div');
  area.innerHTML = `<picture><source srcset="${sourcePath}"><img src="${imagePath}"></picture>`;
  runInNewContext(`${functionSource}\nreplaceDotMedia(area);`, {
    URL,
    window: { location: `${origin}${pathname}` },
    prefix,
    CONFIG: { contentRoot: '/dc-shared' },
    area,
  });
  return area;
}

describe('replaceDotMedia tools exception', () => {
  it.each([
    ['/tools', ''],
    ['/tools/', ''],
    ['/tools/convert', ''],
    ['/tools/deep/convert', ''],
    ['/fr/tools', '/fr'],
    ['/fr/tools/', '/fr'],
    ['/fr/tools/convert', '/fr'],
    ['/ca_fr/tools/deep/convert', '/ca_fr'],
    ['/langstore/fr/tools/convert', '/langstore/fr'],
  ])('rewrites relative media on %s', (pathname, prefix) => {
    const area = rewrite(pathname, prefix);
    expect(area.querySelector('img').getAttribute('src'))
      .toBe(`${origin}/dc-shared${imagePath.substring(1)}`);
    expect(area.querySelector('source').getAttribute('srcset'))
      .toBe(`${origin}/dc-shared${sourcePath.substring(1)}`);
  });

  it.each([
    ['/', ''],
    ['/index', ''],
    ['/fr/', '/fr'],
    ['/fr/index', '/fr'],
  ])('preserves existing shallow-page rewriting on %s', (pathname, prefix) => {
    const area = rewrite(pathname, prefix);
    expect(area.querySelector('img').getAttribute('src'))
      .toBe(`${origin}/dc-shared${imagePath.substring(1)}`);
    expect(area.querySelector('source').getAttribute('srcset'))
      .toBe(`${origin}/dc-shared${sourcePath.substring(1)}`);
  });

  it.each([
    ['/other/page', ''],
    ['/other/tools/page', ''],
    ['/tools-extra/page', ''],
    ['/toolsmith/page', ''],
    ['/dc-shared/tools/page', ''],
    ['/fr/other/page', '/fr'],
    ['/fr/other/tools/page', '/fr'],
    ['/fr/tools-extra/page', '/fr'],
    ['/ca_fr/toolsmith/page', '/ca_fr'],
    ['/langstore/fr/other/page', '/langstore/fr'],
  ])('preserves the existing depth limit on %s', (pathname, prefix) => {
    const area = rewrite(pathname, prefix);
    expect(area.querySelector('img').getAttribute('src')).toBe(imagePath);
    expect(area.querySelector('source').getAttribute('srcset')).toBe(sourcePath);
  });

  it('leaves attributes outside the existing media selectors unchanged', () => {
    const area = document.createElement('div');
    const paths = ['/media_test.png', `${origin}/tools/media_test.png`, './other.png', '/dc-shared/media_test.png'];
    paths.forEach((path) => {
      const img = document.createElement('img');
      img.setAttribute('src', path);
      area.appendChild(img);
      const element = document.createElement('source');
      element.setAttribute('srcset', path);
      area.appendChild(element);
    });
    runInNewContext(`${functionSource}\nreplaceDotMedia(area);`, {
      URL,
      window: { location: `${origin}/tools/convert` },
      prefix: '',
      CONFIG: { contentRoot: '/dc-shared' },
      area,
    });
    expect([...area.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual(paths);
    expect([...area.querySelectorAll('source')].map((element) => element.getAttribute('srcset'))).toEqual(paths);
  });
});
