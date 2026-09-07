Built site only. Cloudflare deploys this branch with `npx wrangler deploy`.

  wrangler.toml   points wrangler at ./public
  public/         the generated site (253 games, 262 pages)

Source lives on the main branch. Rebuild with:

  node setup.mjs && node catalog.mjs pull && node curate.mjs && node build.mjs
