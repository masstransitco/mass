// src/components/Map/StationMarkers.jsx

import React from "react";
import { Marker } from "@react-google-maps/api";

const StationMarkers = ({ stations, onStationClick }) => {
  console.log("Rendering StationMarkers with stations:", stations); // **Added**

  // Define icon after confirming window.google is available
  const stationIcon = window.google
    ? {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: "#276ef1",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 7,
      }
    : null;

  if (!stationIcon) {
    console.warn(
      "window.google is not defined. Station markers will not display custom icons."
    );
    return null; // Or render default icons
  }

  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={station.position}
          icon={stationIcon}
          onClick={() => onStationClick(station)}
          title={station.place}
        />
      ))}
    </>
  );
};

export default React.memo(StationMarkers);
