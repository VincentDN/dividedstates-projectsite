#!/usr/bin/env python3
"""Build data/territories.geojson and data/states.geojson for the Divided
States world-map page.

territories.geojson dissolves US state polygons (Natural Earth 1:50m
admin-1, public domain, downloaded for the American Kingdoms atlas and
copied into sources/natural-earth-admin1-states.geojson here) into
macro-region factions per the "Declassified" faction briefing cards
supplied for this page, plus Alaska/Hawaii as affiliated-but-non-combatant
territory. It's the interactive layer (click/hover/fit-bounds/labels).

states.geojson keeps each state as its own feature, tagged with its
faction id and a small per-state shade of that faction's colour, plus a
subtle stroke -- a purely visual mosaic drawn on top of territories.geojson
so the flat macro-region reads as individual states once you zoom in,
without changing what a click selects (that's still the faction).

Both files have the Great Lakes cut out of them (not just data/land.geojson
in build-map-layers.py) -- state/admin-1 polygons aren't clipped to the
lakeshore, so without this the faction/state fill painted straight across
the lakes instead of leaving them as open water.

The state-to-faction assignment is a best-effort placeholder: the briefing
cards' own maps are illustrative/propaganda-style (each faction's card
shows its own claimed territory, and those claims visibly overlap along
the contested Northeast), not a clean partition. Not confirmed canon. See
world-map/README.md for how to revise it.

Requires shapely >= 2.

Run from the repository root:
    python3 world-map/scripts/build-territories.py
"""
import colorsys
import json
import zlib
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "sources" / "natural-earth-admin1-states.geojson"
LAKES_SRC = ROOT / "sources" / "natural-earth-lakes.geojson"
OUT = ROOT / "data" / "territories.geojson"
STATES_OUT = ROOT / "data" / "states.geojson"

GREAT_LAKES = {"Lake Superior", "Lake Michigan", "Lake Huron", "Lake Erie", "Lake Ontario"}

# Four-way split per the briefing cards. Order here drives both the
# generated GeoJSON's feature order (so the map's own "Factions" sidebar
# list reads in this order) and, by convention, the homepage carousel --
# New England sits last, after Pacific States, rather than leading.
# "Loyalist States" was renamed to "American Union State" early on -- the
# actual name of the flag supplied for it -- while keeping the same
# territory, colour and "Blue States"/Loyalist lore. "Congressional
# States" was later renamed to "Pacific States" the same way, its own
# established nickname (see the briefing cards) becoming the primary name;
# "Congressional States" lives on as the "also known as" in its own
# summary and the other factions' references to it below.
FACTIONS = {
    "american-union-state": {
        "name": "American Union State",
        "color": "#1f3a66",
        "states": [
            "VA", "NC", "SC", "GA", "FL", "AL", "MS", "TN", "KY", "AR",
            "LA", "TX", "OK", "NM",
        ],
        "summary": (
            "Also known as the ‘Blue States,’ the American Union State "
            "is an alliance of conservative and reactionary forces under "
            "President Langdon, whose legitimacy dates to the 1936 "
            "election crisis. When Langdon sent the Federal Army to crush "
            "the Labor Revolt against explicit orders from Congress, he "
            "was decried as a tyrant — and when he backed a military "
            "coup to remove Congress entirely, its surviving "
            "representatives fled west to found the Pacific "
            "States.\n\nBoth the American Union State and Pacific States "
            "governments still claim the title United States of America; "
            "their Rocky Mountain border has stood as a demilitarized "
            "zone since the Rocky Mountains Ceasefire. German arms have "
            "proven paramount in pushing back the Red advance, and with "
            "Washington retaken, Langdon is now poised to cut the "
            "Revolutionary States off from the sea."
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
    "pacific-states": {
        "name": "Pacific States",
        "color": "#c98a2b",
        "states": ["WA", "OR", "CA", "NV", "AZ"],
        "summary": (
            "Also known as the ‘Congressional States,’ the "
            "Pacific States are a loose alliance of moderate "
            "Republicans and Democrats who fled President Langdon’s "
            "crackdown at the outbreak of the war, led by the remnants of "
            "Congress and anti-Langdon governors who claim to be the last "
            "holdout of true American democracy.\n\nNot at open war with "
            "either side, the Pacific States hold a tenuous "
            "ceasefire along the Rocky Mountains — a policy of "
            "non-intervention dating to Congress’s refusal to send "
            "the Federal military into Chicago at the start of the "
            "revolution. Though the smallest of the three factions, they "
            "enjoy support from the Republic of Japan and Royalist "
            "Canada."
        ),
    },
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
}

STATE_TO_FACTION = {
    code: fid for fid, data in FACTIONS.items() for code in data["states"]
}

# Alaska and Hawaii weren't states in 1940 and sit outside the civil war
# entirely, but each is nominally under one side's flag -- Alaska as
# American Union State territory (the Gulf shipping lanes a territorial
# government would have depended on), Hawaii under the Pacific States'
# own fleet. Neither actively participates, so they're tagged
# "affiliated" rather than "faction" and rendered with the animated
# diagonal treatment instead of a solid fill.
AFFILIATED_TERRITORIES = {
    "AK": {
        "faction": "american-union-state",
        "summary": (
            "Alaska is nominally American Union State territory, its "
            "governor answering to Atlanta — but it takes no active part "
            "in the war. Too remote, too thinly settled, and not yet a "
            "state to fight over."
        ),
    },
    "HI": {
        "faction": "pacific-states",
        "summary": (
            "Hawaii falls under the Pacific States' own claim, home to "
            "their fleet -- but it isn't a state yet, and it takes no "
            "active part in the war on the mainland."
        ),
    },
}


def load_great_lakes():
    src = json.loads(LAKES_SRC.read_text())
    lakes = [
        shape(f["geometry"])
        for f in src["features"]
        if f["properties"].get("name") in GREAT_LAKES
    ]
    return unary_union(lakes).buffer(0.001)


def shade(hex_color, postal):
    """A small, deterministic per-state lightness offset of a faction's
    base colour -- enough to read as a mosaic of individual states once
    zoomed in, subtle enough to still read as one flat colour zoomed out."""
    r, g, b = (int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    offset = ((zlib.crc32(postal.encode()) % 1000) / 1000 - 0.5) * 0.16  # +/-8%
    l = min(0.92, max(0.08, l + offset))
    r2, g2, b2 = colorsys.hls_to_rgb(h, l, s)
    return "#{:02x}{:02x}{:02x}".format(round(r2 * 255), round(g2 * 255), round(b2 * 255))


def main():
    great_lakes = load_great_lakes()
    src = json.loads(SRC.read_text())
    us_by_postal = {}
    state_geoms = {}  # postal -> (faction_id, cut geometry), for states.geojson
    territory = {}  # unassigned-but-US, kept neutral (Alaska, Hawaii)
    for feature in src["features"]:
        props = feature["properties"]
        if props.get("iso_a2") != "US":
            continue
        postal = props.get("postal")
        geom = shape(feature["geometry"]).difference(great_lakes)
        if postal in STATE_TO_FACTION:
            fid = STATE_TO_FACTION[postal]
            us_by_postal.setdefault(fid, []).append(geom)
            state_geoms[postal] = (fid, geom)
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
                        "state and not claimed by any of the factions in "
                        "this civil war."
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

    state_features = []
    for postal, (fid, geom) in state_geoms.items():
        state_features.append(
            {
                "type": "Feature",
                "properties": {
                    "postal": postal,
                    "faction": fid,
                    "color": shade(FACTIONS[fid]["color"], postal),
                    "line": FACTIONS[fid]["color"],
                },
                "geometry": mapping(geom),
            }
        )
    states_fc = {"type": "FeatureCollection", "features": state_features}
    STATES_OUT.write_text(json.dumps(states_fc))
    print(f"Wrote {len(state_features)} features to {STATES_OUT} ({STATES_OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
