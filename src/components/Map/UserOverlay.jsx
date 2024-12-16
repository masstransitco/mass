// src/components/Map/UserOverlay.jsx
import React from "react";
import { OverlayView } from "@react-google-maps/api";

const UserOverlay = ({ userLocation, mapHeading }) => {
  if (!userLocation) return null;

  return (
    <OverlayView
      position={userLocation}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "20px solid #2171ec",
          transform: `rotate(${mapHeading}deg)`,
          transformOrigin: "center",
          zIndex: 10,
        }}
      />
    </OverlayView>
  );
};

export default React.memo(UserOverlay);
