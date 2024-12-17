// src/components/Map/StationMarkers.jsx
import React from "react";
import { Marker } from "@react-google-maps/api";

const StationMarkers = ({ stations, onStationClick, selectedStations }) => {
  const stationIcon = {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: "#276ef1",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 7,
  };

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
