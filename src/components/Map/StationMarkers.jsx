// src/components/Map/StationMarkers.jsx

import React, { useEffect, useState } from "react";
import { useGoogleMap } from "@react-google-maps/api";

const StationMarkers = ({ stations, onStationClick }) => {
  const map = useGoogleMap();
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Clear any existing markers
    markers.forEach((marker) => {
      marker.map = null;
    });

    // Create new advanced markers for stations
    const newMarkers = stations.map((station) => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: station.position,
        title: station.place,
      });

      // Add click listener for station
      marker.addListener("click", () => {
        if (onStationClick) onStationClick(station);
      });

      return marker;
    });

    setMarkers(newMarkers);

    return () => {
      // Remove markers on cleanup
      newMarkers.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [map, stations, onStationClick, markers]);

  return null;
};

export default React.memo(StationMarkers);
