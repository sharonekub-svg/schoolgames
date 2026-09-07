# Handoff — deploy this browser-games site

Give this whole file to the agent that has the Vercel and GitHub connections.
Everything it needs is here.

---

## What this is

A static browser-games portal. 253 curated games. No framework, no dependencies,
no `npm install` — plain Node scripts that generate HTML into `dist/`.

- **238 games** embedded from the GamePix broker, filtered to a play-score of 0.80+
- **15 games self-hosted** from this repo: 14 open-source titles under MIT/BSD/Unlicense,
  plus **Daily Five**, an original daily word game written for this site
- **262 pages**: home, 8 category sections with pagination, one page per game,
  a lazy-loaded search index, `sitemap.xml`, `robots.txt`

Every page is under ~40 KB. Total CSS + JS is 9 KB.

---

## Build it

Node 20+. Needs `tar` on PATH (built into Windows 10+, macOS and Linux).

```bash
node setup.mjs          # re-downloads the 14 open-source games (~80 MB, not in git)
node make-thumbs.mjs    # draws any missing thumbnails into src/thumbs/
node catalog.mjs pull   # GamePix catalogue -> data/catalog.json (~6,100 games)
node curate.mjs         # merge + filter -> data/games.json
node build.mjs          # -> dist/
node serve.mjs          # local check at http://localhost:4321
```

`setup.mjs` and `catalog.mjs pull` only need running once, or when refreshing content.
After that, `curate.mjs && build.mjs` is the whole loop.

`dist/` ends up around 83 MB across 2,265 files. Largest single file is 6.2 MB.

---

## Deploy to Vercel

`vercel.json` is already written: `outputDirectory: dist`, `trailingSlash: true`
(the generated URLs are directory-style, so this matters), plus cache headers.

**Do not set a build command on Vercel.** `setup.mjs` pulls ~80 MB from GitHub and
that is fragile in a build container. Build locally, deploy the output:

```bash
node curate.mjs && node build.mjs
npx vercel deploy --prod dist
```

If you would rather Vercel build it, commit `dist/` and set the output directory
to `dist` with an empty build command.

### After the first deploy — do this, it matters

The site currently has a placeholder domain. Fix it or every canonical tag and
every sitemap URL points at nothing:

1. Set `domain` in `site.config.json` to the real deployed URL, no trailing slash
   (e.g. `https://loadless.vercel.app`)
2. `node build.mjs`
3. Redeploy
4. Submit `<domain>/sitemap.xml` in Google Search Console

---

## GitHub

Safe to commit. `.gitignore` already excludes the re-downloadable parts:
`dist/`, the vendored games under `src/games/*` (except `dailyfive`), and the
broker catalogue JSON.

What is tracked is small — the scripts, the config, `src/style.css`,
`src/thumbs/*.svg` (hand-drawn, not downloadable), and `src/games/dailyfive/`
(original work).

Keep every `LICENSE` file inside `src/games/*/`. Those games are MIT, BSD-3 and
Unlicense; the licences require the notice to travel with the code. `setup.mjs`
preserves them — do not strip them to save space.

---

## Supabase is not needed

Sharon mentioned it. This site is fully static: no accounts, no server state,
no database. Daily Five keeps its streak in the visitor's own `localStorage`.

Adding Supabase would add cost and an attack surface for zero benefit. Skip it
unless a feature later genuinely needs stored server-side state — leaderboards
across devices would be the first real reason.

---

## Two things that are still missing, and they block revenue

The site works and shows ads right now. **The ad money currently goes to the
brokers' default accounts, not to Sharon.**

1. **GamePix `sid`** — `site.config.json` has `"sid": "1"`, the default account.
   Sign up at partners.gamepix.com, get the real `sid`, put it in the config,
   re-run `curate.mjs && build.mjs`.
2. **GameMonetize publisher id** — `gamemonetize.mjs` uses the generic public feed,
   which carries no publisher id at all. Regenerate the feed at
   gamemonetize.com/rss-builder with a real account.

Both signup forms ask for a live site URL, which is why deploying comes first.

**Sharon is 15.** Both accounts and any payout details need a parent as the
account holder. Do not create accounts or enter payment details on her behalf —
set up the deploy, hand back the URL, and let her and a parent do the signups.

---

## Rules the content depends on — do not quietly break these

**Never self-host a game that isn't licensed for it.** The 14 open-source games
are fine because their licences permit it. Everything else streams from the
broker's servers. Hosting broker games locally, or pulling game files from other
portals, is what gets sites in this category DMCA'd off their domains.

**The trademark blocklist is load-bearing.** `blockedTrademarks` in
`site.config.json` drops broker titles carrying franchise names someone else owns
(`Minecraft Hole IO`, `Mario 3D Shooter`, `FNAF Shooter`, and so on). GamePix
entries skip the check because that catalogue is vetted; the looser feeds do not.
A clone with its own name is legal. A clone wearing the original's name gets a
takedown sent to this domain.

**No proxy features.** Sites in this niche often bundle a web proxy to get past
school network filters. This one deliberately does not, and should not gain one.

---

## Files

| File | Job |
|---|---|
| `site.config.json` | name, domain, broker ids, quality floor, pinned titles, trademark blocklist |
| `setup.mjs` | re-downloads the self-hosted games and applies each one's fixes |
| `catalog.mjs` | pulls and searches the GamePix catalogue |
| `gamemonetize.mjs` | searches the GameMonetize catalogue |
| `opensource.mjs` | checks candidate games against the GitHub API for a real licence |
| `curate.mjs` | merges every source into the final list |
| `make-thumbs.mjs` | draws thumbnails into `src/thumbs/` |
| `build.mjs` | generates every page, the search index, sitemap and robots.txt |
| `serve.mjs` | zero-dependency local static server |
| `gen-demo.mjs` | single-file shareable preview with thumbnails inlined |
| `README.md` | the traffic experiment, the money maths, the kill criterion |
| `LICENSING.md` | every broker network checked, and how to get games they don't carry |
| `EMAILS.md` | licensing enquiry templates (four already sent) |

---

## One thing worth reading before changing the game list

`README.md` explains why there are 253 games and not 21,000. Short version: the
GamePix score distribution shows 3,367 games with a score of exactly zero and a
flat default blob between 0.70 and 0.80. Only ~250 titles are genuinely played.

Raising `maxGames` or lowering `qualityFloor` will pad the site with shovelware
and push it toward Google's scaled-content-abuse territory, which was the top
enforcement priority in the March 2026 core update. The small number is deliberate.
