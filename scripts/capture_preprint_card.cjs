const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  console.log('Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2']
  });

  const page = await browser.newPage();
  // Viewport at 1600 x 1000 @ 2x retina
  await page.setViewport({
    width: 1600,
    height: 1000,
    deviceScaleFactor: 2
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#preprint');

  // Inject balanced, smaller, and cleaner CSS with zero whitespace under BeH2 tab
  await page.addStyleTag({
    content: `
      header, .site-header, .site-nav, nav, .hero-film-container, .hero-title-group, .hero-film-wrapper, footer, .site-footer, .section-block {
        display: none !important;
      }
      .hero-section {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        background: #020611 !important;
      }
      body, html {
        background: #020611 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }

      .preprint-spotlight-wrapper {
        display: block !important;
        width: 1400px !important;
        max-width: 1400px !important;
        margin: 0 auto !important;
        padding: 20px !important;
        box-sizing: border-box !important;
      }

      .preprint-spotlight-card {
        width: 1400px !important;
        max-width: 1400px !important;
        padding: 38px 46px !important;
        border-radius: 18px !important;
        background: linear-gradient(145deg, rgba(6, 22, 36, 0.98) 0%, rgba(2, 9, 18, 0.99) 100%) !important;
        box-shadow: 0 0 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.15) !important;
        border: 1.2px solid rgba(56, 189, 248, 0.40) !important;
        box-sizing: border-box !important;
      }

      .spotlight-top-bar {
        margin-bottom: 16px !important;
        padding-bottom: 10px !important;
      }

      .spotlight-badge {
        font-size: 0.78rem !important;
        padding: 4px 10px !important;
      }

      .spotlight-meta {
        font-size: 0.84rem !important;
      }

      .spotlight-status {
        font-size: 0.78rem !important;
        padding: 4px 12px !important;
      }

      .spotlight-doi-pill {
        font-size: 0.80rem !important;
        padding: 4px 12px !important;
      }

      .spotlight-title {
        font-size: 2.05rem !important;
        margin-bottom: 8px !important;
        line-height: 1.24 !important;
        font-weight: 700 !important;
        letter-spacing: -0.015em !important;
      }

      .spotlight-author {
        margin-bottom: 24px !important;
        font-size: 1.05rem !important;
      }

      /* Stage: Single clean stage containing the 4 buttons (plot panel deleted) */
      .spotlight-stage {
        display: block !important;
        margin-bottom: 22px !important;
      }

      /* Entire plot showcase panel on the right is deleted as requested */
      .plot-showcase-panel {
        display: none !important;
      }

      /* 2x2 Balanced Grid for the 4 Phenomena Buttons */
      .active-belt {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 16px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .belt-header {
        grid-column: 1 / -1 !important;
        margin-bottom: 8px !important;
        display: flex !important;
        align-items: center !important;
      }

      .belt-kicker {
        font-size: 0.82rem !important;
        letter-spacing: 0.12em !important;
        font-weight: 700 !important;
        color: #38bdf8 !important;
      }

      /* Each button is a spacious, rich, clickable card */
      .belt-button {
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        padding: 22px 26px !important;
        margin: 0 !important;
        border-radius: 12px !important;
        box-sizing: border-box !important;
        background: rgba(8, 26, 42, 0.75) !important;
        border: 1.2px solid rgba(56, 189, 248, 0.25) !important;
        transition: none !important;
        transform: none !important;
      }

      /* Individual distinctive left accent bars & borders for each phenomenon */
      .belt-button:nth-child(2) {
        border-color: rgba(56, 189, 248, 0.45) !important;
        background: linear-gradient(135deg, rgba(12, 36, 58, 0.90), rgba(6, 20, 34, 0.95)) !important;
      }
      .belt-button:nth-child(2)::before {
        background: #38bdf8 !important;
        box-shadow: 0 0 8px #38bdf8 !important;
        width: 4px !important;
      }
      .belt-button:nth-child(2) .belt-badge {
        background: rgba(56, 189, 248, 0.20) !important;
        color: #38bdf8 !important;
        border-color: rgba(56, 189, 248, 0.40) !important;
      }

      .belt-button:nth-child(3) {
        border-color: rgba(251, 191, 36, 0.35) !important;
      }
      .belt-button:nth-child(3)::before {
        background: #fbbf24 !important;
        box-shadow: 0 0 8px #fbbf24 !important;
        width: 4px !important;
      }
      .belt-button:nth-child(3) .belt-badge {
        background: rgba(251, 191, 36, 0.20) !important;
        color: #fbbf24 !important;
        border-color: rgba(251, 191, 36, 0.40) !important;
      }

      .belt-button:nth-child(4) {
        border-color: rgba(52, 211, 153, 0.35) !important;
      }
      .belt-button:nth-child(4)::before {
        background: #34d399 !important;
        box-shadow: 0 0 8px #34d399 !important;
        width: 4px !important;
      }
      .belt-button:nth-child(4) .belt-badge {
        background: rgba(52, 211, 153, 0.20) !important;
        color: #34d399 !important;
        border-color: rgba(52, 211, 153, 0.40) !important;
      }

      .belt-button:nth-child(5) {
        border-color: rgba(192, 132, 252, 0.35) !important;
      }
      .belt-button:nth-child(5)::before {
        background: #c084fc !important;
        box-shadow: 0 0 8px #c084fc !important;
        width: 4px !important;
      }
      .belt-button:nth-child(5) .belt-badge {
        background: rgba(192, 132, 252, 0.20) !important;
        color: #c084fc !important;
        border-color: rgba(192, 132, 252, 0.40) !important;
      }

      .belt-btn-top {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-bottom: 8px !important;
        width: 100% !important;
      }

      .belt-badge {
        font-size: 0.74rem !important;
        padding: 3px 9px !important;
        font-weight: 700 !important;
      }

      .belt-system {
        font-size: 0.86rem !important;
        font-family: monospace !important;
        color: #94a3b8 !important;
      }

      .belt-btn-title {
        font-size: 1.28rem !important;
        font-weight: 700 !important;
        margin-bottom: 6px !important;
        line-height: 1.25 !important;
        color: #ffffff !important;
      }

      .belt-btn-desc {
        font-size: 0.90rem !important;
        line-height: 1.40 !important;
        color: #94a3b8 !important;
      }

      /* Bottom action bar */
      .spotlight-actions-bar {
        margin-top: 22px !important;
        padding-top: 18px !important;
        gap: 14px !important;
        border-top: 1px solid rgba(56, 189, 248, 0.20) !important;
      }

      .spotlight-btn-primary, .spotlight-btn-secondary {
        padding: 10px 22px !important;
        font-size: 0.90rem !important;
      }
    `
  });

  await new Promise(r => setTimeout(r, 1000));

  const spotlightEl = await page.$('.preprint-spotlight-card');
  if (spotlightEl) {
    console.log('Capturing 16:9 interactive dashboard card screenshot...');
    const outPath = path.join(__dirname, '../scratch/spotlight_card_16x9.png');
    await spotlightEl.screenshot({ path: outPath });
    console.log('Saved 16:9 card screenshot to:', outPath);

    // Frame into true 16:9 2400x1350 with pristine cosmic obsidian canvas
    const pyScript = `
import numpy as np
from PIL import Image

src = Image.open('scratch/spotlight_card_16x9.png')
sw, sh = src.size

cw, ch = 2400, 1350
canvas = Image.new('RGB', (cw, ch), (2, 6, 17)) # #020611

# Scale src to fit snugly within 2400x1350 with balanced 50px vertical margin
scale_w = (cw - 80) / sw
scale_h = (ch - 80) / sh
scale = min(scale_w, scale_h)

target_w = int(sw * scale)
target_h = int(sh * scale)

resized = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
x_off = (cw - target_w) // 2
y_off = (ch - target_h) // 2

canvas.paste(resized, (x_off, y_off))

# Save all marketing and public paths
canvas.save('marketing/linkedin_active_belt.png')
canvas.save('marketing/linkedin_card_1_active_belt.png')
canvas.save('public/assets/preprint/linkedin_card_1_active_belt.png')
canvas.save('public/assets/preprint/qbescf_linkedin_active_belt.png')
canvas.save('public/assets/preprint/qbescf_spotlight_dashboard.png')

print(f'Done! Rendered {sw}x{sh} -> Framed into {cw}x{ch} (target {target_w}x{target_h})')
`;
    fs.writeFileSync(path.join(__dirname, '../scratch/frame_active_belt.py'), pyScript);
    execSync('python3 scratch/frame_active_belt.py', { cwd: path.join(__dirname, '..') });
    console.log('Successfully framed active belt card into 2400x1350!');
  } else {
    console.error('Could not find .preprint-spotlight-card');
  }

  await browser.close();
  console.log('Done!');
})();
