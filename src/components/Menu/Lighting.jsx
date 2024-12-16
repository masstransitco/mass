/* eslint-disable react/no-unknown-property */

import React from "react";

const Lighting = () => (
  <>
    <ambientLight intensity={0.5} />
    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
  </>
);

Lighting.displayName = "Lighting";
export default Lighting;
