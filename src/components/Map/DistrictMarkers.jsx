// src/components/Map/DistrictMarkers.jsx

import React, { useEffect, useState } from "react";
import { useGoogleMap } from "@react-google-maps/api";

const DistrictMarkers = ({ districts, onDistrictClick }) => {
  const map = useGoogleMap();
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Clear any existing markers
    markers.forEach((marker) => {
      marker.map = null;
    });

    // Create new advanced markers
    const newMarkers = districts.map((district) => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: district.position,
        title: district.name,
      });

      // Add click listener for district
      marker.addListener("click", () => {
        if (onDistrictClick) onDistrictClick(district);
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
  }, [map, districts, onDistrictClick, markers]);

  return null; // No direct rendering needed
};

export default React.memo(DistrictMarkers);
