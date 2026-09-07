// Merges every broker catalogue into the curated site list (data/games.json).
// Rules live in site.config.json. Run after catalog.mjs pull / the GameMonetize pull.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const cfg = JSON.parse(await readFile('site.config.json', 'utf8'));

async function load(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return [];
  }
}

const gamepix = await load('data/catalog.json');
const gamemonetize = await load('data/gm-catalog.json');

function slugify(title) {
  return title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function retag(url, sid) {
  try {
    const u = new URL(url);
    u.searchParams.set('sid', sid);
    return u.toString();
  } catch {
    return url;
  }
}

// GameMonetize uses its own category names. Fold them into ours.
const GM_CATEGORY = {
  puzzle: 'Puzzles',
  puzzles: 'Puzzles',
  adventure: 'Adventure',
  racing: 'Racing',
  sports: 'Sports',
  strategy: 'Strategy',
  shooting: 'Shooting',
  action: 'Arcade',
  arcade: 'Arcade',
  hypercasual: 'Arcade',
  clicker: 'Arcade',
  stickman: 'Arcade',
  '3d': 'Arcade',
  multiplayer: 'Arcade',
  girls: 'Junior',
  boys: 'Junior',
  cooking: 'Junior',
  dressup: 'Junior'
};

function fromGamePix(g) {
  const title = (g.title ?? '').trim();
  return {
    source: 'gamepix',
    slug: slugify(title),
    title,
    description: (g.desc_en || g.description || '').trim(),
    category: g.category || 'Arcade',
    categories: g.categories?.length ? g.categories : [g.category || 'Arcade'],
    url: retag(g.url, cfg.sid),
    thumb: g.thumbnailUrl,
    width: g.width ?? 800,
    height: g.height ?? 600,
    orientation: g.orientation ?? 'landscape',
    touch: g.touch !== false,
    keyboard: g.hwcontrols !== false,
    instructions: '',
    score: g.rkScore ?? 0
  };
}

function fromGameMonetize(g) {
  const title = (g.title ?? '').trim();
  const w = Number(g.width) || 800;
  const h = Number(g.height) || 600;
  const cat = GM_CATEGORY[String(g.category ?? '').toLowerCase().trim()] ?? 'Arcade';
  return {
    source: 'gamemonetize',
    slug: slugify(title),
    title,
    description: (g.description ?? '').trim(),
    category: cat,
    categories: [cat],
    url: g.url,
    thumb: g.thumb,
    width: w,
    height: h,
    orientation: h > w ? 'portrait' : 'landscape',
    touch: true,
    keyboard: true,
    instructions: (g.instructions ?? '').trim(),
    // This feed carries no quality score, so these only enter via `pinned`.
    score: 0
  };
}

// Franchise names owned by someone else. A clone with its own name is fine;
// a clone wearing the original's name gets our domain a DMCA notice, so any
// title carrying one of these is dropped from the loosely-vetted feed.
const blocked = (cfg.blockedTrademarks ?? []).map((s) => s.toLowerCase());
const carriesTrademark = (title) => {
  const t = title.toLowerCase();
  return blocked.find((b) => t.includes(b));
};

const excludeCat = new Set(cfg.excludeCategories ?? []);
const seen = new Set();
const out = [];
const rejected = [];

function usable(n) {
  return n.slug && n.title && n.url && n.thumb && !excludeCat.has(n.category);
}

function add(n) {
  if (!usable(n) || seen.has(n.slug)) return false;
  if (n.source !== 'gamepix') {
    const hit = carriesTrademark(n.title);
    if (hit) {
      rejected.push(`${n.title}  <- "${hit}"`);
      return false;
    }
  }
  seen.add(n.slug);
  out.push(n);
  return true;
}

// Games whose licence lets us host the files ourselves, out of src/games/.
// These load from our own domain: no broker, no third-party ads, fastest of all.
// A real screenshot beats the drawn placeholder, so use one when it exists.
function selfThumb(dir) {
  for (const ext of ['jpg', 'png']) {
    if (existsSync(`src/thumbs/${dir}.${ext}`)) return `/thumbs/${dir}.${ext}`;
  }
  return `/thumbs/${dir}.svg`;
}

function fromSelfHosted(s) {
  return {
    source: 'selfhosted',
    slug: slugify(s.title),
    title: s.title,
    description: s.description ?? '',
    category: s.category ?? 'Puzzles',
    categories: [s.category ?? 'Puzzles'],
    url: `/games/${s.dir}/`,
    thumb: selfThumb(s.dir),
    width: 800,
    height: 600,
    orientation: 'landscape',
    touch: true,
    keyboard: true,
    instructions: s.instructions ?? '',
    credit: s.credit,
    license: s.license,
    repo: s.repo,
    // Hand-picked, so they sit above everything the brokers supply.
    score: 1
  };
}

const pool = [
  ...(cfg.selfHosted ?? []).map(fromSelfHosted),
  ...gamepix.map(fromGamePix),
  ...gamemonetize.map(fromGameMonetize)
];

// Self-hosted games always make the cut.
for (const s of cfg.selfHosted ?? []) add(fromSelfHosted(s));

// Titles named in site.config.json go first, in the order written.
const pinnedLog = [];
for (const want of cfg.pinned ?? []) {
  const w = want.toLowerCase();
  const matches = pool.filter((n) => n.title.toLowerCase().includes(w)).sort((a, b) => b.score - a.score);
  if (!matches.length) {
    pinnedLog.push(`  MISSING  ${want}`);
    continue;
  }
  for (const m of matches) if (add(m)) pinnedLog.push(`  pinned   ${m.title}  [${m.source}]`);
}

// Then the scored catalogue, best first. The GameMonetize feed has no quality
// signal at all, so nothing from it gets in except by name in `pinned` above -
// otherwise it floods the site with shovelware.
const floor = cfg.qualityFloor ?? 0.8;
const rest = pool.filter((n) => n.source === 'gamepix' && n.score >= floor).sort((a, b) => b.score - a.score);
for (const n of rest) {
  if (out.length >= cfg.maxGames) break;
  add(n);
}

await writeFile('data/games.json', JSON.stringify(out, null, 2));

if (pinnedLog.length) console.log(pinnedLog.join('\n') + '\n');

const bySource = {};
const byCat = {};
for (const g of out) {
  bySource[g.source] = (bySource[g.source] ?? 0) + 1;
  byCat[g.category] = (byCat[g.category] ?? 0) + 1;
}
console.log(`curated ${out.length} games from ${pool.length} available`);
console.log('  sources:   ' + Object.entries(bySource).map(([k, v]) => `${k}: ${v}`).join('   '));
console.log('  categories:' + Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => ` ${k}: ${v}`).join('  '));
console.log(`\nblocked ${rejected.length} titles carrying someone else's trademark`);
for (const r of rejected.slice(0, 15)) console.log('  ' + r);
if (rejected.length > 15) console.log(`  ... and ${rejected.length - 15} more`);
