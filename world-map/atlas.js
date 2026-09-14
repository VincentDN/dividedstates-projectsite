(function () {
  "use strict";

  var FLAG_LINKS = {
    // Real Flagmaker product pages. Congressional States has none yet --
    // see world-map/README.md -- so it falls back to COLLECTION_URL.
    "american-union-state": "https://flagmaker-print.com/products/american-union-state-flag-kaiserreich",
    "revolutionary-states": "https://flagmaker-print.com/products/revolutionary-states-flag-the-divided-states",
  };
  var COLLECTION_URL = "https://flagmaker-print.com/collections/alt-history-flags";

  // The real flag artwork supplied for American Union State/Congressional
  // is a raster (their Flagmaker vectors, rasterised); Revolutionary's is
  // still a hand-drawn placeholder pending its own vector. Keyed by
  // faction id so showDetails() can pick the right file per faction.
  var FLAG_IMAGE_EXT = {
    "american-union-state": "png",
    "congressional-states": "png",
    "revolutionary-states": "svg",
    "new-england": "svg",
  };

  // Alaska and Hawaii: nominally under a faction's flag but not part of
  // the war, rendered with a moving diagonal hatch instead of a solid fill.
  var AFFILIATED_HATCH = {
    "american-union-state": "url(#hatch-affiliated-american-union-state)",
    "congressional-states": "url(#hatch-affiliated-congressional-states)",
  };

  // Azimuthal equidistant, centred on the North Pole, rather than
  // Leaflet's default Web Mercator -- the same projection used by the
  // American Kingdoms atlas, which reads noticeably better for a map
  // that's really just the continental US: it doesn't stretch the north
  // the way Mercator does, so Canada/Great Lakes country doesn't balloon
  // relative to the Gulf states. There's no tile layer here (every layer
  // is vector GeoJSON), so a custom CRS only has to get project/unproject
  // right; nothing depends on a 256px tile pyramid. lon0 picks which
  // meridian points "up" from the pole -- roughly through central Canada,
  // so North America reads upright rather than rotated.
  var EARTH_R = 6371000, D2R = Math.PI / 180, R2D = 180 / Math.PI, POLAR_LON0 = -100 * D2R;
  var PolarAzimuthal = {
    R: EARTH_R,
    project: function (latlng) {
      var rho = EARTH_R * (Math.PI / 2 - latlng.lat * D2R);
      var theta = latlng.lng * D2R - POLAR_LON0;
      return L.point(rho * Math.sin(theta), -rho * Math.cos(theta));
    },
    unproject: function (point) {
      var rho = Math.sqrt(point.x * point.x + point.y * point.y);
      var lat = 90 - (rho / EARTH_R) * R2D;
      var lon = (((POLAR_LON0 + Math.atan2(point.x, -point.y)) * R2D + 540) % 360) - 180;
      return L.latLng(lat, lon);
    },
    bounds: L.bounds([-EARTH_R * Math.PI, -EARTH_R * Math.PI], [EARTH_R * Math.PI, EARTH_R * Math.PI]),
  };
  var polarScale = 0.5 / (Math.PI * EARTH_R);
  L.CRS.PolarAzimuthal = L.extend({}, L.CRS.Earth, {
    code: "DS:polar-azimuthal",
    projection: PolarAzimuthal,
    transformation: new L.Transformation(polarScale, 0.5, -polarScale, 0.5),
  });

  var map = L.map("map", {
    crs: L.CRS.PolarAzimuthal,
    attributionControl: false,
    zoomControl: false,
    minZoom: 3,
    maxZoom: 10,
    worldCopyJump: false,
  }).setView([39, -96], 4);
  // Top-right rather than bottom-right: the info panel docks along the
  // bottom edge on narrow/mobile layouts (see atlas.css), and a
  // bottom-right zoom control would sit right on top of it there.
  L.control.zoom({ position: "topright" }).addTo(map);
  L.control.attribution({ prefix: "Map made with Leaflet" }).addTo(map);

  var landPane = map.createPane("land");
  landPane.style.zIndex = 350;
  var waterPane = map.createPane("water");
  waterPane.style.zIndex = 360;
  var factionPane = map.createPane("factions");
  factionPane.style.zIndex = 400;
  var statesPane = map.createPane("states");
  statesPane.style.zIndex = 410;
  var roadPane = map.createPane("roads");
  roadPane.style.zIndex = 420;
  var labelPane = map.createPane("labels");
  labelPane.style.zIndex = 640;

  var factionLayers = {};
  var labelMarkers = [];
  var selectedLayer = null;

  function selectLayer(layer, feature) {
    if (selectedLayer) selectedLayer.setStyle({ });
    document.querySelectorAll(".faction-fill.is-selected, .state-fill.is-selected").forEach(function (el) {
      el.classList.remove("is-selected");
    });
    if (layer && layer._path) {
      layer._path.classList.add("is-selected");
    }
    // The per-state mosaic sits visually on top of this layer, so its own
    // selection stroke would be hidden underneath -- highlight every state
    // belonging to the same faction on that layer instead.
    var fid = feature.properties.kind === "affiliated" ? feature.properties.faction : feature.properties.id;
    document.querySelectorAll('.state-fill[data-faction="' + fid + '"]').forEach(function (el) {
      el.classList.add("is-selected");
    });
    selectedLayer = layer;
    showDetails(feature);
  }

  function showDetails(feature) {
    var props = feature.properties;
    document.getElementById("welcome").hidden = true;
    var details = document.getElementById("details");
    details.hidden = false;
    document.getElementById("detail-name").textContent = props.name;
    document.getElementById("detail-description").textContent = props.summary || "";

    var flagId = props.kind === "affiliated" ? props.faction : props.id;

    var flagImg = document.getElementById("detail-flag");
    if (props.kind === "faction" || props.kind === "affiliated") {
      var ext = FLAG_IMAGE_EXT[flagId] || "svg";
      flagImg.src = "assets/flags/" + flagId + "." + ext;
      flagImg.alt = props.name + " flag" + (ext === "svg" ? " (placeholder design)" : "");
      flagImg.hidden = false;
    } else {
      flagImg.hidden = true;
    }

    var buyLink = document.getElementById("detail-flag-buy");
    if (props.kind === "faction" || props.kind === "affiliated") {
      buyLink.href = FLAG_LINKS[flagId] || COLLECTION_URL;
      buyLink.hidden = false;
    } else {
      buyLink.hidden = true;
    }

    openPanel();
  }

  function openPanel() {
    document.getElementById("panel").classList.remove("panel-collapsed");
    document.getElementById("panel-toggle").setAttribute("aria-expanded", "true");
  }

  // On phones/tablets (and anyone asking for less data), swap the six
  // full-resolution GeoJSON files for one pre-simplified bundle: coarser
  // coastline, shared-edge-simplified territory/state borders, and rivers
  // and the major-highway layer dropped outright, since both are
  // decorative and roads.geojson alone is the single heaviest file in
  // data/. See scripts/build-mobile-map.py for how the bundle is built.
  // ?detail=full/lite on the URL overrides the automatic guess, for
  // testing either path on any device.
  var requestedDetail = new URLSearchParams(location.search).get("detail");
  var liteMode = requestedDetail !== "full" && (
    requestedDetail === "lite" ||
    matchMedia("(max-width:900px)").matches ||
    (matchMedia("(pointer:coarse)").matches && matchMedia("(max-width:1200px)").matches) ||
    (navigator.connection && navigator.connection.saveData === true)
  );
  document.documentElement.classList.toggle("atlas-lite", liteMode);
  if (liteMode) {
    // Nothing left to toggle -- rivers and roads aren't in the mobile bundle at all.
    ["toggle-roads", "toggle-water"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.closest("label").hidden = true;
    });
  }
  var EMPTY_FC = { type: "FeatureCollection", features: [] };
  var mobileBundle = liteMode
    ? fetch("data/mobile/atlas.json?v=1").then(function (r) { return r.json(); })
    : null;
  function loadLayer(name) {
    if (liteMode) {
      if (name === "rivers" || name === "roads") return Promise.resolve(EMPTY_FC);
      return mobileBundle.then(function (bundle) { return bundle[name]; });
    }
    return fetch("data/" + name + ".geojson").then(function (r) { return r.json(); });
  }

  var capitalMarkers = [];

  loadLayer("land")
    .then(function (geo) {
      L.geoJSON(geo, {
        pane: "land",
        className: "land-base",
        interactive: false,
      }).addTo(map);
    });

  loadLayer("rivers")
    .then(function (geo) {
      L.geoJSON(geo, {
        pane: "water",
        className: "river-line",
        interactive: false,
      }).addTo(map);
    });

  loadLayer("roads")
    .then(function (geo) {
      L.geoJSON(geo, {
        pane: "roads",
        className: "road-line",
        interactive: false,
      }).addTo(map);
    });

  loadLayer("capitals")
    .then(function (geo) {
      geo.features.forEach(function (feature) {
        var coords = feature.geometry.coordinates;
        var marker = L.marker([coords[1], coords[0]], {
          pane: "labels",
          interactive: false,
          icon: L.divIcon({
            className: "capital-dot",
            html: '<span class="capital-mark"><span>' + feature.properties.name + "</span></span>",
          }),
        }).addTo(map);
        capitalMarkers.push(marker);
      });
      updateCapitalVisibility();
    });

  // Capitals fade AND grow in gradually rather than snapping straight to
  // full strength: tiny and barely-there at CAPITAL_MIN_ZOOM, full size
  // and opacity by CAPITAL_FULL_ZOOM, so the map doesn't go from empty to
  // 50 loud labels in one scroll tick.
  var CAPITAL_MIN_ZOOM = 5;
  var CAPITAL_FULL_ZOOM = 8;
  function updateCapitalVisibility() {
    var zoom = map.getZoom();
    var checked = document.getElementById("toggle-capitals").checked;
    var show = zoom >= CAPITAL_MIN_ZOOM && checked;
    var t = Math.min(1, Math.max(0, (zoom - CAPITAL_MIN_ZOOM) / (CAPITAL_FULL_ZOOM - CAPITAL_MIN_ZOOM)));
    var opacity = Math.max(0.35, t);
    var scale = 0.55 + t * 0.45;
    capitalMarkers.forEach(function (m) {
      var el = m.getElement();
      if (!el) return;
      el.style.display = show ? "" : "none";
      var mark = el.querySelector(".capital-mark");
      if (mark) {
        mark.style.opacity = opacity;
        mark.style.setProperty("--scale", scale);
      }
    });
  }
  map.on("zoomend", updateCapitalVisibility);

  loadLayer("territories")
    .then(function (geo) {
      var factionListEl = document.getElementById("faction-list");

      L.geoJSON(geo, {
        pane: "factions",
        style: function (feature) {
          var props = feature.properties;
          return {
            className: "faction-fill" + (props.kind === "affiliated" ? " is-affiliated" : ""),
            color: "#0a0a0a",
            weight: 1.4,
            fillColor: props.color,
            fillOpacity: props.kind === "territory" ? 0.35 : 0.9,
          };
        },
        onEachFeature: function (feature, layer) {
          var props = feature.properties;
          factionLayers[props.id] = layer;

          layer.bindTooltip(
            "<strong>" + props.name + "</strong>",
            { sticky: true, className: "territory-tooltip" }
          );

          layer.on("click", function () {
            selectLayer(layer, feature);
          });

          if (props.kind === "faction") {
            var li = document.createElement("li");
            var btn = document.createElement("button");
            btn.type = "button";
            var swatch = document.createElement("span");
            swatch.className = "faction-swatch";
            swatch.style.background = props.color;
            btn.appendChild(swatch);
            btn.appendChild(document.createTextNode(props.name));
            btn.addEventListener("click", function () {
              map.fitBounds(layer.getBounds(), { padding: [40, 40] });
              selectLayer(layer, feature);
            });
            li.appendChild(btn);
            factionListEl.appendChild(li);
          }

          if (props.kind === "faction" || props.kind === "affiliated") {
            var center = layer.getBounds().getCenter();
            var marker = L.marker(center, {
              pane: "labels",
              interactive: false,
              icon: L.divIcon({
                className: "state-label",
                html: '<span class="state-label-text">' + props.name + "</span>",
              }),
            }).addTo(map);
            labelMarkers.push(marker);
          }
        },
      }).addTo(map);

      Object.keys(factionLayers).forEach(function (id) {
        var layer = factionLayers[id];
        var props = layer.feature.properties;
        if (layer._path && props.kind === "affiliated") {
          layer._path.style.fill = AFFILIATED_HATCH[props.faction] || "";
        }
      });
    });

  // A per-state mosaic drawn on top of the flat faction fill: each state
  // its own slight shade of the faction colour with a thin border between
  // neighbours, so the map reads as individual states once zoomed in
  // without changing what a click selects (that's still handled by the
  // faction layer underneath -- these paths are interactive:false so
  // clicks/hover fall straight through to it).
  loadLayer("states")
    .then(function (geo) {
      var layer = L.geoJSON(geo, {
        pane: "states",
        interactive: false,
        style: function (feature) {
          return {
            className: "state-fill",
            fillColor: feature.properties.color,
            fillOpacity: 1,
            color: feature.properties.line,
            weight: 0.7,
            opacity: 0.5,
          };
        },
      }).addTo(map);
      layer.eachLayer(function (stateLayer) {
        if (stateLayer._path) {
          stateLayer._path.setAttribute("data-faction", stateLayer.feature.properties.faction);
        }
      });
      updateMosaicOpacity();
    });

  // The mosaic is meant to sell "this region is made of individual states"
  // once you're in close; zoomed out to the whole US it just reads as noisy
  // borders cutting across what should be one flat faction colour. Keep the
  // states pane down near a bare MOSAIC_MIN_OPACITY hint at the whole-US
  // overview, and ramp it up to full opacity as you zoom in past
  // MOSAIC_FADE_ZOOM, reaching 1 by MOSAIC_FULL_ZOOM.
  var MOSAIC_FADE_ZOOM = 5;
  var MOSAIC_FULL_ZOOM = 9;
  var MOSAIC_MIN_OPACITY = 0.18;
  function updateMosaicOpacity() {
    var zoom = map.getZoom();
    var t = Math.min(1, Math.max(0, (zoom - MOSAIC_FADE_ZOOM) / (MOSAIC_FULL_ZOOM - MOSAIC_FADE_ZOOM)));
    statesPane.style.opacity = MOSAIC_MIN_OPACITY + t * (1 - MOSAIC_MIN_OPACITY);
  }
  map.on("zoomend", updateMosaicOpacity);

  document.getElementById("panel-toggle").addEventListener("click", function () {
    var panel = document.getElementById("panel");
    var collapsed = panel.classList.toggle("panel-collapsed");
    this.setAttribute("aria-expanded", String(!collapsed));
  });
  document.getElementById("panel-close").addEventListener("click", function () {
    document.getElementById("panel").classList.add("panel-collapsed");
    document.getElementById("panel-toggle").setAttribute("aria-expanded", "false");
  });

  document.getElementById("toggle-territories").addEventListener("change", function (e) {
    var display = e.target.checked ? "" : "none";
    Object.keys(factionLayers).forEach(function (id) {
      var layer = factionLayers[id];
      if (layer._path) layer._path.style.display = display;
    });
    document.querySelectorAll(".state-fill").forEach(function (el) {
      el.style.display = display;
    });
  });
  document.getElementById("toggle-labels").addEventListener("change", function (e) {
    labelMarkers.forEach(function (m) {
      var el = m.getElement();
      if (el) el.style.display = e.target.checked ? "" : "none";
    });
  });
  document.getElementById("toggle-capitals").addEventListener("change", updateCapitalVisibility);
  document.getElementById("toggle-roads").addEventListener("change", function (e) {
    document.querySelectorAll(".road-line").forEach(function (path) {
      path.style.display = e.target.checked ? "" : "none";
    });
  });
  document.getElementById("toggle-water").addEventListener("change", function (e) {
    var display = e.target.checked ? "" : "none";
    document.querySelectorAll(".river-line").forEach(function (path) {
      path.style.display = display;
    });
  });
})();
