import { chromium } from '@playwright/test';

async function runLiveSmoke() {
  console.log('🚀 Starting Human-Like Live Visual Smoke Test...');
  console.log('👀 Browser window is opening on your desktop screen now!');

  // Launch real headed Chrome with slowMo for visible human typing and clicking
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    slowMo: 450, // Human speed (450ms between actions)
    args: ['--start-maximized', '--window-size=1280,850']
  });

  const context = await browser.newContext({
    viewport: null, // Full screen responsive
  });

  const page = await context.newPage();

  // Helper function to show a glowing yellow spotlight circle on elements before clicking
  async function highlightAndClick(selector, label) {
    console.log(`👉 [Action] Clicking: ${label}`);
    try {
      const el = typeof selector === 'string' ? page.locator(selector).first() : selector;
      await el.scrollIntoViewIfNeeded();
      await el.evaluate(node => {
        node.style.outline = '4px solid #f59e0b';
        node.style.transition = 'all 0.3s ease';
        node.style.boxShadow = '0 0 20px #f59e0b';
      });
      await page.waitForTimeout(600);
      await el.click();
    } catch (err) {
      console.warn(`Click warning for ${label}:`, err.message);
    }
  }

  // ==========================================
  // PHASE 1: GIA LIMS LOGIN & MODULE WALKTHROUGH
  // ==========================================
  console.log('\n🏥 Phase 1: Testing GIA LIMS (http://localhost:3001)...');
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Fill credentials visibly
  console.log('⌨️ Typing username: admin');
  const userField = page.locator('input[placeholder*="user" i], input[name="username"]').first();
  if (await userField.count()) {
    await userField.click();
    await userField.fill('');
    await userField.pressSequentially('admin', { delay: 120 });
  }

  console.log('⌨️ Typing password: ••••••••••••');
  const passField = page.locator('input[type="password"]').first();
  if (await passField.count()) {
    await passField.click();
    await passField.fill('');
    await passField.pressSequentially('Admin@12345678', { delay: 100 });
  }

  await page.waitForTimeout(500);

  // Click Sign In
  const signInBtn = page.locator('button:has-text("Sign in"), button:has-text("Login")').first();
  await highlightAndClick(signInBtn, 'Sign In Button');

  await page.waitForTimeout(2500);

  // Navigate to Registration
  const regBtn = page.locator('button:has-text("Registration"), button:has-text("Accessioning")').first();
  if (await regBtn.count()) {
    await highlightAndClick(regBtn, 'Direct Registration & Accessioning');
    await page.waitForTimeout(1800);
  }

  // Navigate to QC / Westgard
  const qcBtn = page.locator('button:has-text("Westgard"), button:has-text("QC")').first();
  if (await qcBtn.count()) {
    await highlightAndClick(qcBtn, 'QC / Westgard Engine');
    await page.waitForTimeout(2000);
  }

  // Navigate to Reports
  const reportsBtn = page.locator('button:has-text("Reports")').first();
  if (await reportsBtn.count()) {
    await highlightAndClick(reportsBtn, 'Reports Module');
    await page.waitForTimeout(1800);
  }

  // ==========================================
  // PHASE 2: HRGEN DIGITECH PWA SHOWCASE
  // ==========================================
  console.log('\n🌐 Phase 2: Testing HRGen Digitech PWA (http://127.0.0.1:4173)...');
  const page2 = await context.newPage();
  await page2.goto('http://127.0.0.1:4173/#solutions', { waitUntil: 'domcontentloaded' });
  await page2.bringToFront();
  await page2.waitForTimeout(1500);

  // Smooth scroll down to solutions
  console.log('📜 Scrolling through Digitech Solutions...');
  await page2.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
  await page2.waitForTimeout(1200);

  // Click between preview buttons
  const automationBtn = page2.locator('button:has-text("Automation")').first();
  if (await automationBtn.count()) {
    await automationBtn.evaluate(node => { node.style.outline = '3px solid #38bdf8'; });
    await page2.waitForTimeout(600);
    await automationBtn.click();
    await page2.waitForTimeout(1200);
  }

  const pwaBtn = page2.locator('button:has-text("Web & PWA")').first();
  if (await pwaBtn.count()) {
    await pwaBtn.evaluate(node => { node.style.outline = '3px solid #38bdf8'; });
    await page2.waitForTimeout(600);
    await pwaBtn.click();
    await page2.waitForTimeout(1200);
  }

  const medicareBtn = page2.locator('button:has-text("MediCare LIMS")').first();
  if (await medicareBtn.count()) {
    await medicareBtn.evaluate(node => { node.style.outline = '3px solid #38bdf8'; });
    await page2.waitForTimeout(600);
    await medicareBtn.click();
    await page2.waitForTimeout(1200);
  }

  console.log('\n🎉 Live Visual Smoke Test completed successfully!');
  console.log('🌟 Leaving browser window open for you to inspect and interact!');

  // Keep open for user inspection
  await page2.waitForTimeout(60000); // 1 minute live inspection
}

runLiveSmoke().catch(err => {
  console.error('Smoke test error:', err);
});
