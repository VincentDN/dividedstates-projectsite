(function () {
  "use strict";

  var FLAG_LINKS = {
    // Real Flagmaker product pages. Congressional States has none yet --
    // see world-map/README.md -- so it falls back to COLLECTION_URL.
    "loyalist-states": "https://flagmaker-print.com/products/american-union-state-flag-kaiserreich",
    "revolutionary-states": "https://flagmaker-print.com/products/revolutionary-states-flag-the-divided-states",
  };
  var COLLECTION_URL = "https://flagmaker-print.com/collections/alt-history-flags";

  // The real flag artwork supplied for Loyalist/Congressional is a raster
  // (their Flagmaker vectors, rasterised); Revolutionary's is still a
  // hand-drawn placeholder pending its own vector. Keyed by faction id so
  // showDetails() can pick the right file per faction.
  var FLAG_IMAGE_EXT = {
    "loyalist-states": "png",
    "congressional-states": "png",
    "revolutionary-states": "svg",
    "new-england": "svg",
  };

  // Alaska and Hawaii: nominally under a faction's flag but not part of
  // the war, rendered with a moving diagonal hatch instead of a solid fill.
  var AFFILIATED_HATCH = {
    "loyalist-states": "url(#hatch-affiliated-loyalist-states)",
    "congressional-states": "url(#hatch-affiliated-congressional-states)",
  };

  var map = L.map("map", {
    attributionControl: false,
    zoomControl: false,
    minZoom: 3,
    maxZoom: 10,
    worldCopyJump: false,
  }).setView([39, -96], 4);
  L.control.zoom({ position: "bottomright" }).addTo(map);
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

  var capitalMarkers = [];

  fetch("data/land.geojson")
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      L.geoJSON(geo, {
        pane: "land",
        className: "land-base",
        interactive: false,
      }).addTo(map);
    });

  fetch("data/rivers.geojson")
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      L.geoJSON(geo, {
        pane: "water",
        className: "river-line",
        interactive: false,
      }).addTo(map);
    });

  fetch("data/roads.geojson")
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      L.geoJSON(geo, {
        pane: "roads",
        className: "road-line",
        interactive: false,
      }).addTo(map);
    });

  fetch("data/capitals.geojson")
    .then(function (r) { return r.json(); })
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

  fetch("data/territories.geojson")
    .then(function (r) { return r.json(); })
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
  fetch("data/states.geojson")
    .then(function (r) { return r.json(); })
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
    });

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
