/* eslint-disable react/no-unknown-property */

import React, { Suspense, useMemo, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, Html, Environment } from "@react-three/drei";
import PropTypes from "prop-types";

import Lighting from "./Lighting";
import GroundPlaneComponent from "./GroundPlaneComponent";
import GLBViewerComponent from "./GLBViewerComponent";

const EV5 = memo(({ isSelected }) => {
  const cameraSettings = useMemo(
    () => ({
      position: [20, 10, 25],
      fov: isSelected ? 30 : 45,
      near: 0.5,
      far: 100,
    }),
    [isSelected]
  );

  const orbitControlsSettings = useMemo(
    () => ({
      autoRotate: isSelected, // Only rotate if selected
      autoRotateSpeed: isSelected ? 1.5 : 0,
      enableZoom: false,
      minDistance: 5,
      maxDistance: 50,
      enablePan: false,
      maxPolarAngle: Math.PI / 2,
    }),
    [isSelected]
  );

  // Scale the model based on selection state
  const modelScale = isSelected ? [3.2, 3.2, 3.2] : [3, 3, 3];

  return (
    <div
      style={{
        width: "80px",
        height: "10vh",
        overflow: "hidden",
        borderRadius: "8px",
        boxShadow: "none", // No highlight on the box/container
      }}
    >
      <Canvas
        shadows
        camera={cameraSettings}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={<Html center>Loading...</Html>}>
          <Lighting />
          <OrbitControls {...orbitControlsSettings} />
          <GroundPlaneComponent isSelected={isSelected} />
          <Environment preset="studio" />
          <Preload all />
          <GLBViewerComponent
            modelPath={process.env.PUBLIC_URL + "/EV5.glb"}
            scale={modelScale}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

EV5.displayName = "EV5";
EV5.propTypes = {
  isSelected: PropTypes.bool.isRequired,
};

export default EV5;
