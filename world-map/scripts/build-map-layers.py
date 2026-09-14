#!/usr/bin/env python3
"""Rebuild the map's base layers: coastline, Great Lakes, major rivers and
state capitals. Everything here is clipped to a North America bounding box
(lon -170..-50, lat 5..75) and simplified just enough to stay small.

Requires shapely >= 2. Run from this directory:
    python3 scripts/build-map-layers.py

(Major roads are built separately by build-roads.py -- that one needs a
fresh ~50 MB download and isn't run automatically here.)
"""
import json
from pathlib import Path

from shapely.geometry import shape, mapping, box, Point
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "sources"
DATA = ROOT / "data"
BBOX = box(-170, 5, -50, 75)


def clip_dissolve(path, simplify_tol, predicate=None):
    src = json.loads((SRC / path).read_text())
    geoms = []
    for feature in src["features"]:
        if predicate and not predicate(feature["properties"]):
            continue
        geom = shape(feature["geometry"])
        if not geom.intersects(BBOX):
            continue
        clipped = geom.intersection(BBOX)
        if not clipped.is_empty:
            geoms.append(clipped)
    merged = unary_union(geoms)
    if simplify_tol:
        merged = merged.simplify(simplify_tol, preserve_topology=True)
    return merged


def write(name, geometry_or_features):
    out = DATA / name
    if isinstance(geometry_or_features, list):
        fc = {"type": "FeatureCollection", "features": geometry_or_features}
    else:
        fc = {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "properties": {}, "geometry": mapping(geometry_or_features)}],
        }
    out.write_text(json.dumps(fc))
    print(f"Wrote {out} ({out.stat().st_size} bytes)")


GREAT_LAKES = {"Lake Superior", "Lake Michigan", "Lake Huron", "Lake Erie", "Lake Ontario"}


def main():
    # Coastline -- finer tolerance than the first pass (0.003 vs 0.01) for a
    # visibly crisper edge at the zoom levels this page actually uses.
    #
    # The Great Lakes aren't holes in Natural Earth's land polygon (it's
    # solid landmass there), so the first pass drew them as a *separate*
    # lakes layer on top of land -- independently simplified, so its
    # boundary didn't quite line up with land's, leaving jagged sliver
    # gaps of bare sea colour between the two mismatched edges. Cutting
    # the lakes out of land *before* simplifying (one shared topology,
    # simplified together) was meant to fix that by construction, but the
    # artifacts persisted -- because the source of the mismatch wasn't
    # simplification order at all, it was subtracting the *entire*
    # 412-feature natural-earth-lakes layer (which includes hundreds of
    # small, densely-packed Canadian Shield lakes north of Superior) as
    # one unary_union+difference pass; that many nearby small holes
    # sharing one simplify() call is exactly the shape that produces
    # shattered-looking self-intersection artifacts. The five Great Lakes
    # themselves are each a single valid polygon -- only they need to be
    # holes for this map to read correctly -- so only they get cut,
    # individually simplified before differencing so five simple shapes
    # never have to survive one simplify() pass together with hundreds of
    # tiny ones. Each is also buffered out by a hair (~110 m) before the
    # cut, so any residual tracing mismatch between the land and lakes
    # *datasets* (not just simplification) erodes into the hole rather
    # than surviving as a sliver of exposed sea colour along the shore.
    land_raw = clip_dissolve("natural-earth-land.geojson", None)
    lakes_src = json.loads((SRC / "natural-earth-lakes.geojson").read_text())
    great_lakes = [
        shape(f["geometry"]).simplify(0.0015, preserve_topology=True).buffer(0.001)
        for f in lakes_src["features"]
        if f["properties"].get("name") in GREAT_LAKES
    ]
    land = land_raw.difference(unary_union(great_lakes)).simplify(0.003, preserve_topology=True)
    write("land.geojson", land)

    # The full lakes layer (all 412 features, not just the Great Lakes),
    # kept as its own file in case a future pass wants water styled
    # differently from open sea -- not rendered as a map layer today.
    lakes_raw = clip_dissolve("natural-earth-lakes.geojson", None)
    lakes = lakes_raw.simplify(0.003, preserve_topology=True)
    write("lakes.geojson", lakes)

    rivers_src = json.loads((SRC / "natural-earth-rivers.geojson").read_text())
    river_features = []
    for feature in rivers_src["features"]:
        if (feature["properties"].get("scalerank") or 9) > 6:
            continue
        geom = shape(feature["geometry"])
        if not geom.intersects(BBOX):
            continue
        clipped = geom.intersection(BBOX).simplify(0.004, preserve_topology=True)
        if clipped.is_empty:
            continue
        river_features.append(
            {
                "type": "Feature",
                "properties": {"name": feature["properties"].get("name")},
                "geometry": mapping(clipped),
            }
        )
    write("rivers.geojson", river_features)

    places = json.loads((SRC / "natural-earth-populated-places.geojson").read_text())
    capital_features = []
    for feature in places["features"]:
        props = feature["properties"]
        if props.get("FEATURECLA") != "Admin-1 capital" or props.get("ADM0NAME") != "United States of America":
            continue
        capital_features.append(
            {
                "type": "Feature",
                "properties": {"name": props.get("NAME"), "state": props.get("ADM1NAME")},
                "geometry": {"type": "Point", "coordinates": [props.get("LONGITUDE"), props.get("LATITUDE")]},
            }
        )
    write("capitals.geojson", capital_features)


if __name__ == "__main__":
    main()
