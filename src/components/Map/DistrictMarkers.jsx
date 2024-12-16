// src/components/Map/DistrictMarkers.jsx
import React from "react";
import { Marker } from "@react-google-maps/api";

const DistrictMarkers = ({ districts, onDistrictClick }) => {
  return (
    <>
      {districts.map((district) => (
        <Marker
          key={district.id}
          position={district.position}
          onClick={() => onDistrictClick(district)}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: { width: 24, height: 24 },
          }}
        />
      ))}
    </>
  );
};

export default React.memo(DistrictMarkers);
