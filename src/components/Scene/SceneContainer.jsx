// src/components/Scene/SceneContainer.jsx
import { useJsApiLoader } from "@react-google-maps/api";
import React, { useEffect, useState } from "react";

const SceneContainer = ({ selectedStation, selectedDistrict }) => {
  const [geojson, setGeojson] = useState(null);
  const [currentPlace, setCurrentPlace] = useState(null);

  // Initialize useJsApiLoader with 'alpha' version and required libraries
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA8rDrxBzMRlgbA7BQ2DoY31gEXzZ4Ours", // Use environment variables for security
    version: "alpha", // Load the alpha version for experimental 3D features
    libraries: ["marker", "geometry", "places", "maps3d"], // Include necessary libraries
  });

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
    if (!isLoaded) return; // Ensure Google Maps API is loaded
    if (loadError) {
      console.error("Error loading Google Maps API:", loadError);
      return;
    }

    const initializeMap = () => {
      if (!currentPlace) {
        console.warn("No place data available to initialize the 3D map.");
        return;
      }

      const mapElement = document.querySelector("gmp-map-3d");
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
    };

    initializeMap();
  }, [isLoaded, loadError, currentPlace]);

  if (loadError) {
    return <p>Error loading Google Maps API.</p>;
  }

  if (!isLoaded) {
    return <p>Loading Google Maps...</p>;
  }

  return (
    <div style={{ height: "30vh", width: "100%" }}>
      {geojson ? (
        geojson.features && geojson.features.length > 0 ? (
          <gmp-map-3d
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
