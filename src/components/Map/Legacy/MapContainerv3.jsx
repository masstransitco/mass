// src/MapContainer.jsx

import React, { useRef, useEffect } from "react";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import Search from "@arcgis/core/widgets/Search";
import Locate from "@arcgis/core/widgets/Locate";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import "./MapContainer.css";

const MapContainer = () => {
  const mapRef = useRef();

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize the WebMap using the provided ID
    const webMap = new WebMap({
      portalItem: {
        id: "2e977a0d176b4bb582b9d4d643dfcc4d", // Your WebMap ID
      },
    });

    // Initialize the MapView
    const view = new MapView({
      container: mapRef.current,
      map: webMap,
      // Optionally set the initial extent or other view properties here
    });

    // Add Search widget
    const searchWidget = new Search({
      view: view,
    });
    view.ui.add(searchWidget, "top-right");

    // Add Locate widget
    const locateWidget = new Locate({
      view: view,
    });
    view.ui.add(locateWidget, "top-left");

    // Add a GraphicsLayer to display nearby results
    const graphicsLayer = new GraphicsLayer();
    webMap.add(graphicsLayer);

    // Function to perform Nearby Search
    const performNearbySearch = async (point, distance = 1000) => {
      // Clear previous graphics
      graphicsLayer.removeAll();

      // Define the search parameters
      const nearbyQuery = {
        geometry: point,
        distance: distance, // in meters
        units: "meters",
        outFields: ["*"],
        returnGeometry: true,
      };

      // Assume there's a feature layer in the webmap to search against
      // You might need to adjust this based on your actual layers
      const featureLayer = webMap.allLayers.find(
        (layer) => layer.type === "feature"
      );

      if (!featureLayer) {
        console.error("No feature layer found in the WebMap.");
        return;
      }

      // Perform the query
      const results = await featureLayer.queryFeatures(nearbyQuery);

      // Add results to the graphics layer
      results.features.forEach((feature) => {
        const graphic = new Graphic({
          geometry: feature.geometry,
          attributes: feature.attributes,
          symbol: featureLayer.renderer
            ? featureLayer.renderer.symbol
            : undefined,
        });
        graphicsLayer.add(graphic);
      });
    };

    // Listen for search completion to perform nearby search
    searchWidget.on("search-complete", (event) => {
      const { results } = event;
      if (results.length > 0) {
        const result = results[0];
        const point = result.feature.geometry;
        performNearbySearch(point, 1000); // 1 km radius
      }
    });

    // Optionally, handle map click to perform nearby search
    view.on("click", (event) => {
      const point = event.mapPoint;
      performNearbySearch(point, 1000); // 1 km radius
    });

    // Cleanup on unmount
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
      }}
      ref={mapRef}
    />
  );
};

export default MapContainer;
