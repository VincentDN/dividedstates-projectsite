# The Divided States — static site (Cloudflare Pages)

Clean static build of **dividedstates-project.com**, refactored from the old
WordPress/Divi export (originally mirrored with HTTrack) into a lean package
ready to deploy on Cloudflare Pages. The rendered look and functionality are
unchanged; this was a code-cleanup + SEO pass.

## Deploy to Cloudflare Pages

1. Push this folder to a Git repo (or upload the folder directly in the
   Cloudflare dashboard → Workers & Pages → Create → Pages → Direct Upload).
2. Build settings: **no build command**, **output directory = `/` (this folder)**.
   It's already static — nothing to compile.
3. Add the custom domain `dividedstates-project.com` in the Pages project.

Cloudflare serves `index.html` inside each folder as a clean URL
(`/`, `/episodes/`, `/connect/`, `/patreon-cameo/`) automatically.

## What's in here

```
index.html                      Home
episodes/index.html             Episodes
connect/index.html              Connect / Newsletter
patreon-cameo/index.html        Patreon cameo zone
404.html                        Branded not-found page
_headers                        Security + caching headers
_redirects                      Legacy .html paths -> clean URLs
robots.txt                      Allow all + sitemap pointer
sitemap.xml                     4 URLs
favicon.ico                     Root favicon (was missing before)
wp-content/ , wp-includes/      Divi theme CSS/JS, fonts, uploads (unchanged)
```

## Changes made in this refactor

**Removed (dead WordPress / mirror cruft, no visual impact):**
- HTTrack mirror comments and the stray `?p=` redirect stubs
- `xmlrpc0db0.php`, `wp-json/` REST dump, RSD/EditURI, oEmbed & shortlink links
- WP pingback link, RSS/comments feed links, `generator` meta tags
- Jetpack `stats.wp.com` tracking script (dead on a static host)

**Added — full SEO schema (per page):**
- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Absolute Open Graph / Twitter Card URLs + image dimensions & alt
- JSON-LD `@graph`: Organization, WebSite, Person (Vincent De Nil), WebPage,
  BreadcrumbList, and a CreativeWorkSeries on the home page

**Added — Flagmaker & Print links:**
- A **“Flags”** item in the main navigation on every page → https://flagmaker-print.com/
- The founder Person entity in the JSON-LD links to Flagmaker (`url` + `sameAs`)
- The 404 page includes a Flagmaker call-to-action

**Cleaned up:**
- All asset paths made root-relative (`/wp-content/…`, `/wp-includes/…`) —
  consistent across pages and correct for a domain-root host. This also fixed a
  broken mobile background image on the Connect page that was 404-ing in the
  original export.
- Internal page links normalised to clean URLs (`/`, `/episodes/`, …), and one
  broken menu link (`…#episodes/#gallery`) fixed to `/#gallery`.

## Known pre-existing items (unchanged, optional follow-ups)

- The Divi **admin** FontAwesome font files (`fa-solid-900.*`, etc. under
  `wp-content/themes/Divi/core/admin/fonts/fontawesome/`) were never included in
  the original export. They are builder-only fonts and are **not used by the
  front-end** (visible icons use the ETmodules/Socicon fonts, which are present),
  so there is no visual impact. They can be removed from the inline `@font-face`
  CSS later if you want a zero-404 build.
- The old newsletter plugin (`mailin`) still carries inline config pointing at
  the former WordPress `admin-ajax.php` endpoint. There is no rendered form on
  these pages — the working newsletter CTA links to the external Kaiser Cat
  Cinema signup — so this config is inert. Safe to strip if desired.

## Version history

**v1.0.0 — 2026-09-02** — Initial clean build. WordPress/Divi export refactored
for Cloudflare Pages: dead cruft removed, root-relative assets (Connect-page
mobile background fixed), clean internal URLs, full SEO schema + JSON-LD,
Flagmaker nav + schema, and the config/support files listed above. Each page
carries a `v1.0.0` build stamp in its `<head>` (view-source to confirm what's
deployed). See `VERSION` for the full changelog.
