/* src/components/MapContainer.jsx */
/* global google */

import React, { useState, useEffect, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  DirectionsRenderer,
  Circle,
  MarkerClusterer,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "50vh",
};

const center = {
  lat: 22.3964,
  lng: 114.1095,
};

// Custom map styles
const darkGrayMapStyle = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#1c1c1c" }],
  },
  // Add more styles as needed...
];

const MapContainer = () => {
  const [map, setMap] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [showCircles, setShowCircles] = useState(false);

  // Hardcoded API key for testing (replace this with an environment variable in production)
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA8rDrxBzMRlgbA7BQ2DoY31gEXzZ4Ours", // Replace with your actual API key or use an environment variable
    libraries: ["geometry"],
  });

  // Fetch Stations Data
  useEffect(() => {
    fetch("/stations.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load GeoJSON");
        return response.json();
      })
      .then((data) => {
        const features = data.features.map((feature) => ({
          id: feature.id,
          position: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          },
          ...feature.properties,
        }));
        setStations(features);
      })
      .catch((error) => {
        console.error("Error loading GeoJSON:", error);
      });
  }, []);

  // Handle Marker Click
  const handleMarkerClick = useCallback(
    (station) => {
      setSelectedStation(station);
      setShowCircles(false);

      if (userLocation && isLoaded) {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: userLocation,
            destination: station.position,
            travelMode: "WALKING",
          },
          (result, status) => {
            if (status === "OK") {
              setDirections(result);
            } else {
              console.error("Directions request failed:", status);
            }
          }
        );
      }

      if (map) {
        map.panTo(station.position);
        map.setZoom(15);
      }
    },
    [userLocation, map, isLoaded]
  );

  // Locate User Functionality
  const locateMe = useCallback(() => {
    setDirections(null);
    setSelectedStation(null);

    if (!map) {
      alert("Map is not initialized yet.");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);
          map.panTo(userPos);
          map.setZoom(15);
          setShowCircles(true);
        },
        (error) => {
          console.error("Error fetching user location:", error);
          alert(
            "Unable to access your location. Please ensure location services are enabled."
          );
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, [map]);

  // Handle Map Clicks (Clears selections and directions)
  const handleMapClick = useCallback(() => {
    setSelectedStation(null);
    setShowCircles(false);
    setDirections(null);
  }, []);

  // Marker Icon Configuration (Optional customization)
  const markerIcon = isLoaded
    ? {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#ffffff",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#000000",
      }
    : null;

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="map-container" style={{ position: "relative" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          mapTypeId: "satellite",
          tilt: 45,
          styles: darkGrayMapStyle,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: "auto",
          rotateControl: true,
        }}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onClick={handleMapClick}
      >
        {/* User Location Marker and Circles */}
        {userLocation && (
          <>
            <Marker
              position={userLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
            {showCircles && (
              <>
                <Circle
                  center={userLocation}
                  radius={500}
                  options={{
                    strokeColor: "#FFFFFF",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillOpacity: 0,
                  }}
                />
                <Circle
                  center={userLocation}
                  radius={1000}
                  options={{
                    strokeColor: "#FFFFFF",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillOpacity: 0,
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Station Markers with MarkerClusterer */}
        <MarkerClusterer>
          {(clusterer) =>
            stations.map((station) => (
              <Marker
                key={station.id}
                position={station.position}
                clusterer={clusterer}
                onClick={() => handleMarkerClick(station)}
                icon={markerIcon}
              />
            ))
          }
        </MarkerClusterer>

        {/* Selected Station InfoWindow */}
        {selectedStation && (
          <InfoWindow
            position={selectedStation.position}
            onCloseClick={() => setSelectedStation(null)}
          >
            <div>
              <h3>{selectedStation.Place || "Unnamed Station"}</h3>
              <p>{selectedStation.Address || "No address available"}</p>
            </div>
          </InfoWindow>
        )}

        {/* Directions Renderer */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#276ef1",
                strokeOpacity: 0.8,
                strokeWeight: 4,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* Locate Me Button */}
      <button
        onClick={locateMe}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          width: "40px",
          height: "40px",
          backgroundColor: "#e7e8ec",
          color: "#000",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        📍
      </button>
    </div>
  );
};

export default MapContainer;
