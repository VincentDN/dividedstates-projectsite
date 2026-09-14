# Divided States map — alpha

An interactive map of the Second American Civil War (1940), styled after the
retro B&W newsreel maps supplied as reference and the four-faction colour
key from the reference screenshot (orange West, red centre, blue-grey South,
green Northeast). Modelled on the American Kingdoms atlas at
`americankingdoms-projectsite/medieval-america-map/` (same general Leaflet
+ GeoJSON + details-panel setup), rebuilt from scratch here rather than
copied wholesale: this map has no submaps, culture/realm mode toggle or
`?edit=1` editor, and uses Leaflet's default Web Mercator instead of AK's
custom polar projection (unnecessary at continental-US scale).

Linked from the homepage's main nav, footer Explore column, and a Map
Promo section below the gallery (see the root `README.md`). Still marked
alpha on the page itself (the banner, the title) and its state-to-faction
borders are an explicit provisional placeholder -- see below -- but it's
no longer `noindex`/orphaned.

The sea is now near-black (`#121214`) and land a bright warm grey
(`#b3ab9c`), matching the reference newsreel stills' own high contrast --
the first pass had both at similar muddy mid-tones. `#map::after`'s
overlay was a `repeating-linear-gradient` scanline stripe (read as a CRT
effect, not the intended film-print look); it's now a directional
`feTurbulence` (`type="turbulence"`, uneven x/y `baseFrequency`) grain,
`multiply`-blended so it darkens unevenly like ink soaking into paper
fibre instead of a uniform overlay wash. The Leaflet
attribution control was also being added twice (once automatically by
`L.map()`'s default `attributionControl: true`, once explicitly for the
custom prefix), which is why the live default-Leaflet "Leaflet" credit
with its Ukraine-flag emoji was showing through; `atlas.js` now sets
`attributionControl: false` on the map and adds a single control reading
"Map made with Leaflet".

## The three factions and their borders — provisional, not canon

Superseded the original four-way guess (New England / Revolutionary States
/ American Union State / Congressional States) once the "Declassified"
faction briefing cards were supplied: they establish a **three**-faction
civil war, not four. `scripts/build-territories.py` dissolves US state
polygons (Natural Earth 1:50m admin-1, public domain, copied from the AK
atlas's own `sources/natural-earth-admin1-states.geojson` into this page's
`sources/`) into three macro-regions, real 1940 state lines standing in
for whatever the eventual in-universe borders turn out to be:

| Faction | Colour | States |
| --- | --- | --- |
| Loyalist States ("Blue States") | navy `#1f3a66` | ME, NH, VT, MA, RI, CT, NY, NJ, VA, NC, SC, GA, FL, AL, MS, TN, KY, AR, LA, TX, OK, NM |
| Revolutionary States ("Red States" / R.S.A.) | red `#8c2c26` | PA, DE, MD, DC, WV, OH, MI, WI, IL, IN, MN, IA, MO, KS, NE, SD, ND, MT, WY, CO, UT, ID |
| Congressional States ("Pacific States") | gold `#c98a2b` | WA, OR, CA, NV, AZ |

The former separate New England and American Union State regions are now
one Loyalist States faction -- the briefing card's own map shows Loyalist
territory as a single contiguous claim from New England down through the
South, capital Atlanta, not two unrelated regions. Revolutionary States and
Congressional States keep the same states they already had; only their
name, colour and lore changed.

Alaska and Hawaii weren't states in 1940 and take no active part in the
war, so instead of a solid fill each is drawn with a moving diagonal hatch
(SVG `<pattern>` + SMIL `<animateTransform>`, defined inline at the top of
`index.html`, applied by `atlas.js` setting `layer._path.style.fill` since
Leaflet's own `fillColor` option can't take a `url(#...)` paint server) in
shades of its nominal faction's colour: Alaska under the Loyalist States,
Hawaii under the Congressional States. Their flag/buy-a-flag panel still
points at that faction's real flag, via `atlas.js`'s `flagId` lookup.

This split is still a best-effort reading, now of the briefing cards
rather than the original reference screenshot -- and the cards are
themselves propaganda-style illustrations (each faction's own map shows
its own claimed territory, and those claims visibly overlap in the
contested Northeast) rather than a clean partition, so don't take the
exact state list as anything more than a reasonable resolution of that
overlap. It is **not** confirmed canon. To correct it: edit the `FACTIONS`
dict in `scripts/build-territories.py` (state postal codes per faction)
and rerun `python3 scripts/build-territories.py` from this directory
(requires `shapely`) to regenerate `data/territories.geojson`.

## Flags and Flagmaker links

Real flag art now exists for two of the three factions, supplied as
Illustrator/PDF vectors and rasterised here (`pdftoppm`) rather than
redrawn by hand:

- **Loyalist States** — `assets/flags/loyalist-states.png`, the supplied
  AUS eagle-on-blue vector. Links to
  `https://flagmaker-print.com/products/american-union-state-flag-kaiserreich`,
  the same product already used on the homepage (that flag's real name is
  evidently "American Union State" regardless of what this faction is
  called on the map -- the two are the same design).
- **Congressional States** — `assets/flags/congressional-states.png`, the
  supplied Pacific States/PSA vector (white-red-gold bands, navy star and
  bear). **No real Flagmaker product URL for this one yet** -- `FLAG_LINKS`
  has no entry for it, so its "Purchase a flag" button falls back to the
  general `/collections/alt-history-flags` collection link. Add the real
  URL to `atlas.js`'s `FLAG_LINKS` once one exists.
- **Revolutionary States** — `assets/flags/revolutionary-states.svg` is
  still a hand-drawn placeholder (no vector was supplied for this one),
  redrawn to approximate the briefing card's own flag icon: a black
  panel with a white gear-and-star badge against diagonal red/white
  stripes. Its "Purchase a flag" button already links to the real product,
  `https://flagmaker-print.com/products/revolutionary-states-flag-the-divided-states`
  -- the URL was supplied even though the artwork wasn't.

`atlas.js`'s `FLAG_IMAGE_EXT` map records which extension (`png` vs `svg`)
each faction's flag file uses, since `showDetails()` needs to build the
right filename per faction rather than assuming one extension for all.

## Map detail: coastline, lakes, rivers, roads, capitals

The first alpha was criticized as too low-res/empty at any real zoom, so
`scripts/build-map-layers.py` now produces four more layers alongside the
territories, all clipped to a `lon -170..-50, lat 5..75` North America box:

- `data/land.geojson` — coastline, simplified at a finer 0.003° tolerance
  than the first pass's 0.01° for visibly crisper detail. The Great Lakes
  are cut out of it as true holes (`land_raw.difference(lakes_raw)`,
  *then* simplified once as a single geometry) rather than drawn as a
  second, separately-simplified layer on top -- the original approach
  left jagged sliver gaps wherever the two independently-simplified edges
  didn't quite line up, worst around Georgian Bay's genuinely complex
  coastline. One hole-by-construction has no second edge to drift out of
  alignment with the first.
- `data/lakes.geojson` — the lake footprint on its own (not diffed against
  land), kept as data but not rendered as a separate map layer today,
  since land's own holes already show the sea-black through with no seam
  risk. Here in case a future pass wants water styled differently from
  open sea.
- `data/rivers.geojson` — Natural Earth rivers filtered to `scalerank<=5`
  (keeps the Mississippi/Missouri/Ohio/Columbia/Rio Grande tier, drops the
  minor tributaries that would just clutter the map at this scale).
- `data/capitals.geojson` — all 50 state capitals, from
  `sources/natural-earth-populated-places.geojson`'s `Admin-1 capital`
  rows. `atlas.js` only shows their markers/labels once you zoom in past
  `CAPITAL_MIN_ZOOM` (5) — at the default continental view they were just
  50 overlapping labels. Styled as a small solid chip (`.capital-mark`) with
  a star glyph and bold condensed text, echoing the briefing cards' own
  "SACRAMENTO"-style capital callout rather than plain map text.

Major highways are separate: `scripts/build-roads.py` filters Natural
Earth's 1:10m roads (`type == "Major Highway"`, `sov_a3 == "USA"`) down to
`data/roads.geojson`. That source is ~50 MB, too large to vendor in
`sources/` like the others, so the script re-downloads it from
`nvkelso/natural-earth-vector` on GitHub each time it's run rather than
reading a committed copy.

Run `python3 scripts/build-map-layers.py` (needs `shapely`) to regenerate
everything except roads; `python3 scripts/build-roads.py` separately
(needs network access) for those.

## Files

- `index.html`, `atlas.css`, `atlas.js` — the page.
- `data/territories.geojson` — the three factions + affiliated AK/HI,
  generated by `scripts/build-territories.py` (see above).
- `data/land.geojson`, `data/lakes.geojson`, `data/rivers.geojson`,
  `data/capitals.geojson`, `data/roads.geojson` — base map layers (see
  above).
- `sources/` — the raw Natural Earth inputs (public domain; see the AK
  atlas's README for full sourcing/license notes, same data). Roads is
  the exception -- not vendored, see above.
- `vendor/` — Leaflet 1.9.4, copied from the AK atlas's own vendor copy
  (same version, same BSD licence file).

## Preview locally

Serve the **repository root** (the page loads `../favicon.ico` and
`../assets/logo.png` from it) and open `/world-map/`:

```
python3 -m http.server 4187
```

## Deploying

This directory only needs to ship alongside the rest of the repository
root on the existing Cloudflare Pages project, the same one serving
`dividedstates-project.com` today — no new project, domain or build step.
