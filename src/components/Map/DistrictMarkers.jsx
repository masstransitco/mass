// src/components/Map/DistrictMarkers.jsx

import React from "react";
import { Marker } from "@react-google-maps/api";

const DistrictMarkers = ({ districts, onDistrictClick }) => {
  console.log("Rendering DistrictMarkers with districts:", districts); // **Added**

  // Define icon after confirming window.google is available
  const districtIcon = window.google
    ? {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: "#e7e8ec",
        fillOpacity: 1.0,
        strokeColor: "#000",
        strokeWeight: 1,
        scale: 8,
      }
    : null;

  if (!districtIcon) {
    console.warn(
      "window.google is not defined. District markers will not display custom icons."
    );
    return null; // Or render default icons
  }

  return (
    <>
      {districts.map((district) => (
        <Marker
          key={district.id}
          position={district.position}
          icon={districtIcon}
          onClick={() => onDistrictClick(district)}
          title={district.name}
        />
      ))}
    </>
  );
};

export default React.memo(DistrictMarkers);
