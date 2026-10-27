'use strict';

const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { chromium } = require('@playwright/test');
const { startTestServer, stopTestServer } = require('../tests/e2e/testServer');

async function availablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function main() {
  const port = await availablePort();
  let serverHandle;
  let browser;
  const result = { runtime: 'synthetic in-memory API', desktop: {}, mobile: {}, pageErrors: [] };

  try {
    serverHandle = await startTestServer(port);
    if (!serverHandle.isLocal) throw new Error('Refusing to inspect an existing server instead of the synthetic test server');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.on('pageerror', error => result.pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.fill('#loginUser', 'admin');
    await page.fill('#loginPass', 'Admin@12345678');
    await page.click('#loginForm button.primary');
    await page.locator('#app:not(.hidden)').waitFor();
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(os.tmpdir(), 'hrgen-ui-ux-desktop.png'), fullPage: true });

    const modules = ['dashboard', 'patients', 'billing', 'worklist', 'qc', 'reports', 'inventory', 'collection', 'audit', 'integrations', 'features', 'settings'];
    for (const moduleId of modules) {
      await page.evaluate(async id => { if (typeof window.show === 'function') await window.show(id); }, moduleId);
      await page.waitForTimeout(80);
      const metrics = await page.evaluate(() => {
        const controls = [...document.querySelectorAll('#view input, #view select, #view textarea')];
        const unnamed = controls.filter(el => !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.labels?.length)
          .map(el => ({ tag: el.tagName.toLowerCase(), type: el.type || null, placeholder: el.getAttribute('placeholder'), name: el.getAttribute('name') }));
        const view = document.querySelector('#view h2, #view .big')?.textContent?.trim() || null;
        const renderError = [...document.querySelectorAll('#view .card')].some(card => card.querySelector('.bad.badge')?.textContent?.trim() === 'ERROR');
        return { view, renderError, controlCount: controls.length, unnamedControls: unnamed };
      });
      result.desktop[moduleId] = metrics;
    }

    const injectedError = '<img src=x onerror=window.__auditXss=true>';
    await page.route('**/api/patients', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: injectedError })
    }));
    await page.evaluate(async () => window.show('patients'));
    await page.locator('#view .bad.badge').waitFor();
    result.errorRendering = await page.evaluate(() => ({
      injectedMarkupCreated: Boolean(document.querySelector('#view img')),
      scriptExecuted: Boolean(window.__auditXss),
      renderedText: document.querySelector('#view p')?.textContent || ''
    }));
    await page.unroute('**/api/patients');

    await page.setViewportSize({ width: 390, height: 844 });
    for (const moduleId of modules) {
      await page.evaluate(async id => { if (typeof window.show === 'function') await window.show(id); }, moduleId);
      await page.waitForTimeout(60);
      result.mobile[moduleId] = await page.evaluate(() => ({
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        wideElements: [...document.querySelectorAll('body *')].map(el => ({
          tag: el.tagName.toLowerCase(), id: el.id || null, className: typeof el.className === 'string' ? el.className : null,
          left: Math.round(el.getBoundingClientRect().left), width: Math.round(el.getBoundingClientRect().width),
          scrollWidth: el.scrollWidth
        })).filter(el => el.left + el.width > window.innerWidth + 2 && el.width > 0)
          .sort((a, b) => b.width - a.width).slice(0, 5)
      }));
    }
    await page.evaluate(async () => window.show('collection'));
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(os.tmpdir(), 'hrgen-ui-ux-mobile.png'), fullPage: true });
    const renderFailures = Object.entries(result.desktop).filter(([, view]) => view.renderError || !view.view);
    const unnamedControls = Object.values(result.desktop).reduce((count, view) => count + view.unnamedControls.length, 0);
    const mobileOverflow = Object.entries(result.mobile).filter(([, metrics]) => metrics.horizontalOverflow);
    if (renderFailures.length) throw new Error(`View render failures: ${renderFailures.map(([id]) => id).join(', ')}`);
    if (unnamedControls) throw new Error(`${unnamedControls} visible form controls have no accessible name`);
    if (mobileOverflow.length) throw new Error(`Horizontal overflow: ${mobileOverflow.map(([id]) => id).join(', ')}`);
    if (result.pageErrors.length) throw new Error(`Browser page errors: ${result.pageErrors.join('; ')}`);
    if (result.errorRendering.injectedMarkupCreated || result.errorRendering.scriptExecuted || !result.errorRendering.renderedText.includes('<img src=x')) {
      throw new Error('API error text was not safely rendered as text');
    }
    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (browser) await browser.close();
    if (serverHandle?.isLocal) await stopTestServer();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
