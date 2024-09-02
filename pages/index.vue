<template>
  <main>
    <div id="map" ref="map">
      <div class="box" id="contentBox">
        <p class="note"><strong>إختر/ي المدينة</strong></p>

        <nav id="filter-group" class="filter-group"></nav>
        <div id="menu-navigation">
          <button id="prevButton" disabled>السابق</button>
          <button id="nextButton">التالي</button>
        </div>
      </div>

      <div class="box-row">
        <p class="boxA">
          تم الإنشاء بواسطة استوديو أشغال عامّة CC
          <!-- <script src="https://unpkg.com/vue/dist/vue.min.js"></script> -->
        </p>
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
        zoom: 9.5,
        speed: 0.3,
      });
    }, 2000);

    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    map.addControl(new mapboxgl.FullscreenControl(), "top-left");

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
            "fill-color": "#f48282", // blue color fill
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
                    // console.log(
                    //   feature.properties.OBJECTID1,
                    //   ",",
                    //   feature.geometry.coordinates,
                    //   ",",
                    //   count,
                    //   ",",
                    //   strikeType
                    // );

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

        // Function to update the sync date
        function updateSyncDate() {
          // Get the current date and time
          const currentDate = new Date();

          // Format the date as needed (e.g., 'YYYY-MM-DD HH:mm:ss')
          const formattedDate =
            currentDate.toISOString().split("T")[0] +
            " " +
            currentDate.toTimeString().split(" ")[0];

          // Save the formatted date to localStorage
          localStorage.setItem("lastSyncDate", formattedDate);

          // Update the displayed date
          document.getElementById(
            "lastUpdatedDiv"
          ).innerText = `Last Synced: ${formattedDate}`;
        }

        // Function to load the last sync date from localStorage
        function loadLastSyncDate() {
          const lastSyncDate = localStorage.getItem("lastSyncDate");

          // If there is a saved sync date, display it; otherwise, show a default message
          if (lastSyncDate) {
            document.getElementById(
              "lastUpdatedDiv"
            ).innerText = `Last Synced: ${lastSyncDate}`;
          } else {
            document.getElementById("lastUpdatedDiv").innerText =
              "No sync has occurred yet.";
          }
        }

        // Call the load function on page load to display the last sync date
        window.addEventListener("DOMContentLoaded", loadLastSyncDate);

        // // Function to update the date and time
        // function updateLastUpdatedDate() {
        //   const lastUpdatedDiv = document.getElementById("lastUpdatedDiv");

        //   // Get the current date and time
        //   const now = new Date();

        //   // Format the date and time (e.g., "September 2, 2024, 14:30")
        //   const options = {
        //     year: "numeric",
        //     month: "long",
        //     day: "numeric",
        //     hour: "2-digit",
        //     minute: "2-digit",
        //   };
        //   const formattedDate = now.toLocaleDateString("ar-LB", options); // 'ar-EG' for Arabic formatting

        //   // Update the inner HTML of the div with the formatted date
        //   lastUpdatedDiv.innerHTML = `آخر تحديث: ${formattedDate}`;
        // }

        // // Example call to the function when updating
        // updateLastUpdatedDate();

        function initializeCitySelection() {
          const filterGroup = document.getElementById("filter-group");
          // Create and configure the city dropdown
          const citySelect = document.createElement("select");
          citySelect.id = "citySelect";
          citySelect.style.marginTop = "20px";
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
            "بيبلوس",
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
          //   "Byblos",
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
          filterGroup.appendChild(citySelect);

          // Coordinates for each city in Lebanon
          const cityCoordinates = {
            بيروت: [35.4955, 33.8888],
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

          // Event listener for city dropdown
          citySelect.addEventListener("change", (event) => {
            const selectedCity = event.target.value;

            if (cityCoordinates[selectedCity]) {
              const [lng, lat] = cityCoordinates[selectedCity];

              // Set the map view to the selected city's coordinates
              map.flyTo({
                center: [lng, lat],
                zoom: 12, // Adjust zoom level as needed
              });
            }
          });

          // Initialize buttons
          const prevButton = document.getElementById("prevButton");
          const nextButton = document.getElementById("nextButton");

          prevButton.addEventListener("click", () => navigateCity(-1));
          nextButton.addEventListener("click", showNextContent);
          updateButtons(); // Initial button state
        }
        initializeCitySelection();

        // Function to handle "Next" button click
        function showNextContent() {
          const contentBox = document.getElementById("contentBox");

          // Overwrite the content of the box with new content
          contentBox.innerHTML = `
        <div class="new-content">
            <p>هذه هي المحتويات الجديدة</p>
            <!-- Add any other new content or elements here -->
            <button id="backButton">عودة</button>
        </div>
    `;

          // Add event listener for "Back" button
          document
            .getElementById("backButton")
            .addEventListener("click", () => {
              // Call the initialize function to reset content to the original
              contentBox.innerHTML = `
            <p class="note"><strong>إختر/ي المدينة</strong></p>
            <nav id="filter-group" class="filter-group"></nav>
            <div id="city-navigation">
                <button id="prevButton" disabled>السابق</button>
                <button id="nextButton">التالي</button>
            </div>
        `;
              initializeCitySelection(); // Reinitialize the original content
            });
        }

        function updateMapData() {
          this.map = map; // Assign map instance to this.map

          const selectedCity = document.getElementById("citySelect").value;
          if (cityCoordinates[selectedCity]) {
            const [lng, lat] = cityCoordinates[selectedCity];
            map.flyTo({ center: [lng, lat], zoom: 12 });
          }

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

          // calculateStrikeTypeCounts(features);
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
              '<h3 style="direction:rtl;">' +
                // strikeBy(description.Strike_Type) +
                // '</h3><p style="direction:rtl;">' +
                // // checkArea(description.area) +
                // '</p><p style="direction:rtl;"> ' +
                // strikeTarget(description.Strike_Target) +
                // '<h3 style="direction:rtl;">' +
                // strikeVictims(description.Strike_Victims) +
                // '</p><p style="direction:rtl;"> ' +
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
          if (this.legendItems) {
            this.legendItems.forEach((item) => {
              item.clicked = false;
              const legendItemElement = document.querySelector(
                `.legend-item[data-label="${item.label}"]`
              );
              if (legendItemElement) {
                legendItemElement.classList.remove("clicked");
              }
            });
          }

          //add markers reset here
          // Set all markers to opacity 0 initially
          map.markers.forEach((marker) => {
            marker.getElement().style.opacity = 1;
          });

          updateMapData();
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
          // var victimCounts = {}; // Object to store count of each target type
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
            '<div dir="rtl">' +
            info.Village +
            "<p></p>" +
            "أيام القصف: " +
            totalCount +
            "<p></p>";

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
            totalVictimCount +
            "</div>";

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
  width: 174px;
  /* height: 209px; */
  height: 30vh;
  padding: 20px;
  z-index: 100000;
  /* display: flex; */
  /* align-content: flex-start !important; */
  justify-content: space-between;
  top: 0px;
  margin: 0.5rem;
  background-color: rgb(255, 255, 255);
  outline: 2px solid black;
  box-sizing: border-box;
}
/* .box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: rgb(255, 255, 255);
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
} */

/* Style for the content section */
.content {
  flex: 1; /* Take up remaining space */
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
  /* left: 40px; */
  bottom: 15%;

  display: flex;
  /* width: 146px; */
  height: 450px;
  z-index: 100000;
  flex-flow: column;
  align-content: flex-start !important;
  /* top: 37%; */
  /* margin: 0.5rem; */
  /* background-color: rgba(255, 255, 255, 0.188); */
  /* box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); */
  transition: height 0.5s ease; /* Add smooth transition for height change */
  direction: rtl !important;
}
@media screen and (max-width: 767px) {
  .boxB {
    height: 360px;
    /* width: 165px; */
    /* bottom: 18%; */
    /* left: 40px; */
    top: 30%;
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

@media screen and (max-width: 767px) {
  .title-Box {
    position: absolute;
    background-color: rgb(255, 255, 255);
    /* outline: 2px black solid; */
    z-index: 10000;
    height: 60px;
    /* height: Hug; */
    /* width: 300px; */
    width: 30%;
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
    font-size: 0.75em;
    direction: rtl !important;
  }
}

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
@media screen and (max-width: 767px) {
  .boxC {
    bottom: 7%;
  }
}

/* General button styles */
button {
  font-family: "Arial", sans-serif;
  font-size: 16px;
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

/* Specific styles for enabled buttons */
#prevButton:not(:disabled),
#nextButton {
  background-color: #3498db; /* Blue color */
  color: white;
}

/* Hover effect for buttons */
#prevButton:not(:disabled):hover,
#nextButton:hover {
  background-color: #2980b9; /* Darker blue */
  transform: scale(1.05); /* Slightly enlarge on hover */
}

/* Disabled button styles */
#prevButton:disabled {
  background-color: #bdc3c7; /* Grey color */
  color: #7f8c8d; /* Darker grey text */
  cursor: not-allowed;
}

/* Active button styles (on click) */
button:active {
  transform: scale(0.98); /* Slightly shrink on click */
}

/* Style for the navigation buttons container */
#menu-navigation {
  display: flex;
  justify-content: center; /* Center buttons horizontally */
  margin-top: 20px;
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
@media screen and (max-width: 767px) {
  .box-row {
    bottom: 6%;
  }
}

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
  margin-left: 15px;
  margin-right: 5px;
  align-content: center;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  text-align: center !important;
  font-size: 1.3em;
  font-family: "Tajawal";
  margin-bottom: -0.5rem;
  color: rgb(0, 0, 0);
  direction: rtl !important;
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

/* #menu {
  background: #fff;
  position: absolute;
  z-index: 1;
  top: 10px;
  right: 10px;
  border-radius: 3px;
  width: 120px;
  font-family: "Open Sans", sans-serif;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
} */

/* #menu a {
  font-size: 13px;
  color: #404040;
  display: block;
  margin: 0;
  padding: 0;
  padding: 10px;
  text-decoration: none;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

#menu a:last-child {
  border: none;
}

#menu a:hover {
  background-color: #f8f8f8;
  color: #404040;
}

#menu a.active {
  background-color: #ffa12c;
  color: #ffffff;
} */

.filter-group {
  /* font: 0.8em/1.4em "Helvetica Neue", Arial, Helvetica, sans-serif;
  font-weight: 600;
  position: absolute;
  top: 30px;
  right: 20px;
  z-index: 1;
  border-radius: 3px;
  width: 120px;
  color: #fff;
  text-align: center !important; */
  flex: 1; /* Take up remaining space */
  margin-bottom: 20px; /* Add space below to prevent overlap with buttons */
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
  left: 40px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 5px;
  /*box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);*/
  /* display: flex; */
  transition: height 0.5s ease; /* Add smooth transition for height change */
  border: 1px solid #000; /* Outline for the legend */
  gap: 2px;
  /*width: fit-content;  Adjust width as needed */
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
  margin-left: 5px;
  transition: transform 0.3s ease, filter 0.3s ease;
}
/* Style for clicked items */
.legend .legend-item.clicked img {
  /* Styles for clicked state */
  filter: grayscale(100%) brightness(50%);
}

/* @media screen and (max-width: 767px) {
  .legend-item img {
    width: 10px;
    height: 10px;
  }
} */
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
    margin-left: -10px !important; /*Adjust margin for smaller screens */
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
  direction: rtl;
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
</style>
