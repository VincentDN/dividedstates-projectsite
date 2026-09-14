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

Alaska and Hawaii are drawn as neutral, uncoloured U.S. territory (neither
was a state in 1940, and the reference art doesn't cover them).

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

## Files

- `index.html`, `atlas.css`, `atlas.js` — the page.
- `data/territories.geojson` — the four factions + AK/HI, generated (see
  above).
- `data/land.geojson` — North America coastline, clipped and simplified
  from `sources/natural-earth-land.geojson` (originally full-world) to a
  `lon -170..-50, lat 5..75` box, ~320 KB down from 1.6 MB.
- `sources/` — the raw Natural Earth inputs (public domain; see the AK
  atlas's README for full sourcing/license notes, same data).
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
