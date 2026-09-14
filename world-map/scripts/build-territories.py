#!/usr/bin/env python3
"""Build data/territories.geojson for the Divided States world-map page.

Dissolves US state polygons (Natural Earth 1:50m admin-1, public domain,
downloaded for the American Kingdoms atlas and copied into
sources/natural-earth-admin1-states.geojson here) into three macro-region
factions per the "Declassified" faction briefing cards supplied for this
page, plus Alaska/Hawaii as affiliated-but-non-combatant territory.

The state-to-faction assignment is a best-effort placeholder: the briefing
cards' own maps are illustrative/propaganda-style (each faction's card
shows its own claimed territory, and those claims visibly overlap along
the contested Northeast), not a clean partition. Not confirmed canon. See
world-map/README.md for how to revise it.

Requires shapely >= 2.

Run from the repository root:
    python3 world-map/scripts/build-territories.py
"""
import json
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "sources" / "natural-earth-admin1-states.geojson"
OUT = ROOT / "data" / "territories.geojson"

# Three-way split per the briefing cards. The former separate "New England"
# and "American Union State" regions from the first two passes are merged
# into one Loyalist States faction -- the cards' own map shows Loyalist
# territory as one contiguous claim from New England down through the
# South, not two.
FACTIONS = {
    "loyalist-states": {
        "name": "Loyalist States",
        "color": "#1f3a66",
        "states": [
            "ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ",
            "VA", "NC", "SC", "GA", "FL", "AL", "MS", "TN", "KY", "AR",
            "LA", "TX", "OK", "NM",
        ],
        "summary": (
            "Also known as the ‘Blue States,’ the Loyalist States "
            "are an alliance of conservative and reactionary forces under "
            "President Langdon, whose legitimacy dates to the 1936 "
            "election crisis. When Langdon sent the Federal Army to crush "
            "the Labor Revolt against explicit orders from Congress, he "
            "was decried as a tyrant — and when he backed a military "
            "coup to remove Congress entirely, its surviving "
            "representatives fled west to found the Congressional "
            "States.\n\nBoth the Loyalist and Congressional governments "
            "still claim the title United States of America; their Rocky "
            "Mountain border has stood as a demilitarized zone since the "
            "Rocky Mountains Ceasefire. German arms have proven paramount "
            "in pushing back the Red advance, and with Washington "
            "retaken, Langdon is now poised to cut the Revolutionary "
            "States off from the sea."
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
            "Also known as the ‘Red States,’ the Revolutionary "
            "States are a social democratic federation governing the "
            "Great Lakes region as the R.S.A. — its executive branch "
            "answers to a ‘Third Pillar’ of the country’s "
            "largest labor unions, presided over by a Chairman. It was "
            "founded after National Guard forces were defeated in the "
            "Chicago Uprising of 1937, when Russian and French support "
            "let the revolutionaries seize most of the Great Lakes and "
            "parts of the East Coast.\n\nAfter early gains, the Red "
            "States have been pushed out of the central states by "
            "Loyalist forces. The R.S.A. still commands a strong "
            "population and industrial base, but now withstands both a "
            "Canadian Royalist blockade and German meddling to its south."
        ),
    },
    "congressional-states": {
        "name": "Congressional States",
        "color": "#c98a2b",
        "states": ["WA", "OR", "CA", "NV", "AZ"],
        "summary": (
            "Also known as the ‘Pacific States,’ the "
            "Congressional States are a loose alliance of moderate "
            "Republicans and Democrats who fled President Langdon’s "
            "crackdown at the outbreak of the war, led by the remnants of "
            "Congress and anti-Langdon governors who claim to be the last "
            "holdout of true American democracy.\n\nNot at open war with "
            "either side, the Congressional States hold a tenuous "
            "ceasefire along the Rocky Mountains — a policy of "
            "non-intervention dating to Congress’s refusal to send "
            "the Federal military into Chicago at the start of the "
            "revolution. Though the smallest of the three factions, they "
            "enjoy support from the Republic of Japan and Royalist "
            "Canada."
        ),
    },
}

STATE_TO_FACTION = {
    code: fid for fid, data in FACTIONS.items() for code in data["states"]
}

# Alaska and Hawaii weren't states in 1940 and sit outside the civil war
# entirely, but each is nominally under one side's flag -- Alaska as
# Loyalist territory (the Gulf shipping lanes a territorial government
# would have depended on), Hawaii under the Congressional States' Pacific
# fleet. Neither actively participates, so they're tagged "affiliated"
# rather than "faction" and rendered with the animated diagonal treatment
# instead of a solid fill.
AFFILIATED_TERRITORIES = {
    "AK": {
        "faction": "loyalist-states",
        "summary": (
            "Alaska is nominally Loyalist territory, its governor "
            "answering to Atlanta — but it takes no active part in "
            "the war. Too remote, too thinly settled, and not yet a "
            "state to fight over."
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
                        "state and not claimed by any of the three "
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
