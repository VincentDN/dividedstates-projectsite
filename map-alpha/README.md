# Divided States map — alpha

An interactive map of the Second American Civil War (1940), styled after the
retro B&W newsreel maps supplied as reference and the four-faction colour
key from the reference screenshot (orange West, red centre, blue-grey South,
green Northeast). Modelled on the American Kingdoms atlas at
`americankingdoms-projectsite/medieval-america-map/` (same general Leaflet
+ GeoJSON + details-panel setup), rebuilt from scratch here rather than
copied wholesale: this map has no submaps, city markers, culture/realm mode
toggle or `?edit=1` editor, and uses Leaflet's default Web Mercator instead
of AK's custom polar projection (unnecessary at continental-US scale).

Not linked from the homepage nav and marked `noindex, nofollow` — an
orphaned page reachable only by its direct URL, `/map-alpha/`, per the
request that put it here.

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

## The four factions and their borders — provisional, not canon

`scripts/build-territories.py` dissolves US state polygons (Natural Earth
1:50m admin-1, public domain, copied from the AK atlas's own
`sources/natural-earth-admin1-states.geojson` into this page's
`sources/`) into four macro-regions, real 1940 state lines standing in for
whatever the eventual in-universe borders turn out to be:

| Faction | Colour | States |
| --- | --- | --- |
| New England | green `#5f7a4f` | ME, NH, VT, MA, RI, CT, NY, NJ |
| Revolutionary States | red `#8c2c26` | PA, DE, MD, DC, WV, OH, MI, WI, IL, IN, MN, IA, MO, KS, NE, SD, ND, MT, WY, CO, UT, ID |
| American Union State | blue-grey `#5a6b78` | VA, NC, SC, GA, FL, AL, MS, TN, KY, AR, LA, TX, OK, NM |
| Congressional States | orange `#c98a2b` | WA, OR, CA, NV, AZ |

Alaska and Hawaii weren't states in 1940 and take no active part in the
war, so instead of a solid fill each is drawn with a moving diagonal hatch
(SVG `<pattern>` + SMIL `<animateTransform>`, defined inline at the top of
`index.html`, applied by `atlas.js` setting `layer._path.style.fill` since
Leaflet's own `fillColor` option can't take a `url(#...)` paint server) in
shades of its nominal faction's colour: Alaska under the American Union
State, Hawaii under the Congressional States. Their flag/buy-a-flag panel
still points at that faction's real flag, via `atlas.js`'s `flagId` lookup.

This split is my best-effort reading of the reference screenshot plus the
homepage's own copy — "Chicago **and Washington** have fallen" put DC (and
Maryland with it) in Revolutionary hands rather than with the loyalist
rump, which is why New England ends at the Hudson rather than covering the
whole mid-Atlantic. It is **not** confirmed canon. To correct it: edit the
`FACTIONS` dict in `scripts/build-territories.py` (state postal codes per
faction) and rerun `python3 scripts/build-territories.py` from this
directory (requires `shapely`) to regenerate `data/territories.geojson`.

## Flags and Flagmaker links

Only the American Union State has a real Flagmaker product today
(`https://flagmaker-print.com/products/american-union-state-flag-kaiserreich`,
already used on the homepage). `atlas.js`'s `FLAG_LINKS` map sends its
"Purchase a flag" button straight there; the other three factions fall back
to the general `/collections/alt-history-flags` collection link until they
get dedicated product pages — add their URLs to `FLAG_LINKS` once they
exist. This is the same follow-up tracked in the root `README.md` roadmap
notes.

The four `assets/flags/*.svg` are original placeholder graphics (not
sourced from any established design) standing in until real flag art
exists, same pattern AK uses for its own provisional territories.

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
  50 overlapping labels. Marked with a small low-opacity diamond (`.capital-mark::before`,
  not a star) and an 8px label, deliberately quiet map furniture rather
  than a competing data layer.

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
`../assets/logo.png` from it) and open `/map-alpha/`:

```
python3 -m http.server 4187
```

## Deploying

This directory only needs to ship alongside the rest of the repository
root on the existing Cloudflare Pages project, the same one serving
`dividedstates-project.com` today — no new project, domain or build step.
