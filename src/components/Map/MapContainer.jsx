// src/components/Map/MapContainer.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Polyline,
} from "@react-google-maps/api";

import ViewBar from "./ViewBar";
import InfoBox from "./InfoBox";
import UserOverlay from "./UserOverlay";
import UserCircles from "./UserCircles";

import DistrictMarkers from "./DistrictMarkers";
import StationMarkers from "./StationMarkers";

import useFetchGeoJSON from "../../hooks/useFetchGeoJSON";
import useMapGestures from "../../hooks/useMapGestures";

import PropTypes from "prop-types";

import "./MapContainer.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyA8rDrxBzMRlgbA7BQ2DoY31gEXzZ4Ours";
const mapId = "94527c02bbb6243";
const libraries = ["geometry", "places"];
const containerStyle = { width: "100%", height: "100vh" };
const BASE_CITY_CENTER = { lat: 22.236, lng: 114.191 };

const CITY_VIEW = {
  name: "CityView",
  center: BASE_CITY_CENTER,
  zoom: 11,
  tilt: 0,
  heading: 0,
};

const STATION_VIEW_ZOOM = 18;
const CIRCLE_DISTANCES = [500, 1000];

const USER_STATES = {
  SELECTING_DEPARTURE: "SelectingDeparture",
  SELECTED_DEPARTURE: "SelectedDeparture",
  SELECTING_ARRIVAL: "SelectingArrival",
  SELECTED_ARRIVAL: "SelectedArrival",
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
  onFareInfo,
  userState,
  setUserState,
}) => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [viewHistory, setViewHistory] = useState([CITY_VIEW]);
  const [showCircles, setShowCircles] = useState(false);
  const [departureStation, setDepartureStation] = useState(null);
  const [destinationStation, setDestinationStation] = useState(null);
  const [viewBarText, setViewBarText] = useState("Stations near me");

  const currentView = viewHistory[viewHistory.length - 1];

  // Show SceneContainer if in SELECTED_DEPARTURE or SELECTED_ARRIVAL
  const showSceneContainer =
    userState === USER_STATES.SELECTED_DEPARTURE ||
    userState === USER_STATES.SELECTED_ARRIVAL;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const {
    data: stationsData = [],
    loading: stationsLoading,
    error: stationsError,
  } = useFetchGeoJSON("/stations.geojson");

  const {
    data: districtsData = [],
    loading: districtsLoading,
    error: districtsError,
  } = useFetchGeoJSON("/districts.geojson");

  const stations = useMemo(() => {
    return stationsData.map((feature, index) => ({
      id: feature.id != null ? String(feature.id) : `station-${index}`,
      place: feature.properties.Place,
      address: feature.properties.Address,
      position: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      },
      district: feature.properties.District,
    }));
  }, [stationsData]);

  const districts = useMemo(() => {
    return districtsData.map((feature, index) => ({
      id: feature.id != null ? String(feature.id) : `district-${index}`,
      name: feature.properties.District,
      position: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      },
      description: feature.properties.Description,
    }));
  }, [districtsData]);

  useMapGestures(map);

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
      // 30% cheaper than taxi
      const ourFare = Math.max(taxiFareEstimate * 0.7, startingFare);
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
      if (!map) {
        console.warn("Map not ready, cannot navigate.");
        return;
      }
      setViewHistory((prev) => [...prev, view]);
      map.panTo(view.center);
      map.setZoom(view.zoom);
      if (view.tilt !== undefined) map.setTilt(view.tilt);
      if (view.heading !== undefined) map.setHeading(view.heading);

      switch (view.name) {
        case "CityView":
          setViewBarText("All Districts");
          break;
        case "DistrictView":
          setViewBarText(view.districtName || "District");
          break;
        case "StationView":
          setViewBarText(view.stationName || "Station");
          break;
        case "MeView":
          setViewBarText("Stations near me");
          break;
        case "DriveView":
          // After directions fetched
          break;
        default:
          setViewBarText("");
      }
    },
    [map]
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
          const fare = calculateFare(route.distance.value, route.duration.value);
          setViewBarText(
            `Distance: ${fare.distanceKm} km | Est Time: ${fare.estTime}`
          );

          if (onFareInfo) {
            onFareInfo(fare);
          }

          navigateToView({
            name: "DriveView",
            center: {
              lat:
                (departureStation.position.lat +
                  destinationStation.position.lat) /
                2,
              lng:
                (departureStation.position.lng +
                  destinationStation.position.lng) /
                2,
            },
            zoom: 13,
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
    onFareInfo
  ]);

  const handleHomeClick = useCallback(() => {
    navigateToView(CITY_VIEW);
    setDepartureStation(null);
    setDestinationStation(null);
    setDirections(null);
    setShowCircles(false);
    setUserState(USER_STATES.SELECTING_DEPARTURE);
    if (onStationDeselect) onStationDeselect();
  }, [navigateToView, onStationDeselect, setUserState]);

  const handleStationSelection = useCallback(
    (station) => {
      if (userState === USER_STATES.SELECTING_DEPARTURE) {
        // Selecting departure
        setDepartureStation(station);
        if (onStationSelect) onStationSelect(station);
        navigateToView({
          name: "SelectedDeparture",
          center: station.position,
          zoom: STATION_VIEW_ZOOM,
        });
        setUserState(USER_STATES.SELECTED_DEPARTURE);
      } else if (userState === USER_STATES.SELECTING_ARRIVAL) {
        // Selecting arrival
        setDestinationStation(station);
        setUserState(USER_STATES.DISPLAY_FARE);
        navigateToDriveView();
      }
    },
    [
      userState,
      navigateToView,
      navigateToDriveView,
      onStationSelect,
      setUserState,
    ]
  );

  const handleClearDeparture = useCallback(() => {
    setDepartureStation(null);
    setDirections(null);
    setUserState(USER_STATES.SELECTING_DEPARTURE);
    if (onStationDeselect) onStationDeselect();
    navigateToView(CITY_VIEW);
  }, [navigateToView, onStationDeselect, setUserState]);

  const handleClearArrival = useCallback(() => {
    setDestinationStation(null);
    setDirections(null);
    setUserState(USER_STATES.SELECTING_ARRIVAL);
    navigateToView(CITY_VIEW);
  }, [navigateToView, setUserState]);

  const handleChooseDestination = useCallback(() => {
    navigateToView(CITY_VIEW);
    setUserState(USER_STATES.SELECTING_ARRIVAL);
    setDestinationStation(null);
    setDirections(null);
    if (onStationDeselect) onStationDeselect();
  }, [navigateToView, onStationDeselect, setUserState]);

  const locateMe = useCallback(() => {
    setDirections(null);
    if (!map) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(userPos);
          navigateToView({
            name: "MeView",
            center: userPos,
            zoom: 15,
          });
          setShowCircles(true);
        },
        (error) => console.error("Location error:", error)
      );
    }
  }, [map, navigateToView]);

  useEffect(() => {
    if (map && userState === USER_STATES.SELECTING_DEPARTURE && !userLocation) {
      locateMe();
    }
  }, [map, locateMe, userState, userLocation]);

  const computeDistance = useCallback(
    (pos) => {
      if (!userLocation || !window.google?.maps?.geometry?.spherical)
        return Infinity;
      const userLatLng = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);
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
    // On MeView, always show stations (within 1000m if needed)
    if (!inMeView || !userLocation) return stations;
    return stations.filter((st) => computeDistance(st.position) <= 1000);
  }, [inMeView, userLocation, stations, computeDistance]);

  const handleDistrictClick = useCallback(
    (district) => {
      if (!map) {
        console.warn("Map not ready, cannot handle district click.");
        return;
      }

      const stationsInDistrict = stations.filter(
        (st) =>
          st.district &&
          st.district.trim().toLowerCase() === district.name.trim().toLowerCase()
      );

      const bounds = new window.google.maps.LatLngBounds();
      stationsInDistrict.forEach((st) => bounds.extend(st.position));

      if (stationsInDistrict.length === 0) {
        bounds.extend(district.position);
      }

      map.fitBounds(bounds);
      map.setTilt(45);

      navigateToView({
        name: "DistrictView",
        center: map.getCenter().toJSON(),
        zoom: map.getZoom(),
        tilt: 45,
        heading: map.getHeading() || 0,
        districtName: district.name,
      });

      // Selecting a district does NOT change user state
      if (onDistrictSelect) onDistrictSelect(district);

      setViewBarText("All Districts");
    },
    [map, navigateToView, stations, onDistrictSelect]
  );

  const onLoadMap = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const displayedStations = useMemo(() => {
    // On CityView: Only districts (no stations)
    if (currentView.name === "CityView") {
      return districts;
    }

    let filtered = baseFilteredStations;

    if (currentView.name === "DistrictView" && currentView.districtName) {
      const normalizedName = currentView.districtName.trim().toLowerCase();
      filtered = filtered.filter(
        (st) =>
          st.district && st.district.trim().toLowerCase() === normalizedName
      );
    }

    switch (userState) {
      case USER_STATES.SELECTING_DEPARTURE:
        // On CityView we show districts, else show filtered stations
        if (currentView.name === "CityView") {
          return districts;
        }
        return filtered;
      case USER_STATES.SELECTED_DEPARTURE:
        return [departureStation];
      case USER_STATES.SELECTING_ARRIVAL:
        return [departureStation, destinationStation].filter(Boolean);
      case USER_STATES.DISPLAY_FARE:
        return [departureStation, destinationStation].filter(Boolean);
      default:
        return filtered;
    }
  }, [
    currentView,
    userState,
    departureStation,
    destinationStation,
    baseFilteredStations,
    stations,
    districts,
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

  useEffect(() => {
    if (map && stations.length > 0 && districts.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      stations.forEach((station) => bounds.extend(station.position));
      districts.forEach((district) => bounds.extend(district.position));
      map.fitBounds(bounds);
    }
  }, [map, stations, districts]);

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
    <div className="map-container" style={{ position: "relative", width: "100%", height: "100vh" }}>
      <ViewBar
        departure={
          userState === USER_STATES.SELECTED_DEPARTURE
            ? departureStation?.place
            : null
        }
        arrival={
          userState === USER_STATES.SELECTED_ARRIVAL
            ? destinationStation?.place
            : null
        }
        viewBarText={viewBarText}
        onClearDeparture={handleClearDeparture}
        onClearArrival={handleClearArrival}
        showChooseDestination={userState === USER_STATES.SELECTED_DEPARTURE}
        onChooseDestination={handleChooseDestination}
        onHome={handleHomeClick}
        onLocateMe={locateMe}
        isMeView={currentView.name === "MeView"}
        isDistrictView={currentView.name === "DistrictView"}
        isStationView={userState === USER_STATES.SELECTED_DEPARTURE}
      />

      {/* InfoBoxes and SceneContainer area */}
      <div className="lower-panel"> 
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

        {showSceneContainer && (
          <div className="scene-wrapper">
            {/* scenecontainer appear in SELECTED_DEPARTURE or SELECTED_ARRIVAL state */}
            {/* Ensure to pass the station position as center if station is selected */}
            {(userState === USER_STATES.SELECTED_DEPARTURE && departureStation) ||
            (userState === USER_STATES.SELECTED_ARRIVAL && destinationStation) ? (
              <SceneContainer
                center={
                  userState === USER_STATES.SELECTED_DEPARTURE
                    ? departureStation.position
                    : destinationStation.position
                }
              />
            ) : null}
          </div>
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
          gestureHandling: "none",
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
          <UserOverlay userLocation={userLocation} mapHeading={map?.getHeading() || 0} />
        )}

        {directions && (
          <>
            <DirectionsRenderer directions={directions} options={directionsOptions} />
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

        {currentView.name === "CityView" && (
          <DistrictMarkers districts={districts} onDistrictClick={handleDistrictClick} />
        )}

        {currentView.name !== "CityView" && (
          <StationMarkers stations={displayedStations} onStationClick={handleStationSelection} />
        )}
      </GoogleMap>
    </div>
  );
};

MapContainer.propTypes = {
  onStationSelect: PropTypes.func.isRequired,
  onStationDeselect: PropTypes.func.isRequired,
  onDistrictSelect: PropTypes.func.isRequired,
  onFareInfo: PropTypes.func.isRequired,
  userState: PropTypes.oneOf(Object.values(USER_STATES)).isRequired,
  setUserState: PropTypes.func.isRequired,
};

export default MapContainer;