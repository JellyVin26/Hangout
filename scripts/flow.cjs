/** E2E smoke test: tap through key flows with puppeteer. */
const puppeteer = require('puppeteer-core');

const BASE = 'http://localhost:4173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const results = [];

  // 1. Home → hangout detail via card tap
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await sleep(2500);
  const href = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find((x) => x.getAttribute('href')?.startsWith('/hangout/'));
    if (!a) return null;
    a.click();
    return a.getAttribute('href');
  });
  await sleep(2000);
  results.push(`home→detail: clicked ${href} → url=${page.url().replace(BASE, '')}`);

  // 2. Chat: type + send message (paper plane button)
  await page.goto(`${BASE}/hangout/h_coffee/chat`, { waitUntil: 'networkidle0' });
  await sleep(2500);
  await page.type('input, textarea', 'Yo, I am on my way 🚗');
  await sleep(600);
  const sent = await page.evaluate(() => {
    // find send icon (paper plane) parent Pressable
    const planes = [...document.querySelectorAll('svg')].filter(s => s.innerHTML?.includes('path'));
    for (const p of planes) {
      const btn = p.closest('[role="button"], [onpress], [onclick]');
      if (btn) { btn.click(); return 'clicked'; }
    }
    return 'no button found';
  });
  await sleep(1500);
  const visible = await page.evaluate(() => document.body.innerText.includes('on my way'));
  results.push(`chat send: ${sent}, message visible=${visible}`);

  // 3. Create flow: fill title, click Continue
  await page.goto(`${BASE}/create`, { waitUntil: 'networkidle0' });
  await sleep(2500);
  await page.type('input, textarea', 'Sunset Coffee Run');
  await sleep(600);
  const nextRes = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('div[role="button"], a, button')];
    const next = btns.find((b) => b.innerText && b.innerText.trim().toLowerCase() === 'continue');
    if (!next) return 'no Continue btn';
    next.click();
    return 'clicked Continue';
  });
  await sleep(2000);
  results.push(`create flow: ${nextRes} → url=${page.url().replace(BASE, '')}`);

  // 4. Live screen renders traveler rows + map
  await page.goto(`${BASE}/hangout/h_coffee/live`, { waitUntil: 'networkidle0' });
  await sleep(4000);
  const liveInfo = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      hasStatus: /Arrived|On the way|Running late|Not started/i.test(txt),
      hasShare: /Share live location|ETA only/i.test(txt),
      hasMap: !!document.querySelector('svg'),
      hasAvatar: [...document.querySelectorAll('svg')].some(s => s.querySelector('circle')),
    };
  });
  results.push(`live screen: ${JSON.stringify(liveInfo)}`);

  // 5. Place detail page
  await page.goto(`${BASE}/place/p_ember`, { waitUntil: 'networkidle0' });
  await sleep(2500);
  const placeInfo = await page.evaluate(() => ({
    hasTitle: document.body.innerText.includes('Ember Coffee'),
    hasRating: /★|\d\.\d/.test(document.body.innerText),
    hasNav: /Navigate|Directions/i.test(document.body.innerText),
  }));
  results.push(`place detail: ${JSON.stringify(placeInfo)}`);

  // 6. Badges screen
  await page.goto(`${BASE}/badges`, { waitUntil: 'networkidle0' });
  await sleep(2500);
  const badges = await page.evaluate(() => ({
    hasBadges: /Explorer|Cafe|Foodie|Weekend|Organizer|Early/i.test(document.body.innerText),
    count: document.querySelectorAll('[class*="card"]').length,
  }));
  results.push(`badges: ${JSON.stringify(badges)}`);

  console.log(results.join('\n'));
  await browser.close();
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});