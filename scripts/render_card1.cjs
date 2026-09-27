const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Rendering Card 1 from linkedin_card_1.html at 2400x1350...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 2400,
    height: 1350,
    deviceScaleFactor: 1
  });

  await page.goto('http://localhost:5173/linkedin_card_1.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200)); // Wait for Google fonts

  const tempArtifact = '/Users/romitchakraborty/.gemini/antigravity-ide/brain/71159cbb-187a-479f-84b1-3243036e7528/.tempmediaStorage/card1_branded_preview.png';
  await page.screenshot({ path: tempArtifact });
  console.log('✓ Saved preview to:', tempArtifact);

  const targets = [
    path.join(__dirname, '../public/p1-4tile.png'),
    path.join(__dirname, '../marketing/linkedin_card_1_active_belt.png'),
    path.join(__dirname, '../public/assets/preprint/linkedin_card_1_active_belt.png'),
    path.join(__dirname, '../marketing/linkedin_active_belt.png'),
    path.join(__dirname, '../public/assets/preprint/qbescf_spotlight_dashboard.png'),
  ];

  for (const t of targets) {
    fs.copyFileSync(tempArtifact, t);
    console.log('✓ Saved to:', t);
  }

  await browser.close();
  console.log('Done rendering Card 1!');
})();
