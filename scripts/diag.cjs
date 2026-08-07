const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:54770/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  const info = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.r-633pao')];
    return els.map(el => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return { rect: `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`, filter: st.filter.slice(0, 60), bg: st.backgroundColor };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
