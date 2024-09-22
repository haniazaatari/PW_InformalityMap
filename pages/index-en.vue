<template>
  <main>
    <div id="map" ref="map">
      <div class="box" id="contentBox">
        <p class="note"><strong>إختر/ي المدينة</strong></p>

        <nav id="filter-group" class="filter-group"></nav>
        <p class="note"><strong>إختر/ي سنة النشوء بعلاقتها مع النوع</strong></p>

        <nav id="filter-group2" class="filter-group"></nav>
        <p class="note"><strong>إختر/ي ملكية الأرض</strong></p>
        <nav id="filter-group3" class="filter-group"></nav>
        <p class="note"><strong>إختر/ي نوع الوصول الى الأرض</strong></p>
        <nav id="filter-group4" class="filter-group"></nav>

        <div id="reset-filter" class="reset-filter"></div>
      </div>
      <div class="boxB">
        <div id="legend">
          <h3>Legend</h3>

          <!-- Fill Color for "ملكية الأرض" -->
          <h4>Land Ownership ("ملكية الأرض")</h4>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #ffd700"></span>
            Public ("عام")
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #ff6347"></span>
            Private ("خاص")
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #32cd32"></span>
            Waqf ("وقف")
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #4682b4"></span>
            Public-Private ("عام - خاص")
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #808080"></span>
            Other
          </div>

          <!-- Opacity for Year of Establishment -->
          <h4>Year of Establishment</h4>
          <div class="legend-item">
            <span class="legend-color" style="opacity: 0.3"></span> 1930s -
            1950s
          </div>
          <div class="legend-item">
            <span class="legend-color" style="opacity: 0.5"></span> 1950s -
            1970s
          </div>
          <div class="legend-item">
            <span class="legend-color" style="opacity: 0.7"></span> 1975 - 1990
          </div>
          <div class="legend-item">
            <span class="legend-color" style="opacity: 0.9"></span> 1990 -
            Present
          </div>

          <!-- Outline Colors for "التصنيف الحالي للأرض في الخرائط الرسمية" -->
          <h4>Land Classification ("التصنيف الحالي للأرض")</h4>
          <div class="legend-item">
            <span class="legend-outline" style="border-color: #008000"></span>
            Agricultural ("زراعي")
          </div>
          <div class="legend-item">
            <span class="legend-outline" style="border-color: #0000ff"></span>
            Residential ("سكني")
          </div>
          <div class="legend-item">
            <span class="legend-outline" style="border-color: #ffa500"></span>
            Mixed Use ("سكني \\ تجاري")
          </div>
          <div class="legend-item">
            <span class="legend-outline" style="border-color: #800080"></span>
            Tourism ("سياحي")
          </div>
          <div class="legend-item">
            <span class="legend-outline" style="border-color: #808080"></span>
            Unclassified ("غير مصنف")
          </div>
        </div>
      </div>

      <div class="box-row">
        <p class="boxA">تم الإنشاء بواسطة استوديو أشغال عامّة CC</p>
      </div>
      <div class="boxC" id="lastUpdatedDiv">
        آخر تحديث: ٣ أيلول ٢٠٢٤ في ۰۱:٣٠ ص
      </div>
    </div>
  </main>
</template>
<!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mapbox-gl-moment@1.0.2/dist/mapbox-gl-moment.min.js"></script> -->
<!-- <script src='https://api.tiles.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.js'></script> -->
<script src="https://unpkg.com/@turf/turf@6.5.0/turf.min.js"></script>
<script>
import mapboxgl from "mapbox-gl";
import moment from "moment";
import * as turf from "@turf/turf";
import { multiPolygon } from "@turf/turf";

// import targetGeojson from "../target.geojson"; // Import your GeoJSON data
export default {
  head: {
    link: [
      {
        rel: "stylesheet",
        href: "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css",
      },
    ],
  },
  data() {
    return {
      map: null,
      isBoxMinimized: false,
    };
  },

  // Define the filterByCategory function in the Vue component's methods
  methods: {},

  mounted() {
    const map = new mapboxgl.Map({
      accessToken: process.env.mapboxAccessToken,
      container: "map",
      style: process.env.MapboxStyle,
      pitchWithRotate: true,
      minZoom: 9,
      maxZoom: 18,
    });

    // const legendItems = document.querySelectorAll(".legend-item");

    if (mapboxgl.getRTLTextPluginStatus() === "unavailable") {
      mapboxgl.setRTLTextPlugin(
        "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
        null,
        true
      );
    }

    setTimeout(() => {
      map.flyTo({
        center: [35.52907144495116, 33.86973923491871],
        zoom: 12,
      });
    }, 2000);

    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    map.addControl(new mapboxgl.FullscreenControl(), "top-left");

    // this.map = map; // Assign map instance to this.map

    map.on("load", () => {
      try {
        //to keep the villages name on the top
        const layers = map.getStyle().layers;
        // Find the index of the first symbol layer in the map style.
        let firstSymbolId;
        for (const layer of layers) {
          if (layer.type === "symbol") {
            firstSymbolId = layer.id;
            break;
          }
        }

        // // Function to load SVG patterns
        // function loadSvgPattern(map, patternName, svgPath) {
        //   // Check if the image already exists
        //   if (map.hasImage(patternName)) {
        //     console.log(`Image "${patternName}" already exists.`);
        //     return;
        //   }

        //   var img = new Image();
        //   img.crossOrigin = "Anonymous"; // Prevent CORS issues

        //   img.onload = function () {
        //     var canvas = document.createElement("canvas");
        //     canvas.width = img.width;
        //     canvas.height = img.height;
        //     var ctx = canvas.getContext("2d");
        //     ctx.drawImage(img, 0, 0);
        //     var pngUrl = canvas.toDataURL("image/png");

        //     map.loadImage(pngUrl, function (error, image) {
        //       if (error) {
        //         console.error("Error loading image into Mapbox:", error);
        //         return;
        //       }
        //       map.addImage(patternName, image);
        //     });
        //   };

        //   img.onerror = function () {
        //     console.error(`Failed to load image from path: ${svgPath}`);
        //   };

        //   img.src = svgPath; // Set the source to the SVG path
        // }

        // Listen for missing image event and dynamically add the image
        map.on("styleimagemissing", function (e) {
          var id = e.id;
          if (patterns[id]) {
            loadSvgPattern(map, id, patterns[id]);
          }
        });

        // // Patterns
        // var patterns = {
        //   "pattern-palcamp": "/images/pattern-palcamp.svg",
        //   hideout: "/images/hideout.svg",
        //   "polka-dots": "/images/polka-dots.svg",
        //   chevron: "/images/chevron.svg",
        //   diagonalcross: "/images/diagonalcross.svg",
        //   grid: "/images/grid.svg",
        //   cross: "/images/cross.svg",
        // };

        // // Load patterns dynamically
        // for (const [patternName, svgPath] of Object.entries(patterns)) {
        //   loadSvgPattern(map, patternName, svgPath);
        // }
        // map.addImage("pattern-palcamp", "./images/pattern-palcamp.svg");

        //added informality map
        map.addSource("places", {
          type: "geojson",
          generateId: true,
          data: "./beirut-informalitymap.geojson",
        });

        map.addLayer(
          {
            id: "poly",
            type: "fill",
            source: "places", // reference the data source
            layout: {},
            paint: {
              "fill-color": [
                "match",
                ["get", "ملكية الأرض"],
                "عام",
                "#FFD700", // gold for public
                "خاص",
                "#FF6347", // tomato for private
                "وقف",
                "#32CD32", // limegreen for Waqf
                "عام - خاص",
                "#4682B4", // steelblue for mixed
                /* default */ "#808080", // gray for unmatched cases
              ],

              // random colors :)
              // "fill-color": [
              //   "rgb",
              //   ["%", ["*", ["get", "fid"], 110], 255], // Red channel based on fid
              //   ["%", ["*", ["get", "fid"], 330], 255], // Green channel based on fid
              //   ["%", ["*", ["get", "fid"], 550], 255], // Blue channel based on fid
              // ],
              "fill-opacity": [
                "match",
                ["get", "سنة النشوء بعلاقتها مع النوع"],
                "1930s - 1950s بدأت كمخيمات للاجئين / مناطق لإسكان اللاجئين ذوي الدخل المنخفض",
                0.3,
                "1950s - 1970s بدأت كمناطق سكنية للمهاجرين من الريف إلى المدينة",
                0.5,
                "1975 - 1990 بدأت خلال الحرب اللبنانية",
                0.7,
                "1990 - اليوم بدأت جراء المعارك المتتالية والهجرات الناتجة عنها",
                0.9,
                /* default */ 0.3,
              ],
              "line-color": [
                "match",
                ["get", "التصنيف الحالي للأرض في الخرائط الرسمية"],
                "زراعي",
                "#008000", // green for agricultural
                "سكني",
                "#0000FF", // blue for residential
                "سكني \\ تجاري mixed use",
                "#FFA500", // orange for mixed use
                "سياحي",
                "#800080", // purple for tourism
                "غير مصنف",
                "#808080", // gray for unclassified
                /* default */ "#000000", // black for unmatched cases
              ],
            },
          },
          firstSymbolId
        );

        // map.addLayer(
        //   {
        //     id: "poly-pattern",
        //     type: "fill",
        //     source: "places", // reference the data source
        //     layout: {},
        //     paint: {
        //       "fill-pattern": [
        //         "match",
        //         ["get", "الوصول إلى الأرض"],
        //         "مخيم فلسطيني",
        //         "pattern-palcamp", // Tomato color pattern
        //         "مخيم أرمني",
        //         "hideout", // Steelblue color pattern
        //         "تجمع فلسطيني",
        //         "polka-dots", // Limegreen color pattern
        //         "مشروع للأرمن",
        //         "chevron", // Gold color pattern
        //         "إفراز غير رسمي للأراضي في ضواحي المدن",
        //         "diagonalcross", // Blueviolet color pattern
        //         "وضع اليد في أراضي متنازع على ملكيّتها",
        //         "grid", // Orangered color pattern
        //         "وضع اليد في مشاريع الإسكان العام",
        //         "cross", // Seagreen color pattern
        //         /* default */ "polka-dots", // Gray pattern for unmatched cases
        //       ],

        //       "fill-opacity": 1,
        //       "fill-pattern-transform": ["scale", 0.8, 0.8],
        //     },
        //   },
        //   "poly"
        // );

        // Outline layer
        map.addLayer(
          {
            id: "poly-outline",
            type: "line",
            source: "places", // reference the data source
            layout: {},
            paint: {
              "line-color": [
                "match",
                ["get", "التصنيف الحالي للأرض في الخرائط الرسمية"],
                "زراعي",
                "#008000", // green for agricultural
                "سكني",
                "#0000FF", // blue for residential
                "سكني \\ تجاري mixed use",
                "#FFA500", // orange for mixed use
                "سياحي",
                "#800080", // purple for tourism
                "غير مصنف",
                "#808080", // gray for unclassified
                /* default */ "#000000", // black for unmatched cases
              ],
              "line-width": 1, // outline width
            },
          },
          firstSymbolId
        );

        // Add a symbol layer to display the name in the center of each zone
        map.addLayer({
          id: "zone-label",
          type: "symbol",
          source: "places",
          layout: {
            "text-field": ["get", "name"], // Assuming your GeoJSON has a 'name' property
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], // Adjust as needed
            "text-size": 14,
            "text-anchor": "center", // Center the text
          },
          paint: {
            "text-color": "#000", // Text color
            "text-halo-color": "#fff", // Halo (outline) for better visibility
            "text-halo-width": 1,
          },
        });

        // Create the reset button
        const menuFilter = document.getElementById("reset-filter");
        const resetButton = document.createElement("button");
        resetButton.textContent = "Reset Filters";
        resetButton.style.marginBottom = "10%";
        // resetButton.style.marginLeft = "-25px";
        resetButton.style.width = "160px";
        resetButton.style.height = "40px";
        resetButton.style.cursor = "pointer";
        resetButton.style.fontSize = "16px";
        resetButton.style.marginTop = "10px"; // Adjust spacing as needed
        resetButton.style.backgroundColor = "Yellow";
        resetButton.addEventListener(
          "click",
          handleResetButtonClick.bind(this)
        );
        resetButton.classList.add("reset-button");
        menuFilter.appendChild(resetButton);

        // //added informality map
        // map.addSource("greaterBeirut", {
        //   type: "geojson",
        //   generateId: true,
        //   data: "./Greaterbeirut.geojson",
        // });

        // // // Add a grey outline around the polygon.
        // map.addLayer({
        //   id: "outline",
        //   type: "line",
        //   source: "greaterBeirut",
        //   layout: {},
        //   paint: {
        //     "line-color": "white",
        //     "line-width": 0.6,
        //   },
        // });

        // // Load GeoJSON data using Fetch API
        // fetch("./merged_counts.geojson")
        //   .then((response) => {
        //     // Check if response is successful
        //     if (!response.ok) {
        //       throw new Error("Failed to load GeoJSON data.");
        //     }
        //     // Parse JSON data
        //     return response.json();
        //   })
        //   .then((data) => {
        //     // Initialize markers array
        //     map.markers = [];
        //     // Check if data contains features
        //     if (data && data.features && data.features.length > 0) {
        //       data.features.forEach((feature) => {
        //         // Extract strike type properties
        //         const objectId = feature.properties.OBJECTID1;
        //         const strikeTypes = feature.properties;

        //         // Create a marker for each strike type
        //         Object.entries(strikeTypes).forEach(([strikeType, count]) => {
        //           // Skip if the strike type is not relevant or has a count of 0
        //           if (
        //             strikeType === "OBJECTID1" ||
        //             strikeType === "index" ||
        //             count === 0
        //           ) {
        //             return;
        //           }

        //           // Get color and marker HTML based on count
        //           // const markerColor = getColorForCount(strikeType);
        //           const markerHTML = setMarkerHTML(count, strikeType);

        //           // Create a marker and add it to the map
        //           if (markerHTML) {
        //             const marker = new mapboxgl.Marker({
        //               element: markerHTML,
        //             })
        //               .setLngLat(feature.geometry.coordinates)
        //               .addTo(map);
        //             // console.log(
        //             //   feature.properties.OBJECTID1,
        //             //   ",",
        //             //   feature.geometry.coordinates,
        //             //   ",",
        //             //   count,
        //             //   ",",
        //             //   strikeType
        //             // );

        //             //added the category
        //             // Set a data-category attribute on the marker element
        //             marker
        //               .getElement()
        //               .setAttribute("data-category", strikeType);

        //             // Store marker in markers array
        //             map.markers.push(marker);
        //           }
        //         });
        //       });

        // console.log("Strike Type Counts:", strikeTypeCounts);
        //   } else {
        //     console.warn("No features found in the GeoJSON data.");
        //   }
        // });

        function initializeCitySelection() {
          const filterGroup1 = document.getElementById("filter-group");

          // Create and configure the city dropdown
          const citySelect = document.createElement("select");
          citySelect.id = "citySelect";
          citySelect.classList.add("city-dropdown"); // Correct way to add a class
          //citySelect.style.marginTop = "20px";
          citySelect.style.direction = "rtl"; // Set direction to right-to-left
          citySelect.addEventListener("change", updateMapData);

          // List of cities in Lebanon
          const cities = [
            "بيروت",
            "طرابلس",
            "صيدا",
            "صور",
            "زحلة",
            "جونية",
            "بعبدا",
            "جبيل",
            "بعلبك",
            "البترون",
          ];
          // const cities = [
          //   "Beirut",
          //   "Tripoli",
          //   "Sidon",
          //   "Tyre",
          //   "Zahle",
          //   "Jounieh",
          //   "Baabda",
          //   "Jbeil",
          //   "Baalbek",
          //   "Batroun",
          // ];

          // Create an option for each city and append to the dropdown
          cities.forEach((city) => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
          });

          // Append the city dropdown to the filter group
          filterGroup1.appendChild(citySelect);

          const filterGroup2 = document.getElementById("filter-group2");
          // Create and configure the city dropdown
          const rangeFilter = document.createElement("select");
          rangeFilter.id = "rangeFilter";
          rangeFilter.classList.add("city-dropdown"); // Correct way to add a class
          //rangeFilter.style.marginTop = "20px";
          rangeFilter.multiple = true; // Allow multiple selections
          rangeFilter.size = 3; // Optional: Set visible options at once
          rangeFilter.style.direction = "rtl"; // Set direction to right-to-left
          rangeFilter.addEventListener("change", updateMapData);

          const dateRanges = [
            "",
            "1930s - 1950s بدأت كمخيمات للاجئين / مناطق لإسكان اللاجئين ذوي الدخل المنخفض",
            "1950s - 1970s بدأت كمناطق سكنية للمهاجرين من الريف إلى المدينة",
            "1975 - 1990 بدأت خلال الحرب اللبنانية",
            "1990 - اليوم بدأت جراء المعارك المتتالية والهجرات الناتجة عنها",
          ];

          // Create an option for each city and append to the dropdown
          dateRanges.forEach((dateRange) => {
            const option = document.createElement("option");
            option.value = dateRange;
            option.textContent = dateRange;
            option.title = dateRange;
            rangeFilter.appendChild(option);
          });

          filterGroup2.appendChild(rangeFilter);

          rangeFilter.addEventListener("change", (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            tooltip.textContent = selectedOption.title; // Show tooltip text
            tooltip.style.display = "block"; // Show tooltip
          });

          rangeFilter.addEventListener("blur", () => {
            tooltip.style.display = "none"; // Hide tooltip
          });

          // Position the tooltip
          rangeFilter.addEventListener("mousemove", (e) => {
            tooltip.style.left = `${e.pageX}px`;
            tooltip.style.top = `${e.pageY - 30}px`; // Adjust for tooltip height
          });

          const filterGroup3 = document.getElementById("filter-group3");
          // Create and configure the city dropdown
          const landOwnership = document.createElement("select");
          landOwnership.id = "landOwnership";
          landOwnership.classList.add("city-dropdown"); // Correct way to add a class
          //landOwnership.style.marginTop = "20px";
          landOwnership.multiple = true; // Allow multiple selections
          landOwnership.size = 3;
          landOwnership.style.direction = "rtl"; // Set direction to right-to-left
          landOwnership.addEventListener("change", updateMapData);

          const landOwnershipRanges = ["", "عام", "خاص", "وقف", "عام - خاص"];

          // Create an option for each city and append to the dropdown
          landOwnershipRanges.forEach((landOwnershipRange) => {
            const option = document.createElement("option");
            option.value = landOwnershipRange;
            option.textContent = landOwnershipRange;
            option.title = landOwnershipRange;
            landOwnership.appendChild(option);
          });

          filterGroup3.appendChild(landOwnership);

          landOwnership.addEventListener("change", (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            tooltip.textContent = selectedOption.title; // Show tooltip text
            tooltip.style.display = "block"; // Show tooltip
          });

          landOwnership.addEventListener("blur", () => {
            tooltip.style.display = "none"; // Hide tooltip
          });

          // Position the tooltip
          landOwnership.addEventListener("mousemove", (e) => {
            tooltip.style.left = `${e.pageX}px`;
            tooltip.style.top = `${e.pageY - 30}px`; // Adjust for tooltip height
          });

          const filterGroup4 = document.getElementById("filter-group4");
          // Create and configure the city dropdown
          const accessType = document.createElement("select");
          accessType.id = "accessType";
          accessType.classList.add("city-dropdown"); // Correct way to add a class
          //accessType.style.marginTop = "20px";
          accessType.multiple = true; // Allow multiple selections
          accessType.size = 3;
          accessType.style.direction = "rtl"; // Set direction to right-to-left
          accessType.addEventListener("change", updateMapData);

          const accessTypeRanges = [
            "",
            "إفراز غير رسمي للأراضي في ضواحي المدن",
            "تجمع فلسطيني",
            "وضع اليد في أراضي خالية",
            "مخيم فلسطيني",
            "مخيم أرمني",
            "مشروع للأرمن",
            "وضع اليد في مباني مهجورة",
          ];

          // Create an option for each city and append to the dropdown
          accessTypeRanges.forEach((accessTypeRange) => {
            const option = document.createElement("option");
            option.value = accessTypeRange;
            option.textContent = accessTypeRange;
            option.title = accessTypeRange;
            accessType.appendChild(option);
          });

          filterGroup4.appendChild(accessType);

          accessType.addEventListener("change", (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            tooltip.textContent = selectedOption.title; // Show tooltip text
            tooltip.style.display = "block"; // Show tooltip
          });

          accessType.addEventListener("blur", () => {
            tooltip.style.display = "none"; // Hide tooltip
          });

          // Position the tooltip
          accessType.addEventListener("mousemove", (e) => {
            tooltip.style.left = `${e.pageX}px`;
            tooltip.style.top = `${e.pageY - 30}px`; // Adjust for tooltip height
          });

          // // Coordinates for each city in Lebanon
          // const cityCoordinates = {
          //   بيروت: [35.4955, 33.8888],
          //   طرابلس: [35.8456, 34.4367],
          //   صيدا: [35.3692, 33.557],
          //   صور: [35.1971, 33.2712],
          //   زحلة: [35.9033, 33.8462],
          //   جونية: [35.6435, 33.9808],
          //   بعبدا: [35.5426, 33.8356],
          //   جبيل: [35.6482, 34.1207],
          //   بعلبك: [36.2045, 34.0059],
          //   البترون: [35.6588, 34.2557],
          // };

          // const cityCoordinates = {
          //   Beirut: [35.4955, 33.8888],
          //   Tripoli: [35.8456, 34.4367],
          //   Sidon: [35.3692, 33.557],
          //   Tyre: [35.1971, 33.2712],
          //   Zahle: [35.9033, 33.8462],
          //   Jounieh: [35.6435, 33.9808],
          //   Baabda: [35.5426, 33.8356],
          //   Byblos: [35.6482, 34.1207],
          //   Baalbek: [36.2045, 34.0059],
          //   Batroun: [35.6588, 34.2557],
          // };

          // // Event listener for city dropdown
          // citySelect.addEventListener("change", (event) => {
          //   const selectedCity = event.target.value;

          //   if (cityCoordinates[selectedCity]) {
          //     const [lng, lat] = cityCoordinates[selectedCity];

          //     // Set the map view to the selected city's coordinates
          //     map.flyTo({
          //       center: [lng, lat],
          //       zoom: 12, // Adjust zoom level as needed
          //     });
          //   }
          // });
        }

        // Function to update the map based on the selected city
        function updateMapData() {
          //update city selection
          const selectedCity = document.getElementById("citySelect").value;
          const cityCoordinates = {
            // بيروت: [35.4955, 33.8888],
            بيروت: [35.52907144495116, 33.86973923491871],
            طرابلس: [35.8456, 34.4367],
            صيدا: [35.3692, 33.557],
            صور: [35.1971, 33.2712],
            زحلة: [35.9033, 33.8462],
            جونية: [35.6435, 33.9808],
            بعبدا: [35.5426, 33.8356],
            جبيل: [35.6482, 34.1207],
            بعلبك: [36.2045, 34.0059],
            البترون: [35.6588, 34.2557],
          };

          if (cityCoordinates[selectedCity]) {
            const [lng, lat] = cityCoordinates[selectedCity];
            map.flyTo({ center: [lng, lat], zoom: 12 }); // Adjust zoom level as needed
          }

          const rangeFilter = document.getElementById("rangeFilter");
          const selectedDateRanges = Array.from(
            rangeFilter.selectedOptions
          ).map((option) => option.value);

          const landOwnership = document.getElementById("landOwnership");
          const selectedLandProperties = Array.from(
            landOwnership.selectedOptions
          ).map((option) => option.value);

          const accessType = document.getElementById("accessType");
          const selectedAccessTypes = Array.from(
            accessType.selectedOptions
          ).map((option) => option.value);

          let filters = ["all"];

          // Add filter for date ranges (سنة النشوء بعلاقتها مع النوع) as a union (OR)
          if (selectedDateRanges.length > 0 && selectedDateRanges[0] !== "") {
            console.log("Selected Date Ranges: ", selectedDateRanges);
            filters.push([
              "match",
              ["get", "سنة النشوء بعلاقتها مع النوع"],
              selectedDateRanges, // Array of selected ranges
              true,
              false,
            ]);
          }

          // Add filter for land property ownership (ملكية الأرض) as a union (OR)
          if (
            selectedLandProperties.length > 0 &&
            selectedLandProperties[0] !== ""
          ) {
            console.log("Selected Land Properties: ", selectedLandProperties);
            filters.push([
              "match",
              ["get", "ملكية الأرض"],
              selectedLandProperties, // Array of selected properties
              true,
              false,
            ]);
          }

          // Add filter for access type (نوع الوصول إلى الأرض) as a union (OR)
          if (selectedAccessTypes.length > 0 && selectedAccessTypes[0] !== "") {
            console.log("Selected Access Types: ", selectedAccessTypes);
            filters.push([
              "match",
              ["get", "الوصول إلى الأرض"],
              selectedAccessTypes, // Array of selected access types
              true,
              false,
            ]);
          }

          // Apply the combined filter only if at least one filter is active
          if (filters.length > 1) {
            console.log("Filters applied: ", filters);
            map.setFilter("poly", filters);
          } else {
            // If no filters are applied, show all data
            map.setFilter("poly", null);
          }

          //   const rangeFilter = document.getElementById("rangeFilter");
          //   const selectedDateRange =
          //     document.getElementById("rangeFilter").value;
          //   // const selectedDateRange = rangeFilter.value;
          //   const landOwnership = document.getElementById("landOwnership");
          //   const selectedlandproperty = landOwnership.value;
          //   const accessType = document.getElementById("accessType");
          //   const selectedAccessType = accessType.value;
          //   let filters = ["all"];

          //   // Add filter for date range (سنة النشوء بعلاقتها مع النوع)
          //   if (rangeFilter && selectedDateRange !== "") {
          //     filters.push([
          //       "==",
          //       ["get", "سنة النشوء بعلاقتها مع النوع"],
          //       selectedDateRange,
          //     ]);
          //   }

          //   // Add filter for land property ownership (ملكية الأرض)
          //   if (selectedlandproperty !== "") {
          //     filters.push([
          //       "match",
          //       ["get", "ملكية الأرض"],
          //       selectedlandproperty,
          //       true,
          //       false,
          //     ]);
          //   }

          //   // Add filter for access type (نوع الوصول إلى الأرض)
          //   if (selectedAccessType !== "") {
          //     filters.push([
          //       "match",
          //       ["get", "نوع الوصول إلى الأرض"],
          //       selectedAccessType,
          //       true,
          //       false,
          //     ]);
          //   }

          //   // Apply the combined filter only if at least one filter is active
          //   if (filters.length > 1) {
          //     map.setFilter("poly", filters);
          //   } else {
          //     // If no filters are applied, show all data
          //     map.setFilter("poly", null);
          //   }
          // }

          // // Function to update the map based on the selected city
          // function filterbyrange() {
          //   const rangeFilter = document.getElementById("rangeFilter");
          //   const selectedDateRange =
          //     document.getElementById("rangeFilter").value;

          //   if (rangeFilter) {
          //     // Only apply the filter if we are in the content2 menu
          //     if (selectedDateRange === "") {
          //       // If the first option (empty string) is selected, show all data
          //       map.setFilter("poly", null);
          //     } else {
          //       // Apply the filter for the selected date range
          //       map.setFilter("poly", [
          //         "==",
          //         ["get", "سنة النشوء بعلاقتها مع النوع"],
          //         selectedDateRange,
          //       ]);
          //     }
          //   }
          // }

          //  // Function to update the map based on the selected city
          // function filterbylandproperty() {
          //   const landOwnership = document.getElementById("");
          //   const selectedDateRange =
          //     document.getElementById("rangeFilter").value;

          //   if (rangeFilter) {
          //     // Only apply the filter if we are in the content2 menu
          //     if (selectedDateRange === "") {
          //       // If the first option (empty string) is selected, show all data
          //       map.setFilter("poly", null);
          //     } else {
          //       // Apply the filter for the selected date range
          //       map.setFilter("poly", [
          //         "==",
          //         ["get", "سنة النشوء بعلاقتها مع النوع"],
          //         selectedDateRange,
          //       ]);
          //     }
          //   }
        }

        // Initialize city selection on page load
        initializeCitySelection();

        // Function to handle reset button click
        function handleResetButtonClick() {
          // Reset any filter on the 'poly' layer to show all features
          if (map.getLayer("poly")) {
            map.setFilter("poly", null); // This removes any filters applied and shows all features
          }

          // Clear city and range filter dropdowns
          document.getElementById("citySelect").value = ""; // Reset city selection
          document.getElementById("rangeFilter").value = ""; // Reset date range selection

          // Reset the GeoJSON source data to its full set (without filtering)
          fetch("./beirut-informalitymap.geojson")
            .then((response) => response.json())
            .then((data) => {
              // Update the source with the original full dataset
              map.getSource("places").setData({
                type: "FeatureCollection",
                features: data.features,
              });
            });

          // Optionally, fly back to the default center or zoom level after reset
          map.flyTo({
            center: [35.52907144495116, 33.86973923491871],
            zoom: 12,
          }); // Default to Beirut or desired center/zoom
        }

        // // Function to handle reset button click
        // function handleResetButtonClick() {
        //   // Clear the filter on the 'poly' layer to show all features
        //   if (map.getLayer("poly")) {
        //     map.setFilter("poly", null); // This will remove any filters applied and show all features
        //   }
        //   map.setFilter("poly", null);
        //   // initializeCitySelection();

        //   // If you need to reapply a specific filter or refresh data, call updateMapData
        //   updateMapData(); // Uncomment if you need to call this to reset or refresh other parts
        // }

        // // Function to update button states
        // function updateButtons() {
        //   const prevButton = document.getElementById("prevButton");
        //   const nextButton = document.getElementById("nextButton");

        //   // Disable "Previous" button if at the first city
        //   prevButton.disabled = currentCityIndex === 0;

        //   // Disable "Next" button if at the last city
        //   nextButton.disabled = currentCityIndex === cities.length - 1;
        // }

        // document
        //   .getElementById("prevButton")
        //   .addEventListener("click", function () {
        //     // Toggle visibility or replace content in the existing box
        //     document.getElementById("contentBox").style.display = "block";
        //     document.getElementById("otherContentBox").style.display = "none";
        //     this.disabled = true; // Disable the 'Previous' button
        //   });

        // document
        //   .getElementById("nextButton")
        //   .addEventListener("click", function () {
        //     // Toggle visibility or replace content in the existing box
        //     document.getElementById("contentBox").style.display = "none";
        //     document.getElementById("otherContentBox").style.display = "block";
        //     document.getElementById("prevButton").disabled = false; // Enable the 'Previous' button
        //   });

        //     // Function to handle "Next" button click
        //     function showNextContent() {
        //       const contentBox = document.getElementById("contentBox");

        //       // Overwrite the content of the box with new content
        //       contentBox.innerHTML = `
        //     <div class="new-content">
        //         <p>هذه هي المحتويات الجديدة</p>
        //         <!-- Add any other new content or elements here -->
        //         <button id="backButton">عودة</button>
        //     </div>
        // `;

        //       // Add event listener for "Back" button
        //       document
        //         .getElementById("backButton")
        //         .addEventListener("click", () => {
        //           // Call the initialize function to reset content to the original
        //           contentBox.innerHTML = `
        //                 <div class="box" id="contentBox">
        //             <p class="note"><strong>إختر/ي المدينة</strong></p>
        //             <div class="boxB">
        //               <nav id="filter-group" class="filter-group"></nav>
        //               <div id="menu-navigation">
        //                 <button id="prevButton" disabled>السابق</button>
        //                 <button id="nextButton">التالي</button>
        //               </div>
        //             </div>
        //           </div>
        //             `;
        //           initializeCitySelection(); // Reinitialize the original content
        //         });
        //     }

        // function updateMapData() {
        //   this.map = map; // Assign map instance to this.map

        //   const selectedCity = document.getElementById("citySelect").value;
        //   if (cityCoordinates[selectedCity]) {
        //     const [lng, lat] = cityCoordinates[selectedCity];
        //     map.flyTo({ center: [lng, lat], zoom: 12 });
        //   }

        // // Function to apply category filter
        // const applyCategoryFilter = (selectedCategories) => {
        //   categoryFilter = [
        //     "any",
        //     selectedCategories.map((category) => [
        //       "==",
        //       ["get", "Strike_Type"],
        //       category,
        //     ]),
        //     selectedCategories.map((category) => [
        //       "==",
        //       ["get", "Strike_Target"],
        //       category,
        //     ]),
        //     [">", ["get", "Strike_Victims"], 0],
        //   ];

        //   // Apply the category filter to the map's data source
        //   filterByCategory(selectedCategories);
        // };

        // // Function to apply date filter
        // const applyDateFilter = (fromTimestamp, toTimestamp) => {
        //   dateFilter = [
        //     "all",
        //     [">=", ["get", "Date"], fromTimestamp],
        //     ["<=", ["get", "Date"], toTimestamp],
        //   ];

        //   // Apply the date filter to the map's data source
        //   map.setFilter("poly", dateFilter);
        // };

        // // Call applyDateFilter initially or whenever the date range changes
        // applyDateFilter(fromTimestamp, toTimestamp);

        // // // Call applyCategoryFilter when a category is selected
        // applyCategoryFilter(selectedCategories);

        // const filteredFeatures = map.queryRenderedFeatures({
        //   layers: ["poly"],
        // });

        //           // Assuming "places" is the ID of your GeoJSON data source
        // const geojsonData = map.getSource('poly')._data;

        // // Now you have access to the features

        map.on("mousemove", "poly", function (e) {
          if (e.features[0]) {
            mouseover(e.features[0]);
          } else {
            mouseout();
          }
        });

        map.on("mouseout", "poly", function (e) {
          mouseout();
        });

        let fHover = null; // Define fHover outside any function scope

        function mouseover(feature) {
          var fHover = feature;
          map.getCanvasContainer().style.cursor = "pointer";

          map.setFeatureState(
            {
              source: "places",
              id: fHover.id,
            },
            {
              hover: true,
            }
          );
        }

        function mouseout() {
          if (!fHover) return;
          map.getCanvasContainer().style.cursor = "grab";
          map.setFeatureState(
            {
              source: "places",
              id: fHover.id,
            },
            {
              hover: false,
            }
          );
          fHover = null;
        }

        var popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: true,
          //offset: [160, 0],
        });

        map.on("mouseenter", "poly", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        // // Change the cursor back to a pointer
        // // when it leaves the states layer.
        // map.on("mouseleave", "poly", () => {
        //   map.getCanvas().style.cursor = "";
        // });

        map.on("click", "poly", function (e) {
          map.getCanvas().style.cursor = "pointer";
          //var centroid = turf.centroid(turf.polygon(e.features[0].geometry));
          //var coordinates = e.features[0].geometry.coordinates.slice()
          var description = e.features[0].properties;
          // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          //   coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
          // }
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              '<h3 style="direction:rtl;">' +
                // strikeBy(description.Strike_Type) +
                // '</h3><p style="direction:rtl;">' +
                // // checkArea(description.area) +
                // '</p><p style="direction:rtl;"> ' +
                // strikeTarget(description.Strike_Target) +
                // '<h3 style="direction:rtl;">' +
                // strikeVictims(description.Strike_Victims) +
                // '</p><p style="direction:rtl;"> ' +
                mapDetails(description) +
                "</p>"
            )
            .addTo(map);
        });

        // function calculateTotalStrikeCount(feature) {
        //   const uniqueDates = new Set(feature.properties.dates);
        //   return uniqueDates.size;
        // }

        //replaced strikeDetails function
        function mapDetails(info) {
          // // Convert fromDate and toDate to timestamps
          // const fromTimestamp = fromDateInput.value.valueOf();
          // const toTimestamp = toDateInput.value.valueOf();

          // const pickedVillage = info.objectid1;
          // var features = map.querySourceFeatures("places");
          // var totalCount = 0;
          // var datesCounted = []; // To track unique dates
          // var strikeTypeCounts = {}; // Object to store count of each strike type
          // var targetCounts = {}; // Object to store count of each target type
          // // var victimCounts = {}; // Object to store count of each target type
          // var totalVictimCount = 0; // Total count of victims

          // // Object containing paths to strike type images
          // var strikeTypeImages = {
          //   "طيران/ غارة جوية": "/images/AIRCRAFT.svg",
          //   "قذائف مدفعية": "/images/ARTILARY SHELLS.svg",
          //   "قنابل مضيئة": "/images/FLARE BOMB.svg",
          //   فسفوري: "/images/PHOSPHORUS.svg",
          //   "غير مؤكد": "/images/na-svgrepo-com.svg",
          // };

          // // Object containing paths to strike target images
          // var targetImages = {
          //   "بيت/مبنى": "/images/house.svg",
          //   "سيارة/دراجة": "/images/car-bicycle.svg",
          //   "مدرسة/مستشفى/مسجد": "/images/school-mosque-hospital.svg",
          //   صحافة: "/images/press.svg",
          //   "جيش لبناني": "/images/lb army.svg",
          //   "قوات حفظ السلام": "/images/peaceforces.svg",
          //   "دواجن/زراعة/صيد": "/images/farm.svg",
          //   "دفاع مدني/إسعاف": "/images/دفاع مدني - اسعاف.svg",
          //   "غابات/ أحراج": "/images/forest.svg",
          //   "مشاريع حيوية/ بنى تحتية": "/images/infrastructure.svg",
          //   مقبرة: "/images/cemetery.svg",
          // };

          // var targetVictims = {
          //   "ضحايا مدنيين": "/images/victim.svg",
          // };

          // const processedIDs = new Set(); // Set to store processed IDs
          // for (var i = 0; i < features.length; i++) {
          //   var props = features[i].properties;
          //   const featureID = props.ID; // Get the ID of the current feature
          //   // Check if the feature ID has already been processed
          //   if (processedIDs.has(featureID)) {
          //     continue; // Skip processing if the ID has been processed before
          //   }

          //   processedIDs.add(featureID); // Add the ID to the set of processed IDs

          //   if (props.objectid1 == pickedVillage) {
          //     if (
          //       fromTimestamp === "" ||
          //       toTimestamp === "" || // No date range specified
          //       (props.Date >= fromTimestamp && props.Date <= toTimestamp) // Date falls within the specified range
          //     ) {
          //       // Check if the date has not been counted before
          //       if (!datesCounted.includes(props.Date)) {
          //         datesCounted.push(props.Date); // Add the date to the list of counted dates
          //         totalCount++; // Increment total count
          //       }

          //       const countedStrikeTypes = new Set(); // Set to store already counted strike types for the current date
          //       const countedStrikeTargets = new Set(); // Set to store already counted strike targets for the current date

          //       // Increment strike type count for the current feature
          //       const strikeTypes = props.Strike_Type.split(","); // Split into individual categories
          //       // console.log(strikeTypes);
          //       strikeTypes.forEach((type) => {
          //         const trimmedType = type.trim();
          //         if (Object.keys(strikeTypeImages).includes(trimmedType)) {
          //           countedStrikeTypes.add(trimmedType); // Add strike type to the set
          //         }
          //       });

          //       // Increment target count for the current feature
          //       if (props.Strike_Target) {
          //         const targetTypes = props.Strike_Target.split(","); // Split into individual categories
          //         targetTypes.forEach((target) => {
          //           const trimmedTarget = target.trim();
          //           if (Object.keys(targetImages).includes(trimmedTarget)) {
          //             countedStrikeTargets.add(trimmedTarget); // Add strike target to the set
          //           }
          //         });
          //       }

          //       // Update strike type and strike target counts
          //       countedStrikeTypes.forEach((type) => {
          //         // console.log(props.ID);
          //         // console.log("type:" + type);
          //         // console.log(strikeTypeCounts[type]);
          //         strikeTypeCounts[type] = (strikeTypeCounts[type] || 0) + 1;
          //       });
          //       countedStrikeTargets.forEach((target) => {
          //         targetCounts[target] = (targetCounts[target] || 0) + 1;
          //       });

          //       // Increment total victim count for the current feature
          //       if (
          //         props.Strike_Victims != "null" &&
          //         parseInt(props.Strike_Victims) > 0
          //       ) {
          //         totalVictimCount += parseInt(props.Strike_Victims);
          //       }
          //     }
          //   }
          // }

          // if (pickedVillage == "" || info.objectid === null) {
          //   return "";
          // }

          // Constructing the return string with counts of each strike type, target type, and total victim count
          var returnString =
            '<div dir="rtl">' +
            "الاسم: " +
            info["name"] + // 'name'
            "<p></p>" +
            "سنة النشوء بعلاقتها مع النوع: " +
            info["سنة النشوء بعلاقتها مع النوع"] + // 'yearOfEstablishmentTypeRelation'
            "<p></p>" +
            "الوصول إلى الأرض: " +
            info["الوصول إلى الأرض"] + // 'landAccess'
            "<p></p>" +
            "ملكية الأرض: " +
            info["ملكية الأرض"] + // 'landOwnership'
            "<p></p>" +
            "التصنيف الحالي للأرض: " +
            info["التصنيف الحالي للأرض في الخرائط الرسمية"] + // 'currentLandClassification'
            "<p></p>" +
            "وضع البناء: " +
            info["وضع البناء"] + // 'buildingStatus'
            "<p></p>" +
            "المقاربة: " +
            info["المقاربة"] + // 'approach'
            "<p></p>" +
            "</div>";

          // // Append strike type counts to the return string
          // for (var strikeType in strikeTypeCounts) {
          //   returnString +=
          //     "<br> <img src='" +
          //     strikeTypeImages[strikeType] +
          //     "' alt='" +
          //     strikeType +
          //     "' style='width: 20px; height: 20px;'>" +
          //     strikeTypeCounts[strikeType];
          // }

          // // Append target type counts to the return string
          // for (var targetType in targetCounts) {
          //   returnString +=
          //     "<br> <img src='" +
          //     targetImages[targetType] +
          //     "' alt='" +
          //     targetType +
          //     "' style='width: 20px; height: 20px;'>" +
          //     targetCounts[targetType];
          // }

          // // Append total victim count to the return string
          // returnString +=
          //   // "<p></p><img src='/images/victims.svg' style='width: 20px; height: 20px;'>" +
          //   // totalVictimCount +
          //   "</div>";

          return returnString;
        }

        // function setCentroidImage(features) {
        //   features.forEach((feature) => {
        //     const totalCount = feature.properties.totalStrikeCount;
        //     const imagePath = getImagePath(totalCount);
        //     feature.properties.centroidImage = imagePath;
        //   });
        // }

        // // Now filterByCategory is accessible within this component
        // this.handleCategoryClick = (category) => {
        //   // Call filterByCategory function passing the clicked category
        //   filterByCategory(category);
        // };
        //     handleCategoryClick(category) {
        //   this.filterByCategory(category);
        // };

        map.on("mouseleave", "poly", function () {
          map.getCanvas().style.cursor = "grab";
          popup.remove();
        });
      } catch (error) {
        console.error("Error during map initialization:", error);
      }
    });
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  font-family: "Raleway" !important;
  /* direction: rtl !important; */
}

/* Hide attributes  */
.mapbox-improve-map {
  display: none;
}

.mapboxgl-popup-close-button {
  color: white !important;
  font-size: 20px !important;
}

.mapboxgl-ctrl-attrib {
  display: none;
}

.mapboxgl-ctrl-logo {
  display: none !important;
}

/* Control box */
.mapboxgl-ctrl-group {
  border-radius: 1px;
}
.mapboxgl-ctrl-group button:focus {
  box-shadow: none;
}
.mapboxgl-ctrl-group > .mapboxgl-ctrl-icon {
  width: 30px;
  height: 30px;
}
.mapboxgl-ctrl-group > .mapboxgl-ctrl-icon > button {
  width: 30px !important;
  height: 30px !important;
  border-radius: 2px !important;
}
.mapboxgl-ctrl-compass-arrow {
  margin: 0.1em 2px !important;
}

.box {
  position: absolute;
  left: 40px;
  display: flex;
  flex-direction: column; /* Align items vertically */
  width: 300px;
  height: 80vh;
  padding: 20px;
  z-index: 100000;
  justify-content: flex-start; /* Align items to the top */
  top: 0px;
  margin: 0.5rem;
  background-color: rgb(255, 255, 255);
  outline: 2px solid black;
  box-sizing: border-box;
}

/* Styles for .boxC */
/* .boxB {
  position: absolute;
  left: 50%; 
  top: 30%;
  display: flex;
  flex-direction: column;
  align-items: center; 
  width: auto;
  height: auto;
  z-index: 100000;
  color: #ffffff;
  transition: height 0.5s ease; 
  direction: rtl !important;
  transform: translateX(-50%); 
} */

/* Styles for .boxB */
.boxB {
  position: absolute; /* Ensure children are positioned relative to this */
  right: 1%;
  bottom: 1%;
  display: flex;
  z-index: 100000;
  flex-direction: column; /* Stack children vertically */
  align-items: center; /* Center children horizontally */
  width: auto; /* Ensure it takes full width */
  height: auto;
}

.minimized {
  display: none;
  /* height: 50px; Define the height when box is minimized */
}

.title-Box {
  position: absolute;
  background-color: rgb(255, 255, 255);
  /* outline: 2px black solid; */
  z-index: 10000;
  /* height: 97px; */
  /* height: Hug; */
  height: 80px;
  /* width: 300px; */
  width: 200px;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.20000000298023224));
  border-radius: 5px;
  padding-left: 11px;
  padding-right: 11px;
  padding-top: 8px;
  padding-bottom: 8px;
  text-align: right;
  /* vertical-align: text-middle;x   */
  display: flex;
  flex-direction: column;
  right: 40px;
  top: 10px;
  font-size: 1.5em;
  direction: rtl !important;
}

/* @media screen and (max-width: 767px) {
  .title-Box {
    position: absolute;
    background-color: rgb(255, 255, 255);
    /* outline: 2px black solid; 
    z-index: 10000;
    height: 60px;
    /* height: Hug; 
    /* width: 300px; 
    width: 30%;
    filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.20000000298023224));
    border-radius: 5px;
    padding-left: 11px;
    padding-right: 11px;
    padding-top: 8px;
    padding-bottom: 8px;
    text-align: right;
    /* vertical-align: text-middle;x   
    display: flex;
    flex-direction: column;
    right: 40px;
    top: 10px;
    font-size: 0.75em;
    direction: rtl !important;
  }
} */

.boxC {
  position: absolute;
  /* left: 85%; */
  left: 40px;
  bottom: 5%;
  /* font-weight: bold; */
  font-family: "Tajawal";

  display: flex;
  width: auto;
  height: auto;
  z-index: 100000;
  flex-flow: column;
  align-content: flex-start !important;
  color: #ffffff;
  /* top: 37%; */
  /* margin: 0.5rem; */
  /* background-color: rgba(255, 255, 255, 0.288); */
  /* box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); */
  transition: height 0.5s ease; /*Add smooth transition for height change*/
  direction: rtl !important;
}
/* @media screen and (max-width: 767px) {
  .boxC {
    bottom: 7%;
  }
} */

/* Common styles for all navigation buttons */
.navButton {
  background-color: #3498db; /* Blue color */
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  flex: 1; /* Make buttons take equal width */
}

/* Styles for enabled buttons (default) */
.navButton:not(:disabled) {
  background-color: #3498db; /* Blue color */
  color: white;
}

/* Hover effect for enabled buttons */
.navButton:not(:disabled):hover {
  background-color: #2980b9; /* Darker blue */
  transform: scale(1.05); /* Slightly enlarge on hover */
}

/* Styles for disabled buttons */
.navButton:disabled {
  background-color: #ccc; /* Grey color for disabled state */
  color: #666; /* Grey text color */
  cursor: not-allowed; /* Cursor for disabled button */
  transform: none; /* Remove any transformations */
}
/* Hover effect for navigation buttons */
.navButton:hover {
  background-color: #2980b9; /* Darker blue */
  transform: scale(1.05); /* Slightly enlarge on hover */
}

/* Styles for .content */
.content {
  flex: 1; /* Take up remaining space */
}
/* Styles for #filter-group */
#filter-group {
  margin-bottom: 5px; /* Add some spacing below */
}

/* CSS for menu-navigation */
.reset-filter {
  display: flex;
  flex-direction: column; /* Stack buttons vertically */
  align-items: center; /* Center buttons horizontally */
  gap: 10px; /* Space between buttons */
  margin-bottom: 20px; /* Space below the menu */
}

/* Style for the city dropdown */
.city-dropdown {
  font-size: 1.5em; /* Increase font size */
  margin-top: 20px; /* Add some spacing below */
  padding: 8px; /* Padding for better appearance */
  border: 1px solid #ccc; /* Border styling */
  border-radius: 4px; /* Rounded corners */
  width: 100%; /* Full width */
}
/* .button {
  font-size: 5px;
  width: 120px;
} */
/* .button{
  top: 80%;
} */

/* .legend-item.minimized {
  display: none;
} */

.title {
  /* margin-left: 0.5rem;
  margin-right: 0.5rem; */
  display: flex;
  text-align: center;
  top: 0px;
  /* right: 40px; */
  /* width: 300px;
  height: 97px; */
  /* align-items: center; */
  /* text-justify: center; */
  text-align: right;
  vertical-align: text-middle;
  /* font-size: 20px; */
  font-size: 1.6em;

  line-height: 27px;
  font-family: "Raleway";
  font-size: medium;
  color: rgb(0, 0, 0);
  /*flex-flow: row;*/
  width: auto;

  margin-bottom: -0.5rem;
  flex-direction: column;
}
.box-row {
  position: absolute;
  left: 0px;
  display: flex;
  width: 210px;
  height: 50px;
  z-index: 100000;
  flex-flow: column;
  align-content: flex-start !important;
  bottom: 4%;
  margin: 0.5rem;
  padding-bottom: 10px;
  background-color: rgba(255, 255, 255, 0);
  /* box-shadow: 0px 20px 25px -5px rgba(0, 0, 0, 0),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); */
}
/* @media screen and (max-width: 767px) {
  .box-row {
    bottom: 6%;
  }
} */

.boxA {
  /* margin-left: 2rem;
  margin-right: 2rem; */
  left: 40px;
  margin-top: 1.3rem;
  display: flex;
  text-align: center;
  /*align-items: center;*/
  /*text-justify: center;*/
  font-size: 10px;
  font-family: "Tajawal";
  /*flex-flow: row;*/
  flex-direction: row;
  margin-bottom: 0.5rem;
  /* color: #181615; */
  color: #ffff;
  direction: rtl !important;
}
.note {
  margin-left: 2px;
  margin-right: 5px;
  align-content: center;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  text-align: center !important;
  font-size: 1.5em;
  font-family: "Tajawal";
  margin-bottom: 0.5rem;
  color: rgb(0, 0, 0);
  direction: rtl !important;
}

.mapboxgl-popup {
  min-width: 100px !important;
  max-width: 270px !important;
  direction: rtl !important;
}

.mapboxgl-popup-content {
  text-align: right !important;
  font-family: "Raleway" !important;
  background-color: #225c64 !important;
  opacity: 0.8 !important;
  color: white !important;
  font-size: 14px;
  direction: rtl !important;
}

.mapboxgl-popup-tip {
  display: none !important;
  direction: rtl !important;
}

.mapboxgl-popup-content {
  text-align: center;
  font-family: "Raleway" !important;
  direction: rtl !important;
}

@font-face {
  font-family: "Raleway";
  font-weight: normal;
  src:
  /* url("/fonts/Raleway-Regular.eot?") format("eot"),
    url("/fonts/Raleway-Regular.woff2") format("woff2"),
    url("/fonts/Raleway-Regular.woff") format("woff"),
    url("/fonts/Raleway-Regular.otf") format("opentype"), */ url("/fonts/Raleway-Regular.ttf")
    format("truetype");
  /* url("/fonts/Raleway-Regular.svg#Raleway-Regular") format("svg"); */
}

@font-face {
  font-family: "Tajawal";
  font-weight: normal;
  src:
  /* url("/fonts/Tajawal-Regular.eot?") format("eot"),
    url("/fonts/Tajawal-Regular.woff2") format("woff2"),
    url("/fonts/Tajawal-Regular.woff") format("woff"),
    url("/fonts/Tajawal-Regular.otf") format("opentype"), */ url("/fonts/Tajawal-Regular.ttf")
    format("truetype");
  /* url("/fonts/Tajawal-Regular.svg#Tajawal-Regular") format("svg"); */
}

/* legend styling */
#legend {
  background-color: white;
  padding: 10px;
  border: 1px solid #ccc;
  font-family: Arial, sans-serif;
  max-width: 300px; /* Ensure legend doesn't overflow */
  border-radius: 5px; /* Add subtle rounded corners */
}

#legend h3,
#legend h4 {
  margin: 10px 0;
  font-size: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px; /* Slightly larger margin for spacing */
}

.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  background-color: gray; /* default color */
  border: 1px solid #000;
  border-radius: 3px; /* Slight rounding for a modern look */
}

.legend-outline {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border: 2px solid black; /* default border color */
  background-color: transparent;
  border-radius: 3px;
}

/* Hover effect for better interaction */
.legend-item:hover .legend-color,
.legend-item:hover .legend-outline {
  opacity: 0.8;
  transform: scale(1.1); /* Slightly enlarge on hover */
  transition: transform 0.2s ease, opacity 0.2s ease;
}

#minimizeBtn {
  border: none;
  /* background-color: transparent; */
  border: 1px solid #000; /* Optional: Adds a border */
  background-color: #f0f0f0;
  cursor: pointer;
  float: right;
}

.circleLegend {
  position: absolute;
  bottom: 1px;
  left: 20px;
  z-index: 1000;
  background-color: white;
  border: 1px solid #ccc;
  padding: 1px;
  /* box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); */
  border-radius: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: fit-content; /* Adjust width as needed */
}

@media screen and (max-width: 767px) {
  .circleLegend {
    left: 80%;
    right: 2px;
    /* width: 100%; */
    bottom: 60px;
    flex-direction: column;
  }
}

.circleLegend .icon-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px !important;
  /* flex-direction: column; */
}
.circleLegend .icon-item img {
  width: auto; /* Adjust size as needed */
  height: 20px;
  /* width: 80px; */
  margin-right: 5px;
  align-content: center;
}
.circleLegend .icon-item:last-child {
  margin-bottom: 0;
}

/* ends here */

/* Media Query for smaller screens */
@media screen and (max-width: 768px) {
  .box {
    width: 30%; /* Adjust the width as needed */
    height: 360px; /* Or any smaller height */
    margin: 10px auto; /* Center it with a smaller margin */
    padding: 2px;
  }

  .mapboxgl-ctrl {
    font-size: 12px; /* Make controls smaller */
  }
  .legend {
    font-size: 10px; /* Reduce legend text size */
  }
  .marker {
    width: 15px; /* Reduce marker size */
    height: 15px;
  }

  .boxB {
    top: 1%;
    right: 1%;
    /* transform: translateX(-50%); */
  }

  .box .content {
    padding: 5px; /* Reduce padding */
    margin: 0; /* Eliminate unnecessary margins */
  }

  /* Title box adjustments */
  .title-Box {
    width: 80%;
    height: 60px;
    font-size: 1em;
    right: 10px;
  }

  /* Box-row adjustments */
  .box-row {
    bottom: 6%;
    left: 10px;
  }

  .legend {
    position: absolute;
    top: 10px;
    right: 10px; /* Push legend to the right */
    width: 150px; /* Adjust width if needed */
  }

  .option {
    font-size: 10px; /* Reduce font size */
    padding: 0px; /* Adjust padding if needed */
    margin: 0px 0; /* Reduce margin */
  }

  .note {
    margin-left: 1px;
    margin-right: 1px;
    font-size: 10px; /* Reduce font size */
    padding: 0%; /* Adjust padding */
    margin: 5px 0; /* Reduce margin */
    text-align: center !important;
    margin-bottom: 0.1rem;
  }

  .option,
  .note {
    width: auto; /* Ensure they resize based on content */
    line-height: 1.3; /* Decrease line spacing if necessary */
  }

  .filter-group {
    margin-bottom: 1px; /* Add some spacing below */
  }

  /* Style for the city dropdown */
  .city-dropdown {
    font-size: 0.9em; /* Increase font size */
    margin-top: 5px;
    padding: 2px; /* Padding for better appearance */
    border: 1px solid #ccc; /* Border styling */
    border-radius: 4px; /* Rounded corners */
    width: 100%; /* Full width */
  }

  #legend {
    max-width: 100%; /* Let it expand fully on smaller screens */
    padding: 5px;
  }

  .legend-color,
  .legend-outline {
    width: 15px;
    height: 15px;
  }

  #legend h3,
  #legend h4 {
    font-size: 10px; /* Decrease font size for mobile */
    margin: 5px 0; /* Adjust margin for mobile */
  }

  .reset-button {
    width: 100px !important; /* Adjust width for smaller screens */
    /* margin-left: -10px !important; Adjust margin for smaller screens */
    margin-bottom: 1px;
    font-size: 10px;
  }
  .legend-item {
    margin-bottom: 0px;
  }
}

@media screen and (max-width: 767px) {
  /* Adjust navigation button size */
  .navButton {
    padding: 8px 15px;
    font-size: 0.85em;
  }
}
</style>
