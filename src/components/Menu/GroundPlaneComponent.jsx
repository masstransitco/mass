/* eslint-disable react/no-unknown-property */

import React, { memo } from "react";
import PropTypes from "prop-types";

const GroundPlaneComponent = memo(({ isSelected }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <circleGeometry args={[10, 64]} />
    <meshStandardMaterial color={isSelected ? "#2171ec" : "#adadad"} />
    <shadowMaterial opacity={0.5} />
  </mesh>
));

GroundPlaneComponent.displayName = "GroundPlaneComponent";
GroundPlaneComponent.propTypes = {
  isSelected: PropTypes.bool.isRequired,
};

export default GroundPlaneComponent;
