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

`atlas.js` now uses the same custom polar-azimuthal CRS as the AK atlas
(`L.CRS.PolarAzimuthal`, centred on the North Pole rather than Leaflet's
default Web Mercator) instead of the plain Web Mercator this page started
with -- it reads better even at continental-US scale, since Mercator
visibly stretches Canada/the Great Lakes relative to the Gulf states.
Copied over function-for-function (project/unproject/`lon0`); the CRS's
`code` string is `DS:polar-azimuthal` rather than AK's `AK:polar-azimuthal`
so the two are distinguishable if ever inspected side by side, though both
still register under the same `L.CRS.PolarAzimuthal` global since the two
pages never load together.

The sea is a dark grey (`#2b2b2e`, previously near-black `#121214` -- pure
black read as a void the grain couldn't show up over) and land a bright
warm grey (`#b3ab9c`), matching the reference newsreel stills' own high
contrast -- the first pass had both at similar muddy mid-tones. `#map::after`'s
overlay was a `repeating-linear-gradient` scanline stripe (read as a CRT
effect, not the intended film-print look); it's now a directional
`feTurbulence` (`type="turbulence"`, uneven x/y `baseFrequency`) grain,
`multiply`-blended so it darkens unevenly like ink soaking into paper
fibre instead of a uniform overlay wash. `#map::before` is a single fine
`feTurbulence` grain layer, `overlay`-blended. A coarser second
`background-image` (big pale blotches, meant to read as aged-paper
watermarks) was tried alongside it but rolled back -- too messy on top of
the state mosaic -- so `::before` stays the one grain layer. The Leaflet
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

It's meant to read as "this region is made of individual states" once
you're zoomed in close, not to compete with the flat colour at the
whole-US overview -- at that range the borders/shading just looked like
noise cutting across what should read as one solid colour. So
`atlas.js`'s `updateMosaicOpacity()` keeps the whole `states` pane's own
opacity down near a bare `MOSAIC_MIN_OPACITY` (0.18) hint at/below
`MOSAIC_FADE_ZOOM` (5) -- letting the flat `.faction-fill` colour beneath
dominate at the whole-US view -- and ramps it up to full opacity by
`MOSAIC_FULL_ZOOM` (9) as you zoom in toward city level.

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

Real flag art now exists for all four factions -- American Union
State/Congressional States supplied as Illustrator/PDF vectors and
rasterised here (`pdftoppm`); Revolutionary States/New England supplied
directly as production JPG/PNG. Every faction links to its own real
Flagmaker product page (`atlas.js`'s `FLAG_LINKS`) -- none fall back to the
generic collection link any more:

- **American Union State** — `assets/flags/american-union-state.png`, the
  supplied AUS eagle-on-blue vector. Links to
  `https://flagmaker-print.com/products/american-union-state-flag-kaiserreich`,
  the same product already used on the homepage -- this faction was in
  fact renamed to "American Union State" specifically to match this real
  flag's actual name, having briefly been called "Loyalist States" per
  the briefing cards.
- **Congressional States** — `assets/flags/congressional-states.png`, the
  supplied Pacific States/PSA vector (white-red-gold bands, navy star and
  bear). Links to
  `https://flagmaker-print.com/products/pacific-states-bear-flag-the-divided-states`.
- **Revolutionary States** — `assets/flags/revolutionary-states.png`, the
  supplied production art: a black canton (white gear, star and crossed
  hammer-and-pick badge) against diagonal red/white stripes, split by a
  white bevel band. Links to
  `https://flagmaker-print.com/products/revolutionary-states-flag-the-divided-states`.
- **New England** — `assets/flags/new-england.jpg`, the supplied
  production art: a white canton with a green pine tree on a green field,
  six white stars in a ring to its right. Links to
  `https://flagmaker-print.com/products/new-england-flag-kaiserreich`.

(An earlier pass shipped hand-drawn SVG placeholders for these two,
redrawn from reference screenshots pending the real files -- replaced here
now that the actual production art has been supplied.)

Alaska and Hawaii aren't active belligerents (see below) and show their
own real 1940s-America state flags in the info panel rather than their
nominal faction's:

- **Alaska** — `assets/flags/alaska.svg`, the real eight-gold-star Big
  Dipper/North Star flag on dark blue. Links to
  `https://flagmaker-print.com/products/alaska-state-flag-united-states`.
- **Hawaii** — `assets/flags/hawaii.svg`, the real eight-stripe flag with
  a Union Jack canton. Links to
  `https://flagmaker-print.com/products/hawaii-state-flag-united-states`.

`atlas.js`'s `AFFILIATED_OWN_FLAG` maps each affiliated territory id
(`territory-ak`/`territory-hi`) to its own flag id, and `showDetails()`
checks that map before falling back to `feature.properties.faction` --
every other territory still shows its faction's flag as before.

The button text reads "Purchase this flag on Flagmaker & Print" (was
"Purchase a flag" in the first two passes), and `#panel` widened from
300px to 340px (plus `.flag-buy{white-space:nowrap}`) so that line no
longer wraps.

`atlas.js`'s `FLAG_IMAGE_EXT` map records which extension (`png` vs `svg`)
each flag id's file uses, since `showDetails()` needs to build the right
filename rather than assuming one extension for all.

## Info panel: selecting a territory

`showDetails()` sets `#panel-title` (the panel heading, otherwise a static
"Map key") to the selected territory's name, so it stays visible even once
the visitor scrolls the panel body down to the toggles -- and resets
`.panel-body`'s `scrollTop` to 0 on every selection, so tapping the next
territory always brings its flag and name back into view rather than
staying wherever the previous territory had it scrolled to.

## Factions carousel -- moved to the homepage

An earlier pass added a Factions carousel below the map on this page. It's
since moved to the homepage instead (`#factions` in the root `index.html`,
below the Map Promo section) and expanded to eight cards -- the four
factions plus the German Empire, Soviet Union, Canada and the British
Empire, the great powers backing each side. See the root `README.md` for
that section's own notes; nothing faction-carousel-specific remains in
this directory.

Every outbound link on this page (site menu, "Back to The Divided States",
"Read more about The Divided States", the flag buy link) still opens in a
new tab (`target="_blank" rel="noopener"`) -- this page is a tool people
explore in place, not somewhere they want to navigate away from.

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

## Mobile layout fixes

Two narrow-viewport layout bugs, independent of the performance work
below: the zoom `+`/`-` control was anchored `bottomright`, which on
mobile sat right on top of `#panel` (docked along the bottom edge there,
see its `@media(max-width:760px)` rule) -- now `topright`, clear of the
panel at every width, matching where the AK atlas puts its own zoom
control for the same reason. And `header`'s three flex children (logo,
title, "Map key" button) used to free-wrap in source order, which on a
narrow screen could land the title squeezed into whatever width was left
between the other two rather than getting its own row; the mobile media
query now pins logo+button to one row (`order`, `margin-left:auto`) and
the title to its own full-width row underneath, at a smaller size.

## Mobile performance: a lower-detail bundle

The full data set (`land`, `territories`, `states`, `rivers`, `roads`,
`capitals`) runs to ~1.8 MB of GeoJSON, dominated by vertex-dense
coastline and state borders plus `roads.geojson` (the major-highways
overlay alone is the single heaviest file). Fine at continental-US zoom on
a desktop, but excessive for a phone: pinch-zoom has to re-render that
much vector detail on every frame, and it's rarely visible at the zoom
level a phone screen actually shows.

`scripts/build-mobile-map.py` (needs `shapely>=2.1`) bundles a
pre-simplified, single-request replacement, written to
`data/mobile/atlas.json`:

- `territories` and `states` are each simplified as one shared-edge
  coverage (`shapely.coverage_simplify`) rather than feature-by-feature --
  both were dissolved from the same admin-1 source with no independent
  rounding, so their borders already share exact edges going in, and
  coverage-simplifying keeps that guarantee instead of letting
  neighbouring polygons drift apart into gaps or overlapping slivers the
  way simplifying each one separately would.
- `land` gets a coarser coastline pass (0.02° vs the desktop file's
  0.003°) and drops slivers under ~0.001° of area outright.
- `rivers` and `roads` are dropped entirely rather than simplified --
  both are decorative, not needed to read the map, and skipping them is
  most of the size win.
- `capitals` is copied through unsimplified; it's already tiny point data.

Run it after regenerating any of the source files above:

```
python3 world-map/scripts/build-mobile-map.py
```

It prints a size comparison (`fullDataBytes` vs `mobileDataBytes`/
`mobileGzipBytes`) and writes the same numbers to
`data/mobile/build-stats.json`; last run was a ~78% reduction (1.8 MB to
~400 KB raw, ~136 KB gzipped).

`atlas.js` decides whether to use it via a `liteMode` flag -- true on a
narrow viewport (`max-width:900px`), a coarse pointer under 1200px, or
`navigator.connection.saveData`, and overridable with `?detail=full` or
`?detail=lite` on the URL for testing either path on any device. In lite
mode, every layer fetch goes through one `loadLayer()` helper that pulls
from the single cached `data/mobile/atlas.json` response instead of six
separate requests; `rivers`/`roads` resolve to an empty FeatureCollection
client-side rather than being fetched at all, and the now-inert "Major
highways"/"Rivers" checkboxes in the map key are hidden (`document
.documentElement.classList.toggle("atlas-lite", liteMode)` also flags the
`<html>` element, in case a future style needs to key off it).

## Files

- `index.html`, `atlas.css`, `atlas.js` — the page.
- `data/territories.geojson` — the four factions + affiliated AK/HI,
  generated by `scripts/build-territories.py` (see above).
- `data/states.geojson` — the per-state shade mosaic, also generated by
  `build-territories.py` (see above).
- `data/land.geojson`, `data/lakes.geojson`, `data/rivers.geojson`,
  `data/capitals.geojson`, `data/roads.geojson` — base map layers (see
  above).
- `data/mobile/atlas.json`, `data/mobile/build-stats.json` — the bundled
  lower-detail data phones load instead, generated by
  `scripts/build-mobile-map.py` (see above).
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
