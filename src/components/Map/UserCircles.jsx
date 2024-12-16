// src/components/Map/UserCircles.jsx
import React from "react";
import { Circle, OverlayView } from "@react-google-maps/api";

const UserCircles = ({ userLocation, distances, getLabelPosition }) => {
  if (!userLocation) return null;

  return (
    <>
      {distances.map((dist) => (
        <React.Fragment key={dist}>
          <Circle
            center={userLocation}
            radius={dist}
            options={{
              strokeColor: "#2171ec",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillOpacity: 0,
            }}
          />
          <OverlayView
            position={getLabelPosition(userLocation, dist)}
            mapPaneName={OverlayView.OVERLAY_LAYER}
          >
            <div className="circle-label">
              {dist >= 1000 ? `${dist / 1000}km` : `${dist}m`}
            </div>
          </OverlayView>
        </React.Fragment>
      ))}
    </>
  );
};

export default React.memo(UserCircles);
