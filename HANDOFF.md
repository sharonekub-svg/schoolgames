# Handoff — deploy this browser-games site

Give this whole file to the agent that has the Vercel and GitHub connections.
Everything it needs is here.

---

## What this is

A static browser-games portal. 477 curated games. No framework, no dependencies,
no `npm install` — plain Node scripts that generate HTML into `dist/`.

- **249 games** embedded from the GamePix broker, filtered to a play-score of 0.80+
- **213 games** embedded from Playgama, a hand-picked list carrying the `playgamaClid`
  partner id from `site.config.json`
- **15 games self-hosted** from this repo: 14 open-source titles under MIT/BSD/Unlicense,
  plus **Daily Five**, an original daily word game written for this site
- **478 pages**: home (a Popular strip, then every game), one page per game, a
  lazy-loaded search index, `sitemap.xml`, `robots.txt`

`featured` in `site.config.json` names the games in the top strip, in order, and
`featuredCount` caps it. A name matching nothing is skipped rather than fatal.

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

`npm run build` is `setup.mjs && make-thumbs.mjs && build.mjs` — the three steps a
deploy needs. It deliberately leaves `curate.mjs` out: see the warning below.

### Do not run `curate.mjs` without the catalogues

`curate.mjs` rebuilds `data/games.json` from scratch out of the source catalogues.
`data/playgama.json` is committed, but `data/catalog.json` (GamePix) is not — it is
re-downloadable, so it is gitignored. Running `curate.mjs` on a fresh clone would
therefore drop all 249 GamePix games.

It now refuses to: any run that would shrink the list by more than 10% aborts and
prints what is missing. `node catalog.mjs pull` first, then curate. `--force` writes
anyway, when the shrink is what you actually wanted.

`setup.mjs` and `catalog.mjs pull` only need running once, or when refreshing content.
After that, `curate.mjs && build.mjs` is the whole loop.

`dist/` ends up around 88 MB. Most of it is the 14 vendored games.

---

## Deploy to Vercel

`vercel.json` is already written: `outputDirectory: dist`, `trailingSlash: true`
(the generated URLs are directory-style, so this matters), and cache headers. It
carries the build command too, so importing the repo at
vercel.com/new is the whole deploy — no CLI, no token, no settings to fill in:

| Vercel setting | Value | Where it comes from |
|---|---|---|
| Framework preset | Other | no framework here |
| Build command | `node setup.mjs && node make-thumbs.mjs && node build.mjs` | `vercel.json` |
| Install command | `echo "no dependencies"` | `vercel.json` |
| Output directory | `dist` | `vercel.json` |

`setup.mjs` pulls ~80 MB from codeload.github.com during the build. That is the
price of not committing 14 vendored games; it takes well under a minute.

Check the **production branch** in Settings → Git. Vercel defaults to the repo's
default branch, which is not necessarily the branch carrying the latest work.

### The domain takes care of itself

`build.mjs` reads the host in this order:

1. `SITE_DOMAIN` — set it for a custom domain or a one-off build
2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel sets this itself, so canonicals and
   `sitemap.xml` are right from the first deploy, even after a project rename
3. `domain` in `site.config.json` — the local-preview fallback

A `domain` with a path (`https://user.github.io/schoolgames`) makes every internal
link carry that prefix, for a subpath host like GitHub Pages. A bare host adds none.

After the first deploy, submit `<domain>/sitemap.xml` in Google Search Console.

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

Playgama is the exception: `playgamaClid` in `site.config.json` is already a real
partner id, so those 213 games credit the right account.

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
(`Minecraft Hole IO`, `Mario 3D Shooter`, `FNAF Shooter`, and so on). GamePix and
Playgama entries skip the check because both catalogues are vetted and carry the
real licensed titles under their real names; the looser feeds do not.
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
| `curate.mjs` | merges every source into the final list (refuses to shrink it >10%) |
| `data/playgama.json` | the hand-picked Playgama catalogue — committed, unlike the GamePix one |
| `package.json` | `npm run build` / `curate` / `serve`; no dependencies |
| `make-thumbs.mjs` | draws thumbnails into `src/thumbs/` |
| `shoot-thumbs.mjs` | optional: screenshots the self-hosted games for their thumbnails (needs Playwright) |
| `check-games.mjs` | loads every game in a real browser, reports the broken ones |
| `build.mjs` | generates every page, the search index, sitemap and robots.txt |
| `serve.mjs` | zero-dependency local static server |
| `gen-demo.mjs` | single-file shareable preview with thumbnails inlined |
| `README.md` | the traffic experiment, the money maths, the kill criterion |
| `LICENSING.md` | every broker network checked, and how to get games they don't carry |
| `EMAILS.md` | licensing enquiry templates (four already sent) |

---

## One thing worth reading before changing the game list

`README.md` explains why there are 477 games and not 21,000. Short version: the
GamePix score distribution shows 3,367 games with a score of exactly zero and a
flat default blob between 0.70 and 0.80. Only ~250 titles are genuinely played.

Raising `maxGames` or lowering `qualityFloor` will pad the site with shovelware
and push it toward Google's scaled-content-abuse territory, which was the top
enforcement priority in the March 2026 core update. The small number is deliberate.
