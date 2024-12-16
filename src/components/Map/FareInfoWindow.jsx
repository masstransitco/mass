// src/components/Map/FareInfoWindow.jsx

import React from "react";
import { InfoWindow } from "@react-google-maps/api";

const FareInfoWindow = ({ position, fareInfo, onClose }) => {
  if (!fareInfo) return null;

  return (
    <InfoWindow position={position} onCloseClick={onClose}>
      <div className="info-window">
        <h3>Fare Information</h3>
        <p>Estimated driving time: {fareInfo.duration}</p>
        <p>Fare: HK${fareInfo.ourFare.toFixed(2)}</p>
        <p>(Taxi Estimate: HK${fareInfo.taxiFareEstimate.toFixed(2)})</p>
      </div>
    </InfoWindow>
  );
};

export default React.memo(FareInfoWindow);
