/* eslint-disable compat/compat */
import { expect } from '@esm-bundle/chai';

const waitForImsConfig = async () => {
  for (let i = 0; i < 100; i += 1) {
    if (window.adobeid) return;
    await new Promise((r) => { setTimeout(r, 50); });
  }
  throw new Error('IMS config was not set');
};

describe('IMS hash cleanup on a guest verb page', () => {
  it('tells imslib to remove the token without a trailing #', async () => {
    document.head.innerHTML = '<meta name="ims-guest" content="true"><meta name="ims-cid" content="acrobatmiloguest">';
    document.body.innerHTML = '<main><div><div class="verb-widget heic-to-pdf"><div><div>HEIC to PDF</div></div></div></div></main>';
    await import('../../../dc-shared/scripts/scripts.js');
    await waitForImsConfig();
    expect(window.adobeid.alwaysRemoveTokenFromUrl).to.be.true;
    expect(window.adobeid.client_id).to.equal('acrobatmiloguest');
    expect(window.adobeid.enableGuestAccounts).to.be.true;
  }).timeout(10000);
});
