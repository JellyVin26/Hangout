/** Headless screenshot harness for visual QA (dev only). */
const puppeteer = require('puppeteer-core');

const BASE = 'http://localhost:4174';
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };
const WAIT = 3500;

const shots = [
  { name: 'welcome', url: '/welcome' },
  { name: 'signup', url: '/signup' },
  { name: 'home', url: '/' },
  { name: 'hangouts', url: '/hangouts' },
  { name: 'activity', url: '/activity' },
  { name: 'profile', url: '/profile' },
  { name: 'hangout-coffee', url: '/hangout/h_coffee' },
  { name: 'hangout-arcade', url: '/hangout/h_arcade' },
  { name: 'chat', url: '/hangout/h_coffee/chat' },
  { name: 'live', url: '/hangout/h_coffee/live' },
  { name: 'memories', url: '/hangout/h_board/memories' },
  { name: 'create', url: '/create' },
  { name: 'place-picker', url: '/create/place' },
  { name: 'invite', url: '/create/invite' },
  { name: 'place', url: '/place/p_ember' },
  { name: 'badges', url: '/badges' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // Seed: sign in first so authed routes render
  await page.goto(`${BASE}/welcome`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, WAIT));

  const results = [];
  for (const s of shots) {
    try {
      await page.goto(`${BASE}${s.url}`, { waitUntil: 'networkidle0', timeout: 60000 });
      await new Promise((r) => setTimeout(r, s.name === 'live' ? 5000 : WAIT));
      await page.screenshot({ path: `shots/${s.name}.png` });
      results.push(`OK   ${s.name}`);
    } catch (e) {
      results.push(`FAIL ${s.name}: ${e.message.slice(0, 120)}`);
    }
  }
  await browser.close();
  console.log(results.join('\n'));
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
