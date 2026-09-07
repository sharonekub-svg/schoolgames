// Optional: photographs the self-hosted games for their thumbnails.
//
//   node serve.mjs &                  # the games have to be served
//   npx playwright@1 install chromium # one-off, this is the only dependency
//   node shoot-thumbs.mjs 2048 hexgl  # or no arguments for all of them
//
// Writes src/thumbs/<dir>.png. Not part of the build: make-thumbs.mjs draws a
// placeholder for anything without a screenshot, and curate.mjs prefers a
// screenshot when one exists. Some games open on a blank canvas or a text menu
// and photograph badly - keep the drawn SVG for those, it reads better at
// 250px than a black square does.
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const cfg = JSON.parse(await readFile('site.config.json', 'utf8'));
const BASE = new URL(cfg.domain).pathname.replace(/\/+$/, '');
const PORT = process.env.PORT ?? 4321;

// Games whose board is one element; the rest are shot whole and centre-cropped.
const ELEMENT = { '2048': '.game-container', asteroids: 'canvas', skifree: 'canvas' };

const wanted = process.argv.slice(2);
const dirs = (cfg.selfHosted ?? []).map((s) => s.dir).filter((d) => !wanted.length || wanted.includes(d));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 2 });

for (const dir of dirs) {
  const page = await ctx.newPage();
  try {
    await page.goto(`http://localhost:${PORT}${BASE}/games/${dir}/`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2500);
    // Most of these draw nothing until something happens.
    for (const key of ['Enter', 'Space', 'ArrowRight', 'ArrowUp']) {
      await page.keyboard.press(key).catch(() => {});
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(2000);
    const el = ELEMENT[dir] ? await page.$(ELEMENT[dir]) : null;
    await (el ?? page).screenshot({ path: `src/thumbs/${dir}.png` });
    console.log(`  shot ${dir}`);
  } catch (e) {
    console.log(`  FAILED ${dir}: ${e.message.split('\n')[0]}`);
  }
  await page.close();
}

await browser.close();
console.log(`\n${dirs.length} game(s) photographed -> src/thumbs/`);
