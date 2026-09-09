// One-shot setup: re-downloads every self-hosted game and applies the fixes
// each one needs. The games are not committed to this repo - only the original
// work is (Daily Five, the thumbnails, the scripts).
//
//   node setup.mjs
//
// Needs `tar` on PATH (built into Windows 10+, macOS and Linux).
import { mkdir, rm, rename, readdir, access, cp, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const run = promisify(execFile);
const GAMES = 'src/games';

// repo, target dir, branch, and the surgery each one needs afterwards.
const SOURCES = [
  { repo: 'gabrielecirulli/2048', dir: '2048', branch: 'master', drop: ['CONTRIBUTING.md', 'Rakefile'] },
  // bkcore.coffee LOOKS like CoffeeScript source but holds .js files loaded at
  // runtime. Deleting it breaks the game. Only package.zip is safe to remove.
  { repo: 'BKcore/HexGL', dir: 'hexgl', branch: 'master', drop: ['package.zip'] },
  { repo: 'wwwtyro/Astray', dir: 'astray', branch: 'master' },
  { repo: 'basicallydan/skifree.js', dir: 'skifree', branch: 'master' },
  { repo: 'particle-clicker/particle-clicker', dir: 'particle-clicker', branch: 'master' },
  { repo: 'dmcinnes/HTML5-Asteroids', dir: 'asteroids', branch: 'master' },
  { repo: 'Casmo/Drakonas', dir: 'drakonas', branch: 'master', drop: ['editor', '_locales'] },
  { repo: 'ondras/custom-tetris', dir: 'blockfall', branch: 'master' },
  { repo: 'Casmo/tower-defense', dir: 'towerdefense', branch: 'master' },
  { repo: 'Couchfriends/Space-Shooter', dir: 'spaceshooter', branch: 'master', flatten: 'build' },
  { repo: 'Couchfriends/breakout', dir: 'breakout', branch: 'master', flatten: 'build' },
  // The repo ships neither bower_components/ nor the grunt-built
  // dist/output.min.js, so its index.html loads a bundle that does not exist
  // and the game hangs on its loading spinner forever. index_dev.html loads
  // js/app/* directly - all of which is committed - and needs only the four
  // libraries bower would have fetched. Each comes straight from its own
  // source, licence file included, so there is still no build step here.
  {
    repo: 'budnix/ball-and-wall', dir: 'ballwall', branch: 'master',
    rename: ['index_dev.html', 'index.html'],
    vendor: [
      { repo: 'jquery/jquery-dist', ref: 'refs/tags/2.1.4', from: 'dist/jquery.min.js',
        to: 'bower_components/jquery/dist/jquery.min.js', license: 'MIT-LICENSE.txt' },
      { repo: 'kriskowal/q', ref: 'refs/tags/v1.0.1', from: 'q.js',
        to: 'bower_components/q/q.js', license: 'LICENSE' },
      { repo: 'emn178/js-md5', ref: 'refs/tags/v0.7.3', from: 'build/md5.min.js',
        to: 'bower_components/js-md5/js/md5.min.js', license: 'LICENSE.txt' },
      { repo: 'octopuscreative/FancySelect', ref: 'refs/heads/master', from: 'fancySelect.js',
        to: 'bower_components/fancyselect/fancySelect.js', license: 'LICENSE' }
    ],
    // aral.github.com has been dead for years, and it is a third-party request
    // from our domain on every single load.
    strip: [/<a[^>]*class="fork-me"[\s\S]*?<\/a>/g]
  },
  { repo: 'jrgdiz/snake', dir: 'snake', branch: 'master', rename: ['index.htm', 'index.html'] },
  { repo: 'cxong/Beatrix', dir: 'beatrix', branch: 'master' }
];

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

// Pulls one file out of another repo's tarball. For the handful of games whose
// dependencies were never committed alongside them.
async function vendor(target, v) {
  const tmp = path.join(GAMES, `.vendor-${path.basename(v.to)}`);
  const tgz = `${tmp}.tar.gz`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });

  const res = await fetch(`https://codeload.github.com/${v.repo}/tar.gz/${v.ref}`);
  if (!res.ok) throw new Error(`${v.repo}: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tgz));
  await run('tar', ['xzf', tgz, '-C', tmp]);
  await rm(tgz, { force: true });

  const inner = path.join(tmp, (await readdir(tmp))[0]);
  const dest = path.join(target, v.to);
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(path.join(inner, v.from), dest);

  // These are MIT libraries; the licence has to travel with the code. It goes
  // at the package root (bower_components/<pkg>/), not next to the file, so
  // two packages cannot overwrite each other's.
  if (v.license && (await exists(path.join(inner, v.license)))) {
    const pkgRoot = path.join(target, ...v.to.split('/').slice(0, 2));
    await cp(path.join(inner, v.license), path.join(pkgRoot, 'LICENSE')).catch(() => {});
  }
  await rm(tmp, { recursive: true, force: true });
}

async function fetchRepo(s) {
  const target = path.join(GAMES, s.dir);

  // Never clobber Daily Five or a thumbnail we drew.
  if (await exists(path.join(target, 'index.html')) && s.dir !== '2048') {
    const thumb = path.join(target, 'thumb.svg');
    if (await exists(thumb)) { console.log(`  have    ${s.dir}`); return; }
  }

  const tmp = path.join(GAMES, `.tmp-${s.dir}`);
  const tgz = path.join(GAMES, `.${s.dir}.tar.gz`);
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });

  const url = `https://codeload.github.com/${s.repo}/tar.gz/refs/heads/${s.branch}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${s.repo}: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tgz));

  await run('tar', ['xzf', tgz, '-C', tmp]);
  await rm(tgz, { force: true });

  const inner = (await readdir(tmp))[0];
  let src = path.join(tmp, inner);

  // Some repos ship the playable build in a subfolder.
  if (s.flatten) {
    const built = path.join(src, s.flatten);
    if (await exists(built)) {
      for (const lic of ['LICENSE', 'LICENSE.txt', 'license.md']) {
        if (await exists(path.join(src, lic))) {
          await cp(path.join(src, lic), path.join(built, lic)).catch(() => {});
        }
      }
      src = built;
    }
  }

  // Keep whatever thumb.svg we already drew.
  const keptThumb = path.join(target, 'thumb.svg');
  const hadThumb = await exists(keptThumb);
  let stash = null;
  if (hadThumb) {
    stash = path.join(GAMES, `.thumb-${s.dir}.svg`);
    await cp(keptThumb, stash);
  }

  await rm(target, { recursive: true, force: true });
  await rename(src, target);
  await rm(tmp, { recursive: true, force: true });

  if (stash) { await cp(stash, keptThumb); await rm(stash, { force: true }); }

  for (const d of s.drop ?? []) await rm(path.join(target, d), { recursive: true, force: true });
  if (s.rename) {
    const [from, to] = s.rename;
    if (await exists(path.join(target, from))) {
      await rename(path.join(target, from), path.join(target, to));
    }
  }

  for (const v of s.vendor ?? []) {
    await vendor(target, v);
    console.log(`    vendored ${v.to}  (${v.repo})`);
  }

  for (const re of s.strip ?? []) {
    const html = path.join(target, 'index.html');
    if (await exists(html)) await writeFile(html, (await readFile(html, 'utf8')).replace(re, ''));
  }

  console.log(`  fetched ${s.dir}`);
}

console.log(`Fetching ${SOURCES.length} open-source games into ${GAMES}/\n`);
for (const s of SOURCES) {
  try { await fetchRepo(s); }
  catch (e) { console.log(`  FAILED  ${s.dir}: ${e.message}`); }
}

console.log('\nNext:');
console.log('  node make-thumbs.mjs      # draws any missing thumbnails');
console.log('  node catalog.mjs pull     # GamePix catalogue -> data/catalog.json');
console.log('  node curate.mjs           # merge + filter -> data/games.json');
console.log('  node build.mjs            # -> dist/');
