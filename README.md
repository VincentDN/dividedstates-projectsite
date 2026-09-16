# The Divided States

Version 2.0.4 · 3 September 2026

## Roadmap notes (raise these next time we pick up site work)

- **Full interactive map, for both the TDS site and the AK site.**
  Underway: `/world-map/` (see `world-map/README.md`) is a first alpha —
  four dissolved macro-regions (American Union State, Revolutionary
  States, Pacific States, New England, per the "Declassified" faction
  briefing cards, with New England later restored as its own region on
  request and Congressional States later renamed to Pacific States, its
  own established nickname) over real 1940 state lines, each state also
  showing as a subtle shade of its faction's colour once zoomed in.
  Styled after the retro B&W newsreel reference art. It's live in the
  main nav, the footer's Explore column, and a Map Promo section below
  the homepage gallery (same full-bleed-band treatment as AK's own map
  promo) — no longer orphaned/noindexed, though it's still alpha
  software and its state-to-faction borders are explicitly a provisional
  placeholder pending confirmation, per that README. Sibling AK atlas is
  at `medieval-america-map/` in that repo, for comparison.
- **Every flag should be purchasable via a direct link to its Flagmaker
  product page**, not just the generic collection link. All four factions
  now link straight to their real product pages (`world-map/atlas.js`'s
  `FLAG_LINKS`), and Alaska/Hawaii show and link their own real state flags
  rather than their nominal faction's — see `world-map/README.md`.
- **The homepage has a Factions carousel** (`#factions`, below the Map
  Promo section), seven cards sharing the Crew section's own sliding-carousel
  mechanics (`initCarousel()` in `main.js`, now parameterised for both
  rows): the four Divided States factions plus the great powers backing
  each side -- German Empire, Soviet Union, and Canada (merged with the
  British Empire into one "Canada (British Exiles)" card, muted-purple
  accent, since in Kaiserreich canon the Dominion of Canada *is* where the
  exiled British crown sits). Each card links a YouTube faction-intro
  video and a `kaisercatcinema.com` propaganda-poster product.
  Revolutionary States' video points at "World of Kaiserreich - Combined
  Syndicates" -- Revolutionary States is this universe's Combined
  Syndicates of America, so it's the same underlying lore video rather
  than a separate one. The Soviet Union card's art
  (`greyhounds-in-chicago.jpg`) is an explicit placeholder pending a
  dedicated piece. Card order (and the map's own faction list, driven
  by the same `FACTIONS` dict) is American Union State, Revolutionary
  States, Pacific States, New England, then the three foreign powers.
  Congressional States was renamed to Pacific States, its own established
  nickname per the briefing cards -- see `world-map/README.md`. Card
  text avoids em dashes throughout.

A single, hand-written static homepage. No WordPress, Divi, jQuery, npm dependencies,
framework, database, build process, or server-side application is required.
The homepage preserves the original artwork, principal copy and section order.

## Files

- `index.html`: all content, navigation and the JSON-LD entity graph.
- `styles.css`: layout, responsive rules, colours and typography.
- `main.js`: mobile menu, crew carousel, click-to-load video player and accessible gallery.
- `assets/`: only the homepage's images, video thumbnails and self-hosted fonts.
- `_redirects`: old page addresses redirect to homepage sections or KCC.
- `_headers`: Cloudflare Pages security and cache headers.
- `robots.txt` and `sitemap.xml`: the sitemap lists the homepage and `/world-map/`.
- `functions/api/subscribe.js`: Cloudflare Pages Function backing the inline
  newsletter form in the Connect section (see below).

The former Episodes, Connect and Patreon Cameo HTML pages, the branded 404
page and all WordPress/Divi/plugin directories have been removed. Git history
retains the old implementation.

## Newsletter signup

The email box in the "Interested? Connect with us!" section posts to
`/api/subscribe`, a Cloudflare Pages Function (`functions/api/subscribe.js`)
that subscribes the address to Shopify Mail by setting marketing consent on
the matching Shopify customer via the Shopify Admin GraphQL API. No email
addresses are stored in this repo or on Cloudflare; Shopify remains the only
list.

This requires four variables set on the Cloudflare Pages project (Settings →
Environment variables), never committed to the repo:

- `SHOPIFY_STORE_DOMAIN` (Text) — e.g. `kaisercatcinema.myshopify.com`
- `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` (Secret) — from the custom
  app's API credentials page in the Shopify Dev Dashboard, with the
  `read_customers` and `write_customers` Admin API scopes configured.
- `SHOPIFY_SOURCE_TAG` (Text) — `source:tds_projectsite` on this project.
  Every subscriber who signs up here gets tagged with this in Shopify, so you
  can filter/segment customers by which site brought them in.

Since January 1, 2026 Shopify custom apps no longer hand out a permanent
`shpat_` token — instead the Function exchanges the Client ID/Secret for a
short-lived (~24h) access token on every request via the `client_credentials`
OAuth grant.

See `.dev.vars.example` for local development with `wrangler pages dev`.

## Deploy on the existing Cloudflare Pages project

Keep the current project and custom domain. You do not need a Worker or a new project.

For Git integration:

1. Review and push the replacement files to this repository's deployment branch.
2. Framework preset: **None**.
3. Build command: **exit 0** (no build).
4. Build output directory: **/** (the repository root).
5. Root directory: leave blank.
6. Remove any obsolete build command or framework setting from the old project.

For an existing Direct Upload project, upload the complete deploy ZIP or extracted
folder through **Create a new deployment**. `index.html` must be at its root, beside
`assets`, `styles.css`, `main.js`, `_headers` and `_redirects`.

Do not upload only `index.html`: it needs the files beside it. Do not merge this
package into an old WordPress export without removing the obsolete directories;
old files would still be deployable.

After deployment, verify the homepage, a gallery image, video playback and
`/episodes/` → `/#episodes`. Cloudflare Pages applies `_headers` and `_redirects`;
a basic local file viewer does not.

Cloudflare Pages guide:
https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

## Preview locally

Extract the entire folder, then open `index.html` in your browser. Relative asset
paths make images, fonts, styles, the menu and gallery work without a server.
YouTube may require an HTTP origin to play videos (file URLs can lack a referrer).

For a complete preview, serve this folder with any static server. If Python is
installed, run `python -m http.server 4187`, then open `http://localhost:4187/`.
The homepage does not require Python in production.

## Edit the homepage

The footer is a single block with Contact, Explore and Vincent De Nil columns,
with regular-weight headings. It uses three columns on desktop, two on tablets
and stacks on phones. The KCC social icons are centered below the newsletter
button. The larger eagle is centered above the copyright in the footer.
Contact details are not repeated beneath the copyright, and only one top divider
separates the footer from the newsletter section. The video-loading note is removed.

- Edit the labelled sections in `index.html` to change copy.
- The Crew section is a horizontal carousel with arrow buttons, mouse dragging,
  native touch swiping and keyboard navigation (Left/Right, Home/End). It never
  auto-rotates and respects reduced-motion preferences. Add members by copying a
  `crew-card` article inside `#crew-track`; all biographies remain readable and
  crawlable in the HTML, including without JavaScript. Printing shows every card.
- The Factions section is the same carousel mechanics as Crew (`initCarousel()`
  in `main.js` now serves both). Add a faction/power by copying a `faction-card`
  article inside `#faction-track`, with a `--fc-color` inline style (an accent
  colour for the card's top border only, never used as text colour so it stays
  legible regardless of hue) and two `.faction-links` entries.
- Add a gallery `button.gallery-item` using the existing examples, its image
  dimensions, caption and `data-full` path. The script discovers all items.
- Add a `button.video-choice` with the YouTube ID, full title and a local thumbnail
  to extend the video list. Only one iframe is created, after the visitor clicks.
- Use homepage anchors or relevant `kaisercatcinema.com` / `flagmaker-print.com`
  pages for content links. The newsletter section links directly to the KCC
  social profiles; the footer links to Vincent's LinkedIn/GitHub. Email uses `mailto:`. Video playback uses YouTube;
  schema identity URLs deliberately retain their canonical external domains.
- The press-kit button says "Request the press kit" and points to Contact: there was no downloadable
  press-kit file in the source repository. Add a real press-kit asset and update
  that button if a direct download becomes available.
- The Webtoons mention is retained as text, without an unrelated link.
- The large player poster is the 1280 × 720 YouTube original, stored separately
  from the small video-choice thumbnails. Actual playback quality is controlled
  by YouTube, not this static poster.
- KCC social links were fetched from `https://kaisercatcinema.com/pages/connect`.
  Its Reddit link leads to the Kaiserreich community, not a dedicated KCC profile.
  Vincent's profile links match the canonical identity in the schema.

## SEO and shared identities

The complete JSON-LD is present in the HTML head, without JavaScript injection.
The graph contains WebSite, WebPage, CreativeWorkSeries, Person, two Organizations,
and the Flagmaker & Print OnlineStore.

It shares these IDs with American Kingdoms and Vincent's own website:

- `https://vincentdenil.com/#vincent`
- `https://vincentdenil.com/#atelier`
- `https://kaisercatcinema.com/#org`
- `https://flagmaker-print.com/#org`

The canonical person and company definitions follow `vincentdenil.com`, while
the project structure follows American Kingdoms. All referenced shared entities
are fully defined in the same graph. Divided States retains its own site/project
IDs, copy and image URLs. There is no one-item homepage breadcrumb, unsupported
`productionCompany` property, or invented rating, review, upload date or video data.

Validate with https://validator.schema.org/ after editing. Google's Rich Results
Test reports only supported Google features, not every valid Schema.org entity.
The homepage is not a personal ProfilePage, and is not labelled as one merely to
obtain a rich-result badge.

The original social-preview image is retained. If the public domain changes,
update the canonical, Open Graph, Twitter, sitemap and site/project schema URLs
together. Do not change the shared person/company IDs.

## Maintenance notes

- No animations, automatic video playback, trackers or external font requests.
- There are 25 gallery works, six video choices, two project posters, four
  crew profiles and seven faction cards. The New York image was removed from the gallery at the owner's
  request but remains in use as the homepage hero background.
- Editable HTML/CSS/JS revalidate; assets have a one-day cache, not immutable
  one-year caching. Rename an asset or purge its cache for an immediate update.
- Local fonts include their original SIL Open Font License texts.
- Local brand icons are Font Awesome Free SVGs by Fonticons, Inc., licensed under
  CC BY 4.0. Original SVG attribution comments and `assets/icons/LICENSE.txt` are
  included. Source: https://github.com/FortAwesome/Font-Awesome/tree/6.x/svgs/brands
- Keep Git repositories outside Synology/Dropbox sync folders where possible.
  Synchronisation can interfere with Git's lock files; it is unrelated to HTML.
