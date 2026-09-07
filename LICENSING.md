# Getting the games you actually want

Five routes, best first. Route 3 is what Friv itself does.

---

## Route 0 — Open source games you host yourself

The only route that gives you games **no competitor has**, with zero broker cut,
zero third-party ads, and the fastest load on the site because the files come off
your own domain.

`node opensource.mjs` checks candidates against the GitHub API and reads the real
licence rather than guessing. Current results: **21 games clear to self-host.**

Already wired up as proof: **2048** (MIT, Gabriele Cirulli) at `/g/2048/`.
It runs from `src/games/2048/`, ships with its `LICENSE.txt`, and credits the
author on the page.

### The 21 that cleared

| Licence | Game | What it is |
|---|---|---|
| MIT | 2048 | sliding number puzzle — **already live** |
| MIT | HexGL | futuristic WebGL racer |
| Unlicense | Astray | WebGL 3D maze |
| MIT | particle-clicker | idle clicker in a physics lab |
| MIT | skifree.js | endless downhill skiing |
| MIT | blockrain.js | falling-block puzzle |
| BSD-3 | pop-pop-win | minesweeper variant |
| MIT | cube-composer | functional programming puzzle |
| MIT | Drakonas | vertical scrolling shooter |
| MIT | tower-defense | tower defence |
| MIT | HTML5-Asteroids | asteroids-style shooter |
| MIT | Space-Shooter | arcade shooter |
| MIT | ball-and-wall, breakout | brick breakers |
| MIT | snake | snake |
| BSD-3 | custom-tetris | configurable falling-block puzzle |
| MIT | Beatrix, prism, zop | small puzzles |
| MIT | save-the-forest | arcade |
| MIT | 111 one-button games | 111 microgames in one repo |

Copyleft — allowed, but you must publish your changes and keep the licence:
clumsy-bird (GPL-3, archived), orbium (GPL-2), AncientBeast (AGPL-3).

**11 candidates had no licence at all** — Hextris, sandboxels, untrusted, digger,
Emberwind, onslaught_arena, pond, Captain-Rogers, freeciv-web, hauberk, glitch2016.
No licence means all rights reserved by default. Public code on GitHub is not public
domain. Ask the author before touching those.

### Adding another one

1. Download the repo into `src/games/<name>/` (keep `LICENSE`).
2. Draw a `thumb.svg` at 250×250.
3. Add an entry to `selfHosted` in `site.config.json`.
4. `node curate.mjs && node build.mjs`.

Same trademark rule applies. The awesome lists are full of Mario, Diablo,
Command & Conquer and Duck Hunt clones. An MIT licence on the *code* does not give
you Nintendo's *trademark*. Those are excluded from `opensource.mjs` on purpose.

---

## Route 1 — Clones and successors that are already legal

Game *mechanics* are not copyrightable. Only the name, art, characters and code are.
A two-player co-op puzzle-platformer with its own name and art is completely legal,
and the catalogue is full of them.

Already pinned to the top of the site:

| You wanted | What you're getting instead | Source |
|---|---|---|
| Fireboy and Watergirl | Fire and Water Ball, 2 Player Red Blue Pirates | GamePix |
| Bob the Robber | Ball Thief vs Police 1 & 2 | GamePix |
| Any 2-player Friv classic | 12 MiniBattles - Two Players | GamePix |
| Moto X3M | Moto X3M: Spooky Land | GamePix |
| Penalty Challenge | Penalty Challenge + Multiplayer | GamePix |

Cost: nothing. Available: now.

---

## Route 2 — Add a second broker

GameMonetize runs the same model as GamePix and has an open catalogue feed —
**15,000 games**, roughly 2.5x what GamePix has.

```bash
node gamemonetize.mjs find "your search term"
```

**Read this before using it.** GameMonetize vets uploads more loosely than GamePix.
Its catalogue contains entries like `Fireboy And Watergirl Online` and
`Unblocked Forest Fireboy And Watergirl`.

Fireboy and Watergirl is exclusively licensed by Oslo Albet to a single publisher.
So an entry with that exact name on an open broker feed **cannot be the licensed
original**. It is a clone wearing someone else's trademark.

If you publish it, the DMCA notice lands on *your* domain, not GameMonetize's.
The broker's terms put that on the uploader; the takedown still kills your site.

Rule: a clone with its own name is fine. A clone using the original's name is not.
Same for the `Bloxorz` entry — verify who actually made it before touching it.

---

## Route 3 — License it directly from the developer

This is exactly how Friv built its catalogue: it makes very few games itself and
buys non-exclusive licences from independent developers, who sell the same licence
to several portals at once.

You can do the same thing. You are 15, so run any actual agreement or payment past
a parent before signing or sending money.

### Who to write to

| Game | Developer | Route | Odds |
|---|---|---|---|
| Moto X3M | MadPuffers (Ukraine) | studio contact page | decent — already broker-distributed |
| Bloxorz | Damien Clarke | personal site | decent — 2007 Flash, low commercial value now |
| Bob the Robber | licensed to Coolmath / Kizi | publisher, not dev | low |
| Fireboy and Watergirl | Oslo Albet, Barcelona | `septimaniacgames@gmail.com` (their published developer contact) | very low — exclusive deal since 2009 |
| Power Pamplona | made by Rexona as an ad | brand, Flash-era | very low |
| Smiling Glass Pro Pourer | commissioned by Friv as an exclusive | — | zero. Don't bother. |

### The email

Keep it short. Developers get a lot of these and the long ones read as spam.

> **Subject:** Non-exclusive web licence for [GAME] — [YOUR SITE]
>
> Hi [NAME],
>
> I run [YOURSITE.com], a browser games site. I'd like to license [GAME] for web,
> non-exclusive.
>
> I currently have [X] games and [Y] monthly sessions. Happy to work on a flat fee,
> revenue share, or your standard licence — whatever you normally do.
>
> If it's already exclusive somewhere, no problem, just say so and I'll stop asking.
>
> Thanks,
> [NAME]

Do not claim traffic you don't have. They can check, and a small honest number
reads better than a number that falls apart in one question.

Expect most answers to be no or silence. That's the job — Friv reviews thousands
of games a year to pick a few.

---

## Route 4 — Accept that some are gone

Portal exclusives cannot be licensed. That is the entire point of an exclusive.
Smiling Glass Pro Pourer is a Friv commission and Fireboy and Watergirl has been
locked to one publisher since 2009 with the ads compiled into the game files.

Chasing those two is wasted time. Route 1 gets you 90% of the feel for zero effort.

---

## What never to do

Do not pull game files off Friv, Coolmath or Kizi and host them yourself.
That is what gets these sites DMCA'd off their domains, and it is the single
most common way a portal like yours dies in month three.
