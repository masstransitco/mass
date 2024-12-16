// src/components/Map/StationMarkers.jsx
import React from "react";
import { Marker } from "@react-google-maps/api";

const StationMarkers = ({ stations, onStationClick, selectedStations }) => {
  // Define SVG path for the marker
  const svgMarkerPath =
    "M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z";

  return (
    <>
      {stations.map((station) => {
        const isSelected =
          selectedStations.departure?.id === station.id ||
          selectedStations.destination?.id === station.id;

        return (
          <Marker
            key={station.id}
            position={station.position}
            onClick={() => onStationClick(station)}
            icon={{
              path: svgMarkerPath,
              fillColor: isSelected ? "#e7e8ec" : "#2171ec", // Fill color based on selection
              strokeColor: isSelected ? "#2171ec" : "#e7e8ec", // Stroke color based on selection
              fillOpacity: 1, // Full opacity for visibility
              strokeWeight: 2, // Stroke weight for border visibility
              scale: 2, // Scale of the marker
              anchor: new window.google.maps.Point(0, 20), // Anchor point for positioning
            }}
          />
        );
      })}
    </>
  );
};

export default React.memo(StationMarkers);
