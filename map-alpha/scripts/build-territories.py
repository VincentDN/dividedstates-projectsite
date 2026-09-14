#!/usr/bin/env python3
"""Build data/territories.geojson for the Divided States map-alpha page.

Dissolves US state polygons (Natural Earth 1:50m admin-1, public domain,
downloaded for the American Kingdoms atlas and copied into
sources/natural-earth-admin1-states.geojson here) into four macro-region
factions per the provisional 1940 Second American Civil War split, plus
Alaska/Hawaii and Canada/Mexico as uncoloured neutral context.

The state-to-faction assignment is a best-effort placeholder based on the
reference art supplied for this page and the existing site copy ("Chicago
and Washington have fallen" -> DC is Revolutionary States, not loyalist),
not confirmed canon. See map-alpha/README.md for how to revise it.

Requires shapely >= 2.

Run from the repository root:
    python3 map-alpha/scripts/build-territories.py
"""
import json
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "sources" / "natural-earth-admin1-states.geojson"
OUT = ROOT / "data" / "territories.geojson"

# Provisional 1940 four-way split. DC and Maryland fall with the Revolutionary
# States per the front page's existing "Chicago and Washington have fallen"
# copy; New England is the loyalist rump cut off north of the Mason-Dixon
# line; the American Union State (Huey Long) holds the South; the
# Congressional States hold the Pacific coast and Southwest.
FACTIONS = {
    "new-england": {
        "name": "New England",
        "color": "#5f7a4f",
        "states": ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ"],
        "summary": (
            "Cut off from the capital when Washington fell, the loyalist "
            "Federal government retreated to the Northeast Corridor. New "
            "England remains the last stronghold flying the old flag, "
            "hemmed in by the Revolutionary States to the west and south."
        ),
    },
    "revolutionary-states": {
        "name": "Revolutionary States",
        "color": "#8c2c26",
        "states": [
            "PA", "DE", "MD", "DC", "WV", "OH", "MI", "WI", "IL", "IN",
            "MN", "IA", "MO", "KS", "NE", "SD", "ND", "MT", "WY", "CO",
            "UT", "ID",
        ],
        "summary": (
            "Born from the Red revolution that swept the Great Lakes and "
            "toppled Federal authority in Washington and Chicago alike, "
            "the Revolutionary States now hold the industrial heartland "
            "and the high plains beyond it."
        ),
    },
    "american-union-state": {
        "name": "American Union State",
        "color": "#5a6b78",
        "states": [
            "VA", "NC", "SC", "GA", "FL", "AL", "MS", "TN", "KY", "AR",
            "LA", "TX", "OK", "NM",
        ],
        "summary": (
            "Huey Long's corporatist South, built on the old Democratic "
            "machine and a promise that every man would be a king -- so "
            "long as he answered to Baton Rouge."
        ),
    },
    "congressional-states": {
        "name": "Congressional States",
        "color": "#c98a2b",
        "states": ["WA", "OR", "CA", "NV", "AZ"],
        "summary": (
            "The Pacific coast's answer to a Union that no longer governs "
            "it: an independent, professedly constitutional government "
            "holding the West behind the Rockies and the desert."
        ),
    },
}

STATE_TO_FACTION = {
    code: fid for fid, data in FACTIONS.items() for code in data["states"]
}

# Alaska and Hawaii weren't states in 1940 and sit outside the civil war
# entirely, but each is nominally under one side's flag -- Alaska as an
# American Union State territory (the AUS held the Gulf shipping lanes a
# territorial government would have depended on), Hawaii under the
# Congressional States' Pacific fleet. Neither actively participates, so
# they're tagged "affiliated" rather than "faction" and rendered with the
# animated diagonal treatment instead of a solid fill.
AFFILIATED_TERRITORIES = {
    "AK": {
        "faction": "american-union-state",
        "summary": (
            "Alaska is nominally American Union State territory, its "
            "governor answering to Baton Rouge -- but it takes no active "
            "part in the war. Too remote, too thinly settled, and not "
            "yet a state to fight over."
        ),
    },
    "HI": {
        "faction": "congressional-states",
        "summary": (
            "Hawaii falls under the Congressional States' Pacific claim, "
            "home to their fleet -- but it isn't a state yet, and it "
            "takes no active part in the war on the mainland."
        ),
    },
}


def main():
    src = json.loads(SRC.read_text())
    us_by_postal = {}
    territory = {}  # unassigned-but-US, kept neutral (Alaska, Hawaii)
    for feature in src["features"]:
        props = feature["properties"]
        if props.get("iso_a2") != "US":
            continue
        postal = props.get("postal")
        geom = shape(feature["geometry"])
        if postal in STATE_TO_FACTION:
            us_by_postal.setdefault(STATE_TO_FACTION[postal], []).append(geom)
        else:
            territory[postal] = (props.get("name"), geom)

    features = []
    for fid, data in FACTIONS.items():
        geoms = us_by_postal.get(fid, [])
        if not geoms:
            continue
        merged = unary_union(geoms)
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": fid,
                    "name": data["name"],
                    "kind": "faction",
                    "color": data["color"],
                    "summary": data["summary"],
                    "states": data["states"],
                },
                "geometry": mapping(merged),
            }
        )

    for postal, (name, geom) in territory.items():
        affiliation = AFFILIATED_TERRITORIES.get(postal)
        if affiliation:
            faction_id = affiliation["faction"]
            features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "id": f"territory-{postal.lower()}",
                        "name": name,
                        "kind": "affiliated",
                        "faction": faction_id,
                        "color": FACTIONS[faction_id]["color"],
                        "summary": affiliation["summary"],
                        "states": [postal],
                    },
                    "geometry": mapping(geom),
                }
            )
            continue

        features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": f"territory-{postal.lower()}",
                    "name": name,
                    "kind": "territory",
                    "color": "#9a9a90",
                    "summary": (
                        f"{name} is a U.S. territory in 1940, not yet a "
                        "state and not claimed by any of the four "
                        "factions in this civil war."
                    ),
                    "states": [postal],
                },
                "geometry": mapping(geom),
            }
        )

    fc = {"type": "FeatureCollection", "features": features}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(fc))
    print(f"Wrote {len(features)} features to {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
