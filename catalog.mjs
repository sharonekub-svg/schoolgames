// Pulls the WHOLE GamePix catalogue to data/catalog.json, then searches it.
// Usage:  node catalog.mjs pull
//         node catalog.mjs find "fireboy" "moto x3m" ...
import { readFile, writeFile } from 'node:fs/promises';

const cfg = JSON.parse(await readFile('site.config.json', 'utf8'));
const cmd = process.argv[2];

if (cmd === 'pull') {
  const all = [];
  const seen = new Set();
  for (let offset = 0; offset < 20000; offset += 1000) {
    const res = await fetch(
      `https://games.gamepix.com/games?sid=${encodeURIComponent(cfg.sid)}&limit=1000&offset=${offset}`
    );
    if (!res.ok) throw new Error(`GamePix ${res.status}`);
    const batch = (await res.json()).data ?? [];
    if (!batch.length) break;
    for (const g of batch) {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      all.push(g);
    }
    process.stdout.write(`  ${all.length} games\r`);
    if (batch.length < 1000) break;
  }
  await writeFile('data/catalog.json', JSON.stringify(all));
  console.log(`\ncatalogue: ${all.length} games saved`);
} else if (cmd === 'find') {
  const catalog = JSON.parse(await readFile('data/catalog.json', 'utf8'));
  const terms = process.argv.slice(3);
  for (const term of terms) {
    const t = term.toLowerCase();
    const hits = catalog.filter((g) => (g.title ?? '').toLowerCase().includes(t));
    console.log(`\n=== "${term}" -> ${hits.length} hit(s)`);
    for (const h of hits.slice(0, 12)) {
      console.log(`   ${h.title.trim()}  [${h.category}]  score ${(h.rkScore ?? 0).toFixed(2)}`);
    }
  }
} else {
  console.log('usage: node catalog.mjs pull | find <terms...>');
}
