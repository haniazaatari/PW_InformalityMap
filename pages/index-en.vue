<template>
  <main>
    <div id="map" ref="map">
      <div class="box">
        <p class="note"><strong>Select days of attack</strong></p>

        <nav id="filter-group" class="filter-group"></nav>
      </div>

      <div id="map"></div>

      <div id="circleLegend" class="circleLegend">
        <div class="icon-item">
          <img src="/images/CIRCLE-01.svg" alt="1-2 icon" />1-2 days
        </div>
        <div class="icon-item">
          <img src="/images/CIRCLE-02.svg" alt="3-6 icon" />3-6
        </div>
        <div class="icon-item">
          <img src="/images/CIRCLE-03.svg" alt="7-12 icon" />7-12
        </div>
        <div class="icon-item">
          <img src="/images/CIRCLE-04.svg" alt="13-24 icon" />13-24
        </div>
        <div class="icon-item">
          <img src="/images/CIRCLE-05.svg" alt="25-48 icon" />25-48
        </div>
        <div class="icon-item">
          <img src="/images/CIRCLE-06.svg" alt="49-96 icon" />49-96
        </div>
        <div class="icon-item">
          <img src="/images/CIRCLE-07.svg" alt=">97 icon" />>97
        </div>
      </div>

      <div class="box-row">
        <p class="boxA">
          Created by Public Works Studio CC;
          <!-- <script src="https://unpkg.com/vue/dist/vue.min.js"></script> -->
        </p>
      </div>

      <div class="boxB" :class="{ minimized: isBoxMinimized }">
        <!-- legend items -->
        <div class="legend" :class="{ minimized: isBoxMinimized }">
          <div
            class="legend-item"
            v-for="(item, index) in legendItems"
            :key="index"
            :class="{ clicked: item.clicked }"
            @click="handleCategoryClick(item.label)"
          >
            <img :src="item.icon" :alt="item.label" class="legend-item-img" />
            <!-- Add a space between img and label -->
            {{ "   " }}
            <label>{{ item.enlabel }}</label
            >{{ "   " }}
          </div>
        </div>
      </div>
      <div class="boxC" id="lastUpdatedDiv"></div>
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

// Object containing paths to strike type images
var strikeTypeImages = {
  "طيران/ غارة جوية": "/images/AIRCRAFT.svg",
  "قذائف مدفعية": "/images/ARTILARY SHELLS.svg",
  "قنابل مضيئة": "/images/FLARE BOMB.svg",
  " فسفوري": "/images/PHOSPHORUS.svg",
  "غير مؤكد": "/images/na-svgrepo-com.svg",
};

// Object containing paths to strike target images
var targetImages = {
  "بيت/مبنى": "/images/house.svg",
  "سيارة/دراجة": "/images/car-bicycle.svg",
  "مدرسة/مستشفى/مسجد": "/images/school-mosque-hospital.svg",
  صحافة: "/images/press.svg",
  "جيش لبناني": "/images/lb army.svg",
  "قوات حفظ السلام": "/images/peaceforces.svg",
  "دواجن/زراعة/صيد": "/images/farm.svg",
  "دفاع مدني/إسعاف": "/images/دفاع مدني - اسعاف.svg",
  "غابات/ أحراج": "/images/forest.svg",
  "مشاريع حيوية/ بنى تحتية": "/images/infrastructure.svg",
  مقبرة: "/images/cemetery.svg",
};

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
      selectedCategories: [], // Array to store selected categories
      legendItems: [
        {
          enlabel: "Air Strikes",
          label: "طيران/ غارة جوية",
          icon: "/images/AIRCRAFT.svg",
          clicked: false,
        },
        {
          enlabel: "Artillery Shells",
          label: "قذائف مدفعية",
          icon: "/images/ARTILARY SHELLS.svg",
          clicked: false,
        },
        {
          enlabel: "Flare Bombs",
          label: "قنابل مضيئة",
          icon: "/images/FLARE BOMB.svg",
          clicked: false,
        },
        {
          enlabel: "Phosphourous",
          label: "فسفوري",
          icon: "/images/PHOSPHORUS.svg",
          clicked: false,
        },
        {
          enlabel: "N/A",
          label: "غير مؤكد",
          icon: "/images/na-svgrepo-com.svg",
          clicked: false,
        },
        {
          enlabel: "House/Building",
          label: "بيت/مبنى",
          icon: "/images/house.svg",
          clicked: false,
        },
        {
          enlabel: "Car/Bike",
          label: "سيارة/دراجة",
          icon: "/images/car-bicycle.svg",
          clicked: false,
        },
        {
          enlabel: "School/Hospital/Mosque",
          label: "مدرسة/مستشفى/مسجد",
          icon: "/images/school-mosque-hospital.svg",
          clicked: false,
        },
        {
          enlabel: "Press",
          label: "صحافة",
          icon: "/images/press.svg",
          clicked: false,
        },
        {
          enlabel: "Lebanese Army",
          label: "جيش لبناني",
          icon: "/images/lb army.svg",
          clicked: false,
        },
        {
          enlabel: "Peace Keeping Forces",
          label: "قوات حفظ السلام",
          icon: "/images/peaceforces.svg",
          clicked: false,
        },
        {
          enlabel: "Poultry/Farming/Fishing",
          label: "دواجن/زراعة/صيد",
          icon: "/images/farm.svg",
          clicked: false,
        },
        {
          enlabel: "Civil Defense/Ambulance",
          label: "دفاع مدني/إسعاف",
          icon: "/images/دفاع مدني - اسعاف.svg",
          clicked: false,
        },
        {
          enlabel: "Forests/Woods",
          label: "غابات/ أحراج",
          icon: "/images/forest.svg",
          clicked: false,
        },
        {
          enlabel: "Vital Projects/Infrastructure",
          label: "مشاريع حيوية/ بنى تحتية",
          icon: "/images/infrastructure.svg",
          clicked: false,
        },
        {
          enlabel: "Cemetry",
          label: "مقبرة",
          icon: "/images/cemetery.svg",
          clicked: false,
        },
        {
          enlabel: "Victims",
          label: "ضحايا مدنيين",
          icon: "/images/victims.svg",
          clicked: false,
        },

        //   { label: "AirStrike", icon: "/images/air-force-plane-svgrepo-com.svg" },
        //   { label: "بيت", icon: "/images/house.svg" },
        //   // Add more legend items here if needed
      ],
    };
  },
  // Define the filterByCategory function in the Vue component's methods
  methods: {},

  mounted() {
    const map = new mapboxgl.Map({
      accessToken: process.env.mapboxAccessToken,
      container: "map",
      style: process.env.MapboxStyle1,
      pitchWithRotate: true,
      minZoom: 9,
      maxZoom: 18,
    });

    const filterGroup = document.getElementById("filter-group");

    const legendItems = document.querySelectorAll(".legend-item");

    // if (mapboxgl.getRTLTextPluginStatus() === "unavailable") {
    //   mapboxgl.setRTLTextPlugin(
    //     "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
    //     null,
    //     true
    //   );
    // }

    setTimeout(() => {
      map.flyTo({
        zoom: 9.5,
        speed: 0.3,
      });
    }, 2000);

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // this.map = map; // Assign map instance to this.map

    map.on("load", () => {
      try {
        map.addSource("places", {
          type: "geojson",
          generateId: true,
          data: "./target.geojson",
        });

        map.addLayer({
          id: "poly",
          type: "fill",
          source: "places", // reference the data source
          layout: {},
          paint: {
            "fill-color": "pink", // blue color fill
            "fill-opacity": 0.4,
          },
        });

        // Add a grey outline around the polygon.
        map.addLayer({
          id: "outline",
          type: "line",
          source: "places",
          layout: {},
          paint: {
            "line-color": "black",
            "line-width": 0.05,
          },
        });

        // Load GeoJSON data using Fetch API
        fetch("./merged_counts.geojson")
          .then((response) => {
            // Check if response is successful
            if (!response.ok) {
              throw new Error("Failed to load GeoJSON data.");
            }
            // Parse JSON data
            return response.json();
          })
          .then((data) => {
            // Initialize markers array
            map.markers = [];
            // Check if data contains features
            if (data && data.features && data.features.length > 0) {
              data.features.forEach((feature) => {
                // Extract strike type properties
                const objectId = feature.properties.OBJECTID1;
                const strikeTypes = feature.properties;

                // Create a marker for each strike type
                Object.entries(strikeTypes).forEach(([strikeType, count]) => {
                  // Skip if the strike type is not relevant or has a count of 0
                  if (
                    strikeType === "OBJECTID1" ||
                    strikeType === "index" ||
                    count === 0
                  ) {
                    return;
                  }

                  // Get color and marker HTML based on count
                  // const markerColor = getColorForCount(strikeType);
                  const markerHTML = setMarkerHTML(count, strikeType);

                  // Create a marker and add it to the map
                  if (markerHTML) {
                    const marker = new mapboxgl.Marker({
                      element: markerHTML,
                    })
                      .setLngLat(feature.geometry.coordinates)
                      .addTo(map);

                    //added the category
                    // Set a data-category attribute on the marker element
                    marker
                      .getElement()
                      .setAttribute("data-category", strikeType);

                    // Store marker in markers array
                    map.markers.push(marker);
                  }
                });
              });

              // console.log("Strike Type Counts:", strikeTypeCounts);
            } else {
              console.warn("No features found in the GeoJSON data.");
            }
          });

        //colored circles:
        //add the source to the map
        map.addSource("counts", {
          type: "geojson",
          generateId: true,
          data: "./merged_counts.geojson",
        });

        // Handle date filtering
        const fromDateInput = document.createElement("input");
        fromDateInput.type = "date";
        fromDateInput.id = "fromDate";
        fromDateInput.style.marginTop = "40px";
        fromDateInput.style.alignContent - "center";
        fromDateInput.addEventListener("change", updateMapData);
        filterGroup.appendChild(fromDateInput);

        const toDateInput = document.createElement("input");
        toDateInput.type = "date";
        toDateInput.id = "toDate";
        toDateInput.style.marginTop = "10px";
        toDateInput.style.alignContent - "center";
        toDateInput.addEventListener("change", updateMapData);
        filterGroup.appendChild(toDateInput);

        // Create the reset button
        const legendButton1 = document.createElement("button");
        legendButton1.textContent = "Hide Filterable Legend";
        legendButton1.style.marginTop = "10px";
        legendButton1.style.marginLeft = "-25px";
        legendButton1.style.width = "160px";
        legendButton1.addEventListener("click", toggleSize);
        legendButton1.classList.add("legend-button");
        filterGroup.appendChild(legendButton1);

        // Create the reset button
        const legendButton2 = document.createElement("button");
        legendButton2.textContent = "Hide Circles";
        legendButton2.style.marginTop = "10px";
        legendButton2.style.marginLeft = "-25px";
        legendButton2.style.width = "160px";
        legendButton2.addEventListener("click", toggleVisibility);
        legendButton2.classList.add("legend-button");
        filterGroup.appendChild(legendButton2);

        // Create the reset button
        const resetButton = document.createElement("button");
        resetButton.textContent = "Reset Filters";
        resetButton.style.marginTop = "10px";
        resetButton.style.marginLeft = "-25px";
        resetButton.style.width = "160px";
        resetButton.style.height = "40px";
        resetButton.style.backgroundColor = "Yellow";
        resetButton.addEventListener(
          "click",
          handleResetButtonClick.bind(this)
        );
        resetButton.classList.add("legend-button");
        filterGroup.appendChild(resetButton);

        // Function to toggle visibility of markers
        function toggleVisibility() {
          // Iterate through markers and toggle visibility
          map.markers.forEach((marker) => {
            marker.getElement().style.display =
              marker.getElement().style.display === "none" ? "block" : "none";
          });

          // Update button text
          legendButton2.textContent =
            map.markers[0].getElement().style.display === "none"
              ? "Show Circles"
              : "Hide Circles";
        }

        function toggleSize() {
          this.isBoxMinimized = !this.isBoxMinimized;

          // Toggle class for box
          const box = document.querySelector(".boxB");
          box.classList.toggle("minimized");

          // Toggle class for legend
          const legend = document.querySelector(".legend");
          legend.classList.toggle("minimized");

          // Toggle class for legend items
          const legendItems = document.querySelectorAll(".legend-item");
          legendItems.forEach((item) => {
            item.classList.toggle("minimized");
          });

          // Update button text
          legendButton1.textContent = this.isBoxMinimized
            ? "Show Filterable Legend"
            : "Hide Filterable Legend";
        }
        //add the last updated
        function printLastUpdated() {
          // Path to the CSV file
          const filePath = "./datetime_records.csv";
          const lastUpdatedDiv = document.getElementById("lastUpdatedDiv");

          // Read the CSV file using FileReader
          const fileReader = new FileReader();

          fileReader.onload = function (event) {
            const csvData = event.target.result;
            const rows = csvData.trim().split("\n");
            const lastRow = rows[rows.length - 1];
            const lastUpdatedMessage = "Last updated on: " + lastRow;
            lastUpdatedDiv.innerHTML = lastUpdatedMessage;
          };

          fileReader.onerror = function (error) {
            console.error("Error reading the file:", error);
          };

          // Read the contents of the file
          fetch(filePath)
            .then((response) => response.blob())
            .then((blob) => fileReader.readAsText(blob))
            .catch((error) => {
              console.error("Error fetching CSV file:", error);
            });
        }

        // Call the function
        printLastUpdated();

        // const filterByCategory = (category) => {
        //   // Retrieve the current date filter for the "poly" layer
        //   const currentDateFilter = map.getFilter("poly");

        //   // Initialize an array to hold all the filters
        //   const filters = [];

        //   const item = this.legendItems.find((item) => item.label === category);
        //   if (item && !item.clicked) {
        //     item.clicked = true;
        //     // Apply the clicked styles directly in JavaScript (optional, for demonstration)
        //     const legendItemElement = document.querySelector(
        //       `.legend-item[data-label="${category}"]`
        //     );
        //     if (legendItemElement) {
        //       if (item.clicked) {
        //         legendItemElement.classList.add("clicked");
        //       }
        //     }

        //     // Check if the clicked category is "ضحايا مدنيين" (victims)
        //     if (category === "ضحايا مدنيين") {
        //       // Filter by Strike_Victims count > 0 and not null
        //       filters.push([">", ["get", "Strike_Victims"], 0]);
        //       // filters.push(["has", "Strike_Victims"]); // Ensure that Strike_Victims property exists
        //     } else {
        //       // Create a filter for the clicked category
        //       const categoryFilter = [
        //         "any",
        //         ["in", category, ["get", "Strike_Type"]],
        //         ["in", category, ["get", "Strike_Target"]],
        //       ];

        //       // // If Strike_Victims is present, include it in the filter
        //       // if (category !== "Strike_Victims") {
        //       //     categoryFilter.push(["has", "Strike_Victims"]);
        //       // }

        //       filters.push(categoryFilter);
        //     }
        //   }

        //   // If there's an existing date filter, add it to the filters array
        //   if (currentDateFilter) {
        //     filters.push(currentDateFilter);
        //   } else {
        //     // If no date filter is set, add a filter to include all villages
        //     filters.push(createVillagesFilter());
        //   }

        //   // Combine all filters using the "all" operator
        //   const combinedFilter = ["all", ...filters];

        //   // Apply the combined filter to the map's data source
        //   map.setFilter("poly", combinedFilter);
        // };

        const filterByCategory = (category) => {
          // Find the index of the clicked category in the legendItems array
          const index = this.legendItems.findIndex(
            (item) => item.label === category
          );

          if (index >= 0) {
            const item = this.legendItems[index];

            // Only allow clicking (selecting) the item, not unclicking (deselecting)
            if (item && !item.clicked) {
              item.clicked = true;

              // Apply the clicked styles directly in JavaScript (optional)
              const legendItemElement = document.querySelector(
                `.legend-item[data-label="${category}"]`
              );
              if (legendItemElement) {
                legendItemElement.classList.add("clicked");
              }

              // Initialize an array to hold the selected categories
              const selectedCategories = this.legendItems
                .filter((item) => item.clicked)
                .map((item) => item.label);

              // Adjust marker opacity based on the selected categories
              map.markers.forEach((marker) => {
                // Assume each marker has a `category` property matching the legend item labels
                const markerCategory = marker
                  .getElement()
                  .getAttribute("data-category");

                // Set opacity to 0 for all markers initially
                marker.getElement().style.opacity = 0;

                // Set opacity to 1 for markers with a matching selected category
                if (selectedCategories.includes(markerCategory)) {
                  marker.getElement().style.opacity = 1;
                }
              });

              // Initialize an array to hold all the filters
              const filters = [];

              // Check if the clicked category is "ضحايا مدنيين" (victims)
              if (category === "Strike_Victims") {
                // Filter by Strike_Victims count > 0 and not null
                filters.push([">", ["get", "Strike_Victims"], 0]);
              } else {
                // Create a filter for the clicked category
                const categoryFilter = [
                  "any",
                  ["in", category, ["get", "Strike_Type"]],
                  ["in", category, ["get", "Strike_Target"]],
                ];
                filters.push(categoryFilter);
              }

              // Retrieve the current date filter for the "poly" layer
              const currentDateFilter = map.getFilter("poly");

              // If there's an existing date filter, add it to the filters array
              if (currentDateFilter) {
                filters.push(currentDateFilter);
              } else {
                // If no date filter is set, add a filter to include all villages
                filters.push(createVillagesFilter());
              }

              // Combine all filters using the "all" operator
              const combinedFilter = ["all", ...filters];

              // Apply the combined filter to the map's data source
              map.setFilter("poly", combinedFilter);
            }
          }
        };

        const createVillagesFilter = () => {
          // Return a filter to include all villages
          return ["has", "OBJECTID1"]; // Assuming "OBJECTID1" is always present
        };

        function getColorForCount(strikeType) {
          // Define color logic based on strike type and count
          switch (strikeType) {
            case "طيران/ غارة جوية":
              return { color: "#1b75bc", offsetX: 0, offsetY: 0 };
            case "قذائف مدفعية":
              return { color: "#6c5a44", offsetX: 0, offsetY: 15 };
            case "فسفوري":
              return { color: "#ed1c24", offsetX: 15, offsetY: 15 };
            case "قنابل مضيئة":
              return { color: "#00a651", offsetX: 15, offsetY: 0 };
            case "غير مؤكّد":
              return { color: "black", offsetX: -10, offsetY: 0 };
            default:
              return { color: "gray", offsetX: -10, offsetY: -10 }; // Default color and offset values for unknown strike types
          }
        }
        //setMarker for the circles
        function setMarkerHTML(count, strikeType) {
          const { color, offsetX, offsetY } = getColorForCount(strikeType);

          if (count <= 2) {
            const markerHTML = `<div><svg width="30" height="30"><path d="M 9.99,5.00, C 9.99,7.75 7.75,9.99 5.00,9.99 2.24,9.99 0.00,7.75 0.00,5.00 0.00,2.24 2.24,0.00 5.00,0.00 7.75,0.00 9.99,2.24 9.99,5.00 Z" fill="${color}" transform="translate(${offsetX}, ${offsetY})"/></div>`;
            // Create a div element and set its inner HTML to the marker HTML
            var el = document.createElement("div");
            el.innerHTML = markerHTML;

            // Return the first child of the div element (i.e., the SVG element)
            return el.firstChild;
          } else if (count <= 6) {
            const markerHTML = `<div><svg width="50" height="50"><path d="M 13.00,8.00
           C 13.00,10.76 10.76,13.00 8.00,13.00
             5.24,13.00 3.00,10.76 3.00,8.00
             3.00,5.24 5.24,3.00 8.00,3.00
             10.76,3.00 13.00,5.24 13.00,8.00 Z
           M 8.00,0.00
           C 3.58,0.00 0.00,3.58 0.00,8.00
             0.00,12.42 3.58,16.00 8.00,16.00
             12.42,16.00 16.00,12.42 16.00,8.00
             15.99,3.58 12.42,0.01 8.00,-0.00
             8.00,-0.00 8.00,0.00 8.00,0.00 Z
           M 8.00,15.00
           C 4.14,15.00 1.00,11.86 1.00,8.00
             1.00,4.14 4.14,1.00 8.00,1.00
             11.86,1.00 15.00,4.14 15.00,8.00
             15.00,8.00 15.00,8.00 15.00,8.00
             15.00,11.86 11.86,15.00 8.00,15.00
            8.00,15.00 8.00,15.00 8.00,15.00 Z" fill="${color}" transform="translate(${offsetX}, ${offsetY})"/></div>`;

            // Create a div element and set its inner HTML to the marker HTML
            var el = document.createElement("div");
            el.innerHTML = markerHTML;

            // Return the first child of the div element (i.e., the SVG element)
            return el.firstChild;
          } else if (count <= 12) {
            const markerHTML = `<div><svg width="50" height="50"><path d="M 16.64,11.51
           C 16.64,14.34 14.34,16.64 11.51,16.64
             8.67,16.64 6.37,14.34 6.37,11.51
             6.37,8.67 8.67,6.37 11.51,6.37
             14.34,6.37 16.64,8.67 16.64,11.51 Z
           M 11.51,3.29
           C 11.50,3.29 11.50,3.29 11.49,3.29
             6.96,3.29 3.28,6.97 3.28,11.51
             3.28,16.04 6.96,19.72 11.49,19.72
             16.03,19.72 19.71,16.04 19.71,11.51
             19.71,6.97 16.04,3.30 11.51,3.29
             11.51,3.29 11.51,3.29 11.51,3.29 Z
           M 11.51,18.69
           C 11.50,18.69 11.50,18.69 11.49,18.69
             7.52,18.69 4.30,15.47 4.30,11.49
             4.30,7.52 7.52,4.30 11.49,4.30
             15.47,4.30 18.69,7.52 18.69,11.49
             18.69,11.50 18.69,11.50 18.69,11.50
             18.68,15.47 15.47,18.68 11.51,18.69
             11.51,18.69 11.51,18.69 11.51,18.69 Z
           M 11.51,0.00
           C 11.50,-0.00 11.50,-0.00 11.49,-0.00
             5.14,-0.00 -0.01,5.15 -0.01,11.51
             -0.01,17.86 5.14,23.01 11.49,23.01
             17.85,23.01 23.00,17.86 23.00,11.51
             22.99,5.16 17.85,0.01 11.51,0.00
             11.51,0.00 11.51,0.00 11.51,0.00 Z
           M 11.51,21.98
           C 11.50,21.98 11.50,21.98 11.49,21.98
             5.71,21.98 1.01,17.28 1.01,11.49
             1.01,5.71 5.71,1.01 11.49,1.01
             17.28,1.01 21.98,5.71 21.98,11.49
             21.98,11.50 21.98,11.50 21.98,11.51
             21.97,17.28 17.28,21.97 11.51,21.98
             11.51,21.98 11.51,21.98 11.51,21.98 Z" fill="${color}" transform="translate(${offsetX}, ${offsetY})"/></div>`;

            // Create a div element and set its inner HTML to the marker HTML
            var el = document.createElement("div");
            el.innerHTML = markerHTML;

            // Return the first child of the div element (i.e., the SVG element)
            return el.firstChild;
          } else if (count <= 24) {
            const markerHTML = `<div><svg width="50" height="50"><path d="M 21.10,16.00
           C 21.10,18.82 18.82,21.10 16.00,21.10
             13.18,21.10 10.90,18.82 10.90,16.00
             10.90,13.18 13.18,10.90 16.00,10.90
             18.82,10.90 21.10,13.18 21.10,16.00 Z
           M 16.00,7.83
           C 15.99,7.83 15.98,7.83 15.97,7.83
             11.46,7.83 7.80,11.49 7.80,16.00
             7.80,20.51 11.46,24.17 15.97,24.17
             20.48,24.17 24.14,20.51 24.14,16.00
             24.13,11.51 20.49,7.86 16.00,7.83
             16.00,7.83 16.00,7.83 16.00,7.83 Z
           M 16.00,23.15
           C 15.99,23.15 15.99,23.15 15.98,23.15
             12.03,23.15 8.83,19.95 8.83,16.00
             8.83,12.05 12.03,8.85 15.98,8.85
             19.93,8.85 23.13,12.05 23.13,16.00
             23.11,19.93 19.93,23.11 16.00,23.13
             16.00,23.13 16.00,23.15 16.00,23.15 Z
           M 16.00,4.58
           C 9.68,4.58 4.57,9.70 4.57,16.01
             4.57,22.33 9.69,27.44 16.00,27.44
             22.32,27.44 27.43,22.33 27.43,16.01
             27.43,16.01 27.43,16.00 27.43,16.00
             27.43,9.69 22.31,4.58 16.00,4.58
             16.00,4.58 16.00,4.58 16.00,4.58
             16.00,4.58 16.00,4.58 16.00,4.58 Z
           M 16.00,26.41
           C 16.00,26.41 16.00,26.41 16.00,26.41
             10.25,26.41 5.59,21.75 5.59,16.00
             5.59,10.25 10.25,5.59 16.00,5.59
             21.75,5.59 26.41,10.25 26.41,16.00
             26.40,21.75 21.75,26.40 16.00,26.41
             16.00,26.41 16.00,26.41 16.00,26.41 Z
           M 16.00,0.00
           C 7.16,0.00 0.00,7.16 0.00,16.00
             0.00,24.84 7.16,32.00 16.00,32.00
             24.84,32.00 32.00,24.84 32.00,16.00
             31.99,7.17 24.83,0.01 16.00,0.00
             16.00,0.00 16.00,0.00 16.00,0.00 Z
           M 16.00,30.98
           C 7.72,30.98 1.02,24.28 1.02,16.00
             1.02,7.72 7.72,1.02 16.00,1.02
             24.28,1.02 30.98,7.72 30.98,16.00
             30.98,24.27 24.27,30.98 16.00,30.98
             16.00,30.98 16.00,30.98 16.00,30.98 Z" fill="${color}" transform="translate(${offsetX}, ${offsetY})"/></div>`;

            // Create a div element and set its inner HTML to the marker HTML
            var el = document.createElement("div");
            el.innerHTML = markerHTML;

            // Return the first child of the div element (i.e., the SVG element)
            return el.firstChild;
          } else if (count <= 48) {
            const markerHTML = `<div><svg width="60" height="60"><path d="M 27.02,22.00
           C 27.02,24.77 24.77,27.02 22.00,27.02
             19.23,27.02 16.98,24.77 16.98,22.00
             16.98,19.23 19.23,16.98 22.00,16.98
             24.77,16.98 27.02,19.23 27.02,22.00 Z
           M 22.00,13.96
           C 17.56,13.96 13.96,17.56 13.96,22.00
             13.96,26.44 17.56,30.04 22.00,30.04
             26.44,30.04 30.04,26.44 30.04,22.00
             30.03,17.56 26.44,13.97 22.00,13.96
             22.00,13.96 22.00,13.96 22.00,13.96 Z
           M 22.00,29.03
           C 18.12,29.03 14.97,25.88 14.97,22.00
             14.97,18.12 18.12,14.97 22.00,14.97
             25.88,14.97 29.03,18.12 29.03,22.00
             29.02,25.88 25.88,29.02 22.00,29.03
             22.00,29.03 22.00,29.03 22.00,29.03 Z
           M 22.00,10.75
           C 22.00,10.75 21.99,10.75 21.99,10.75
             15.77,10.75 10.73,15.79 10.73,22.01
             10.73,28.23 15.77,33.27 21.99,33.27
             28.21,33.27 33.25,28.23 33.25,22.01
             33.25,22.01 33.25,22.00 33.25,22.00
             33.24,15.79 28.21,10.76 22.00,10.75
             22.00,10.75 22.00,10.75 22.00,10.75 Z
           M 22.00,32.25
           C 16.34,32.25 11.75,27.66 11.75,22.00
             11.75,16.34 16.34,11.75 22.00,11.75
             27.66,11.75 32.25,16.34 32.25,22.00
             32.24,27.66 27.66,32.24 22.00,32.25
             22.00,32.25 22.00,32.25 22.00,32.25 Z
           M 22.00,6.25
           C 13.30,6.25 6.25,13.30 6.25,22.00
             6.25,30.70 13.30,37.75 22.00,37.75
             30.70,37.75 37.75,30.70 37.75,22.00
             37.74,13.31 30.70,6.26 22.00,6.25
             22.00,6.25 22.00,6.25 22.00,6.25 Z
           M 22.00,36.75
           C 22.00,36.75 21.99,36.75 21.99,36.75
             13.84,36.75 7.24,30.15 7.24,22.00
             7.24,13.85 13.84,7.25 21.99,7.25
             30.14,7.25 36.74,13.85 36.74,22.00
             36.74,30.14 30.14,36.74 22.00,36.75
             22.00,36.75 22.00,36.75 22.00,36.75 Z
           M 22.00,0.00
           C 9.85,0.00 0.00,9.85 0.00,22.00
             0.00,34.15 9.85,44.00 22.00,44.00
             34.15,44.00 44.00,34.15 44.00,22.00
             43.98,9.86 34.14,0.02 22.00,-0.00
             22.00,-0.00 22.00,0.00 22.00,0.00 Z
           M 22.00,42.99
           C 10.41,42.99 1.01,33.59 1.01,22.00
             1.01,10.41 10.41,1.01 22.00,1.01
             33.59,1.01 42.99,10.41 42.99,22.00
             42.97,33.58 33.59,42.97 22.00,42.99
             22.00,42.99 22.00,42.99 22.00,42.99 Z" fill="${color}" transform="translate(${offsetX}, ${offsetY})"/></div>`;

            // Create a div element and set its inner HTML to the marker HTML
            var el = document.createElement("div");
            el.innerHTML = markerHTML;

            // Return the first child of the div element (i.e., the SVG element)
            return el.firstChild;
          } else if (count <= 96) {
            const markerHTML = `<div><svg width="95" height="95"><path d="M 31.00,0.00
           C 13.87,0.00 -0.01,13.88 -0.01,31.00
             -0.01,48.13 13.87,62.01 31.00,62.01
             48.12,62.01 62.00,48.13 62.00,31.00
             62.00,31.00 62.00,31.00 62.00,30.99
             61.98,13.88 48.11,0.01 30.99,-0.00
             30.99,-0.00 31.00,0.00 31.00,0.00 Z
           M 31.00,60.98
           C 14.43,60.98 1.01,47.56 1.01,31.00
             1.01,14.43 14.43,1.01 31.00,1.01
             47.56,1.01 60.98,14.43 60.98,31.00
             60.97,47.55 47.55,60.97 30.99,60.98
             30.99,60.98 31.00,60.98 31.00,60.98 Z
           M 36.06,31.00
           C 36.06,33.79 33.80,36.05 31.00,36.05
             28.21,36.05 25.95,33.79 25.95,31.00
             25.95,28.20 28.21,25.94 31.00,25.94
             33.80,25.94 36.06,28.20 36.06,31.00 Z
           M 31.00,22.92
           C 26.53,22.92 22.90,26.55 22.90,31.01
             22.90,35.48 26.53,39.11 31.00,39.11
             35.46,39.11 39.09,35.48 39.09,31.01
             39.09,31.01 39.09,31.01 39.09,31.00
             39.08,26.54 35.46,22.92 31.00,22.92
             30.99,22.92 30.99,22.92 30.99,22.92
             30.99,22.92 31.00,22.92 31.00,22.92 Z
           M 31.00,38.09
           C 27.08,38.09 23.91,34.92 23.91,31.00
             23.91,27.09 27.08,23.92 31.00,23.92
             34.91,23.92 38.08,27.09 38.08,31.00
             38.07,34.91 34.90,38.08 31.00,38.08
             31.00,38.08 31.00,38.09 31.00,38.09 Z
           M 31.00,19.67
           C 24.74,19.67 19.66,24.75 19.66,31.00
             19.66,37.26 24.74,42.34 31.00,42.34
             37.25,42.34 42.33,37.26 42.33,31.00
             42.33,31.00 42.33,31.00 42.33,30.99
             42.32,24.74 37.25,19.68 31.00,19.67
             31.00,19.67 31.00,19.67 31.00,19.67 Z
           M 31.00,41.32
           C 25.29,41.32 20.67,36.70 20.67,31.00
             20.67,25.29 25.29,20.67 31.00,20.67
             36.70,20.67 41.32,25.29 41.32,31.00
             41.32,31.00 41.32,31.00 41.32,31.00
             41.31,36.70 36.70,41.31 31.00,41.32
             31.00,41.32 31.00,41.32 31.00,41.32 Z
           M 31.00,15.14
           C 30.99,15.14 30.98,15.14 30.98,15.14
             22.21,15.14 15.11,22.24 15.11,31.00
             15.11,39.77 22.21,46.87 30.98,46.87
             39.74,46.87 46.84,39.77 46.84,31.00
             46.84,31.00 46.84,31.00 46.84,30.99
             46.83,22.25 39.74,15.15 31.00,15.14
             31.00,15.14 31.00,15.14 31.00,15.14 Z
           M 31.00,45.84
           C 22.79,45.84 16.15,39.20 16.15,31.00
             16.15,22.79 22.79,16.15 31.00,16.15
             39.20,16.15 45.84,22.79 45.84,31.00
             45.84,39.19 39.19,45.84 31.00,45.84
             31.00,45.84 31.00,45.84 31.00,45.84 Z
           M 31.00,8.86
           C 18.76,8.86 8.85,18.77 8.85,31.00
             8.85,43.24 18.76,53.15 31.00,53.15
             43.23,53.15 53.14,43.24 53.14,31.00
             53.14,31.00 53.14,31.00 53.14,31.00
             53.13,18.77 43.22,8.87 30.99,8.86
             30.99,8.86 31.00,8.86 31.00,8.86 Z
           M 31.00,52.13
           C 31.00,52.13 31.00,52.13 31.00,52.13
             19.32,52.13 9.86,42.67 9.86,31.00
             9.86,19.32 19.32,9.86 31.00,9.86
             42.67,9.86 52.13,19.32 52.13,31.00
             52.12,42.66 42.66,52.12 30.99,52.13
             30.99,52.13 31.00,52.13 31.00,52.13 Z" fill="${color}" transform="translate(${offsetX}, ${offsetY})"/></div>`;

            // Create a div element and set its inner HTML to the marker HTML
            var el = document.createElement("div");
            el.innerHTML = markerHTML;

            // Return the first child of the div element (i.e., the SVG element)
            return el.firstChild;
          } else if (count > 97) {
            const markerHTML = `<div><svg width="110" height="110"><path d="M 34.00,0.46
           C 49.12,-1.63 63.73,0.91 74.91,12.09
             95.24,32.42 89.86,69.61 64.00,82.62
             55.22,87.04 49.47,87.11 40.00,87.00
             22.74,86.79 7.07,74.23 1.75,58.00
             -0.36,51.58 -0.07,46.61 0.00,40.00
             0.24,20.14 15.13,4.67 34.00,0.46 Z
           M 44.00,1.71
           C 36.54,1.88 30.69,2.74 24.00,6.32
             -7.21,23.02 -5.29,69.40 28.00,82.54
             33.14,84.57 39.48,85.48 45.00,85.25
             51.09,85.00 56.51,83.94 62.00,81.19
             91.72,66.32 93.13,24.72 65.00,7.47
             57.91,3.12 52.11,2.13 44.00,1.71 Z
           M 37.00,12.47
           C 43.02,11.62 49.27,11.67 55.00,13.93
             87.52,26.71 78.28,76.43 42.00,74.96
             13.00,73.79 1.41,37.76 23.00,19.21
             27.15,15.65 31.74,13.72 37.00,12.47 Z
           M 39.00,14.30
           C 31.39,15.79 24.26,19.62 19.63,26.00
             6.04,44.76 18.58,72.01 42.00,72.96
             75.27,74.30 85.22,28.14 54.00,16.07
             48.39,13.90 44.90,13.71 39.00,14.30 Z
           M 38.00,21.47
           C 44.57,20.55 51.33,20.91 56.96,24.85
             72.84,35.98 67.85,67.09 42.00,65.96
             16.87,64.86 12.46,27.71 38.00,21.47 Z
           M 39.00,23.33
           C 14.93,29.31 19.67,62.35 42.00,63.90
             63.83,65.42 73.19,35.44 52.00,24.84
             47.63,22.65 43.71,22.80 39.00,23.33 Z
           M 39.00,27.56
           C 42.80,26.90 45.27,26.81 49.00,28.11
             66.97,34.36 61.11,61.69 42.00,59.80
             24.64,58.09 20.86,33.90 39.00,27.56 Z
           M 41.00,29.40
           C 22.74,34.78 27.84,55.79 42.00,57.63
             56.75,59.55 64.82,37.57 48.99,30.53
             45.90,29.16 44.26,29.11 41.00,29.40 Z
           M 39.00,32.74
           C 41.29,32.19 42.58,31.88 45.00,32.11
             59.16,33.49 58.49,56.31 42.00,54.89
             30.31,53.89 27.98,38.64 39.00,32.74 Z
           M 47.00,34.00
           C 47.00,34.00 40.00,35.00 40.00,35.00
             40.00,35.00 47.00,34.00 47.00,34.00 Z
           M 38.00,36.00
           C 38.00,36.00 37.00,36.00 37.00,36.00
             37.00,36.00 38.00,37.00 38.00,37.00
             38.00,37.00 38.00,36.00 38.00,36.00 Z
           M 50.00,36.00
           C 50.00,36.00 49.00,36.00 49.00,36.00
             49.00,36.00 50.00,37.00 50.00,37.00
             50.00,37.00 50.00,36.00 50.00,36.00 Z
           M 37.00,37.00
           C 37.00,37.00 36.00,37.00 36.00,37.00
             36.00,37.00 37.00,38.00 37.00,38.00
             37.00,38.00 37.00,37.00 37.00,37.00 Z
           M 46.00,37.00
           C 46.00,37.00 41.00,38.00 41.00,38.00
             41.00,38.00 46.00,37.00 46.00,37.00 Z
           M 51.00,37.00
           C 51.00,37.00 50.00,37.00 50.00,37.00
             50.00,37.00 51.00,38.00 51.00,38.00
             51.00,38.00 51.00,37.00 51.00,37.00 Z
           M 47.00,38.00
           C 47.00,38.00 46.00,38.00 46.00,38.00
             46.00,38.00 47.00,39.00 47.00,39.00
             47.00,39.00 47.00,38.00 47.00,38.00 Z
           M 35.00,40.00
           C 35.00,40.00 35.00,47.00 35.00,47.00
             35.00,47.00 35.00,40.00 35.00,40.00 Z
           M 49.00,40.00
           C 49.00,40.00 48.00,40.00 48.00,40.00
             48.00,40.00 49.00,41.00 49.00,41.00
             49.00,41.00 49.00,40.00 49.00,40.00 Z
           M 53.00,40.00
           C 53.00,40.00 53.00,47.00 53.00,47.00
             53.00,47.00 53.00,40.00 53.00,40.00 Z
           M 38.00,41.00
           C 38.00,41.00 38.00,46.00 38.00,46.00
             38.00,46.00 38.00,41.00 38.00,41.00 Z
           M 50.00,41.00
           C 50.00,41.00 50.00,46.00 50.00,46.00
             50.00,46.00 50.00,41.00 50.00,41.00 Z
           M 39.00,46.00
           C 39.00,46.00 38.00,46.00 38.00,46.00
             38.00,46.00 39.00,47.00 39.00,47.00
             39.00,47.00 39.00,46.00 39.00,46.00 Z
           M 49.00,46.00
           C 49.00,46.00 48.00,46.00 48.00,46.00
             48.00,46.00 49.00,47.00 49.00,47.00
             49.00,47.00 49.00,46.00 49.00,46.00 Z
           M 41.00,48.00
           C 41.00,48.00 40.00,48.00 40.00,48.00
             40.00,48.00 41.00,49.00 41.00,49.00
             41.00,49.00 41.00,48.00 41.00,48.00 Z
           M 47.00,48.00
           C 47.00,48.00 46.00,48.00 46.00,48.00
             46.00,48.00 47.00,49.00 47.00,49.00
             47.00,49.00 47.00,48.00 47.00,48.00 Z
           M 37.00,49.00
           C 37.00,49.00 36.00,49.00 36.00,49.00
             36.00,49.00 37.00,50.00 37.00,50.00
             37.00,50.00 37.00,49.00 37.00,49.00 Z
           M 46.00,49.00
           C 46.00,49.00 41.00,50.00 41.00,50.00
             41.00,50.00 46.00,49.00 46.00,49.00 Z
           M 51.00,49.00
           C 51.00,49.00 50.00,49.00 50.00,49.00
             50.00,49.00 51.00,50.00 51.00,50.00
             51.00,50.00 51.00,49.00 51.00,49.00 Z
           M 38.00,50.00
           C 38.00,50.00 37.00,50.00 37.00,50.00
             37.00,50.00 38.00,51.00 38.00,51.00
             38.00,51.00 38.00,50.00 38.00,50.00 Z
           M 50.00,50.00
           C 50.00,50.00 49.00,50.00 49.00,50.00
             49.00,50.00 50.00,51.00 50.00,51.00
             50.00,51.00 50.00,50.00 50.00,50.00 Z
           M 47.00,52.00
           C 47.00,52.00 40.00,53.00 40.00,53.00
             40.00,53.00 47.00,52.00 47.00,52.00 Z" fill="${color}" transform="translate(${offsetX}, ${offsetY})"/></div>`;

            // Create a div element and set its inner HTML to the marker HTML
            var el = document.createElement("div");
            el.innerHTML = markerHTML;

            // Return the first child of the div element (i.e., the SVG element)
            return el.firstChild;
          } else {
            // Add more conditions for different count ranges if needed
            console.log("No marker HTML generated for count:", count);
            return null; // Default empty marker
          }
        }

        // Fetch the GeoJSON data for target.geojson
        fetch("./target.geojson")
          .then((response) => response.json()) // Parse the JSON response
          .then((targetData) => {
            // Fetch the GeoJSON data for merged_counts.geojson
            fetch("./merged_counts.geojson")
              .then((response) => response.json()) // Parse the JSON response
              .then((centroidData) => {
                console.log("Centroid GeoJSON data:", centroidData); // Log the fetched centroid data

                // Once both datasets are fetched, call displayStrikeTargetsAndVictims
                displayStrikeTargetsAndVictims(
                  targetData.features,
                  centroidData.features
                );
              })
              .catch((error) => {
                console.error("Error fetching centroid GeoJSON data:", error);
              });
          })
          .catch((error) => {
            console.error("Error fetching target GeoJSON data:", error);
          });

        //setMarker for the Strike_Target & victims
        function setMarkerHTML2(count, strikeTarget) {
          // Log the strikeTarget value to check its value
          // console.log("Strike Target:", strikeTarget);
          // Define the marker HTML based on count and strikeTarget
          var markerHTML;
          if (count > 0) {
            // Your logic to determine markerHTML based on count and strikeTarget
            // You can use a switch statement, if-else conditions, or any other logic here
            switch (strikeTarget) {
              case "بيت/مبنى":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -40px; left: 0;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/house.svg" alt="بيت/مبنى"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "سيارة/دراجة":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -40px; left: -20px;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/car-bicycle.svg" alt="سيارة/دراجة"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "مدرسة/مستشفى/مسجد":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -40px; left: -40;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/school-mosque-hospital" alt="مدرسة/مستشفى/مسجد"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "صحافة":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -20px; left: 0;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/press.svg" alt="صحافة"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "جيش لبناني":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -20px; left: -20px;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/lb army.svg" alt="جيش لبناني"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "قوات حفظ السلام":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -20px; left: -40px;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/peaceforces.svg" alt="قوات حفظ السلام"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "دواجن/زراعة/صيد":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -60px; left: 0;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/farm.svg" alt="دواجن/زراعة/صيد"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "دفاع مدني/إسعاف":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -60px; left: -20px;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/دفاع مدني - اسعاف.svg" alt="دفاع مدني/إسعاف"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "غابات/ أحراج":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -60px; left: -60px;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/forest.svg" alt="غابات/ أحراج"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "مشاريع حيوية/ بنى تحتية":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -60px; left: -40px;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/infrastructure.svg" alt="مشاريع حيوية/ بنى تحتية"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;

              case "مقبرة":
                markerHTML =
                  '<div style="position: absolute; display: inline-block; top: -80px; left: -80px;" data-category="Strike_Victims">' +
                  '<img width="20" height="20" src="/images/cemetery.svg" alt="مقبرة"/>' +
                  '<span style="position: relative; bottom: 4px; right: 5px; background-color: #fff200;">' +
                  count +
                  "</span></div>";
                break;
              // Add cases for other strike targets
              default:
                markerHTML = ""; // Default empty marker
            }
          }

          // Check if markerHTML is generated
          if (markerHTML) {
            // Create a div element and set its inner HTML to the marker HTML
            var el = document.createElement("div");
            el.innerHTML = markerHTML;

            // Return the first child of the div element (i.e., the SVG element)
            return el.firstChild;
          } else {
            console.log("No marker HTML generated for count:", count);
            return null; // Default empty marker
          }
        }

        function displayStrikeTargetsAndVictims(targetData, centroidData) {
          // Initialize an object to store aggregated victim counts
          const victimCounts = {};

          // Loop through the target data to retrieve strike targets and victim counts
          targetData.forEach((targetFeature) => {
            const strikeTarget = targetFeature.properties.Strike_Target;
            const victims = targetFeature.properties.Strike_Victims;
            const objectId1 = targetFeature.properties.objectid1;

            // Check if the entry has victims
            if (victims > 0) {
              // If the strike target already exists for the village in the victimCounts object, add the victim count to it
              const key = `${objectId1}_${strikeTarget}`;
              if (victimCounts[key]) {
                victimCounts[key] += victims;
              } else {
                // Otherwise, initialize the victim count for the village and strike target combination
                victimCounts[key] = victims;
              }
            }
          });
          // Log the victimCounts object
          console.log("Victim Counts:", victimCounts);

          // Now, victimCounts object contains aggregated victim counts for each village and strike target combination

          // Loop through the victimCounts object and create markers for each entry
          Object.entries(victimCounts).forEach(([key, totalVictims]) => {
            const [objectId1, strikeTarget] = key.split("_");

            // Retrieve the corresponding centroid feature using objectid1 as the key
            const centroidFeature = centroidData.find(
              (centroidFeature) =>
                centroidFeature.properties.OBJECTID1 === parseInt(objectId1)
            );

            // If a matching centroid feature is found
            if (centroidFeature) {
              // Define the marker HTML based on the strike target and total victims
              const markerHTML = setMarkerHTML2(totalVictims, strikeTarget);
              // Log the marker HTML
              console.log("Marker HTML:", markerHTML);

              // Check if markerHTML is generated
              if (markerHTML) {
                const marker = new mapboxgl.Marker({
                  element: markerHTML,
                  // offset: [offsetX, offsetY],
                })
                  .setLngLat(centroidFeature.geometry.coordinates)
                  .addTo(map);

                // Store marker in markers array
                map.markers.push(marker);
              }
            }
          });
        }

        function updateMapData() {
          this.map = map; // Assign map instance to this.map

          // Assuming fromDateInput and toDateInput are input elements
          const fromDate = fromDateInput.value;
          const toDate = toDateInput.value;

          // Convert fromDate and toDate to timestamps
          const fromTimestamp = fromDate.valueOf();
          const toTimestamp = toDate.valueOf();

          // Define initial filters
          let dateFilter = null;
          let categoryFilter = null;

          // Function to apply category filter
          const applyCategoryFilter = (selectedCategories) => {
            categoryFilter = [
              "any",
              selectedCategories.map((category) => [
                "==",
                ["get", "Strike_Type"],
                category,
              ]),
              selectedCategories.map((category) => [
                "==",
                ["get", "Strike_Target"],
                category,
              ]),
              [">", ["get", "Strike_Victims"], 0],
            ];

            // Apply the category filter to the map's data source
            filterByCategory(selectedCategories);
          };

          // Function to apply date filter
          const applyDateFilter = (fromTimestamp, toTimestamp) => {
            dateFilter = [
              "all",
              [">=", ["get", "Date"], fromTimestamp],
              ["<=", ["get", "Date"], toTimestamp],
            ];

            // Apply the date filter to the map's data source
            map.setFilter("poly", dateFilter);
          };

          // Call applyDateFilter initially or whenever the date range changes
          applyDateFilter(fromTimestamp, toTimestamp);

          // // Call applyCategoryFilter when a category is selected
          applyCategoryFilter(selectedCategories);

          // const filteredFeatures = map.queryRenderedFeatures({
          //   layers: ["poly"],
          // });

          //           // Assuming "places" is the ID of your GeoJSON data source
          // const geojsonData = map.getSource('poly')._data;

          // // Now you have access to the features
          // const features = geojsonData.features;

          //           console.log(features);

          //           calculateStrikeTypeCounts(features);
        }

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
              '<h3 style="direction:ltr;">' +
                // strikeBy(description.Strike_Type) +
                // '</h3><p style="direction:ltr;">' +
                // // checkArea(description.area) +
                // '</p><p style="direction:ltr;"> ' +
                // strikeTarget(description.Strike_Target) +
                // '<h3 style="direction:ltr;">' +
                // strikeVictims(description.Strike_Victims) +
                // '</p><p style="direction:ltr;"> ' +
                strikeDetails(description) +
                "</p>"
            )
            .addTo(map);
        });

        // Function to handle reset button click

        // Function to handle reset button click
        function handleResetButtonClick() {
          // Clear the value of fromDateInput and toDateInput
          fromDateInput.value = "";
          toDateInput.value = "";

          // Remove the filter from the map
          map.setFilter("poly", null);

          // Reset all clicked states
          this.legendItems.forEach((item) => {
            item.clicked = false;
            const legendItemElement = document.querySelector(
              `.legend-item[data-label="${item.label}"]`
            );
            if (legendItemElement) {
              legendItemElement.classList.remove("clicked");
            }
          });

          // Call updateMapData to reset the map data
          this.updateMapData();
        }

        // function calculateTotalStrikeCount(feature) {
        //   const uniqueDates = new Set(feature.properties.dates);
        //   return uniqueDates.size;
        // }

        //replaced strikeDetails function
        function strikeDetails(info) {
          // Convert fromDate and toDate to timestamps
          const fromTimestamp = fromDateInput.value.valueOf();
          const toTimestamp = toDateInput.value.valueOf();

          const pickedVillage = info.objectid1;
          var features = map.querySourceFeatures("places");
          var totalCount = 0;
          var datesCounted = []; // To track unique dates
          var strikeTypeCounts = {}; // Object to store count of each strike type
          var targetCounts = {}; // Object to store count of each target type
          var victimCounts = {}; // Object to store count of each target type
          var totalVictimCount = 0; // Total count of victims

          // Object containing paths to strike type images
          var strikeTypeImages = {
            "طيران/ غارة جوية": "/images/AIRCRAFT.svg",
            "قذائف مدفعية": "/images/ARTILARY SHELLS.svg",
            "قنابل مضيئة": "/images/FLARE BOMB.svg",
            فسفوري: "/images/PHOSPHORUS.svg",
            "غير مؤكد": "/images/na-svgrepo-com.svg",
          };

          // Object containing paths to strike target images
          var targetImages = {
            "بيت/مبنى": "/images/house.svg",
            "سيارة/دراجة": "/images/car-bicycle.svg",
            "مدرسة/مستشفى/مسجد": "/images/school-mosque-hospital.svg",
            صحافة: "/images/press.svg",
            "جيش لبناني": "/images/lb army.svg",
            "قوات حفظ السلام": "/images/peaceforces.svg",
            "دواجن/زراعة/صيد": "/images/farm.svg",
            "دفاع مدني/إسعاف": "/images/دفاع مدني - اسعاف.svg",
            "غابات/ أحراج": "/images/forest.svg",
            "مشاريع حيوية/ بنى تحتية": "/images/infrastructure.svg",
            مقبرة: "/images/cemetery.svg",
          };

          var targetVictims = {
            "ضحايا مدنيين": "/images/victim.svg",
          };

          const processedIDs = new Set(); // Set to store processed IDs
          for (var i = 0; i < features.length; i++) {
            var props = features[i].properties;
            const featureID = props.ID; // Get the ID of the current feature
            // Check if the feature ID has already been processed
            if (processedIDs.has(featureID)) {
              continue; // Skip processing if the ID has been processed before
            }

            processedIDs.add(featureID); // Add the ID to the set of processed IDs

            if (props.objectid1 == pickedVillage) {
              if (
                fromTimestamp === "" ||
                toTimestamp === "" || // No date range specified
                (props.Date >= fromTimestamp && props.Date <= toTimestamp) // Date falls within the specified range
              ) {
                // Check if the date has not been counted before
                if (!datesCounted.includes(props.Date)) {
                  datesCounted.push(props.Date); // Add the date to the list of counted dates
                  totalCount++; // Increment total count
                }

                const countedStrikeTypes = new Set(); // Set to store already counted strike types for the current date
                const countedStrikeTargets = new Set(); // Set to store already counted strike targets for the current date

                // Increment strike type count for the current feature
                const strikeTypes = props.Strike_Type.split(","); // Split into individual categories
                // console.log(strikeTypes);
                strikeTypes.forEach((type) => {
                  const trimmedType = type.trim();
                  if (Object.keys(strikeTypeImages).includes(trimmedType)) {
                    countedStrikeTypes.add(trimmedType); // Add strike type to the set
                  }
                });

                // Increment target count for the current feature
                if (props.Strike_Target) {
                  const targetTypes = props.Strike_Target.split(","); // Split into individual categories
                  targetTypes.forEach((target) => {
                    const trimmedTarget = target.trim();
                    if (Object.keys(targetImages).includes(trimmedTarget)) {
                      countedStrikeTargets.add(trimmedTarget); // Add strike target to the set
                    }
                  });
                }

                // Update strike type and strike target counts
                countedStrikeTypes.forEach((type) => {
                  // console.log(props.ID);
                  // console.log("type:" + type);
                  // console.log(strikeTypeCounts[type]);
                  strikeTypeCounts[type] = (strikeTypeCounts[type] || 0) + 1;
                });
                countedStrikeTargets.forEach((target) => {
                  targetCounts[target] = (targetCounts[target] || 0) + 1;
                });

                // Increment total victim count for the current feature
                if (
                  props.Strike_Victims != "null" &&
                  parseInt(props.Strike_Victims) > 0
                ) {
                  totalVictimCount += parseInt(props.Strike_Victims);
                }
              }
            }
          }

          if (pickedVillage == "" || info.objectid === null) {
            return "";
          }

          // Constructing the return string with counts of each strike type, target type, and total victim count
          var returnString =
            info.Village + "<p></p>" + "Days hit: " + totalCount + "<p></p>";

          // Append strike type counts to the return string
          for (var strikeType in strikeTypeCounts) {
            returnString +=
              "<br> <img src='" +
              strikeTypeImages[strikeType] +
              "' alt='" +
              strikeType +
              "' style='width: 20px; height: 20px;'>" +
              strikeTypeCounts[strikeType];
          }

          // Append target type counts to the return string
          for (var targetType in targetCounts) {
            returnString +=
              "<br> <img src='" +
              targetImages[targetType] +
              "' alt='" +
              targetType +
              "' style='width: 20px; height: 20px;'>" +
              targetCounts[targetType];
          }

          // Append total victim count to the return string
          returnString +=
            "<p></p><img src='/images/victims.svg' style='width: 20px; height: 20px;'>" +
            totalVictimCount;

          return returnString;
        }

        // function setCentroidImage(features) {
        //   features.forEach((feature) => {
        //     const totalCount = feature.properties.totalStrikeCount;
        //     const imagePath = getImagePath(totalCount);
        //     feature.properties.centroidImage = imagePath;
        //   });
        // }

        // Now filterByCategory is accessible within this component
        this.handleCategoryClick = (category) => {
          // Call filterByCategory function passing the clicked category
          filterByCategory(category);
        };

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
  /* direction:ltr !important; */
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
  width: 174px;
  height: 209px;
  z-index: 100000;
  display: flex;
  /* flex-flow: column; */
  align-content: flex-start !important;
  justify-content: space-around;
  top: 0px;
  margin: 0.5rem;
  /* background-color: rgba(255, 255, 255, 0.288); */
  background-color: rgb(255, 255, 255);
  outline: 2px solid black;
  /* outline-width: 1px; */
  /* box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); */
  /* Outline for the legend */
}

@media screen and (max-width: 767px) {
  .box {
    position: absolute;
    left: 40px;
    display: flex;
    width: 154px;
    height: 209px;
    z-index: 100000;
    display: flex;
    align-content: flex-start !important;
    justify-content: space-around;

    top: 0px;
    margin: 0.5rem;
    /* background-color: rgba(255, 255, 255, 0.288); */
    background-color: rgb(255, 255, 255);
    outline: 2px solid black;
    /* outline-width: 1px; */
    /* box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04); */
    /* Outline for the legend */
  }
}
.boxB {
  position: absolute;
  /* left: 85%; */
  right: 40px;
  bottom: 15%;

  display: flex;
  width: 146px;
  height: 450px;
  z-index: 100000;
  flex-flow: column;
  align-content: flex-start !important;
  /* top: 37%; */
  /* margin: 0.5rem; */
  background-color: rgba(255, 255, 255, 0.188);
  /* box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); */
  transition: height 0.5s ease; /* Add smooth transition for height change */
  direction: ltr !important;
}
@media screen and (max-width: 767px) {
  .boxB {
    height: 360px;
    width: 165px;
    right: 1px;
  }
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
  height: 65px;
  /* width: 300px; */
  width: 200px;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.20000000298023224));
  border-radius: 5px;
  padding-left: 2px;
  padding-right: 11px;
  padding-top: 8px;
  padding-bottom: 8px;
  text-align: left;
  /* vertical-align: text-middle;x   */
  display: flex;
  flex-direction: column;
  left: 10px;
  top: 10px;
  font-size: 1.2em;
  direction: ltr !important;
}

@media screen and (max-width: 767px) {
  .title-Box {
    position: absolute;
    background-color: rgb(255, 255, 255);
    /* outline: 2px black solid; */
    z-index: 10000;
    height: 60px;
    /* height: Hug; */
    /* width: 300px; */
    width: 35%;
    filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.20000000298023224));
    border-radius: 5px;
    padding-left: 2px;
    padding-right: 11px;
    padding-top: 8px;
    padding-bottom: 8px;
    text-align: left;
    /* vertical-align: text-middle;x   */
    display: flex;
    flex-direction: column;
    left: 10px;
    top: 10px;
    font-size: 0.75em;
    font-weight: normal;
    direction: ltr !important;
  }
}

.boxC {
  position: absolute;
  /* left: 85%; */
  right: 0px;
  bottom: 10%;
  font-weight: bold;
  display: flex;
  width: 245px;
  height: 10px;
  z-index: 100000;
  flex-flow: column;
  align-content: flex-start !important;
  /* top: 37%; */
  /* margin: 0.5rem; */
  background-color: rgba(255, 255, 255, 0.288);
  /* box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); */
  transition: height 0.5s ease; /* Add smooth transition for height change */
  /* direction:ltr !important; */
}
.button {
  font-size: 5px;
  width: 120px;
}
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
  text-align: left;
  vertical-align: text-middle;
  /* font-size: 20px; */
  font-size: 1em;

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
  right: 0px;
  display: flex;
  width: 500px;
  height: 50px;
  z-index: 100000;
  flex-flow: column;
  align-content: flex-start !important;
  bottom: 8%;
  margin: 0.5rem;
  background-color: rgba(255, 255, 255, 0);
  /* box-shadow: 0px 20px 25px -5px rgba(0, 0, 0, 0),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); */
}

.boxA {
  margin-left: 2rem;
  margin-right: 2rem;
  margin-top: 1.3rem;
  display: flex;
  text-align: center;
  /*align-items: center;*/
  /*text-justify: center;*/
  font-size: 10px;
  font-family: "Raleway";
  /*flex-flow: row;*/
  flex-direction: row-reverse;
  margin-bottom: -0.5rem;
  /* color: #181615; */
}
.note {
  margin-left: 15px;
  margin-right: 5px;
  /* display: flex; */
  width: 174px;
  align-content: top;
  text-align: center !important;
  align-items: center;
  text-justify: center;
  /* font-size: 15px; */
  font-size: 1.1em;
  font-family: "Raleway";
  flex-flow: row;
  margin-bottom: -0.5rem;
  /* color: #181615; */
  color: rgb(0, 0, 0);
  direction: ltr !important;
}
@media screen and (max-width: 767px) {
  .note {
    font-size: 1.1em;
    text-align: center !important;
    margin-left: 10px;
    margin-right: 10px;
  }
}
.mapboxgl-popup {
  min-width: 100px !important;
  max-width: 270px !important;
  direction: ltr !important;
}

.mapboxgl-popup-content {
  text-align: left !important;
  font-family: "Raleway" !important;
  background-color: #225c64 !important;
  opacity: 0.8 !important;
  color: white !important;
  font-size: 14px;
  direction: ltr !important;
}

.mapboxgl-popup-tip {
  display: none !important;
  direction: ltr !important;
}

.mapboxgl-popup-content {
  text-align: center;
  font-family: "Raleway" !important;
  direction: ltr !important;
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

.filter-group {
  font: 0.8em/1.4em "Helvetica Neue", Arial, Helvetica, sans-serif;
  font-weight: 600;
  position: absolute;
  top: 0px;
  right: 20px;
  z-index: 1;
  border-radius: 3px;
  width: 120px;
  color: #fff;
  text-align: center !important;
}
@media screen and (max-width: 767px) {
  .filter-group {
    right: 17px;
  }
}

.filter-group input[type="checkbox"]:first-child + label {
  border-radius: 3px 3px 0 0;
}

.filter-group label:last-child {
  border-radius: 0 0 3px 3px;
  border: none;
}

.filter-group input[type="checkbox"] {
  display: none;
}

.filter-group input[type="checkbox"] + label {
  background-color: #3386c0;
  display: block;
  cursor: pointer;
  padding: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
}

.filter-group input[type="checkbox"] + label {
  background-color: #3386c0;
  text-transform: capitalize;
}

.filter-group input[type="checkbox"] + label:hover,
.filter-group input[type="checkbox"]:checked + label {
  background-color: #4ea0da;
}

.filter-group input[type="checkbox"]:checked + label:before {
  content: "✔";
  margin-right: 5px;
}

/* legend styling */
.legend {
  position: absolute;
  width: 155px;
  top: 0px;
  right: 0px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
  /* display: flex; */
  transition: height 0.5s ease; /* Add smooth transition for height change */
  border: 1px solid #000; /* Outline for the legend */
  gap: 2px;
  width: fit-content; /* Adjust width as needed */
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, transform 0.1s ease;
}
@media screen and (max-width: 767px) {
  .legend-item {
    margin-bottom: 1px;
  }
}

.legend-item.clicked {
  transform: translateY(2px); /* Simulate pushed button */
}

.legend-item img {
  width: 20px;
  height: 20px;
  margin-right: 5px;
  transition: transform 0.3s ease, filter 0.3s ease;
}
/* @media screen and (max-width: 767px) {
  .legend-item img {
    width: 10px;
    height: 10px;
  }
} */
/*

/* Style for clicked items */
.legend .legend-item.clicked img {
  /* Styles for clicked state */
  filter: grayscale(100%) brightness(50%);
}

.legend-item label {
  font-size: 12px;
  cursor: pointer;
  /* margin-right: 5px; Adjust the margin as needed to create space */
}

@media screen and (max-width: 767px) {
  .legend-teml label {
    font-size: 10px;
    font-weight: bold;
  }
}

.legend .legend-item.clicked label {
  transform: translateY(2px); /* Simulate pushed button */
}

/* legend buttons */
@media screen and (max-width: 767px) {
  .legend-button {
    width: 140px !important; /* Adjust width for smaller screens */
    margin-left: -10px !important; /* Adjust margin for smaller screens */
    font-size: 10px;
  }
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.legend-content {
  display: block;
  /* Adjust the height and style as per your need */
}
/* @media screen and (max-width: 767px) {
  .legend-content {
    font-size: 5px;
  }
}*/

#minimizeBtn {
  border: none;
  /* background-color: transparent; */
  border: 1px solid #000; /* Optional: Adds a border */
  background-color: #f0f0f0;
  cursor: pointer;
  float: left;
}

.circleLegend {
  position: absolute;
  bottom: 1px;
  right: 20px;
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
    left: 40px;
    /* width: 100%; */
    bottom: 60px;
    flex-direction: column;
  }
}
.circleLegend .icon-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px !important;
}
.circleLegend .icon-item img {
  width: 20px; /* Adjust size as needed */
  height: auto;
  margin-right: 5px;
}
.circleLegend .icon-item:last-child {
  margin-bottom: 0;
}
</style>
