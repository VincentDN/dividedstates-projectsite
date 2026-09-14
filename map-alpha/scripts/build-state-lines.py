#!/usr/bin/env python3
"""Build data/state-lines.geojson: individual (undissolved) US state borders,
simplified, for the paper-style variant's dashed internal county/state-line
texture (drawn under the faction fills, the way the WWII reference map
shows thin dashed county lines inside solid-coloured occupation zones).

Requires shapely >= 2. Run from this directory:
    python3 scripts/build-state-lines.py
"""
import json
from pathlib import Path

from shapely.geometry import shape, mapping

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "sources" / "natural-earth-admin1-states.geojson"
OUT = ROOT / "data" / "state-lines.geojson"


def main():
    src = json.loads(SRC.read_text())
    features = []
    for feature in src["features"]:
        props = feature["properties"]
        if props.get("iso_a2") != "US":
            continue
        geom = shape(feature["geometry"]).simplify(0.01, preserve_topology=True)
        features.append(
            {
                "type": "Feature",
                "properties": {"postal": props.get("postal"), "name": props.get("name")},
                "geometry": mapping(geom),
            }
        )
    fc = {"type": "FeatureCollection", "features": features}
    OUT.write_text(json.dumps(fc))
    print(f"Wrote {len(features)} features to {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
