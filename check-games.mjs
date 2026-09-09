// Loads every game in a real browser and reports the ones that do not work.
//
//   node serve.mjs &                     # needed for the self-hosted games
//   npx playwright@1 install chromium    # one-off, the only dependency
//   node check-games.mjs                 # all 477
//   node check-games.mjs --self          # only the 15 served from this domain
//   node check-games.mjs --source=playgama --limit=20
//   CHROMIUM_PATH=/path/to/chrome node check-games.mjs   # bring your own browser
//
// Writes data/check-report.json and a PNG per failure into data/check-shots/.
// A game counts as broken when the page errors, 404s, or draws nothing: an
// empty canvas, no canvas at all, and no text worth reading.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { chromium } from 'playwright';

const games = JSON.parse(await readFile('data/games.json', 'utf8'));
const cfg = JSON.parse(await readFile('site.config.json', 'utf8'));
const BASE = new URL(cfg.domain).pathname.replace(/\/+$/, '');

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const ORIGIN = `http://localhost:${process.env.PORT ?? 4321}`;
const WAIT = Number(arg('wait', 9000));       // how long a game gets to draw
const WORKERS = Number(arg('workers', 6));
const SHOTS = 'data/check-shots';

let list = games;
if (has('self')) list = list.filter((g) => g.source === 'selfhosted');
const source = arg('source');
if (source) list = list.filter((g) => g.source === source);
const limit = Number(arg('limit', 0));
if (limit) list = list.slice(0, limit);

// Self-hosted urls are site-relative, so they need the local server in front.
const target = (g) => (g.url.startsWith('/') ? ORIGIN + BASE + g.url : g.url);

await rm(SHOTS, { recursive: true, force: true });
await mkdir(SHOTS, { recursive: true });

// CHROMIUM_PATH covers a machine that already has a browser Playwright did not
// install itself, which is the usual case in a sandbox.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);

// Did the page actually draw a game? A canvas with real pixels is the strongest
// signal; a <video>, a WebGL context or a screenful of text is good enough.
// Everything else is a blank page wearing a title.
async function drew(page) {
  return page.evaluate(() => {
    // Scale the whole canvas into a small offscreen one and look for more than
    // one colour. Sampling a corner instead misses games that draw in the
    // middle of a white field, which is most of the retro ones.
    const painted = (c) => {
      if (!c.width || !c.height) return false;
      // A canvas that already holds a WebGL context returns null here, and its
      // pixels are unreadable without preserveDrawingBuffer - so a sized one
      // counts as drawn. HexGL and Drakonas are both WebGL.
      let ctx = null;
      try {
        ctx = c.getContext('2d');
      } catch {
        return true;
      }
      if (!ctx) return true;
      try {
        // Read the canvas at its own resolution rather than downscaling it.
        // Scaling averages away the one-pixel vector lines that games like
        // Asteroids are drawn entirely out of, and sampling only a corner
        // misses SkiFree, which draws in the middle of a white field.
        const w = Math.min(c.width, 1400);
        const h = Math.min(c.height, 1400);
        const d = ctx.getImageData(0, 0, w, h).data;
        // Alpha counts. Asteroids draws black lines on a transparent canvas
        // over a white CSS background, so every pixel is 0,0,0 and only the
        // alpha channel says which ones were actually drawn.
        for (let i = 4; i < d.length; i += 4) {
          if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2] || d[i + 3] !== d[3]) {
            return true;
          }
        }
        return false; // one flat colour: nothing was drawn
      } catch {
        return true; // tainted by a cross-origin draw, which means it drew
      }
    };

    const canvases = [...document.querySelectorAll('canvas')];
    if (canvases.some(painted)) return 'canvas';
    if (document.querySelector('video, iframe[src]')) return 'embed';

    // A DOM menu counts too - HexGL and the clickers start on one - but an
    // error page is text as well, so those words disqualify it.
    const text = (document.body?.innerText ?? '').replace(/\s+/g, ' ').trim();
    if (text.length > 20 && !/^(error|not found|404|403|forbidden|access denied)/i.test(text)) {
      return 'text';
    }
    return '';
  });
}

async function check(g) {
  const url = target(g);
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));

  const row = { slug: g.slug, title: g.title, source: g.source, url };
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    row.status = res?.status() ?? 0;
    if (row.status >= 400) throw new Error(`HTTP ${row.status}`);

    // Many games only start on a click. Give it one in the middle, harmlessly.
    await page.waitForTimeout(Math.min(WAIT, 3000));
    await page.mouse.click(500, 350).catch(() => {});
    await page.waitForTimeout(WAIT - Math.min(WAIT, 3000));

    const evidence = await drew(page);
    row.evidence = evidence || 'nothing';
    row.ok = Boolean(evidence);
    if (errors.length) row.errors = errors.slice(0, 3);
    if (!row.ok) {
      await page.screenshot({ path: `${SHOTS}/${g.slug}.png` }).catch(() => {});
      row.shot = `${SHOTS}/${g.slug}.png`;
    }
  } catch (e) {
    row.ok = false;
    row.evidence = 'load failed';
    row.reason = String(e.message).split('\n')[0].slice(0, 160);
    if (errors.length) row.errors = errors.slice(0, 3);
  }
  await ctx.close();
  return row;
}

console.log(`checking ${list.length} games, ${WORKERS} at a time, ${WAIT}ms each\n`);

const results = [];
const queue = [...list];
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    while (queue.length) {
      const g = queue.shift();
      const row = await check(g);
      results.push(row);
      const mark = row.ok ? 'ok  ' : 'FAIL';
      const note = row.ok ? row.evidence : row.reason || row.evidence;
      console.log(`  ${mark} ${row.title}  [${row.source}]  ${note}`);
    }
  })
);

results.sort((a, b) => Number(a.ok) - Number(b.ok) || a.title.localeCompare(b.title));
const broken = results.filter((r) => !r.ok);
await writeFile('data/check-report.json', JSON.stringify({ checked: results.length, broken: broken.length, results }, null, 2));

const bySource = {};
for (const r of broken) bySource[r.source] = (bySource[r.source] ?? 0) + 1;

console.log(`\n${results.length - broken.length}/${results.length} playable`);
if (broken.length) {
  console.log(`broken by source: ${JSON.stringify(bySource)}`);
  console.log(`\nscreenshots in ${SHOTS}/, full report in data/check-report.json`);
  console.log('\nTo drop them from the site, remove their slugs from data/games.json and rebuild.');
}
