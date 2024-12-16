/* global google */

import React, { useEffect, useRef } from "react";

const MapScene = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if the Google Maps script is already loaded
      if (google && google.maps) {
        initMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA8rDrxBzMRlgbA7BQ2DoY31gEXzZ4Ours&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        console.error("Failed to load the Google Maps script.");
      };
      document.body.appendChild(script);
    };

    const initMap = () => {
      if (!google || !google.maps) {
        console.error("Google Maps JavaScript API failed to load.");
        return;
      }

      fetch("/stations.geojson")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to load GeoJSON");
          }
          return response.json();
        })
        .then((geojsonData) => {
          const hongKongBounds = {
            north: 22.568,
            south: 22.153,
            west: 113.837,
            east: 114.423,
          };

          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 22.3964, lng: 114.1095 }, // Hong Kong center
            zoom: 12,
            tilt: 45,
            heading: 0,
            restriction: {
              latLngBounds: hongKongBounds,
              strictBounds: true, // Prevents any movement outside bounds
            },
            minZoom: 10, // Minimum zoom level to show all of Hong Kong
            maxZoom: 20, // Maximum zoom for details
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "road",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "administrative",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "transit",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
              // Add any additional styles as needed
            ],
          });

          // Verify if PhotoRealistic3DTilesLayer exists
          if (google.maps.PhotoRealistic3DTilesLayer) {
            // Add the photorealistic 3D Tiles Layer
            const tilesLayer = new google.maps.PhotoRealistic3DTilesLayer({
              map: map,
            });

            const stationLocations = geojsonData.features.map(
              (feature) => feature.geometry.coordinates
            );

            // Mask buildings not matching station locations
            tilesLayer.setOptions({
              featureFilter: (feature) => {
                const { lat, lng } = feature.position || {};
                return stationLocations.some(([stationLng, stationLat]) =>
                  isSameLocation(
                    { lat, lng },
                    { lat: stationLat, lng: stationLng }
                  )
                );
              },
            });
          } else {
            console.warn(
              "PhotoRealistic3DTilesLayer is not available in the Google Maps API."
            );
            // Optionally, implement alternative 3D features or fallback
          }
        })
        .catch((err) => console.error("Error loading GeoJSON data:", err));
    };

    const isSameLocation = (pos1, pos2) => {
      const tolerance = 0.0001;
      return (
        Math.abs(pos1.lat - pos2.lat) < tolerance &&
        Math.abs(pos1.lng - pos2.lng) < tolerance
      );
    };

    loadGoogleMaps();
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
};

export default MapScene;
