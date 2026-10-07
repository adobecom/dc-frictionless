/* eslint-disable compat/compat */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { getConfig, setConfig } from 'https://main--milo--adobecom.aem.live/libs/utils/utils.js'; // eslint-disable-line import/no-unresolved

const { default: init } = await import(
  '../../../dc-shared/blocks/study-marquee/study-marquee.js'
);

const REDIRECT_URL = 'about:blank#redirect';
const getIframes = () => [...document.body.querySelectorAll('iframe')];
const track = (block, event, data = {}) => {
  block.dispatchEvent(new CustomEvent('unity:track-analytics', { detail: { event, data, sendToSplunk: false } }));
};

describe('study-marquee target iframe prefetch', () => {
  let block;
  let xhr;

  beforeEach(async () => {
    sinon.stub(window, 'fetch');
    window.fetch.callsFake((x) => {
      if (x.endsWith('.svg')) return window.fetch.wrappedMethod.call(window, x);
      return Promise.resolve();
    });
    xhr = sinon.useFakeXMLHttpRequest();
    // Uploading registers a beforeunload prompt that would block the test runner from navigating.
    const addListener = window.addEventListener.bind(window);
    sinon.stub(window, 'addEventListener').callsFake((type, ...args) => {
      if (type !== 'beforeunload') addListener(type, ...args);
    });
    const placeholders = JSON.parse(await readFile({ path: './mocks/placeholders.json' }));
    window.mph = {};
    placeholders.data.forEach((item) => { window.mph[item.key] = item.value; });
    document.head.innerHTML = await readFile({ path: './mocks/head.html' });
    document.body.innerHTML = await readFile({ path: './mocks/body-quiz-maker.html' });
    window.adobeIMS = { isSignedInUser: () => false };
    window.lana = { log: sinon.spy() };
    window.analytics = { verbAnalytics: sinon.spy(), sendAnalyticsToSplunk: sinon.spy() };
    window.prefetchTargetLoaded = false;
    const conf = getConfig();
    setConfig({ ...conf, locale: { prefix: '' } });
    block = document.body.querySelector('.study-marquee');
    await init(block);
  });

  afterEach(() => {
    xhr.restore();
    sinon.restore();
  });

  it('does not load an iframe with a null src when uploading starts before redirectUrl', () => {
    track(block, 'uploading');

    expect(getIframes()).to.have.lengthOf(0);
    expect(window.prefetchTargetLoaded).to.equal(false);
  });

  it('loads the target iframe once redirectUrl arrives after uploading', () => {
    track(block, 'uploading');
    track(block, 'redirectUrl', { redirectUrl: REDIRECT_URL });

    const iframes = getIframes();
    expect(iframes).to.have.lengthOf(1);
    expect(iframes[0].getAttribute('src')).to.equal(REDIRECT_URL);
  });

  it('loads the target iframe when redirectUrl arrives before uploading (chunked upload order)', () => {
    track(block, 'redirectUrl', { redirectUrl: REDIRECT_URL });
    track(block, 'uploading');

    const iframes = getIframes();
    expect(iframes).to.have.lengthOf(1);
    expect(iframes[0].getAttribute('src')).to.equal(REDIRECT_URL);
  });

  it('adds only one target iframe when the user uploads again on the same page', () => {
    track(block, 'uploading');
    track(block, 'redirectUrl', { redirectUrl: REDIRECT_URL });
    track(block, 'redirectUrl', { redirectUrl: REDIRECT_URL });
    track(block, 'uploading');

    expect(getIframes()).to.have.lengthOf(1);
  });
});
