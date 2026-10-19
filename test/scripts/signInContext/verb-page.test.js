/* eslint-disable compat/compat */
import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import { setLibs } from '../../../dc-shared/scripts/utils.js';
import init from '../../../dc-shared/blocks/verb-widget/verb-widget.js';

const { getConfig, setConfig } = await import(`${setLibs('/dc-shared/libs')}/utils/utils.js`);

describe('signInContext on a verb page', () => {
  let originalUrl;

  beforeEach(async () => {
    originalUrl = window.location.href;
    const placeholders = JSON.parse(await readFile({ path: '../../blocks/verb-widget/mocks/placeholders.json' }));
    window.mph = {};
    placeholders.data.forEach(({ key, value }) => {
      window.mph[key] = value;
    });
    window.adobeIMS = { isSignedInUser: () => false };
    setConfig({ ...getConfig(), locale: { prefix: '' }, signInContext: {} });
    document.body.innerHTML = '<main><div><div class="verb-widget heic-to-pdf"><div><div>HEIC to PDF</div></div></div></div></main>';
  });

  afterEach(() => {
    window.history.replaceState(null, '', originalUrl);
  });

  it('adds x_api_client params to the sign-in redirect', async () => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#`);
    const pageUrl = window.location.href;
    await init(document.querySelector('.verb-widget'));
    const expected = new URL(window.location.href);
    expected.hash = '';
    expected.searchParams.set('x_api_client_id', 'adobe_com');
    expected.searchParams.set('x_api_client_location', 'heic_to_pdf');
    expect(getConfig().signInContext.redirect_uri).to.equal(expected.href);
    expect(window.location.href).to.equal(pageUrl);
  }).timeout(10000);

  it('preserves other query params and replaces existing client params for the current verb', async () => {
    const block = document.querySelector('.verb-widget');
    block.classList.replace('heic-to-pdf', 'pdf-to-word');
    window.history.replaceState(null, '', `${window.location.pathname}?campaign=test&x_api_client_id=old&x_api_client_location=old#upload`);
    await init(block);
    expect(getConfig().signInContext.redirect_uri).to.equal(
      `${window.location.origin}${window.location.pathname}?campaign=test&x_api_client_id=adobe_com&x_api_client_location=pdf_to_word`,
    );
  }).timeout(10000);
});
