/** Programmatic layout QA: console errors, horizontal overflow, clipped text. */
const puppeteer = require('puppeteer-core');

const BASE = 'http://localhost:4173';
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

const routes = [
  '/welcome',
  '/signup',
  '/',
  '/hangouts',
  '/activity',
  '/profile',
  '/hangout/h_coffee',
  '/hangout/h_arcade',
  '/hangout/h_coffee/chat',
  '/hangout/h_coffee/live',
  '/hangout/h_board/memories',
  '/create',
  '/create/place',
  '/create/invite',
  '/place/p_ember',
  '/badges',
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  for (const route of routes) {
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const onConsole = (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
    };
    const onPageError = (err) => pageErrors.push(String(err).slice(0, 200));
    const onRequestFailed = (req) => {
      const u = req.url();
      if (!u.includes('localhost:4174')) return;
      failedRequests.push(`${req.failure()?.errorText || 'failed'} ${u.replace(BASE, '')}`);
    };
    const onResponse = (res) => {
      if (res.status() >= 400) {
        failedRequests.push(`${res.status()} ${res.url().replace(BASE, '')}`);
      }
    };
    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('requestfailed', onRequestFailed);
    page.on('response', onResponse);

    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0', timeout: 60000 });
      await new Promise((r) => setTimeout(r, route === '/hangout/h_coffee/live' ? 6000 : 3000));

      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const hOverflow = doc.scrollWidth - window.innerWidth;
        // find elements that overflow the viewport horizontally, ignoring those inside horizontal scrollers
        const offenders = [];
        const inHScroll = (el) => {
          let n = el.parentElement;
          while (n) {
            const st = getComputedStyle(n);
            if ((st.overflowX === 'auto' || st.overflowX === 'scroll') && st.display === 'flex') return true;
            n = n.parentElement;
          }
          return false;
        };
        document.querySelectorAll('*').forEach((el) => {
          // ignore SVG internals (clipped by viewport) and decorative bleed circles
          if (el.closest('svg')) return;
          const cls = el.className?.toString?.() || '';
          if (cls.includes('r-633pao')) return;
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2) && !inHScroll(el)) {
            offenders.push(`${el.tagName}.${cls.slice(0, 60)} [${Math.round(r.left)},${Math.round(r.right)}]`);
          }
        });
        return {
          hOverflow,
          offenderCount: offenders.length,
          offenders: offenders.slice(0, 8),
        };
      });

      const problems = [];
      if (consoleErrors.length) problems.push(`console: ${consoleErrors[0]}`);
      if (pageErrors.length) problems.push(`pageerror: ${pageErrors[0]}`);
      if (failedRequests.length) problems.push(`req: ${failedRequests[0]}`);
      if (metrics.hOverflow > 1) problems.push(`H-overflow ${metrics.hOverflow}px`);
      if (metrics.offenderCount > 0) problems.push(`offenders: ${metrics.offenders.join('; ')}`);

      console.log(`${problems.length ? '!!!' : 'OK '} ${route}${problems.length ? ' -> ' + problems.join(' || ') : ''}`);
    } catch (e) {
      console.log(`ERR ${route} -> ${e.message.slice(0, 120)}`);
    }
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
  await browser.close();
})().catch((e) => {
  console.error('FATAL', e.message);
  process.exit(1);
});
