const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  const file = 'file://' + path.resolve(__dirname, 'boards.html');
  await page.goto(file, { waitUntil: 'networkidle' });
  const ids = ['b0', 'bA', 'bB', 'bC', 'bD', 'bE', 'bF', 'bG'];
  const names = {
    b0: '01-current-setup',
    bA: '02-decision-A-repo',
    bB: '03-decision-B-path',
    bC: '04-akamai-routing',
    bD: '05-scenario-matrix',
    bE: '06-hosting-paths-deepdive',
    bF: '07-edgeworker-dcshared',
    bG: '08-migration-da-import',
  };
  for (const id of ids) {
    const el = await page.$('#' + id);
    await el.screenshot({ path: path.resolve(__dirname, names[id] + '.png') });
    console.log('saved', names[id] + '.png');
  }
  await browser.close();
})();
