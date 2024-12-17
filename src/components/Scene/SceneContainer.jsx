// src/components/Scene/SceneContainer.jsx

import React, { useEffect, useState } from "react";

const SceneContainer = ({ selectedStation, selectedDistrict }) => {
  const [geojson, setGeojson] = useState(null);
  const [currentPlace, setCurrentPlace] = useState(null);
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

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

      setTimeout(() => {
        if (!isMapsLoaded) {
          setLoadError("Google Maps API failed to load.");
          clearInterval(interval);
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isMapsLoaded]);

  useEffect(() => {
    if (selectedStation) {
      setCurrentPlace({
        coordinates: [
          selectedStation.position.lng,
          selectedStation.position.lat,
        ],
        name: selectedStation.place,
      });
    } else if (selectedDistrict) {
      setCurrentPlace({
        coordinates: [
          selectedDistrict.position.lng,
          selectedDistrict.position.lat,
        ],
        name: selectedDistrict.name,
      });
    } else {
      setCurrentPlace(null);
    }
  }, [selectedStation, selectedDistrict]);

  useEffect(() => {
    const fetchGeojson = async () => {
      try {
        const response = await fetch("/stations.geojson");
        const data = await response.json();
        setGeojson(data);
      } catch (error) {
        console.error("Error fetching GeoJSON file:", error);
      }
    };
    fetchGeojson();
  }, []);

  useEffect(() => {
    if (!isMapsLoaded) return;
    if (loadError) {
      console.error("Error loading Google Maps API:", loadError);
      return;
    }

    if (!currentPlace) {
      console.warn("No place data available to initialize the 3D map.");
      return;
    }

    const mapElement = document.getElementById("three-d-map");
    if (mapElement) {
      const [lng, lat] = currentPlace.coordinates;
      mapElement.setAttribute("center", `${lat},${lng}`);
      mapElement.setAttribute("tilt", "67.5");
      mapElement.setAttribute("heading", "0");
      mapElement.setAttribute("altitude", "1000");
      mapElement.setAttribute("range", "1500");
    } else {
      console.error("gmp-map-3d element not found.");
    }
  }, [isMapsLoaded, loadError, currentPlace]);

  if (loadError) {
    return <p>Error loading Google Maps API.</p>;
  }

  if (!isMapsLoaded) {
    return <p>Loading Google Maps...</p>;
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {geojson ? (
        geojson.features && geojson.features.length > 0 ? (
          <gmp-map-3d
            id="three-d-map"
            style={{ height: "100%", width: "100%" }}
            default-labels-disabled
          ></gmp-map-3d>
        ) : (
          <p>No data available.</p>
        )
      ) : (
        <p>Loading station data...</p>
      )}
    </div>
  );
};

export default React.memo(SceneContainer);
