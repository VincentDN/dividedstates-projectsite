# The Divided States

Version 2.0.4 · 3 September 2026

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
- `robots.txt` and `sitemap.xml`: the sitemap contains only the homepage.

The former Episodes, Connect and Patreon Cameo HTML pages, the branded 404
page and all WordPress/Divi/plugin directories have been removed. Git history
retains the old implementation.

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
- There are 25 gallery works, six video choices, two project posters and four
  crew profiles. The New York image was removed from the gallery at the owner's
  request but remains in use as the homepage hero background.
- Editable HTML/CSS/JS revalidate; assets have a one-day cache, not immutable
  one-year caching. Rename an asset or purge its cache for an immediate update.
- Local fonts include their original SIL Open Font License texts.
- Local brand icons are Font Awesome Free SVGs by Fonticons, Inc., licensed under
  CC BY 4.0. Original SVG attribution comments and `assets/icons/LICENSE.txt` are
  included. Source: https://github.com/FortAwesome/Font-Awesome/tree/6.x/svgs/brands
- Keep Git repositories outside Synology/Dropbox sync folders where possible.
  Synchronisation can interfere with Git's lock files; it is unrelated to HTML.
