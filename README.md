# cpalss.com — public site

Live: [https://cpalss.com](https://cpalss.com)  
Repo: [cPALSs/cpalss](https://github.com/cPALSs/cpalss)

Static GitHub Pages site for Community Partners Advocate of Little Saigon Sacramento. Replaced the Google Site that served `www.cpalss.com` (Oct 2026). Page paths match the old Google Sites URLs (`/about/team`, `/little-saigon/stories`, …) so existing links keep working.

## Edit / build / preview / publish

```bash
# From this folder (Operations/Sites/cpalss)
node scripts/build.mjs            # data/site.json → */index.html, 404.html, sitemap.xml, robots.txt
python3 -m http.server 8768       # → http://127.0.0.1:8768/

git add -A && git commit -m "Update cpalss.com" && git push
```

Push to `main` deploys via `.github/workflows/deploy-pages.yml`. Hold the push while iterating; push only after Bao okays it.

## Content

| File | What to edit |
|------|----------------|
| `data/site.json` | Nav, footer links, and every page (`pages[].blocks`). Block types: `text`, `cards`, `links`, `people`, `projects`, `gallery`, `feature`, `articles`, `videos`, `credits`. |
| `assets/` | Images, grouped by page. Team portraits are `assets/team/{name-slug}.jpg` (square, ~480px). |
| `site.css` / `site.js` | Look and mobile nav. |

Generated HTML is committed (GitHub Pages serves it as-is) — always rerun `node scripts/build.mjs` after editing `data/site.json`.

**Team page:** keep in sync with the Board roster in the latest Board minutes. Committee Chairs lists year-round standing committees only — not seasonal project chairs (e.g. Toy Drive). Open officer or standing-committee seats use `{ "open": true, ... }` with a mailto CTA.

**Aliases / redirects:** `pages[].aliases` and top-level `redirects` write small redirect pages (e.g. `/home/` → `/`, the old Unicode `/projects/phở-for-seniors/` → `/projects/pho-for-seniors/`).

Visitor pages must not link monorepo paths or private vault docs.

## Analytics / search

- GA4: `G-31M3604P57` (same property the Google Site used) — `analytics.js`.
- Search Console: domain property `sc-domain:cpalss.com`. Sitemap: `https://cpalss.com/sitemap.xml`. Script: `node "Operations/Festival Network/scripts/search-console-eglny.mjs" submit-sitemap --site cpalss` (from the vault root).

## DNS (Cloudflare, cpalss.com zone)

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| CNAME | `www` | `cpalss.github.io` | DNS only |

No Cloudflare redirect rule for apex ↔ www — GitHub Pages redirects `www` → apex. Leave `toydrive` (Google Sites), `portal` (Cloud Run), `*` (GitHub Pages), MX, SPF, and the `google-site-verification` TXT untouched.
