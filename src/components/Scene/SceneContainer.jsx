// src/components/Scene/SceneContainer.jsx

import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import "./SceneContainer.css";

const SceneContainer = ({ center }) => {
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const mapRef = useRef(null);

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
    // Set center with altitude 150 and HK bounds
    const hkBounds = {
      north: 22.58,
      south: 22.15,
      west: 113.8,
      east: 114.5,
    };

    mapRef.current.bounds = hkBounds;
    mapRef.current.center = {
      lat: center.lat,
      lng: center.lng,
      altitude: 150,
    };
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
