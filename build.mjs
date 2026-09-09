// Static site generator. Reads data/games.json -> writes dist/.
// No dependencies. Run: node build.mjs
import { readFile, writeFile, mkdir, rm, copyFile, cp } from 'node:fs/promises';
import path from 'node:path';

const cfg = JSON.parse(await readFile('site.config.json', 'utf8'));
const games = JSON.parse(await readFile('data/games.json', 'utf8'));
const OUT = 'dist';

// Where this build will actually be served. Vercel names the production host at
// build time, so a deploy gets correct canonicals and sitemap without anyone
// remembering to edit the config after renaming the project. SITE_DOMAIN wins
// over both, for a preview build or a custom domain.
cfg.domain = (
  process.env.SITE_DOMAIN ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  cfg.domain
).replace(/\/+$/, '');
console.log(`domain: ${cfg.domain}`);

// A subpath deploy (GitHub Pages serves this repo under /schoolgames/) needs
// every internal link prefixed. Taken from `domain`, so a bare host needs none.
const BASE = new URL(cfg.domain).pathname.replace(/\/+$/, '');
const link = (u) => (String(u).startsWith('/') ? BASE + u : u);
const YEAR = new Date().getFullYear();

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Search engines truncate around 155 chars; write to that, don't pad.
function clamp(text, max) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(' ', max - 1)).trim() + '...';
}

function layout({ title, description, canonical, body, jsonld, image, prev, next }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${prev ? `<link rel="prev" href="${esc(prev)}">` : ''}
${next ? `<link rel="next" href="${esc(next)}">` : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="${esc(cfg.accent)}">
<link rel="preconnect" href="https://games.assets.gamepix.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&display=swap">
<link rel="stylesheet" href="${BASE}/assets/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="logo" href="${BASE}/">${esc(cfg.siteName)}<span>.</span></a>
  <input class="search" id="q" type="search" placeholder="Search ${games.length} games" autocomplete="off" aria-label="Search games">
</div></header>
<main>
  <div class="wrap"><div id="results" class="results" hidden></div></div>
  <div id="page">${body}</div>
</main>
<footer class="site-footer"><div class="wrap">
  <span>&copy; ${YEAR} ${esc(cfg.siteName)}</span>
  <span>Games provided by GamePix and GameMonetize</span>
  <span class="spacer"><a href="${BASE}/">All games</a></span>
</div></footer>
<script src="${BASE}/assets/app.js" defer></script>
</body>
</html>`;
}

function card(g) {
  return `<a class="card" href="${BASE}/g/${g.slug}/">
  <img class="shot" src="${esc(link(g.thumb))}" alt="${esc(g.title)}" width="250" height="250" loading="lazy" decoding="async">
  <div class="meta"><div class="name">${esc(g.title)}</div></div>
</a>`;
}

const grid = (list) =>
  list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<p class="empty">No games here yet.</p>`;

async function page(dir, html) {
  const full = path.join(OUT, dir);
  await mkdir(full, { recursive: true });
  await writeFile(path.join(full, 'index.html'), html);
}

// ---- build ----

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, 'assets'), { recursive: true });
await copyFile('src/style.css', path.join(OUT, 'assets/style.css'));

// Self-hosted games ship with the site, licence file and all.
try {
  await cp('src/games', path.join(OUT, 'games'), { recursive: true });
} catch {
  // no self-hosted games yet - run `node setup.mjs`
}
try {
  await cp('src/thumbs', path.join(OUT, 'thumbs'), { recursive: true });
} catch {
  // no thumbnails yet - run `node make-thumbs.mjs`
}

const urls = [];
const track = (u) => urls.push(`${cfg.domain}${u}`);

// The strip at the top of the home page. `featured` in the config names those
// games in order; a name that matches nothing is skipped rather than fatal, so
// the row survives a game leaving the catalogue. Everything below it falls back
// to the GamePix play-score, which is the only popularity signal the data
// carries - Playgama and the self-hosted games have none, so sorting on it is
// stable and leaves their curated order alone.
const featuredNames = (cfg.featured ?? cfg.pinned ?? []).map((t) => t.toLowerCase());
const featureRank = (g) => {
  const t = g.title.toLowerCase();
  const i = featuredNames.findIndex((f) => t.includes(f));
  return i === -1 ? Infinity : i;
};
const popular = games
  .filter((g) => featureRank(g) !== Infinity)
  .sort((a, b) => featureRank(a) - featureRank(b) || (b.score ?? 0) - (a.score ?? 0))
  .slice(0, cfg.featuredCount ?? 24);
const listed = [...games].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
console.log(`popular: ${popular.length} games in the top strip`);

// Home - the whole catalogue on one page. No categories, no pagination.
await page(
  '.',
  layout({
    title: `${cfg.siteName} - ${cfg.tagline}`,
    description: cfg.description,
    canonical: `${cfg.domain}/`,
    body: `<div class="wrap">
  <section class="hero">
    <h1>${esc(cfg.tagline)}</h1>
    <p>${esc(cfg.description)}</p>
  </section>
  ${
    popular.length
      ? `<div class="section-head"><h2>Popular</h2><span class="count">start here</span></div>
  ${grid(popular)}`
      : ''
  }
  <div class="section-head"><h2>All games</h2><span class="count">${games.length} games</span></div>
  ${grid(listed)}
</div>`
  })
);
track('/');

// Game pages
for (const g of games) {
  const related = games.filter((r) => r.slug !== g.slug).slice(0, 12);
  const url = `/g/${g.slug}/`;
  const portrait = g.orientation === 'portrait';
  const blurb = g.description || `Play ${g.title} free in your browser.`;

  await page(
    `g/${g.slug}`,
    layout({
      title: `${g.title} - play free, no download | ${cfg.siteName}`,
      description: clamp(`Play ${g.title} free in your browser. ${blurb}`, 155),
      canonical: `${cfg.domain}${url}`,
      image: link(g.thumb),
      jsonld: {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: g.title,
        url: `${cfg.domain}${url}`,
        image: link(g.thumb),
        description: clamp(blurb, 300),
        genre: g.categories,
        playMode: 'SinglePlayer',
        applicationCategory: 'Game',
        gamePlatform: 'Web browser',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      },
      body: `<div class="wrap">
  <nav class="crumbs"><a href="${BASE}/">All games</a> / ${esc(g.title)}</nav>

  <div class="stage${portrait ? ' portrait' : ''}" id="stage" data-src="${esc(link(g.url))}" data-title="${esc(g.title)}">
    <button class="poster" id="poster" type="button">
      <img class="bg" src="${esc(link(g.thumb))}" alt="" aria-hidden="true">
      <img class="icon" src="${esc(link(g.thumb))}" alt="${esc(g.title)}" width="104" height="104">
      <span class="play">&#9654; Play ${esc(g.title)}</span>
    </button>
  </div>

  <div class="game-bar">
    <h1>${esc(g.title)}</h1>
    <button class="btn-ghost" id="fs" type="button">Fullscreen</button>
  </div>

  <section class="about">
    <h2>About ${esc(g.title)}</h2>
    <p>${esc(blurb)}</p>
    ${g.instructions ? `<h2>How to play</h2><p>${esc(g.instructions)}</p>` : ''}
    <dl class="specs">
      <div><dt>Controls</dt><dd>${esc(
        [g.keyboard ? 'Keyboard and mouse' : null, g.touch ? 'Touchscreen' : null]
          .filter(Boolean)
          .join(' / ') || 'Mouse'
      )}</dd></div>
      <div><dt>Plays best</dt><dd>${portrait ? 'Portrait - phones' : 'Landscape - desktop and tablet'}</dd></div>
      <div><dt>Install</dt><dd>Nothing to download</dd></div>
      <div><dt>Price</dt><dd>Free</dd></div>
    </dl>
    ${
      g.repo
        ? `<p class="credit">Made by <strong>${esc(g.credit)}</strong>, released under the ${esc(
            g.license
          )} licence and hosted here from <a href="${esc(g.repo)}" rel="noopener">source</a>. Runs on this domain - no third-party ads, no tracking.</p>`
        : g.credit
          ? `<p class="credit"><strong>Original game</strong>, written for this site. Runs on this domain - no third-party ads, no tracking, and nowhere else has it.</p>`
          : ''
    }
  </section>

  ${related.length ? `<div class="section-head"><h2>More games</h2></div>${grid(related)}` : ''}
</div>`
    })
  );
  track(url);
}

// Search index - fetched on the first keystroke, never on page load.
await writeFile(
  path.join(OUT, 'search.json'),
  JSON.stringify(games.map((g) => [g.slug, g.title]))
);

const app = `document.addEventListener('DOMContentLoaded', function () {
  var q = document.getElementById('q');
  var results = document.getElementById('results');
  var pageEl = document.getElementById('page');
  var index = null;
  var loading = false;

  function render(term) {
    if (!term) {
      results.hidden = true;
      pageEl.hidden = false;
      return;
    }
    pageEl.hidden = true;
    results.hidden = false;

    if (!index) {
      results.innerHTML = '<p class="empty">Loading search...</p>';
      return;
    }

    var t = term.toLowerCase();
    var hits = [];
    for (var i = 0; i < index.length && hits.length < 200; i++) {
      if (index[i][1].toLowerCase().indexOf(t) > -1) hits.push(index[i]);
    }

    if (!hits.length) {
      results.innerHTML = '<p class="empty">Nothing matches "' + term.replace(/[<>&]/g, '') + '".</p>';
      return;
    }

    var html = '<div class="section-head"><h2>Search</h2><span class="count">' + hits.length + (hits.length === 200 ? '+' : '') + '</span></div><ul class="hits">';
    for (var j = 0; j < hits.length; j++) {
      html += '<li><a href="${BASE}/g/' + hits[j][0] + '/"><span class="hit-name"></span></a></li>';
    }
    results.innerHTML = html + '</ul>';
    // Titles go in as text, never as markup.
    var names = results.querySelectorAll('.hit-name');
    for (var k = 0; k < names.length; k++) names[k].textContent = hits[k][1];
  }

  function load() {
    if (index || loading) return;
    loading = true;
    fetch('${BASE}/search.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; render(q.value.trim()); })
      .catch(function () { results.innerHTML = '<p class="empty">Search is unavailable.</p>'; });
  }

  if (q && results && pageEl) {
    q.addEventListener('input', function () {
      var term = q.value.trim();
      if (term) load();
      render(term);
    });
  }

  var stage = document.getElementById('stage');
  var poster = document.getElementById('poster');
  if (stage && poster) {
    poster.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = stage.dataset.src;
      f.title = stage.dataset.title;
      f.allow = 'autoplay; fullscreen; gamepad; clipboard-write';
      f.setAttribute('allowfullscreen', '');
      stage.appendChild(f);
      poster.remove();
    });
  }

  var fs = document.getElementById('fs');
  if (fs && stage) {
    fs.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen();
    });
  }
});
`;
await writeFile(path.join(OUT, 'assets/app.js'), app);

// GitHub Pages: keep _-prefixed paths, and serve a 404 for unknown URLs.
await writeFile(path.join(OUT, '.nojekyll'), '');
await writeFile(
  path.join(OUT, '404.html'),
  layout({
    title: `Page not found | ${cfg.siteName}`,
    description: 'That page does not exist.',
    canonical: `${cfg.domain}/404.html`,
    body: `<div class="wrap"><section class="hero"><h1>Page not found</h1><p>That page does not exist. <a href="${BASE}/">Back to all games</a>.</p></section></div>`
  })
);

await writeFile(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`
);
await writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.domain}/sitemap.xml\n`);

console.log(`built ${urls.length} pages -> ${OUT}/`);
console.log(`  ${games.length} games on one page`);
