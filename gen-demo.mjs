// Builds a single-file demo page (thumbnails inlined as data URIs) so the site
// can be viewed on a host that blocks third-party images. Games open on GamePix.
import { readFile, writeFile } from 'node:fs/promises';

const games = JSON.parse(await readFile('data/games.json', 'utf8'));
const cfg = JSON.parse(await readFile('site.config.json', 'utf8'));
const LIMIT = Number(process.argv[2] ?? 80);
const picked = games.slice(0, LIMIT);

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let bytes = 0;
for (const g of picked) {
  let buf, type;
  if (g.thumb.startsWith('/')) {
    // Self-hosted game: the thumbnail is a local file, not a remote URL.
    buf = await readFile('src' + g.thumb.replace('/games/', '/games/'));
    type = g.thumb.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
    bytes += buf.length;
    g.data = `data:${type};base64,${buf.toString('base64')}`;
    continue;
  }
  const res = await fetch(g.thumb);
  buf = Buffer.from(await res.arrayBuffer());
  bytes += buf.length;
  g.data = `data:${res.headers.get('content-type') ?? 'image/png'};base64,${buf.toString('base64')}`;
  process.stdout.write(`  inlined ${picked.indexOf(g) + 1}/${picked.length}\r`);
}
console.log(`\nthumbnails: ${(bytes / 1e6).toFixed(2)} MB raw`);

const cats = [...new Set(picked.map((g) => g.category))].sort();

const cards = picked
  .map(
    (g) => `<a class="card" href="${esc(g.url.startsWith('/') ? g.repo : g.url)}" target="_blank" rel="noopener"
  data-name="${esc(g.title.toLowerCase())}" data-cat="${esc(g.category.toLowerCase())}">
  <img class="shot" src="${g.data}" alt="${esc(g.title)}" width="250" height="250" loading="lazy" decoding="async">
  <div class="meta"><div class="name">${esc(g.title)}</div><div class="cat">${esc(g.category)}</div></div>
</a>`
  )
  .join('');

const css = await readFile('src/style.css', 'utf8');

const html = `<title>${esc(cfg.siteName)}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&display=swap">
<style>
${css}
.note { margin: 0 0 26px; padding: 12px 16px; border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 8px; background: var(--surface); color: var(--muted); font-size: 14px; max-width: 70ch; }
.note b { color: var(--text); }
</style>

<header class="site-header"><div class="wrap">
  <a class="logo" href="#">${esc(cfg.siteName)}<span>.</span></a>
  <input class="search" id="q" type="search" placeholder="Search games" autocomplete="off" aria-label="Search games">
  <nav class="nav">${cats.map((c) => `<a href="#" data-filter="${esc(c.toLowerCase())}">${esc(c)}</a>`).join('')}</nav>
</div></header>

<main><div class="wrap">
  <section class="hero">
    <h1>${esc(cfg.tagline)}</h1>
    <p>${esc(cfg.description)}</p>
  </section>

  <p class="note"><b>Preview.</b> ${picked.length} of ${games.length} games, thumbnails baked in.
  Tapping a game opens it at its source - on the real site everything plays inline, no new tab.</p>

  <div class="section-head"><h2>All games</h2><span class="count">${picked.length}</span></div>
  <div class="grid" id="grid">${cards}</div>
</div></main>

<footer class="site-footer"><div class="wrap">
  <span>&copy; ${new Date().getFullYear()} ${esc(cfg.siteName)}</span>
  <span>GamePix, GameMonetize, and open source</span>
</div></footer>

<script>
(function () {
  var q = document.getElementById('q');
  var grid = document.getElementById('grid');
  var cards = Array.prototype.slice.call(grid.children);
  var filter = '';

  function apply() {
    var term = q.value.trim().toLowerCase();
    cards.forEach(function (c) {
      var okText = !term || c.dataset.name.indexOf(term) > -1 || c.dataset.cat.indexOf(term) > -1;
      var okCat = !filter || c.dataset.cat === filter;
      c.style.display = okText && okCat ? '' : 'none';
    });
  }

  q.addEventListener('input', apply);
  document.querySelectorAll('[data-filter]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      filter = filter === a.dataset.filter ? '' : a.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(function (x) {
        x.removeAttribute('aria-current');
      });
      if (filter) a.setAttribute('aria-current', 'page');
      apply();
    });
  });
})();
</script>
`;

await writeFile('demo.html', html);
console.log(`demo.html: ${((await readFile('demo.html')).length / 1e6).toFixed(2)} MB`);
