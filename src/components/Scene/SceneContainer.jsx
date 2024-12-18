// src/components/Scene/SceneContainer.jsx

import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";

import "./SceneContainer.css"; // Import CSS for animations

const SceneContainer = ({ center }) => {
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const mapRef = useRef(null); // Reference to the gmp-map-3d element

  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsMapsLoaded(true);
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsMapsLoaded(true);
          clearInterval(interval);
        }
      }, 1000);

      const timeout = setTimeout(() => {
        if (!isMapsLoaded) {
          setLoadError("Google Maps API failed to load.");
          clearInterval(interval);
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isMapsLoaded]);

  useEffect(() => {
    if (!isMapsLoaded || loadError || !center || !mapRef.current) return;

    const mapElement = mapRef.current;
    const { lat, lng } = center;
    mapElement.setAttribute("center", `${lat},${lng}`);
  }, [isMapsLoaded, loadError, center]);

  if (loadError) {
    return <p>Error loading Google Maps API.</p>;
  }

  if (!isMapsLoaded) {
    return <p>Loading Google Maps...</p>;
  }

  return (
    <div className="scene-container">
      <gmp-map-3d
        id="three-d-map"
        ref={mapRef}
        className="scene-map"
        default-labels-disabled
        default-ui-disabled
      ></gmp-map-3d>
    </div>
  );
};

SceneContainer.propTypes = {
  center: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }).isRequired,
};

export default React.memo(SceneContainer);
