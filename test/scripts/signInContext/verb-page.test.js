/* eslint-disable compat/compat */
import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../dc-shared/scripts/utils.js';

const waitForConfig = async () => {
  const utils = await import(`${setLibs('/dc-shared/libs')}/utils/utils.js`);
  for (let i = 0; i < 100; i += 1) {
    if (utils.getConfig().signInContext) return utils;
    await new Promise((r) => { setTimeout(r, 50); });
  }
  throw new Error('Milo config was not set');
};

describe('signInContext on a verb page', () => {
  it('adds x_api_client params to the sign-in redirect', async () => {
    document.body.innerHTML = '<main><div><div class="verb-widget heic-to-pdf"></div></div></main>';
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#`);
    await import('../../../dc-shared/scripts/scripts.js');
    const { getConfig } = await waitForConfig();
    const expected = new URL(window.location.href);
    expected.hash = '';
    expected.searchParams.set('x_api_client_id', 'adobe_com');
    expected.searchParams.set('x_api_client_location', 'heic_to_pdf');
    expect(getConfig().signInContext.redirect_uri).to.equal(expected.href);
  }).timeout(10000);
});
