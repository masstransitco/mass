import React from "react";
import { Marker } from "@react-google-maps/api";

const DistrictMarkers = ({ districts, onDistrictClick }) => {
  return (
    <>
      {districts.map((district) => {
        // Create an inline SVG as a Data URL:
        // A simple rectangle with background #e7e8ec and black text.
        // Adjust width and height as needed
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">
            <rect x="0" y="0" width="120" height="40" fill="#e7e8ec" rx="5" ry="5" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3));"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-family="Helvetica" font-size="14">${district.name}</text>
          </svg>
        `;
        const iconUrl =
          "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);

        return (
          <Marker
            key={district.id}
            position={district.position}
            onClick={() => onDistrictClick(district)}
            icon={{
              url: iconUrl,
              scaledSize: { width: 120, height: 40 },
            }}
          />
        );
      })}
    </>
  );
};

export default React.memo(DistrictMarkers);
