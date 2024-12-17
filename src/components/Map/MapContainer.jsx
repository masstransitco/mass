// src/components/Map/MapContainer.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Polyline,
} from "@react-google-maps/api";

import ViewBar from "./ViewBar";
import InfoBox from "./InfoBox"; // Import InfoBox component
import MotionMenu from "../Menu/MotionMenu";
import UserOverlay from "./UserOverlay";
import UserCircles from "./UserCircles";

import useFetchGeoJSON from "../../hooks/useFetchGeoJSON";
import useMapGestures from "../../hooks/useMapGestures";

import "./MapContainer.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyA8rDrxBzMRlgbA7BQ2DoY31gEXzZ4Ours"; // **Securely loaded from .env**
const mapId = "94527c02bbb6243";
const libraries = ["geometry", "places"];
const containerStyle = { width: "100%", height: "100vh" };
const BASE_CITY_CENTER = { lat: 22.236, lng: 114.191 };
const CITY_VIEW = {
  name: "CityView",
  center: BASE_CITY_CENTER,
  zoom: 11,
  tilt: 45,
  heading: 0,
};
const STATION_VIEW_ZOOM = 16;
const CIRCLE_DISTANCES = [500, 1000];

const USER_STATES = {
  SELECTING_DEPARTURE: "SelectingDeparture",
  SELECTING_ARRIVAL: "SelectingArrival",
  DISPLAY_FARE: "DisplayFare",
};

const PEAK_HOURS = [
  { start: 8, end: 10 },
  { start: 18, end: 20 },
];

const MapContainer = ({
  onStationSelect,
  onStationDeselect,
  onDistrictSelect,
}) => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [viewHistory, setViewHistory] = useState([CITY_VIEW]);
  const [showCircles, setShowCircles] = useState(false);
  const [departureStation, setDepartureStation] = useState(null);
  const [destinationStation, setDestinationStation] = useState(null);
  const [fareInfo, setFareInfo] = useState(null);
  const [userState, setUserState] = useState(USER_STATES.SELECTING_DEPARTURE);
  const [viewBarText, setViewBarText] = useState("Stations near me");

  const currentView = viewHistory[viewHistory.length - 1];

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const {
    data: stationsData,
    loading: stationsLoading,
    error: stationsError,
  } = useFetchGeoJSON("/stations.geojson");

  const {
    data: districtsData,
    loading: districtsLoading,
    error: districtsError,
  } = useFetchGeoJSON("/districts.geojson");

  useMapGestures(map);

  const stations = useMemo(() => {
    if (!stationsData?.features) return [];
    const processedStations = stationsData.features.map((feature) => ({
      id: feature.id,
      place: feature.properties.Place,
      address: feature.properties.Address,
      position: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      },
      district: feature.properties.District,
    }));
    console.log("Processed Stations:", processedStations); // **Added**
    return processedStations;
  }, [stationsData]);

  const districts = useMemo(() => {
    if (!districtsData?.features) return [];
    const processedDistricts = districtsData.features.map((feature) => ({
      id: feature.id,
      name: feature.properties.District,
      position: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      },
      description: feature.properties.Description,
    }));
    console.log("Processed Districts:", processedDistricts); // **Added**
    return processedDistricts;
  }, [districtsData]);

  const isPeakHour = useCallback((date) => {
    const hour = date.getHours();
    return PEAK_HOURS.some((p) => hour >= p.start && hour < p.end);
  }, []);

  const calculateFare = useCallback(
    (distance, durationInSeconds) => {
      const baseTaxi = 24;
      const extraMeters = Math.max(0, distance - 2000);
      const increments = Math.floor(extraMeters / 200) * 1;
      const taxiFareEstimate = baseTaxi + increments;

      const peak = isPeakHour(new Date());
      const startingFare = peak ? 65 : 35;
      const ourFare = Math.max(taxiFareEstimate * 0.5, startingFare);
      const distanceKm = (distance / 1000).toFixed(2);
      const hrs = Math.floor(durationInSeconds / 3600);
      const mins = Math.floor((durationInSeconds % 3600) / 60);
      const estTime = `${hrs > 0 ? hrs + " hr " : ""}${mins} mins`;
      return { ourFare, taxiFareEstimate, distanceKm, estTime };
    },
    [isPeakHour]
  );

  const navigateToView = useCallback(
    (view) => {
      if (!map) return;
      setViewHistory((prev) => [...prev, view]);
      map.panTo(view.center);
      map.setZoom(view.zoom);
      if (view.tilt !== undefined) map.setTilt(view.tilt);
      if (view.heading !== undefined) map.setHeading(view.heading);

      switch (view.name) {
        case "CityView":
          setViewBarText("Hong Kong");
          break;
        case "DistrictView":
          if (userState === USER_STATES.SELECTING_DEPARTURE) {
            setViewBarText("Select departure station");
          } else if (userState === USER_STATES.SELECTING_ARRIVAL) {
            setViewBarText("Select your arrival station");
          } else {
            setViewBarText(view.districtName || "District");
          }
          break;
        case "StationView":
          setViewBarText(view.districtName || "Station");
          break;
        case "MeView":
          setViewBarText("Stations near me");
          break;
        case "DriveView":
          // In drive view, we set text after directions are fetched
          break;
        default:
          setViewBarText("");
      }
    },
    [map, userState]
  );

  const navigateToDriveView = useCallback(() => {
    if (!map || !departureStation || !destinationStation) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: departureStation.position,
        destination: destinationStation.position,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const route = result.routes[0]?.legs[0];
          if (!route) return;
          const fare = calculateFare(
            route.distance.value,
            route.duration.value
          );
          setFareInfo(fare);
          setViewBarText(
            `Distance: ${fare.distanceKm} km | Est Time: ${fare.estTime}`
          );

          navigateToView({
            name: "DriveView",
            center: departureStation.position,
            zoom: 16,
          });
        } else {
          console.error(`Error fetching directions: ${status}`);
        }
      }
    );
  }, [
    map,
    departureStation,
    destinationStation,
    calculateFare,
    navigateToView,
  ]);

  const handleHomeClick = useCallback(() => {
    navigateToView(CITY_VIEW);
    setDepartureStation(null);
    setDestinationStation(null);
    setDirections(null);
    setFareInfo(null);
    setShowCircles(false);
    setUserState(USER_STATES.SELECTING_DEPARTURE);
    if (onStationDeselect) onStationDeselect();
  }, [navigateToView, onStationDeselect]);

  const handleStationSelection = useCallback(
    (station) => {
      if (userState === USER_STATES.SELECTING_DEPARTURE) {
        setDepartureStation(station);
        if (onStationSelect) onStationSelect(station);
        const stationView = {
          name: "StationView",
          center: station.position,
          zoom: STATION_VIEW_ZOOM,
          tilt: 0,
          heading: 0,
          districtName: station.district,
        };
        navigateToView(stationView);
        setUserState(USER_STATES.SELECTING_ARRIVAL);
      } else if (userState === USER_STATES.SELECTING_ARRIVAL) {
        setDestinationStation(station);
        setUserState(USER_STATES.DISPLAY_FARE);
        navigateToDriveView();
      }
    },
    [userState, navigateToView, navigateToDriveView, onStationSelect]
  );

  const handleClearDeparture = useCallback(() => {
    setDepartureStation(null);
    setDirections(null);
    setFareInfo(null);
    setUserState(USER_STATES.SELECTING_DEPARTURE);
    if (onStationDeselect) onStationDeselect();
    navigateToView(CITY_VIEW);
  }, [navigateToView, onStationDeselect]);

  const handleClearArrival = useCallback(() => {
    setDestinationStation(null);
    setDirections(null);
    setFareInfo(null);
    setUserState(USER_STATES.SELECTING_ARRIVAL);
    navigateToView(CITY_VIEW);
  }, [navigateToView]);

  const handleChooseDestination = useCallback(() => {
    navigateToView(CITY_VIEW);
    setUserState(USER_STATES.SELECTING_ARRIVAL);
    setDestinationStation(null);
    setDirections(null);
    setFareInfo(null);
    if (onStationDeselect) onStationDeselect();
  }, [navigateToView, onStationDeselect]);

  const locateMe = useCallback(() => {
    setDirections(null);
    setFareInfo(null);
    if (!map) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(userPos);
          const meView = {
            name: "MeView",
            center: userPos,
            zoom: 15,
          };
          navigateToView(meView);
          setShowCircles(true);
        },
        (error) => console.error("Location error:", error)
      );
    }
  }, [map, navigateToView]);

  useEffect(() => {
    if (map) locateMe();
  }, [map, locateMe]);

  const computeDistance = useCallback(
    (pos) => {
      if (!userLocation || !window.google?.maps?.geometry?.spherical)
        return Infinity;
      const userLatLng = new window.google.maps.LatLng(
        userLocation.lat,
        userLocation.lng
      );
      const stationLatLng = new window.google.maps.LatLng(pos.lat, pos.lng);
      return window.google.maps.geometry.spherical.computeDistanceBetween(
        userLatLng,
        stationLatLng
      );
    },
    [userLocation]
  );

  const inMeView = currentView.name === "MeView";
  const baseFilteredStations = useMemo(() => {
    if (!inMeView || !userLocation) return stations;
    return stations.filter((st) => computeDistance(st.position) <= 1000);
  }, [inMeView, userLocation, stations, computeDistance]);

  const handleDistrictClick = useCallback(
    (district) => {
      const districtView = {
        name: "DistrictView",
        center: district.position,
        zoom: 14,
        districtName: district.name,
      };
      navigateToView(districtView);

      if (onDistrictSelect) onDistrictSelect(district);

      if (userState === USER_STATES.SELECTING_ARRIVAL) {
        setViewBarText("Select your arrival station");
      } else if (userState === USER_STATES.SELECTING_DEPARTURE) {
        setViewBarText("Select departure station");
      }
    },
    [navigateToView, userState, onDistrictSelect]
  );

  const onLoadMap = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Determine which stations to display
  const displayedStations = useMemo(() => {
    let filtered = baseFilteredStations;

    if (currentView.name === "DistrictView" && currentView.districtName) {
      // Only show stations in the selected district
      filtered = filtered.filter(
        (st) => st.district === currentView.districtName
      );
    }

    if (userState === USER_STATES.SELECTING_DEPARTURE) {
      if (departureStation) {
        return [departureStation];
      } else {
        return filtered;
      }
    } else if (userState === USER_STATES.SELECTING_ARRIVAL) {
      if (destinationStation) {
        return [departureStation, destinationStation].filter(Boolean);
      } else {
        return [departureStation].filter(Boolean);
      }
    } else if (userState === USER_STATES.DISPLAY_FARE) {
      return [departureStation, destinationStation].filter(Boolean);
    }

    return filtered;
  }, [
    userState,
    departureStation,
    destinationStation,
    baseFilteredStations,
    currentView,
  ]);

  const directionsOptions = useMemo(
    () => ({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#276ef1",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      },
    }),
    []
  );

  // Fit map to bounds once data is loaded
  useEffect(() => {
    if (map && stations.length > 0 && districts.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      stations.forEach((station) => bounds.extend(station.position));
      districts.forEach((district) => bounds.extend(district.position));
      map.fitBounds(bounds);
    }
  }, [map, stations, districts]);

  // State for markers
  const [districtMarkers, setDistrictMarkers] = useState([]);
  const [stationMarkers, setStationMarkers] = useState([]);

  // Create District Markers
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Clear existing district markers
    districtMarkers.forEach((m) => (m.map = null));

    if (currentView.name === "CityView") {
      const newMarkers = districts.map((district) => {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: district.position,
          title: district.name,
        });

        marker.addListener("click", () => {
          handleDistrictClick(district);
        });

        return marker;
      });

      setDistrictMarkers(newMarkers);
    } else {
      setDistrictMarkers([]);
    }

    return () => {
      districtMarkers.forEach((m) => (m.map = null));
    };
  }, [map, districts, currentView, handleDistrictClick]);

  // Create Station Markers
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Clear existing station markers
    stationMarkers.forEach((m) => (m.map = null));

    // In the city view, we show no stations (except if we have a departure already selected)
    // In MeView, DistrictView, StationView, DriveView we show stations according to displayedStations
    if (
      currentView.name === "MeView" ||
      currentView.name === "DistrictView" ||
      currentView.name === "StationView" ||
      currentView.name === "DriveView"
    ) {
      const newMarkers = displayedStations.map((station) => {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: station.position,
          title: station.place,
        });

        marker.addListener("click", () => {
          handleStationSelection(station);
        });

        return marker;
      });
      setStationMarkers(newMarkers);
    } else if (
      currentView.name === "CityView" &&
      departureStation &&
      userState !== USER_STATES.DISPLAY_FARE
    ) {
      // If we have a departure station selected and are back at city view for choosing arrival
      const newMarkers = [departureStation].map((station) => {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: station.position,
          title: station.place,
        });

        marker.addListener("click", () => {
          handleStationSelection(station);
        });

        return marker;
      });
      setStationMarkers(newMarkers);
    } else {
      setStationMarkers([]);
    }

    return () => {
      stationMarkers.forEach((m) => (m.map = null));
    };
  }, [
    map,
    displayedStations,
    currentView,
    departureStation,
    userState,
    handleStationSelection,
  ]);

  if (loadError) {
    return (
      <div className="error-message">
        Error loading maps. Please check your API key and network connection.
      </div>
    );
  }

  if (!isLoaded) return <div className="loading-message">Loading map...</div>;
  if (stationsLoading || districtsLoading)
    return <div className="loading-message">Loading map data...</div>;
  if (stationsError || districtsError) {
    return (
      <div className="error-message">
        Error loading map data. Please try again later.
      </div>
    );
  }

  return (
    <div
      className="map-container"
      style={{ position: "relative", width: "100%", height: "100vh" }}
    >
      <ViewBar
        viewBarText={viewBarText}
        onHome={handleHomeClick}
        onLocateMe={locateMe}
        isMeView={currentView.name === "MeView"}
        isDistrictView={currentView.name === "DistrictView"}
        isStationView={currentView.name === "StationView"}
        showChooseDestination={
          departureStation &&
          !destinationStation &&
          userState === USER_STATES.SELECTING_DEPARTURE
        }
        onChooseDestination={handleChooseDestination}
      />

      <div className="info-box-container">
        {departureStation && (
          <InfoBox
            type="Departure"
            location={departureStation.place}
            onClear={handleClearDeparture}
          />
        )}

        {destinationStation && (
          <InfoBox
            type="Arrival"
            location={destinationStation.place}
            onClear={handleClearArrival}
          />
        )}
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentView.center}
        zoom={currentView.zoom}
        options={{
          mapId: mapId,
          tilt: currentView.tilt || 0,
          heading: currentView.heading || 0,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: "auto",
          rotateControl: false,
        }}
        onLoad={onLoadMap}
      >
        {userLocation && showCircles && (
          <UserCircles
            userLocation={userLocation}
            distances={CIRCLE_DISTANCES}
            getLabelPosition={(c, r) => {
              const latOffset = r * 0.000009;
              return { lat: c.lat + latOffset, lng: c.lng };
            }}
          />
        )}

        {userLocation && (
          <UserOverlay
            userLocation={userLocation}
            mapHeading={map?.getHeading() || 0}
          />
        )}

        {directions && (
          <>
            <DirectionsRenderer
              directions={directions}
              options={directionsOptions}
            />
            {directions.routes.map((route, routeIndex) =>
              route.legs.map((leg, legIndex) =>
                leg.steps.map((step, stepIndex) => (
                  <Polyline
                    key={`${routeIndex}-${legIndex}-${stepIndex}`}
                    path={step.path}
                    options={{
                      strokeColor: "#276ef1",
                      strokeOpacity: 0.8,
                      strokeWeight: 4,
                    }}
                  />
                ))
              )
            )}
          </>
        )}
      </GoogleMap>

      {userState === USER_STATES.DISPLAY_FARE && fareInfo && (
        <MotionMenu fareInfo={fareInfo} />
      )}
    </div>
  );
};

export default MapContainer;
