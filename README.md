# willmartin.com

Personal site: projects, occasional writing, music. Built with [Astro](https://astro.build/)
and [Tailwind CSS](https://tailwindcss.com/) (v4, CSS-first config — theme tokens live in
`src/styles/global.css`, not a `tailwind.config.js`).

## Structure

```
src/
  layouts/Base.astro     Shared nav/footer/fonts, used by every page
  pages/
    index.astro           Landing/bio
    projects.astro        typedframes / trustedlicenses / poc-tdist link-out cards
    music.astro           Apple Music link
    blog/
      index.astro          Post listing
      [id].astro           Individual post route
  content/blog/*.md       Blog posts (frontmatter: title, date, description?)
  content.config.ts       Blog collection schema
public/
  CNAME                   willmartin.com — GitHub Pages custom domain
```

Visual brand (fonts, accent blue, gray) matches `~/Programming/cv/cv.tex` — same
Merriweather/Open Sans/`#2079C7`/`#666666` values, so the site and CV read as one thing.

## Develop

```
npm install
npm run dev       # localhost:4321
npm run build     # → dist/
npm run preview   # serve the production build locally
```

## Adding a blog post

Drop a new file in `src/content/blog/`, e.g. `src/content/blog/my-post.md`:

```markdown
---
title: My Post Title
date: 2026-09-21
description: Optional one-liner shown in the listing.
---

Post content in Markdown.
```

It'll appear automatically at `/blog/my-post/`, listed newest-first on `/blog/`.

## Deploy

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to
`main`/`master`. The repo's Pages source is set to "GitHub Actions" (not
branch-based) — already configured, no action needed.

## Interactive typedframes demo — not built yet

There's a TODO to add a live "paste Python, see it flagged" demo using typedframes'
actual Rust checker compiled to WebAssembly (no Python runtime involved — the checker
never executes the code it analyzes). That work is scoped as its own handoff spec at
`~/Programming/typedframes/WASM_DEMO_SPEC.md`. Once that lands, `projects.astro` should
gain a demo page and link.

## Custom domain setup (once `willmartin.com` is registered)

Not done yet — `willmartin.com` isn't registered. Once it is:

1. **Point the domain's nameservers at Cloudflare** (free plan), regardless of which
   registrar it was bought from.
2. **DNS, for the apex domain to reach GitHub Pages:** in Cloudflare, add a `CNAME` record
   for `@` (the apex) targeting `w-martin.github.io` — Cloudflare's "CNAME flattening"
   makes this work at the apex, which plain DNS can't do with a CNAME. Add another `CNAME`
   for `www` targeting `w-martin.github.io` too, for `www.willmartin.com`.
3. **In the GitHub repo settings** (Settings → Pages), the custom domain field should
   already show `willmartin.com` (from `public/CNAME`) once DNS resolves — check the
   "Enforce HTTPS" box once it's verified.
4. **Email — Cloudflare Email Routing** (free, no server): in the Cloudflare dashboard,
   Email → Email Routing, add a routing rule forwarding `mail@willmartin.com` to your
   existing Gmail address. Cloudflare adds the necessary MX/TXT records automatically.
