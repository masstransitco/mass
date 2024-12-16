/* src/components/Map/MapContainer.jsx */

import React, { useEffect, useRef } from "react";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import "./MapContainer.css";

const MapContainer = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    // Initialize the WebMap with the provided item ID
    const webmap = new WebMap({
      portalItem: {
        id: "2e977a0d176b4bb582b9d4d643dfcc4d", // Your WebMap item ID
      },
    });

    // Create the MapView
    const view = new MapView({
      container: mapRef.current, // Reference to the div element
      map: webmap, // Pass the WebMap instance
    });

    return () => {
      // Clean up the view when the component is unmounted
      if (view) {
        view.destroy();
      }
    };
  }, []);

  return <div ref={mapRef} className="map-container" />;
};

export default MapContainer;
