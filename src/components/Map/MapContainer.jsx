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
import DistrictMarkersRaw from "./DistrictMarkers";
import StationMarkersRaw from "./StationMarkers";
import SceneContainer from "../Scene/SceneContainer";
import MotionMenu from "../Menu/MotionMenu"; // Import MotionMenu

import useFetchGeoJSON from "../../hooks/useFetchGeoJSON";
import useMapGestures from "../../hooks/useMapGestures";
import PropTypes from "prop-types";

import "./MapContainer.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyA8rDrxBzMRlgbA7BQ2DoY31gEXzZ4Ours"; // Use environment variable for security
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

// Memoized Markers for performance
const DistrictMarkers = React.memo(DistrictMarkersRaw);
const StationMarkers = React.memo(StationMarkersRaw);

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

  // Scene container bottom sheet minimized or expanded
  const [sceneMinimized, setSceneMinimized] = useState(false);

  const currentView = viewHistory[viewHistory.length - 1];

  // SceneContainer visible only on SELECTED_DEPARTURE
  const showSceneContainer = userState === USER_STATES.SELECTED_DEPARTURE;

  // MotionMenu bottom sheet visible only on SELECTED_ARRIVAL
  const showMotionMenu =
    userState === USER_STATES.SELECTED_ARRIVAL && destinationStation;

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
        console.warn("Map not ready.");
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
          // On DriveView, the viewBarText already set in navigateToDriveView
          break;
        default:
          setViewBarText("");
      }
    },
    [map]
  );

  const minimizeScene = useCallback(() => {
    setSceneMinimized(true);
  }, []);

  const expandScene = useCallback(() => {
    setSceneMinimized(false);
  }, []);

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
          setViewBarText(
            `Distance: ${fare.distanceKm} km | Est Time: ${fare.estTime}`
          );

          if (onFareInfo) onFareInfo(fare);

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
    onFareInfo,
  ]);

  const handleHomeClick = useCallback(() => {
    navigateToView(CITY_VIEW);
    minimizeScene();
  }, [navigateToView, minimizeScene]);

  const handleStationSelection = useCallback(
    (station) => {
      if (userState === USER_STATES.SELECTING_DEPARTURE) {
        setDepartureStation(station);
        if (onStationSelect) onStationSelect(station);
        navigateToView({
          name: "StationView",
          center: station.position,
          zoom: STATION_VIEW_ZOOM,
          stationName: station.place,
        });
        setUserState(USER_STATES.SELECTED_DEPARTURE);
        // Show scene container since now selected departure
        expandScene();
      } else if (userState === USER_STATES.SELECTING_ARRIVAL) {
        setDestinationStation(station);
        setUserState(USER_STATES.SELECTED_ARRIVAL);
        // On SELECTED_ARRIVAL, we will hide scene container and show MotionMenu bottom sheet
        // No call to expandScene here since scene container is replaced by motion menu
        navigateToDriveView();
      }
    },
    [
      userState,
      navigateToView,
      navigateToDriveView,
      onStationSelect,
      setUserState,
      expandScene,
    ]
  );

  const handleClearDeparture = useCallback(() => {
    setDepartureStation(null);
    setDirections(null);
    setUserState(USER_STATES.SELECTING_DEPARTURE);
    if (onStationDeselect) onStationDeselect();
    navigateToView(CITY_VIEW);
    minimizeScene();
  }, [navigateToView, onStationDeselect, setUserState, minimizeScene]);

  const handleClearArrival = useCallback(() => {
    setDestinationStation(null);
    setDirections(null);
    // On clearing arrival, revert to SELECTING_DEPARTURE
    setUserState(USER_STATES.SELECTING_DEPARTURE);
    navigateToView(CITY_VIEW);
    minimizeScene();
  }, [navigateToView, setUserState, minimizeScene]);

  const handleChooseDestination = useCallback(() => {
    // From SELECTED_DEPARTURE to SELECTING_ARRIVAL
    // Do NOT remove departure station. Keep departure infobox visible.
    navigateToView(CITY_VIEW);
    setUserState(USER_STATES.SELECTING_ARRIVAL);
    // Do not clear departure station here
    // just entering SELECTING_ARRIVAL so user can pick arrival
    // minimize scene since we no longer show scene container in SELECTING_ARRIVAL
    minimizeScene();
    // onStationDeselect not needed here since we keep departure selected
  }, [navigateToView, setUserState, minimizeScene]);

  const locateMe = useCallback(() => {
    setDirections(null);
    if (!map) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(userPos);
          navigateToView({
            name: "MeView",
            center: userPos,
            zoom: 15,
          });
          setShowCircles(true);
          minimizeScene();
        },
        (error) => console.error("Location error:", error)
      );
    }
  }, [map, navigateToView, minimizeScene]);

  useEffect(() => {
    if (map && userState === USER_STATES.SELECTING_DEPARTURE && !userLocation) {
      locateMe();
    }
  }, [map, locateMe, userState, userLocation]);

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
      if (!map) {
        console.warn("Map not ready.");
        return;
      }

      const stationsInDistrict = stations.filter(
        (st) =>
          st.district &&
          st.district.trim().toLowerCase() ===
            district.name.trim().toLowerCase()
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

      if (onDistrictSelect) onDistrictSelect(district);
      setViewBarText(district.name);
    },
    [map, navigateToView, stations, onDistrictSelect]
  );

  const onLoadMap = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const displayedStations = useMemo(() => {
    // If CityView: only districts shown, no stations
    if (currentView.name === "CityView") {
      // no stations in cityview scenario
      return [];
    }

    let filtered = baseFilteredStations;

    // DistrictView: show all stations in the district
    if (currentView.name === "DistrictView") {
      if (currentView.districtName) {
        const normalizedName = currentView.districtName.trim().toLowerCase();
        filtered = stations.filter(
          (st) =>
            st.district && st.district.trim().toLowerCase() === normalizedName
        );
      } else {
        filtered = stations;
      }
    }

    // MeView: already filtered by proximity
    if (currentView.name === "MeView") {
      // filtered is already proximity filtered
    }

    // StationView: only selected station’s marker
    if (currentView.name === "StationView") {
      if (departureStation) return [departureStation];
      if (destinationStation) return [destinationStation];
      return [];
    }

    // DriveView: only departure & arrival station markers
    if (currentView.name === "DriveView") {
      return [departureStation, destinationStation].filter(Boolean);
    }

    // For SELECTING_ARRIVAL state, user can pick arrival from all stations
    if (userState === USER_STATES.SELECTING_ARRIVAL) {
      return [departureStation, ...stations].filter(Boolean);
    }

    // SELECTED_DEPARTURE: show departure station only
    if (userState === USER_STATES.SELECTED_DEPARTURE) {
      return [departureStation].filter(Boolean);
    }

    // SELECTING_DEPARTURE: show all stations unless in CityView
    if (userState === USER_STATES.SELECTING_DEPARTURE) {
      if (currentView.name === "CityView") {
        // cityview means no stations displayed, only districts
        return [];
      }
      // In selecting departure (not yet chosen), show all stations
      return stations;
    }

    // SELECTED_ARRIVAL or DISPLAY_FARE: departure & arrival
    if (
      userState === USER_STATES.SELECTED_ARRIVAL ||
      userState === USER_STATES.DISPLAY_FARE
    ) {
      return [departureStation, destinationStation].filter(Boolean);
    }

    return filtered;
  }, [
    currentView,
    userState,
    departureStation,
    destinationStation,
    baseFilteredStations,
    stations,
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
      stations.forEach((station) => station && bounds.extend(station.position));
      districts.forEach(
        (district) => district && bounds.extend(district.position)
      );
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

  const sceneVisibleClass =
    showSceneContainer && !sceneMinimized ? "visible" : "minimized";

  // For MotionMenu bottom sheet on SELECTED_ARRIVAL state:
  // This bottom sheet replaces scene container bottom sheet
  // On SELECTED_ARRIVAL, show MotionMenu bottom sheet with same 40vh and "Choose departure time" button
  const showMotionMenuSheet = showMotionMenu;

  return (
    <div className="map-container">
      <ViewBar
        departure={null} // no departure text line
        arrival={null} // no arrival text line
        viewBarText={viewBarText}
        onHome={handleHomeClick}
        onLocateMe={locateMe}
        isMeView={currentView.name === "MeView"}
        isDistrictView={currentView.name === "DistrictView"}
        isStationView={userState === USER_STATES.SELECTED_DEPARTURE}
      />

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

        {userState === USER_STATES.SELECTED_DEPARTURE && (
          <button
            className="choose-destination-button-lower"
            onClick={handleChooseDestination}
            aria-label="Choose Destination"
          >
            Choose Destination
          </button>
        )}

        {/* SceneContainer bottom sheet */}
        {showSceneContainer && departureStation && !showMotionMenuSheet && (
          <div className={`scene-wrapper ${sceneVisibleClass}`}>
            <div className="scene-container-header">
              <button
                className="toggle-scene-button"
                onClick={() =>
                  sceneMinimized ? expandScene() : minimizeScene()
                }
              >
                {sceneMinimized ? "Expand 3D Map" : "Minimize 3D Map"}
              </button>
            </div>
            <SceneContainer center={departureStation.position} />
          </div>
        )}

        {/* MotionMenu bottom sheet */}
        {showMotionMenuSheet &&
          departureStation &&
          destinationStation &&
          directions && (
            <div className="scene-wrapper visible" style={{ height: "40vh" }}>
              <MotionMenu
                departureStation={departureStation}
                arrivalStation={destinationStation}
                directions={directions}
                calculateFare={calculateFare}
                onContinue={() => {
                  // "Choose departure time" action
                  console.log("User chose departure time");
                  // Future logic can be implemented here
                }}
                buttonText="Choose departure time"
              />
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

        {/* CityView: only districts */}
        {currentView.name === "CityView" && (
          <DistrictMarkers
            districts={districts}
            onDistrictClick={handleDistrictClick}
          />
        )}

        {/* Other Views: StationMarkers based on displayedStations */}
        {currentView.name !== "CityView" && (
          <StationMarkers
            stations={displayedStations}
            onStationClick={handleStationSelection}
          />
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
