#!/usr/bin/env python3
"""Build the phone atlas: a single bundled, lower-detail data/mobile/atlas.json
for narrow/touch viewports, in place of the six separate full-resolution
GeoJSON files atlas.js otherwise fetches.

Territories and states are each dissolved from the same admin-1 source
without any independent simplification, so their borders already share
exact edges -- coverage_simplify() keeps that guarantee (no gaps or
slivers opening up between neighbours) while cutting vertex count.

Rivers and the major-highways layer are dropped entirely rather than
simplified: they're decorative overlays, not needed to read the map, and
roads.geojson alone (major highways) is the single heaviest file in data/.

Requires Shapely >= 2.1. Run after editing the full-resolution data:
    python3 world-map/scripts/build-mobile-map.py
"""
import gzip
import json
from pathlib import Path

from shapely import coverage_is_valid, coverage_simplify, make_valid, set_precision
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def read(name):
    return json.loads((DATA / f"{name}.geojson").read_text(encoding="utf-8"))


def parts(g):
    if g.geom_type == "Polygon":
        return [g]
    return [p for c in getattr(g, "geoms", []) for p in parts(c)]


def clean(g):
    return unary_union(parts(make_valid(g)))


def rounded(value):
    if isinstance(value, float):
        return round(value, 5)
    if isinstance(value, (list, tuple)):
        return [rounded(v) for v in value]
    if isinstance(value, dict):
        return {k: rounded(v) for k, v in value.items()}
    return value


def simplify_coverage(name, tolerance, keep_keys):
    """Simplify every feature in `name`.geojson together as one shared-edge
    coverage, so neighbouring features stay seamless after simplification
    instead of drifting apart into gaps or overlaps."""
    fc = read(name)
    geoms = [set_precision(clean(shape(f["geometry"])), 0.00001) for f in fc["features"]]
    assert coverage_is_valid(geoms), f"{name}.geojson edges must already match before simplification"
    simplified = coverage_simplify(geoms, tolerance)
    assert coverage_is_valid(simplified), f"Simplified {name} borders must remain non-overlapping"
    features = []
    for original, g in zip(fc["features"], simplified):
        g = set_precision(g, 0.00001)
        if g.is_empty:
            continue
        properties = {k: v for k, v in original["properties"].items() if k in keep_keys}
        features.append({"type": "Feature", "properties": properties, "geometry": mapping(g)})
    return {"type": "FeatureCollection", "features": features}


def simplify_land(tolerance, min_area):
    features = []
    for f in read("land")["features"]:
        for p in parts(clean(shape(f["geometry"]))):
            if p.area < min_area:
                continue
            g = p.simplify(tolerance, preserve_topology=True)
            if not g.is_empty:
                features.append({"type": "Feature", "properties": {}, "geometry": mapping(g)})
    return {"type": "FeatureCollection", "features": features}


def main():
    bundle = {
        "territories": simplify_coverage(
            "territories", 0.08, {"id", "name", "kind", "faction", "color", "summary", "states"}
        ),
        "states": simplify_coverage("states", 0.03, {"postal", "faction", "color", "line"}),
        # Broad coastline only -- tiny slivers of land under min_area (a
        # degree^2 here, roughly a small island) are dropped rather than
        # kept and butchered by the coarser tolerance.
        "land": simplify_land(0.02, 0.001),
        # Capitals are already tiny point data; no reduction needed.
        "capitals": read("capitals"),
    }
    bundle = rounded(bundle)
    for collection in bundle.values():
        for f in collection["features"]:
            g = shape(f["geometry"])
            if not g.is_valid:
                f["geometry"] = mapping(clean(g))
            assert shape(f["geometry"]).is_valid

    raw = json.dumps(bundle, separators=(",", ":")).encode()
    out = DATA / "mobile"
    out.mkdir(exist_ok=True)
    (out / "atlas.json").write_bytes(raw)

    source_bytes = sum(
        (DATA / f"{n}.geojson").stat().st_size for n in ["land", "territories", "states", "roads", "rivers"]
    )
    stats = {
        "fullDataBytes": source_bytes,
        "mobileDataBytes": len(raw),
        "mobileGzipBytes": len(gzip.compress(raw)),
        "reductionPercent": round(100 * (1 - len(raw) / source_bytes), 1),
    }
    (out / "build-stats.json").write_text(json.dumps(stats, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(stats))


if __name__ == "__main__":
    main()
