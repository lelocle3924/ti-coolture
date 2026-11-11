const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function render() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  });
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  
  const svgContent = fs.readFileSync(path.join(__dirname, '../public/favicon.svg'), 'utf8');
  
  // Render square 512x512
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: 512px; height: 512px; background: transparent; display: flex; align-items: center; justify-content: center; }
      svg { width: 100%; height: 100%; display: block; }
    </style>
  </head>
  <body>
    ${svgContent}
  </body>
  </html>`;

  await page.setContent(html);
  await page.screenshot({ path: path.join(__dirname, '../public/favicon-512x512.png'), omitBackground: true });
  
  // Also 192x192
  await page.setViewportSize({ width: 192, height: 192 });
  const html192 = html.replace(/512px/g, '192px');
  await page.setContent(html192);
  await page.screenshot({ path: path.join(__dirname, '../public/favicon-192x192.png'), omitBackground: true });
  
  // Also 48x48 (Google's multiple)
  await page.setViewportSize({ width: 48, height: 48 });
  const html48 = html.replace(/512px/g, '48px');
  await page.setContent(html48);
  await page.screenshot({ path: path.join(__dirname, '../public/favicon-48x48.png'), omitBackground: true });

  // Also apple-touch-icon 180x180
  await page.setViewportSize({ width: 180, height: 180 });
  const html180 = html.replace(/512px/g, '180px');
  await page.setContent(html180);
  await page.screenshot({ path: path.join(__dirname, '../public/apple-touch-icon.png'), omitBackground: true });

  await browser.close();
  console.log('Favicons generated successfully.');
}

render().catch(err => {
  console.error(err);
  process.exit(1);
});
