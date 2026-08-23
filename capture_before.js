const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const routes = [
    { name: 'home', url: 'http://localhost:3000' },
    { name: 'products', url: 'http://localhost:3000/products' },
    { name: 'hampers', url: 'http://localhost:3000/hampers' },
    { name: 'occasions', url: 'http://localhost:3000/occasions' }
  ];

  const outDir = path.join(process.cwd(), 'screenshots_before');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const route of routes) {
    try {
      await page.goto(route.url, { waitUntil: 'networkidle', timeout: 10000 });
      await page.screenshot({ path: path.join(outDir, `${route.name}_full.png`), fullPage: true });
      console.log(`Captured ${route.name}`);
    } catch (e) {
      console.log(`Failed to capture ${route.name}: ${e.message}`);
    }
  }

  await browser.close();
}

captureScreenshots();
