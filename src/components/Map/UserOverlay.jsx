import React from "react";
import { OverlayView } from "@react-google-maps/api";
import styled from "@emotion/styled";

const PulsingDot = styled.div`
  width: 24px;
  height: 24px;
  background-color: #1b6cfb;
  border-radius: 50%;
  border: 2px solid #ffffff;
  position: relative;
  transform: translate(-50%, -50%);

  &::after {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    background-color: #1b6cfb;
    opacity: 0.4;
    z-index: -1;
    animation: pulse 10s ease-in-out infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.4;
    }
    50% {
      transform: scale(1.5);
      opacity: 0.2;
    }
    100% {
      transform: scale(1);
      opacity: 0.4;
    }
  }
`;

const UserOverlay = ({ userLocation, mapHeading }) => {
  if (!userLocation) return null;

  return (
    <OverlayView
      position={userLocation}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <PulsingDot />
    </OverlayView>
  );
};

export default React.memo(UserOverlay);
