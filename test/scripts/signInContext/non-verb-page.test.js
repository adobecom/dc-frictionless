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

describe('signInContext on a non-verb page', () => {
  it('keeps the default sign-in redirect', async () => {
    document.body.innerHTML = '<main><div><p>No verb</p></div></main>';
    await import('../../../dc-shared/scripts/scripts.js');
    const { getConfig } = await waitForConfig();
    expect(getConfig().signInContext).to.deep.equal({});
  }).timeout(10000);
});
