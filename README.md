# Loadless

Static browser-games site. 477 legally-licensed games: 249 via the GamePix publisher
feed, 213 via Playgama, 15 self-hosted under open-source licences.
No dependencies, no framework, no database. Builds to plain HTML.

The bet: every competitor in this niche is slow and covered in ad vomit.
Being the fast clean one is the entire product.

## Commands

```bash
node setup.mjs              # re-download the 14 self-hosted games (not in git)
node catalog.mjs pull       # GamePix catalogue   -> data/catalog.json    (6,119)
node gamemonetize.mjs find  # search the GameMonetize catalogue           (15,000)
node curate.mjs             # merge + filter all  -> data/games.json
node build.mjs              # data/games.json     -> dist/
node serve.mjs              # preview at http://localhost:4321
node gen-demo.mjs 120       # single-file shareable preview -> demo.html

npm run build               # setup + thumbs + build: what the deploy runs
```

`curate.mjs` rebuilds `data/games.json` from the source catalogues, and
`data/catalog.json` (GamePix) is gitignored — so on a fresh clone it would drop
249 games. It refuses any run that shrinks the list by more than 10%; pull the
catalogue first, or pass `--force` if the shrink is deliberate.

Searching the catalogues before pinning a game:

```bash
node catalog.mjs find "moto x3m" "penalty"
node gamemonetize.mjs find "bloxorz"
```

## Files

| File | Job |
|---|---|
| `site.config.json` | name, domain, IDs, game count, filters, pinned titles, trademark blocklist |
| `catalog.mjs` | pulls + searches the GamePix catalogue |
| `data/playgama.json` | the hand-picked Playgama catalogue (committed) |
| `gamemonetize.mjs` | searches the GameMonetize catalogue |
| `curate.mjs` | merges every source into the final list; won't shrink it >10% |
| `build.mjs` | generates every page, search index, sitemap, robots.txt |
| `src/style.css` | all styling |
| `data/games.json` | the curated list (edit by hand to hand-pick) |
| `dist/` | what you deploy — generated, don't edit |
| `LICENSING.md` | how to get games the brokers don't carry |

## Output

- `/` — every game on one page
- `/g/<slug>/` — one page per game, unique title + meta description + `VideoGame` JSON-LD
- `search.json` — site-wide search index, fetched on the first keystroke only
- `sitemap.xml`, `robots.txt`

Every page stays under ~40 KB. CSS + JS is 9 KB. Games load on click, not on page
load — the page stays fast and a click counts as a real session for ad revenue.

## Why there are 477 games and not 21,000

The GamePix catalogue carries a play-ranking score. Its distribution is the whole story:

| Score | Games |
|---|---|
| 0.90+ | 1 |
| 0.85 – 0.90 | 40 |
| 0.80 – 0.85 | 210 |
| 0.70 – 0.80 | 2,466 |
| below 0.70 | 35 |
| **exactly zero** | **3,367** |

More than half the catalogue has never been meaningfully played, and the 2,466 in the
0.70–0.80 band are a flat default blob, not a real ranking. The genuinely played games
are the ~250 above 0.80. `qualityFloor` in the config is that line.

The GameMonetize feed carries **no quality score at all**, which is why nothing from it
enters except titles you name explicitly in `pinned`. Left unfiltered it floods the site
with shovelware.

This is also an SEO decision. Scaled content abuse was Google's top enforcement priority
in the March 2026 core update, and sites publishing thousands of thin templated pages
took 50–80% traffic drops. Volume itself is fine — undifferentiated volume is not.
4,000 pages built from the same broker descriptions every rival portal also publishes is
exactly the wrong shape. 477 pages with real per-game specs is the right one.

Playgama has no score in its feed either, so its 213 titles are a hand-picked list
kept in `data/playgama.json` rather than a filtered dump.

Curation is the product. Every competitor dumps ten thousand junk games. Being the site
where everything is worth clicking is the only edge available here.

## The trademark blocklist

`blockedTrademarks` in the config drops any GameMonetize title carrying a franchise
name owned by someone else — `Minecraft Hole IO`, `Mario 3D Shooter`, `FNAF Shooter`
and so on. GamePix and Playgama entries skip the check: both catalogues are vetted
and carry the real licensed titles under their real names.

A clone with its own name is legal. A clone wearing the original's name gets a DMCA
notice sent to **your** domain, not the broker's. Keep the list, and add to it
whenever you spot a new one.

## Before you launch

1. **Get your publisher IDs. Without these you earn nothing.**

   Games already show ads — verified, a pre-roll ran on a GameMonetize title.
   That revenue currently goes to the default account, not to you.

   - **GamePix** (partners.gamepix.com) — get your `sid`, put it in
     `site.config.json`. It is `"1"` right now, which is the default account.
   - **GameMonetize** (gamemonetize.com/rss-builder) — the feed in
     `gamemonetize.mjs` is the generic public one and carries no publisher ID.
     Sign up, regenerate the feed with your own ID, and point the script at it.

   Then re-run `curate.mjs` and `build.mjs`.

   You are 15, so both accounts and any payout details need a parent as the
   account holder.
2. **Pick a real name and buy the domain.** Update `siteName` and `domain` in the config,
   then rebuild so canonicals and the sitemap point at the real host.
3. **Deploy** — import the repo at vercel.com/new. `vercel.json` already carries the
   build command and output directory, so there is nothing to configure. The
   deployed URL is picked up automatically for canonicals and the sitemap.
4. **Google Search Console** — add the property, submit `sitemap.xml`. Day one.
   This is the only instrument that tells you whether the experiment is working.

## The 30-day test

Do not add ads yet. Ads on a site with no traffic just make it slow and ugly.

Watch Search Console impressions and clicks:

| Day 30 result | What it means |
|---|---|
| Impressions climbing, some clicks | Working. Add more games, keep going. |
| Impressions, zero clicks | Titles/descriptions are weak. Rewrite, retest. |
| Flat zero | Kill it. Cost you a weekend. |

## The money math — know this going in

Game sites pay roughly **$1–2 per 1000 sessions**.

| Sessions/month | Revenue |
|---|---|
| 10,000 | $10–20 |
| 100,000 | $100–200 |
| 1,000,000 | $1,000–2,000 |

**Below ~50k sessions/month this is not worth your time.** This is a volume business
with no clever shortcut. Totally Science needed ~5M users to make real money.

Monetise only after traffic exists: GamePix revenue share (45%) is already wired in
via your `sid`. AdSense H5 Games Ads on top, then game-native networks
(AdinPlay, Venatus, Playwire) if you ever get big enough to matter.

## Rules that keep the site alive

- **Never self-host games you don't own.** That is what gets these sites DMCA'd off
  their domains. The only 15 files served from this domain are the open-source
  titles whose licences allow it, plus Daily Five, which is ours. Everything else
  streams from GamePix's or Playgama's servers under their publisher terms.
- **No proxy features.** Punching through school network filters is what draws
  legal heat, ad-network bans, and the malware reputation the whole category carries.
  Not building it is a feature, not a limitation.
- **Stay fast.** The moment this site is as slow as the competition, it has no reason
  to exist.
