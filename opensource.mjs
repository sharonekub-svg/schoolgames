// Checks candidate open-source browser games against the GitHub API:
// real licence, still maintained, not archived. Self-hosting one is only legal
// if its licence actually says so, so we read the licence instead of guessing.
//   node opensource.mjs
import { writeFile } from 'node:fs/promises';

// Deliberately excluded: anything carrying a trademark we don't own -
// Mario, Diablo, Command & Conquer, Duck Hunt, Pac-Man. Same rule as the
// broker blocklist. A clone with its own name is fine; a clone wearing
// Nintendo's name is not.
const candidates = [
  ['gabrielecirulli/2048', 'sliding number puzzle'],
  ['Hextris/hextris', 'hexagonal falling-block arcade'],
  ['ellisonleao/clumsy-bird', 'flappy-style one-button arcade'],
  ['BKcore/HexGL', 'futuristic WebGL racer'],
  ['wwwtyro/Astray', 'WebGL 3D maze'],
  ['R74nCom/sandboxels', 'falling-sand physics sandbox'],
  ['AlexNisnevich/untrusted', 'code-your-way-out puzzle roguelike'],
  ['particle-clicker/particle-clicker', 'idle clicker set in a physics lab'],
  ['basicallydan/skifree.js', 'endless downhill skiing'],
  ['Aerolab/blockrain.js', 'falling-block puzzle'],
  ['lutzroeder/digger', 'classic dig-and-collect arcade'],
  ['dart-lang/pop-pop-win', 'minesweeper variant'],
  ['operasoftware/Emberwind', 'side-scrolling action platformer'],
  ['lostdecade/onslaught_arena', 'top-down wave survival'],
  ['Zolmeister/pond', 'physics puzzle'],
  ['Zolmeister/prism', 'light-bending puzzle'],
  ['Zolmeister/zop', 'minimal number puzzle'],
  ['sharkdp/cube-composer', 'functional programming puzzle'],
  ['bni/orbium', 'ball-rolling arcade puzzle'],
  ['cxong/Beatrix', 'rhythm puzzle'],
  ['EnclaveGames/Captain-Rogers', 'space shooter'],
  ['Couchfriends/Space-Shooter', 'arcade shooter'],
  ['Casmo/Drakonas', 'vertical scrolling shooter'],
  ['Casmo/tower-defense', 'tower defence'],
  ['jrgdiz/snake', 'snake'],
  ['budnix/ball-and-wall', 'breakout-style brick breaker'],
  ['Couchfriends/breakout', 'brick breaker'],
  ['dmcinnes/HTML5-Asteroids', 'asteroids-style shooter'],
  ['softvar/save-the-forest', 'arcade'],
  ['abagames/111-one-button-games-in-2021', '111 one-button microgames'],
  ['FreezingMoon/AncientBeast', 'turn-based tactics'],
  ['freeciv/freeciv-web', 'civilisation-style 4X strategy'],
  ['munificent/hauberk', 'roguelike'],
  ['mvasilkov/glitch2016', 'couch 2048 variant'],
  ['ondras/custom-tetris', 'configurable falling-block puzzle']
];

// SPDX ids that permit hosting a copy on your own site.
const PERMISSIVE = new Set([
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Unlicense',
  'CC0-1.0', 'MPL-2.0', 'Zlib', 'WTFPL'
]);
// Copyleft: you may host it, but you must publish your changes and keep the licence.
const COPYLEFT = new Set(['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0']);

const rows = [];
for (const [repo, blurb] of candidates) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'loadless-build' }
    });
    if (res.status === 403) {
      console.log('GitHub rate limit hit - rerun in an hour.');
      break;
    }
    if (!res.ok) {
      rows.push({ repo, blurb, licence: `HTTP ${res.status}`, verdict: 'unreachable' });
      continue;
    }
    const d = await res.json();
    const lic = d.license?.spdx_id ?? 'NONE';
    const verdict = PERMISSIVE.has(lic)
      ? 'self-host OK'
      : COPYLEFT.has(lic)
        ? 'self-host, copyleft'
        : lic === 'NONE' || lic === 'NOASSERTION'
          ? 'ASK FIRST - no licence'
          : `check: ${lic}`;
    rows.push({
      repo,
      blurb,
      licence: lic,
      stars: d.stargazers_count,
      archived: d.archived,
      updated: (d.pushed_at ?? '').slice(0, 7),
      verdict
    });
  } catch (e) {
    rows.push({ repo, blurb, licence: 'error', verdict: 'unreachable' });
  }
}

await writeFile('data/opensource.json', JSON.stringify(rows, null, 2));

const ok = rows.filter((r) => r.verdict === 'self-host OK');
const copy = rows.filter((r) => r.verdict === 'self-host, copyleft');
const ask = rows.filter((r) => r.verdict.startsWith('ASK'));

const show = (list) => {
  for (const r of list) {
    console.log(
      `  ${(r.licence ?? '').padEnd(12)} ${String(r.stars ?? '').padStart(6)}★  ${r.archived ? 'ARCHIVED ' : '         '}${(r.updated ?? '').padEnd(8)} ${r.repo}`
    );
    console.log(`  ${''.padEnd(12)} ${''.padStart(6)}   ${r.blurb}`);
  }
};

console.log(`\n=== SELF-HOST OK (${ok.length}) - permissive licence, just keep the notice`);
show(ok);
console.log(`\n=== SELF-HOST, COPYLEFT (${copy.length}) - allowed, but publish your changes`);
show(copy);
console.log(`\n=== NO LICENCE (${ask.length}) - all rights reserved by default, must ask the author`);
show(ask);
