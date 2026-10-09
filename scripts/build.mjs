#!/usr/bin/env node
/**
 * Renders data/site.json into static HTML pages, sitemap.xml, robots.txt, and 404.html.
 * Usage: node scripts/build.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data/site.json"), "utf8"));
const { meta } = site;

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isExternal = (href = "") => /^https?:\/\//.test(href) || href.startsWith("mailto:");
const linkAttrs = (href) =>
  /^https?:\/\//.test(href) ? ` href="${esc(href)}" target="_blank" rel="noopener"` : ` href="${esc(href)}"`;

function outFile(urlPath) {
  const rel = urlPath.replace(/^\//, "");
  return path.join(ROOT, rel, "index.html");
}

function absUrl(urlPath) {
  return meta.canonicalBase + encodeURI(urlPath);
}

function isActive(item, current) {
  if (item.href === "/") return current === "/";
  if (item.href && !isExternal(item.href) && current.startsWith(item.href)) return true;
  return (item.children || []).some((c) => !isExternal(c.href) && current.startsWith(c.href) && c.href !== "/");
}

function renderNav(current) {
  const items = site.nav
    .map((item) => {
      const active = isActive(item, current) ? " is-active" : "";
      if (!item.children) {
        return `<li class="nav-item${active}"><a class="nav-link"${linkAttrs(item.href)}>${esc(item.label)}</a></li>`;
      }
      const top = item.href
        ? `<a class="nav-link"${linkAttrs(item.href)}>${esc(item.label)}</a>`
        : `<span class="nav-link" tabindex="0">${esc(item.label)}</span>`;
      const kids = item.children
        .map((c) => {
          const here = c.href === current ? ' aria-current="page"' : "";
          return `<li><a${linkAttrs(c.href)}${here}>${esc(c.label)}${isExternal(c.href) ? ' <span class="ext" aria-hidden="true">↗</span>' : ""}</a></li>`;
        })
        .join("");
      return `<li class="nav-item has-children${active}">${top}<ul class="subnav">${kids}</ul></li>`;
    })
    .join("\n        ");
  return `<ul class="nav-list">
        ${items}
        <li class="nav-item nav-donate"><a class="btn btn-small"${linkAttrs(meta.donateUrl)}>Donate</a></li>
      </ul>`;
}

function renderHead(page) {
  const title = page.path === "/" ? `cPALSs – ${meta.orgName}` : `${page.title} – cPALSs`;
  const desc = page.description || meta.defaultDescription;
  const canonical = absUrl(page.path);
  const ogImage = meta.canonicalBase + (page.ogImage || meta.ogImage);
  const ld =
    page.path === "/"
      ? {
          "@context": "https://schema.org",
          "@type": "NGO",
          name: meta.orgName,
          alternateName: "cPALSs",
          url: meta.canonicalBase + "/",
          logo: meta.canonicalBase + "/assets/logo.png",
          email: meta.email,
          foundingDate: "2012",
          areaServed: "Greater Sacramento, California",
          sameAs: meta.social.map((s) => s.url),
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.title,
          url: canonical,
          description: desc,
          publisher: { "@type": "NGO", name: meta.orgName, url: meta.canonicalBase + "/" },
        };
  return `<head>
  <meta charset="UTF-8" />
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${meta.analyticsId}"></script>
  <script src="/analytics.js"></script>
  <script src="/clean-urls.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:site_name" content="cPALSs" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="${esc(ogImage)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${esc(ogImage)}" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <link rel="icon" type="image/png" href="/assets/favicon.png" />
  <link rel="apple-touch-icon" href="/assets/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/site.css" />
</head>`;
}

function renderHeader(current) {
  return `<header class="site-header">
    <div class="header-inner">
      <a class="brand" href="/">
        <img class="brand-logo" src="/assets/logo.png" alt="" width="44" height="44" />
        <span class="brand-text"><span class="brand-name">cPALSs</span><span class="brand-sub">Community Partners Advocate of Little Saigon Sacramento</span></span>
      </a>
      <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
        <span class="nav-toggle-bars" aria-hidden="true"></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="Main">
      ${renderNav(current)}
      </nav>
    </div>
  </header>`;
}

function renderFooter() {
  const social = meta.social.map((s) => `<a${linkAttrs(s.url)}>${esc(s.label)}</a>`).join(" · ");
  return `<footer class="site-footer">
    <div class="footer-inner">
      <img class="footer-logo" src="/assets/logo.png" alt="cPALSs logo" width="72" height="72" loading="lazy" />
      <div>
        <p class="footer-org">${esc(meta.orgName)} (cPALSs)</p>
        <p class="footer-links">${social} · <a href="mailto:${esc(meta.email)}">${esc(meta.email)}</a></p>
        <p class="footer-fine">A California 501(c)(3) nonprofit · <a${linkAttrs(meta.donateUrl)}>Donate</a></p>
      </div>
    </div>
  </footer>`;
}

function img(src, alt, extra = "") {
  return `<img src="${esc(src)}" alt="${esc(alt || "")}" loading="lazy" decoding="async"${extra} />`;
}

const blockRenderers = {
  text(b) {
    return `<section class="block block-text">
      ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ""}
      ${b.lead ? `<p class="lead">${b.lead}</p>` : ""}
      ${(b.paragraphs || []).map((p) => `<p>${p}</p>`).join("\n      ")}
    </section>`;
  },
  cards(b) {
    const cards = b.items
      .map((c) => {
        const inner = `<h3>${esc(c.title)}${c.href && isExternal(c.href) ? ' <span class="ext" aria-hidden="true">↗</span>' : ""}</h3>${c.body ? `<p>${c.body}</p>` : ""}`;
        return c.href
          ? `<a class="card card-link"${linkAttrs(c.href)}>${inner}</a>`
          : `<div class="card">${inner}</div>`;
      })
      .join("\n      ");
    return `<section class="block block-cards">
      ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ""}
      <div class="card-grid">
      ${cards}
      </div>
    </section>`;
  },
  links(b) {
    return `<section class="block block-links">${b.items
      .map((l) => `<a class="btn btn-ghost"${linkAttrs(l.href)}>${esc(l.label)} →</a>`)
      .join(" ")}</section>`;
  },
  people(b) {
    const people = b.items
      .map((p) => {
        const photo = p.open
          ? `<div class="person-photo person-photo-open" aria-hidden="true">?</div>`
          : `<div class="person-photo">${img(p.photo, p.name, ' width="240" height="240"')}</div>`;
        const cta = p.cta ? `<a class="person-cta"${linkAttrs(p.cta.href)}>${esc(p.cta.label)} →</a>` : "";
        return `<li class="person${p.open ? " person-open" : ""}">
          ${photo}
          <h3 class="person-name">${esc(p.name)}</h3>
          ${p.roles?.length ? `<ul class="person-roles">${p.roles.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
          ${cta}
        </li>`;
      })
      .join("\n        ");
    return `<section class="block block-people">
      <h2>${esc(b.heading)}</h2>
      <ul class="people-grid">
        ${people}
      </ul>
    </section>`;
  },
  projects(b) {
    const items = b.items
      .map(
        (p) => `<article class="project">
          <a class="project-media"${linkAttrs(p.href)}>${img(p.image, p.imageAlt)}</a>
          <div class="project-body">
            <h3><a${linkAttrs(p.href)}>${esc(p.title)}${isExternal(p.href) ? ' <span class="ext" aria-hidden="true">↗</span>' : ""}</a></h3>
            <p>${p.body}</p>
            ${p.more ? `<p class="project-more"><a${linkAttrs(p.more.href)}>${esc(p.more.label)} →</a></p>` : ""}
          </div>
        </article>`
      )
      .join("\n        ");
    return `<section class="block block-projects">
      <h2>${esc(b.heading)}</h2>
      <div class="project-list">
        ${items}
      </div>
    </section>`;
  },
  gallery(b) {
    const items = b.items
      .map((g) => {
        const pic = img(g.image, g.caption);
        const media = g.href ? `<a${linkAttrs(g.href)}>${pic}</a>` : `<a href="${esc(g.image)}" class="zoom">${pic}</a>`;
        const cap = g.href ? `<a${linkAttrs(g.href)}>${esc(g.caption)}</a>` : esc(g.caption);
        return `<figure class="gallery-item">${media}<figcaption><strong>${cap}</strong>${g.sub ? `<span>${esc(g.sub)}</span>` : ""}</figcaption></figure>`;
      })
      .join("\n        ");
    return `<section class="block block-gallery">
      ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ""}
      ${b.lead ? `<p class="lead">${b.lead}</p>` : ""}
      <div class="gallery${b.wide ? " gallery-wide" : ""}">
        ${items}
      </div>
    </section>`;
  },
  feature(b) {
    const pic = b.image ? img(b.image, b.imageAlt) : "";
    const media = b.image
      ? `<div class="feature-media${b.imageNarrow ? " feature-media-narrow" : ""}">${b.imageHref ? `<a${linkAttrs(b.imageHref)}>${pic}</a>` : pic}</div>`
      : "";
    const text = b.heading || b.paragraphs || b.body
      ? `<div class="feature-text">
        ${b.heading ? `<h2>${esc(b.heading)}</h2>` : ""}
        ${b.body ? `<p class="lead">${b.body}</p>` : ""}
        ${(b.paragraphs || []).map((p) => `<p>${p}</p>`).join("\n        ")}
      </div>`
      : "";
    return `<section class="block block-feature${text ? "" : " block-feature-solo"}">
      ${media}
      ${text}
    </section>`;
  },
  articles(b) {
    const items = b.items
      .map(
        (a) => `<li><span class="article-meta">${esc(a.date)} — ${esc(a.source)}</span><a${linkAttrs(a.href)}>${esc(a.title)}</a></li>`
      )
      .join("\n        ");
    return `<section class="block block-articles">
      <h2>${esc(b.heading)}</h2>
      <ul class="article-list">
        ${items}
      </ul>
    </section>`;
  },
  videos(b) {
    const items = b.items
      .map((v) => {
        const cap = v.caption
          ? `<figcaption>${v.href ? `<a${linkAttrs(v.href)}>${esc(v.caption)}</a>` : esc(v.caption)}</figcaption>`
          : "";
        return `<figure class="video">
          <div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${esc(v.id)}" title="${esc(v.caption || "cPALSs video")}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
          ${cap}
        </figure>`;
      })
      .join("\n        ");
    return `<section class="block block-videos">
      <h2>${esc(b.heading)}</h2>
      ${b.lead ? `<p class="lead">${b.lead}</p>` : ""}
      <div class="video-grid">
        ${items}
      </div>
    </section>`;
  },
  credits(b) {
    const groups = b.groups
      .map(
        (g) => `<div class="credit-group">
          ${g.heading ? `<h3>${esc(g.heading)}</h3>` : ""}
          <ul>${g.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
        </div>`
      )
      .join("\n        ");
    return `<section class="block block-credits">
      <h2>${esc(b.heading)}</h2>
      <div class="credit-grid">
        ${groups}
      </div>
    </section>`;
  },
};

function renderPageHeader(page) {
  if (page.hero) {
    const h = page.hero;
    const ctas = (h.ctas || [])
      .map((c) => `<a class="btn${c.style === "ghost" ? " btn-ghost-light" : ""}"${linkAttrs(c.href)}>${esc(c.label)}</a>`)
      .join(" ");
    return `<section class="hero">
      <img class="hero-image" src="${esc(h.image)}" alt="${esc(h.imageAlt)}" fetchpriority="high" />
      <div class="hero-scrim" aria-hidden="true"></div>
      <div class="hero-inner">
        <p class="hero-kicker">${esc(h.kicker)}</p>
        <h1 class="hero-title">${esc(h.title)}</h1>
        <div class="hero-cta">${ctas}</div>
      </div>
    </section>`;
  }
  const crumbs = (page.breadcrumb || [])
    .map((c) => `<a href="${esc(c.href)}">${esc(c.label)}</a> <span aria-hidden="true">›</span> `)
    .join("");
  return `<section class="page-header">
      <div class="page-header-inner">
        ${crumbs ? `<p class="breadcrumb">${crumbs}${esc(page.title)}</p>` : ""}
        <h1>${esc(page.title)}</h1>
        ${page.intro ? `<p class="page-intro">${page.intro}</p>` : ""}
      </div>
    </section>`;
}

function renderPage(page) {
  const blocks = (page.blocks || []).map((b) => {
    const fn = blockRenderers[b.type];
    if (!fn) throw new Error(`Unknown block type "${b.type}" on ${page.path}`);
    return fn(b);
  });
  return `<!DOCTYPE html>
<html lang="en">
${renderHead(page)}
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${renderHeader(page.path)}
  <main id="main">
    ${renderPageHeader(page)}
    <div class="content">
    ${blocks.join("\n    ")}
    </div>
  </main>
  ${renderFooter()}
  <script src="/site.js" defer></script>
</body>
</html>
`;
}

function renderRedirect(to) {
  const target = /^https?:\/\//.test(to) ? to : meta.canonicalBase + encodeURI(to);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Redirecting…</title>
  <link rel="canonical" href="${esc(target)}" />
  <meta name="robots" content="noindex" />
  <meta http-equiv="refresh" content="0; url=${esc(to)}" />
  <script>location.replace(${JSON.stringify(to)} + location.search + location.hash);</script>
</head>
<body><p><a href="${esc(to)}">Continue to ${esc(target)}</a></p></body>
</html>
`;
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  console.log("wrote", path.relative(ROOT, file));
}

for (const page of site.pages) {
  write(outFile(page.path), renderPage(page));
  for (const alias of page.aliases || []) write(outFile(alias), renderRedirect(page.path));
}
for (const r of site.redirects || []) write(outFile(r.from), renderRedirect(r.to));

write(
  path.join(ROOT, "404.html"),
  renderPage({
    path: "/404/",
    title: "Page not found",
    description: "This page could not be found on cpalss.com.",
    blocks: [
      {
        type: "text",
        paragraphs: [
          'That page isn’t here. Try the <a href="/">home page</a>, <a href="/projects/">projects</a>, or <a href="/little-saigon/">Little Saigon</a>.',
        ],
      },
    ],
  }).replace('<link rel="canonical"', '<meta name="robots" content="noindex" />\n  <link rel="canonical"')
);

const today = new Date().toISOString().slice(0, 10);
const urls = site.pages
  .map(
    (p) => `  <url>
    <loc>${esc(absUrl(p.path))}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.path === "/" ? "1.0" : p.path.split("/").length > 3 ? "0.6" : "0.8"}</priority>
  </url>`
  )
  .join("\n");
write(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
);
write(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${meta.canonicalBase}/sitemap.xml\n`);
