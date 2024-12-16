// src/components/Map/RouteInfoWindow.jsx

import React from "react";
import { InfoWindow } from "@react-google-maps/api";

const RouteInfoWindow = ({ position, info, onClose }) => {
  if (!info) return null;

  return (
    <InfoWindow position={position} onCloseClick={onClose}>
      <div className="info-window">
        <h3>{info.title}</h3>
        <p>{info.description}</p>
      </div>
    </InfoWindow>
  );
};

export default React.memo(RouteInfoWindow);
