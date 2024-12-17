// src/components/Map/DistrictMarkers.jsx

import React, { useMemo } from "react";
import { Marker } from "@react-google-maps/api";

const DistrictMarkers = ({ districts, onDistrictClick }) => {
  const districtIcon = useMemo(() => {
    if (!window.google) return null; // Ensure google is available
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: "#e7e8ec",
      fillOpacity: 1.0,
      strokeColor: "#000",
      strokeWeight: 1,
      scale: 8,
    };
  }, []);

  if (!districtIcon) {
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
