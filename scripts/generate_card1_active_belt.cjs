const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Launching headless Chrome for Card 1 (Title + Active Belt)...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2']
  });

  const page = await browser.newPage();
  // 16:9 canvas at 1600 x 900 (will render 3200 x 1800 at 2x retina)
  await page.setViewport({
    width: 1600,
    height: 900,
    deviceScaleFactor: 2
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#preprint');

  // Inject styles to showcase Title + Active Belt cleanly on 16:9
  await page.addStyleTag({
    content: `
      header, .site-header, .site-nav, nav, .hero-film-container, .hero-title-group, .hero-film-wrapper, footer, .site-footer, .section-block, .plot-showcase-panel, .spotlight-actions-bar {
        display: none !important;
      }
      .hero-section {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        min-height: 100vh !important;
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
        margin: 0 !important;
        padding: 0 !important;
        width: 1400px !important;
        max-width: 1400px !important;
      }
      .preprint-spotlight-card {
        padding: 48px 56px 44px 56px !important;
        background: linear-gradient(145deg, rgba(6, 22, 36, 0.98) 0%, rgba(2, 9, 18, 0.99) 100%) !important;
        border: 1px solid rgba(56, 189, 248, 0.40) !important;
        border-radius: 14px !important;
        box-shadow: 0 0 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.15) !important;
      }
      .spotlight-top-bar {
        margin-bottom: 20px !important;
        padding-bottom: 18px !important;
        border-bottom: 1px solid rgba(56, 189, 248, 0.20) !important;
      }
      .spotlight-title {
        font-size: 2.25rem !important;
        line-height: 1.25 !important;
        margin-bottom: 12px !important;
        color: #ffffff !important;
      }
      .spotlight-author {
        margin-bottom: 28px !important;
        font-size: 1.15rem !important;
      }
      .spotlight-author strong {
        color: #38bdf8 !important;
        font-size: 1.25rem !important;
      }
      .active-belt {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 16px !important;
      }
      .belt-header {
        margin-bottom: 6px !important;
      }
      .belt-kicker {
        font-size: 0.82rem !important;
        letter-spacing: 0.14em !important;
      }
      .belt-button {
        padding: 20px 24px !important;
        background: rgba(8, 26, 42, 0.75) !important;
        border: 1px solid rgba(56, 189, 248, 0.25) !important;
        border-radius: 10px !important;
      }
      .belt-button.active {
        background: linear-gradient(135deg, rgba(14, 42, 68, 0.95), rgba(8, 28, 46, 0.98)) !important;
        border-color: #38bdf8 !important;
        box-shadow: 0 4px 24px rgba(56, 189, 248, 0.25), inset 0 0 14px rgba(56, 189, 248, 0.12) !important;
      }
      .belt-badge {
        font-size: 0.76rem !important;
        padding: 3px 8px !important;
      }
      .belt-system {
        font-size: 0.88rem !important;
        color: #38bdf8 !important;
      }
      .belt-btn-title {
        font-size: 1.25rem !important;
        margin: 6px 0 4px 0 !important;
        font-weight: 700 !important;
      }
      .belt-btn-desc {
        font-size: 0.88rem !important;
        color: #94a3b8 !important;
        line-height: 1.4 !important;
      }
    `
  });

  // Add a sleek bottom URL badge to Card 1
  await page.evaluate(() => {
    const card = document.querySelector('.preprint-spotlight-card');
    if (card) {
      const footerBadge = document.createElement('div');
      footerBadge.style.display = 'flex';
      footerBadge.style.justifyContent = 'space-between';
      footerBadge.style.alignItems = 'center';
      footerBadge.style.marginTop = '28px';
      footerBadge.style.paddingTop = '16px';
      footerBadge.style.borderTop = '1px solid rgba(56, 189, 248, 0.15)';
      footerBadge.innerHTML = `
        <span style="font-family: monospace; font-size: 0.88rem; color: #94a3b8;">
          Interactive Simulation Suite & Topological Benchmarks
        </span>
        <span style="font-family: monospace; font-size: 0.95rem; font-weight: bold; color: #38bdf8;">
          pointreyessound.com/#preprint &rarr;
        </span>
      `;
      card.appendChild(footerBadge);
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  const cardEl = await page.$('.preprint-spotlight-card');
  const outPath = path.join(__dirname, '../public/assets/preprint/linkedin_card_1_active_belt.png');
  await cardEl.screenshot({ path: outPath });
  console.log('✓ Successfully generated Card 1:', outPath);

  await browser.close();
})();
