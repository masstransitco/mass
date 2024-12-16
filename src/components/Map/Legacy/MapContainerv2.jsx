import React, { useEffect, useRef } from "react";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import Locate from "@arcgis/core/widgets/Locate";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

const MapContainer = () => {
  const mapRef = useRef(null); // Reference for the map container

  useEffect(() => {
    // Initialize the WebMap
    const webmap = new WebMap({
      portalItem: {
        id: "2e977a0d176b4bb582b9d4d643dfcc4d", // Your WebMap item ID
      },
    });

    // Create a GraphicsLayer for custom graphics (concentric circles)
    const graphicsLayer = new GraphicsLayer();
    webmap.add(graphicsLayer);

    // Create the MapView
    const view = new MapView({
      container: mapRef.current,
      map: webmap,
      popup: {
        dockEnabled: true,
        dockOptions: {
          position: "bottom-right",
          breakpoint: false,
        },
      },
    });

    // Locate Widget
    const locateWidget = new Locate({
      view,
      useHeadingEnabled: false,
      goToOverride: (view, options) => {
        options.target.scale = 5000; // Neighborhood scale
        return view.goTo(options.target);
      },
    });

    view.ui.add(locateWidget, "bottom-left");

    // Event when the Locate widget locates the user
    locateWidget.on("locate", (event) => {
      const { position } = event;

      if (!position) {
        console.error("User location not available.");
        return;
      }

      const userLocation = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      };

      // Clear existing concentric circles
      graphicsLayer.removeAll();

      // Draw concentric circles
      drawProximityCircles(userLocation, graphicsLayer);

      // Find the nearest points
      findNearestPoints(userLocation, webmap, view);
    });

    // Function: Draw concentric circles
    const drawProximityCircles = (location, layer) => {
      const radii = [500, 1000, 1500]; // Radii in meters
      const colors = [
        "rgba(255, 0, 0, 0.2)",
        "rgba(255, 165, 0, 0.2)",
        "rgba(0, 0, 255, 0.2)",
      ];

      radii.forEach((radius, index) => {
        const circleGraphic = new Graphic({
          geometry: {
            type: "circle",
            center: [location.longitude, location.latitude],
            radius,
            radiusUnit: "meters",
          },
          symbol: {
            type: "simple-fill",
            color: colors[index],
            outline: {
              color: "rgba(0, 0, 0, 0.5)",
              width: 1,
            },
          },
        });

        layer.add(circleGraphic);
      });

      console.log("Concentric circles added.");
    };

    // Function: Find the 3 nearest points
    const findNearestPoints = (userLocation, map, view) => {
      const featureLayer = map.layers.find((layer) => layer.type === "feature");

      if (!featureLayer) {
        console.error("Feature layer not found in the WebMap.");
        return;
      }

      featureLayer
        .queryFeatures({
          where: "1=1", // Fetch all features
          outFields: ["*"],
          returnGeometry: true,
        })
        .then((result) => {
          const features = result.features;

          // Calculate distances
          const distances = features.map((feature) => {
            const distance = geometryEngine.distance(
              feature.geometry,
              {
                type: "point",
                longitude: userLocation.longitude,
                latitude: userLocation.latitude,
              },
              "meters"
            );
            return { feature, distance };
          });

          // Sort by distance
          distances.sort((a, b) => a.distance - b.distance);

          // Get the 3 closest points
          const closestPoints = distances.slice(0, 3);

          // Build pop-up content
          const content = closestPoints
            .map((point, index) => {
              const attributes = point.feature.attributes;
              return `
                <strong>${index + 1}. ${
                attributes.name || "Unnamed Feature"
              }</strong><br>
                Distance: ${Math.round(point.distance)} meters<br>
                ${
                  attributes.description ||
                  "No additional information available"
                }
              `;
            })
            .join("<br><br>");

          // Open the pop-up
          view.popup.open({
            title: "3 Closest Points",
            content: content,
            location: {
              type: "point",
              longitude: userLocation.longitude,
              latitude: userLocation.latitude,
            },
          });

          console.log("Pop-up opened with 3 closest points.");
        })
        .catch((error) => {
          console.error("Error querying features:", error);
        });
    };

    // Cleanup
    return () => {
      if (view) {
        view.destroy();
        console.log("View destroyed.");
      }
    };
  }, []);

  return (
    <div ref={mapRef} className="map-container" style={{ height: "100vh" }} />
  );
};

export default MapContainer;
