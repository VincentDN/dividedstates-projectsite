#!/usr/bin/env python3
"""Build data/roads.geojson: major US highways (Interstates and similar),
for the map's road layer.

Source: Natural Earth 1:10m roads (public domain), too large (~50 MB) to
vendor in this repo, so this script re-downloads it each run rather than
reading a committed copy in sources/. Requires network access and shapely.

Run from this directory:
    python3 scripts/build-roads.py
"""
import json
import urllib.request
from pathlib import Path

from shapely.geometry import shape, mapping, box

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "roads.geojson"
URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_roads.geojson"
BBOX = box(-170, 5, -50, 75)


def main():
    print("Downloading Natural Earth roads (~50 MB, may take a minute)...")
    with urllib.request.urlopen(URL, timeout=180) as resp:
        data = json.load(resp)

    features = []
    for feature in data["features"]:
        props = feature["properties"]
        if props.get("sov_a3") != "USA" or props.get("type") != "Major Highway":
            continue
        geom = shape(feature["geometry"])
        if not geom.intersects(BBOX):
            continue
        geom = geom.intersection(BBOX).simplify(0.005, preserve_topology=True)
        if geom.is_empty:
            continue
        features.append(
            {
                "type": "Feature",
                "properties": {"label": props.get("label")},
                "geometry": mapping(geom),
            }
        )

    fc = {"type": "FeatureCollection", "features": features}
    OUT.write_text(json.dumps(fc))
    print(f"Wrote {len(features)} features to {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
