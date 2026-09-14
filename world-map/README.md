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

The sea is a dark grey (`#2b2b2e`, previously near-black `#121214` -- pure
black read as a void the grain couldn't show up over) and land a bright
warm grey (`#b3ab9c`), matching the reference newsreel stills' own high
contrast -- the first pass had both at similar muddy mid-tones. `#map::after`'s
overlay was a `repeating-linear-gradient` scanline stripe (read as a CRT
effect, not the intended film-print look); it's now a directional
`feTurbulence` (`type="turbulence"`, uneven x/y `baseFrequency`) grain,
`multiply`-blended so it darkens unevenly like ink soaking into paper
fibre instead of a uniform overlay wash. `#map::before`'s own fine-grain
layer got a second, much coarser `background-image` alongside it: a
low-`baseFrequency` `feTurbulence` whose alpha is remapped through a
`feComponentTransfer` table biased toward 0 (so only the noise peaks
survive as blob shapes) and recoloured solid white via `feColorMatrix`.
Both layers share `::before`'s single `mix-blend-mode:overlay` -- under
overlay, white lightens and near-black darkens, so the blotches read as
pale, aged-paper watermarks against the fine grain without needing a
second element or blend mode. The Leaflet
attribution control was also being added twice (once automatically by
`L.map()`'s default `attributionControl: true`, once explicitly for the
custom prefix), which is why the live default-Leaflet "Leaflet" credit
with its Ukraine-flag emoji was showing through; `atlas.js` now sets
`attributionControl: false` on the map and adds a single control reading
"Map made with Leaflet".

## The four factions and their borders — provisional, not canon

The "Declassified" faction briefing cards established a three-faction
civil war ("Loyalist" / Revolutionary / Congressional) with New England
folded into the Loyalist faction's single claim. New England was then
restored as its own region on direct request -- back to its original
footprint from the very first pass. The Loyalist faction was itself
renamed from "Loyalist States" to **American Union State**, matching the
real name of the flag supplied for it, keeping the same territory, colour
and "Blue States" lore. `scripts/build-territories.py` dissolves US state polygons (Natural Earth
1:50m admin-1, public domain, copied from the AK atlas's own
`sources/natural-earth-admin1-states.geojson` into this page's `sources/`)
into four macro-regions, real 1940 state lines standing in for whatever
the eventual in-universe borders turn out to be:

| Faction | Colour | States |
| --- | --- | --- |
| New England | green `#5f7a4f` | ME, NH, VT, MA, RI, CT, NY, NJ |
| American Union State ("Blue States") | navy `#1f3a66` | VA, NC, SC, GA, FL, AL, MS, TN, KY, AR, LA, TX, OK, NM |
| Revolutionary States ("Red States" / R.S.A.) | red `#8c2c26` | PA, DE, MD, DC, WV, OH, MI, WI, IL, IN, MN, IA, MO, KS, NE, SD, ND, MT, WY, CO, UT, ID |
| Congressional States ("Pacific States") | gold `#c98a2b` | WA, OR, CA, NV, AZ |

The briefing card's own map put all of this under one Loyalist claim
(capital Atlanta) reaching from New England down through the South; this
map now shows New England as its own region again instead, so its lore
text still reads as loyal to the same government/flag as the American
Union State, just administered separately on the map.

Each state also renders as its own subtle shade of its faction's base
colour with a thin border to its neighbours (`data/states.geojson`, also
built by `build-territories.py`). It's a purely visual mosaic layered on
top of the flat per-faction fill: clicking anywhere still selects the
faction (the mosaic is `interactive:false` in `atlas.js`, so clicks/hover
fall straight through to the faction layer underneath), and the shade is
a small deterministic hash-based lightness offset per state (`shade()` in
the script) rather than anything meaningful about that state individually.

It's meant to read as "this flat region is made of states" at a glance,
not to compete with the flat colour once you're zoomed in close enough to
be looking at one or two states -- at that range the borders/shading just
looked like noise cutting across what should read as one solid colour. So
`atlas.js`'s `updateMosaicOpacity()` fades the whole `states` pane's own
opacity down as you zoom in (full strength at/below `MOSAIC_FADE_ZOOM`
(5), down to a bare `MOSAIC_MIN_OPACITY` (0.18) hint by `MOSAIC_FLAT_ZOOM`
(9) rather than vanishing outright), letting the flat `.faction-fill`
colour beneath dominate instead.

Alaska and Hawaii weren't states in 1940 and take no active part in the
war, so instead of a solid fill each is drawn with a moving diagonal hatch
(SVG `<pattern>` + SMIL `<animateTransform>`, defined inline at the top of
`index.html`, applied by `atlas.js` setting `layer._path.style.fill` since
Leaflet's own `fillColor` option can't take a `url(#...)` paint server) in
shades of its nominal faction's colour: Alaska under the American Union State,
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

Real flag art now exists for two of the four factions, supplied as
Illustrator/PDF vectors and rasterised here (`pdftoppm`) rather than
redrawn by hand:

- **American Union State** — `assets/flags/american-union-state.png`, the
  supplied AUS eagle-on-blue vector. Links to
  `https://flagmaker-print.com/products/american-union-state-flag-kaiserreich`,
  the same product already used on the homepage -- this faction was in
  fact renamed to "American Union State" specifically to match this real
  flag's actual name, having briefly been called "Loyalist States" per
  the briefing cards.
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
- **New England** — `assets/flags/new-england.svg`, the original
  hand-drawn placeholder from the very first pass (a plain white pine
  tree on green, restored along with the region itself). No real product
  URL either, same collection-link fallback as Congressional States.

The button text reads "Purchase this flag on Flagmaker & Print" (was
"Purchase a flag" in the first two passes), and `#panel` widened from
300px to 340px (plus `.flag-buy{white-space:nowrap}`) so that line no
longer wraps.

`atlas.js`'s `FLAG_IMAGE_EXT` map records which extension (`png` vs `svg`)
each faction's flag file uses, since `showDetails()` needs to build the
right filename per faction rather than assuming one extension for all.

## Map detail: coastline, lakes, rivers, roads, capitals

The first alpha was criticized as too low-res/empty at any real zoom, so
`scripts/build-map-layers.py` now produces four more layers alongside the
territories, all clipped to a `lon -170..-50, lat 5..75` North America box:

- `data/land.geojson` — coastline, simplified at a finer 0.003° tolerance
  than the first pass's 0.01° for visibly crisper detail. The Great Lakes
  are cut out of it as true holes. The first attempt at this
  (`land_raw.difference(lakes_raw)` for *all* 412 features in
  `natural-earth-lakes.geojson`, simplified once as a single geometry)
  still produced jagged shard artifacts, worst north of Lake Superior --
  the fix wasn't simplification order, it was differencing hundreds of
  small, densely-packed Canadian Shield lakes in the same pass as the
  five actual Great Lakes; that many nearby holes sharing one
  `simplify()` call is exactly the shape that produces self-intersecting
  shards. Only the five lakes named `Lake Superior`/`Michigan`/`Huron`/
  `Erie`/`Ontario` are cut now, each individually simplified (0.0015°)
  and buffered out by ~110 m *before* the difference, so a residual
  tracing mismatch between the land and lakes datasets erodes into the
  hole instead of surviving as a sliver of exposed sea colour. Smaller
  named lakes elsewhere may still show the original artifact; only the
  Great Lakes were in scope for this fix.

  This same five-lake cut is *also* applied in `build-territories.py`
  to every state polygon (both `data/territories.geojson`'s dissolved
  faction shapes and `data/states.geojson`'s per-state mosaic) -- state/
  admin-1 boundaries aren't clipped to the lakeshore, so without this the
  faction/state fill painted straight across the Great Lakes instead of
  leaving them showing as open water.
- `data/lakes.geojson` — the full lake footprint (all 412 features, not
  just the five Great Lakes cut into `land.geojson`), kept as data but
  not rendered as its own map layer today, since land's own holes already
  show the sea-black through with no seam risk for the ones that matter.
- `data/rivers.geojson` — Natural Earth rivers filtered to `scalerank<=6`
  (keeps the Mississippi/Missouri/Ohio/Columbia/Rio Grande tier plus a
  wider set of named tributaries; dropped to `<=5` in the first pass, its
  `#4a6b7a` stroke was also too close to the land/faction colours to read
  as water at a glance -- now a lighter, more distinctly blue `#6fa0b8` at
  1.5px).
- `data/capitals.geojson` — all 50 state capitals, from
  `sources/natural-earth-populated-places.geojson`'s `Admin-1 capital`
  rows. Styled as a small solid chip (`.capital-mark`) with a diamond
  glyph and bold condensed text, echoing the briefing cards' own
  "SACRAMENTO"-style capital callout rather than plain map text --
  `.capital-mark` must be `inline-flex`, not `flex`: Leaflet's own divIcon
  wrapper is a fixed 12x12 anchor box, and a block-level flex child's auto
  width fills that containing block instead of shrink-wrapping its own
  content, which is why the dark chip background used to cover only the
  icon while the city name spilled out past it with no backing. `atlas.js`
  fades AND grows capitals in by zoom rather than snapping them straight
  to full strength: hidden below `CAPITAL_MIN_ZOOM` (5), ramping from
  35%/55% scale up to 100%/100% opacity-and-scale by `CAPITAL_FULL_ZOOM`
  (8), so the map doesn't jump from empty to 50 loud labels in one scroll
  tick -- the scale is a CSS custom property (`--scale`, read by a
  `transform:scale()` on `.capital-mark`) that `atlas.js` sets alongside
  opacity on the same element.

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
- `data/territories.geojson` — the four factions + affiliated AK/HI,
  generated by `scripts/build-territories.py` (see above).
- `data/states.geojson` — the per-state shade mosaic, also generated by
  `build-territories.py` (see above).
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
