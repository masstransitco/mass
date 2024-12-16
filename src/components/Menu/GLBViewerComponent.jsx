/* eslint-disable react/no-unknown-property */
import React, { memo, useEffect, useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber"; // Correct import source
import PropTypes from "prop-types";
import { Box3, Vector3 } from "three";

const GLBViewerComponent = memo(({ modelPath }) => {
  // Load the GLB model
  const { scene } = useGLTF(modelPath, true);

  // Reference to the model for bounding box calculations
  const modelRef = useRef();

  // Access the Three.js camera and viewport size
  const { camera, size } = useThree();

  // Determine the scale based on the model's name
  const scale = useMemo(() => {
    const lowerPath = modelPath.toLowerCase();
    if (
      lowerPath.includes("ev5") ||
      lowerPath.includes("ev7") ||
      lowerPath.includes("taxi") ||
      lowerPath.includes("van")
    ) {
      return [3, 3, 3]; // Scale specific models to [3, 3, 3]
    }
    return [1, 1, 1]; // Default scale
  }, [modelPath]);

  useEffect(() => {
    if (!modelRef.current) return;

    // Compute the bounding box of the model
    const boundingBox = new Box3().setFromObject(modelRef.current);
    const modelSize = new Vector3();
    boundingBox.getSize(modelSize);

    // Determine the longest side of the model
    const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);

    // Calculate the necessary distance from the camera based on field of view
    const fov = camera.fov * (Math.PI / 180); // Convert FOV to radians
    // Removed 'aspect' variable since it's not used
    // const aspect = size.width / size.height; // Unused
    const distance = maxDimension / (2 * Math.tan(fov / 2));

    // Optional: Add padding to the distance
    const paddingFactor = 1.2; // Adjust this factor as needed
    const adjustedDistance = distance * paddingFactor;

    // Calculate the center of the model
    const center = new Vector3();
    boundingBox.getCenter(center);

    // Set the camera position to be closer based on the calculated distance
    // Position the camera along the z-axis relative to the model's center
    camera.position.set(center.x, center.y, center.z + adjustedDistance);

    // Conditionally move the camera up on the Y-axis by 3 if scale is between 1 and 10
    // Assuming uniform scaling, we'll use the first element of the scale array
    const uniformScale = scale[0];
    if (uniformScale >= 1 && uniformScale <= 10) {
      camera.position.y += 3;
    }

    // Make the camera look at the center of the model
    camera.lookAt(center);

    // Update the camera's projection matrix
    camera.updateProjectionMatrix();
  }, [scene, camera, size, scale]);

  return (
    <primitive
      object={scene}
      scale={scale}
      position={[0, 1.5, 0]} // Adjust as necessary for your model's positioning
      ref={modelRef} // Attach the ref for bounding box calculations
    />
  );
});

GLBViewerComponent.displayName = "GLBViewerComponent";

GLBViewerComponent.propTypes = {
  modelPath: PropTypes.string.isRequired,
};

export default GLBViewerComponent;
