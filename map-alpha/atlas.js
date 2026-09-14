(function () {
  "use strict";

  var HATCH_FILL = {
    "new-england": "url(#hatch-new-england)",
    "revolutionary-states": "url(#hatch-revolutionary-states)",
    "american-union-state": "url(#hatch-american-union-state)",
    "congressional-states": "url(#hatch-congressional-states)",
  };

  var CITIES = [
    { name: "Boston", lat: 42.36, lng: -71.06, faction: "new-england", capital: true },
    { name: "Chicago", lat: 41.88, lng: -87.63, faction: "revolutionary-states", capital: true },
    { name: "Baton Rouge", lat: 30.45, lng: -91.14, faction: "american-union-state", capital: true },
    { name: "San Francisco", lat: 37.77, lng: -122.42, faction: "congressional-states", capital: true },
    { name: "Washington, D.C. (fallen)", lat: 38.91, lng: -77.04, faction: "revolutionary-states", capital: false, fallen: true },
  ];

  var FLAG_LINKS = {
    // The only faction with a dedicated Flagmaker product today; the rest
    // fall back to the general alt-history collection until one exists.
    // See map-alpha/README.md.
    "american-union-state": "https://flagmaker-print.com/products/american-union-state-flag-kaiserreich",
  };
  var COLLECTION_URL = "https://flagmaker-print.com/collections/alt-history-flags";

  var map = L.map("map", {
    zoomControl: false,
    minZoom: 3,
    maxZoom: 8,
    worldCopyJump: false,
  }).setView([39, -96], 4);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  L.control.attribution({ prefix: false }).addTo(map);

  var landPane = map.createPane("land");
  landPane.style.zIndex = 350;
  var factionPane = map.createPane("factions");
  factionPane.style.zIndex = 400;
  var stateLinesPane = map.createPane("statelines");
  stateLinesPane.style.zIndex = 420;
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

    var flagImg = document.getElementById("detail-flag");
    if (props.kind === "faction") {
      flagImg.src = "assets/flags/" + props.id + ".svg";
      flagImg.alt = props.name + " flag (placeholder design)";
      flagImg.hidden = false;
    } else {
      flagImg.hidden = true;
    }

    var buyLink = document.getElementById("detail-flag-buy");
    if (props.kind === "faction") {
      buyLink.href = FLAG_LINKS[props.id] || COLLECTION_URL;
      buyLink.hidden = false;
    } else {
      buyLink.hidden = true;
    }

    var stamp = document.getElementById("flag-stamp");
    if (props.kind === "faction") {
      stamp.src = "assets/flags/" + props.id + ".svg";
      stamp.hidden = false;
    } else {
      stamp.hidden = true;
    }

    openPanel();
  }

  function openPanel() {
    document.getElementById("panel").classList.remove("panel-collapsed");
    document.getElementById("panel-toggle").setAttribute("aria-expanded", "true");
  }

  fetch("data/land.geojson")
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      L.geoJSON(geo, {
        pane: "land",
        className: "land-base",
        interactive: false,
      }).addTo(map);
    });

  fetch("data/state-lines.geojson")
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      L.geoJSON(geo, {
        pane: "statelines",
        className: "state-line",
        interactive: false,
      }).addTo(map);
    });

  CITIES.forEach(function (city) {
    var classes = "city-dot-mark" + (city.capital ? " is-capital" : "") + (city.fallen ? " is-fallen" : "");
    L.marker([city.lat, city.lng], {
      pane: "labels",
      interactive: false,
      icon: L.divIcon({
        className: "city-dot",
        iconSize: [10, 10],
        iconAnchor: [4, 4],
        html: '<span class="' + classes + '"><span>' + city.name + "</span></span>",
      }),
    }).addTo(map);
  });

  fetch("data/territories.geojson")
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      var factionListEl = document.getElementById("faction-list");

      L.geoJSON(geo, {
        pane: "factions",
        style: function (feature) {
          var props = feature.properties;
          return {
            className: "faction-fill" + (props.kind !== "faction" ? " is-neutral" : ""),
            color: "#0a0a0a",
            weight: 1.4,
            fillColor: props.color,
            fillOpacity: props.kind === "faction" ? 0.85 : 0.35,
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
        if (layer._path && HATCH_FILL[id]) {
          layer._path.style.fill = HATCH_FILL[id];
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
})();
