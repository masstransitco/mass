// src/components/Map/DistrictMarkers.jsx
import React from "react";
import { Marker } from "@react-google-maps/api";

const DistrictMarkers = ({ districts, onDistrictClick }) => {
  // Define a symbol icon for districts
  const districtIcon = {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: "#e7e8ec",
    fillOpacity: 1.0,
    strokeColor: "#000",
    strokeWeight: 1,
    scale: 8,
  };

  return (
    <>
      {districts.map((district) => (
        <Marker
          key={district.id}
          position={district.position}
          onClick={() => onDistrictClick(district)}
          icon={districtIcon}
          title={district.name}
        />
      ))}
    </>
  );
};

export default React.memo(DistrictMarkers);
