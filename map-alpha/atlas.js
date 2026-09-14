(function () {
  "use strict";

  var FLAG_LINKS = {
    // The only faction with a dedicated Flagmaker product today; the rest
    // fall back to the general alt-history collection until one exists.
    // See map-alpha/README.md.
    "american-union-state": "https://flagmaker-print.com/products/american-union-state-flag-kaiserreich",
  };
  var COLLECTION_URL = "https://flagmaker-print.com/collections/alt-history-flags";

  // Alaska and Hawaii: nominally under a faction's flag but not part of
  // the war, rendered with a moving diagonal hatch instead of a solid fill.
  var AFFILIATED_HATCH = {
    "american-union-state": "url(#hatch-affiliated-american-union-state)",
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
  var roadPane = map.createPane("roads");
  roadPane.style.zIndex = 420;
  var labelPane = map.createPane("labels");
  labelPane.style.zIndex = 640;

  var factionLayers = {};
  var labelMarkers = [];
  var selectedLayer = null;

  function selectLayer(layer, feature) {
    if (selectedLayer) selectedLayer.setStyle({ });
    document.querySelectorAll(".faction-fill.is-selected").forEach(function (el) {
      el.classList.remove("is-selected");
    });
    if (layer && layer._path) {
      layer._path.classList.add("is-selected");
    }
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
      flagImg.src = "assets/flags/" + flagId + ".svg";
      flagImg.alt = props.name + " flag (placeholder design)";
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

  var CAPITAL_MIN_ZOOM = 5;
  function updateCapitalVisibility() {
    var show = map.getZoom() >= CAPITAL_MIN_ZOOM && document.getElementById("toggle-capitals").checked;
    capitalMarkers.forEach(function (m) {
      var el = m.getElement();
      if (el) el.style.display = show ? "" : "none";
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
