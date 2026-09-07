// Pulls the GameMonetize public catalogue to data/gm-catalog.json and searches it.
// GameMonetize is a second broker alongside GamePix - different catalogue, same model.
//   node gamemonetize.mjs pull
//   node gamemonetize.mjs find "fireboy" "bloxorz" ...
import { readFile, writeFile } from 'node:fs/promises';

const cmd = process.argv[2];
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; loadless-build/1.0)' };

if (cmd === 'pull') {
  const all = [];
  const seen = new Set();
  for (let p = 1; p <= 60; p++) {
    const res = await fetch(`https://gamemonetize.com/feed.php?format=0&num=100&page=${p}`, { headers: UA });
    if (!res.ok) break;
    let batch;
    try {
      batch = await res.json();
    } catch {
      break;
    }
    if (!Array.isArray(batch) || !batch.length) break;
    let added = 0;
    for (const g of batch) {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      all.push(g);
      added++;
    }
    process.stdout.write(`  page ${p} -> ${all.length} games\r`);
    if (!added) break;
  }
  await writeFile('data/gm-catalog.json', JSON.stringify(all));
  console.log(`\nGameMonetize catalogue: ${all.length} games`);
  console.log('fields:', Object.keys(all[0] ?? {}).join(', '));
} else if (cmd === 'find') {
  const catalog = JSON.parse(await readFile('data/gm-catalog.json', 'utf8'));
  for (const term of process.argv.slice(3)) {
    const t = term.toLowerCase();
    const hits = catalog.filter((g) => (g.title ?? '').toLowerCase().includes(t));
    console.log(`\n=== "${term}" -> ${hits.length} hit(s)`);
    for (const h of hits.slice(0, 10)) console.log(`   ${h.title}  [${h.category}]`);
  }
} else {
  console.log('usage: node gamemonetize.mjs pull | find <terms...>');
}
