// src/components/Map/MapContainer.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
} from "react";
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
import MotionMenu from "../Menu/MotionMenu";
import DepartTime from "./DepartTime";

import useFetchGeoJSON from "../../hooks/useFetchGeoJSON";
import useMapGestures from "../../hooks/useMapGestures";
import PropTypes from "prop-types";

import "./MapContainer.css";

// Securely access the API key from environment variables
const GOOGLE_MAPS_API_KEY = "AIzaSyA8rDrxBzMRlgbA7BQ2DoY31gEXzZ4Ours";

// Validate that the API key is provided
if (!GOOGLE_MAPS_API_KEY) {
  throw new Error(
    "Google Maps API key is missing. Please set REACT_APP_GOOGLE_MAPS_API_KEY in your environment variables."
  );
}

const mapId = "94527c02bbb6243"; // Ensure this is valid
const libraries = ["places"]; // Removed 'geometry' as it's no longer used
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

// Memoized components for performance
const DistrictMarkers = React.memo(DistrictMarkersRaw);
const StationMarkers = React.memo(StationMarkersRaw);

// Initial state for useReducer
const initialState = {
  userState: USER_STATES.SELECTING_DEPARTURE,
  departureStation: null,
  destinationStation: null,
};

// Reducer function to manage state transitions
const reducer = (state, action) => {
  switch (action.type) {
    case "SET_DEPARTURE":
      console.log(`Action: SET_DEPARTURE, Payload: ${action.payload.place}`);
      return {
        ...state,
        userState: USER_STATES.SELECTED_DEPARTURE,
        departureStation: action.payload,
      };
    case "SET_DESTINATION":
      console.log(`Action: SET_DESTINATION, Payload: ${action.payload.place}`);
      return {
        ...state,
        userState: USER_STATES.SELECTED_ARRIVAL,
        destinationStation: action.payload,
      };
    case "CHOOSE_DESTINATION":
      console.log("Action: CHOOSE_DESTINATION");
      return {
        ...state,
        userState: USER_STATES.SELECTING_ARRIVAL,
      };
    case "CLEAR_DEPARTURE":
      console.log("Action: CLEAR_DEPARTURE");
      return {
        ...state,
        userState: USER_STATES.SELECTING_DEPARTURE,
        departureStation: null,
        destinationStation: null,
      };
    case "CLEAR_DESTINATION":
      console.log("Action: CLEAR_DESTINATION");
      return {
        ...state,
        userState: USER_STATES.SELECTING_ARRIVAL,
        destinationStation: null,
      };
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state;
  }
};

const MapContainer = ({
  onStationSelect,
  onStationDeselect,
  onDistrictSelect,
  onFareInfo,
}) => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [viewHistory, setViewHistory] = useState([CITY_VIEW]);
  const [showCircles, setShowCircles] = useState(false);
  const [viewBarText, setViewBarText] = useState("Stations near me");

  // Scene container bottom sheet minimized or expanded
  const [sceneMinimized, setSceneMinimized] = useState(false);

  // States for managing DepartTime modal and selected departure time
  const [isDepartTimeOpen, setIsDepartTimeOpen] = useState(false);
  const [departureTime, setDepartureTime] = useState(null);

  // useReducer for managing userState, departureStation, destinationStation
  const [state, dispatch] = useReducer(reducer, initialState);
  const { userState, departureStation, destinationStation } = state;

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

  // Memoized current view
  const currentView = useMemo(() => {
    return viewHistory[viewHistory.length - 1];
  }, [viewHistory]);

  // Callback to check if current time is peak hour
  const isPeakHour = useCallback((date) => {
    const hour = date.getHours();
    return PEAK_HOURS.some((p) => hour >= p.start && hour < p.end);
  }, []);

  // Fare calculation logic
  const calculateFare = useCallback(
    (distance, durationInSeconds) => {
      const baseTaxi = 24; // Base fare
      const extraMeters = Math.max(0, distance - 2000); // Assuming first 2000 meters are covered by base fare
      const increments = Math.floor(extraMeters / 200); // Every additional 200 meters
      const taxiFareEstimate = baseTaxi + increments;

      const peak = isPeakHour(new Date());
      const startingFare = peak ? 65 : 35; // Starting fare based on peak hours
      const ourFare = Math.max(taxiFareEstimate * 0.7, startingFare); // 70% of taxi fare or starting fare, whichever is higher

      const distanceKm = (distance / 1000).toFixed(2);
      const hrs = Math.floor(durationInSeconds / 3600);
      const mins = Math.floor((durationInSeconds % 3600) / 60);
      const estTime = `${hrs > 0 ? hrs + " hr " : ""}${mins} mins`;

      return { ourFare, taxiFareEstimate, distanceKm, estTime };
    },
    [isPeakHour]
  );

  // Navigation to different views
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
          // On DriveView, the viewBarText is set based on directions
          break;
        default:
          setViewBarText("");
      }

      console.log(`Navigated to ${view.name}`);
    },
    [map]
  );

  // Handle navigation to DriveView
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
        if (status === "OK") {
          // Changed from window.google.maps.DirectionsStatus.OK to "OK"
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
          console.log("Navigated to DriveView with directions.");
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

  // Handle station selection
  const handleStationSelection = useCallback(
    (station) => {
      if (userState === USER_STATES.SELECTING_DEPARTURE) {
        dispatch({ type: "SET_DEPARTURE", payload: station });
        if (onStationSelect) onStationSelect(station);
        navigateToView({
          name: "StationView",
          center: station.position,
          zoom: STATION_VIEW_ZOOM,
          stationName: station.place,
        });
        console.log(
          `Navigated to StationView for departure station: ${station.place}`
        );
        setSceneMinimized(false);
      } else if (userState === USER_STATES.SELECTING_ARRIVAL) {
        dispatch({ type: "SET_DESTINATION", payload: station });
        console.log(
          `Navigated to DriveView for arrival station: ${station.place}`
        );
        navigateToDriveView();
      }
    },
    [userState, navigateToView, navigateToDriveView, onStationSelect]
  );

  // Handle district click
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
      console.log(`District clicked: ${district.name}`);
    },
    [map, navigateToView, stations, onDistrictSelect]
  );

  // Handle map load
  const onLoadMap = useCallback((mapInstance) => {
    setMap(mapInstance);
    console.log("Map loaded.");
  }, []);

  // Handle Home button click
  const handleHomeClick = useCallback(() => {
    navigateToView(CITY_VIEW);
    setSceneMinimized(false);
    // Do NOT change userState here to maintain SELECTED_DEPARTURE
    console.log(
      "Home button clicked. Navigated to CityView without altering userState."
    );
  }, [navigateToView]);

  // Handle clearing the departure station
  const handleClearDeparture = useCallback(() => {
    dispatch({ type: "CLEAR_DEPARTURE" });
    if (onStationDeselect) onStationDeselect();
    navigateToView(CITY_VIEW);
    setSceneMinimized(false);
    setDirections(null); // Clear directions when clearing departure
    console.log("Cleared departure station and navigated to CityView.");
  }, [navigateToView, onStationDeselect]);

  // Handle clearing the arrival station
  const handleClearArrival = useCallback(() => {
    dispatch({ type: "CLEAR_DESTINATION" });
    navigateToView(CITY_VIEW);
    setSceneMinimized(false);
    setDirections(null); // Clear directions when clearing destination
    console.log("Cleared arrival station and navigated to CityView.");
  }, [navigateToView]);

  // Handle choosing destination via DepartTime modal
  const handleDepartureTimeConfirm = useCallback(
    (selectedTime) => {
      setDepartureTime(selectedTime); // Store the selected departure time
      dispatch({ type: "CHOOSE_DESTINATION" }); // Transition to SELECTING_ARRIVAL state
      setIsDepartTimeOpen(false); // Close the modal
      console.log("Departure time selected:", selectedTime);
    },
    [dispatch]
  );

  // Handle choosing destination button click to open DepartTime modal
  const handleChooseDestination = useCallback(() => {
    setIsDepartTimeOpen(true); // Open the DepartTime modal
  }, []);

  // Handle user location (Locate Me)
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
          setSceneMinimized(false);
          console.log("User location found and navigated to MeView.");
        },
        (error) => {
          console.error("Location error:", error);
          // Optionally, provide user feedback here
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      // Optionally, provide user feedback here
    }
  }, [map, navigateToView]);

  // Trigger locateMe when in SELECTING_DEPARTURE and no userLocation
  useEffect(() => {
    console.log("User state changed:", userState);
    if (map && userState === USER_STATES.SELECTING_DEPARTURE && !userLocation) {
      console.log(
        "Triggering locateMe due to userState being SELECTING_DEPARTURE and no userLocation."
      );
      locateMe();
    }
  }, [map, locateMe, userState, userLocation]);

  // Determine which stations to display based on current view and user state
  const displayedStations = useMemo(() => {
    // If CityView: only districts shown, no stations
    if (currentView.name === "CityView") {
      return [];
    }

    // If DistrictView or MeView: show all stations
    if (currentView.name === "DistrictView" || currentView.name === "MeView") {
      return stations;
    }

    // If StationView: only selected station’s marker
    if (currentView.name === "StationView") {
      if (departureStation) return [departureStation];
      if (destinationStation) return [destinationStation];
      return [];
    }

    // If DriveView: only departure & arrival station markers
    if (currentView.name === "DriveView") {
      return [departureStation, destinationStation].filter(Boolean);
    }

    // Handle based on user state
    switch (userState) {
      case USER_STATES.SELECTING_ARRIVAL:
        return [departureStation, ...stations].filter(Boolean);

      case USER_STATES.SELECTED_DEPARTURE:
        return [departureStation].filter(Boolean);

      case USER_STATES.SELECTING_DEPARTURE:
        return currentView.name === "CityView" ? [] : stations; // Show all stations unless in CityView

      case USER_STATES.SELECTED_ARRIVAL:
      case USER_STATES.DISPLAY_FARE:
        return [departureStation, destinationStation].filter(Boolean);

      default:
        return stations;
    }
  }, [currentView, userState, departureStation, destinationStation, stations]);

  // Memoized directions options
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

  // Adjust map bounds to include all stations and districts once data is loaded
  useEffect(() => {
    if (map && stations.length > 0 && districts.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      stations.forEach((station) => station && bounds.extend(station.position));
      districts.forEach(
        (district) => district && bounds.extend(district.position)
      );
      map.fitBounds(bounds);
      console.log("Map bounds adjusted to include all stations and districts.");
    }
  }, [map, stations, districts]);

  // Debugging Logs for userState and Stations
  useEffect(() => {
    console.log("Current userState:", userState);
    console.log("Departure Station:", departureStation);
    console.log("Destination Station:", destinationStation);
  }, [userState, departureStation, destinationStation]);

  // Render error messages if loading fails
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
    userState === USER_STATES.SELECTED_DEPARTURE && !sceneMinimized
      ? "visible"
      : "minimized";

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
            departureTime={departureTime} // Pass the selected departure time
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
            onClick={handleChooseDestination} // Open DepartTime modal
            aria-label="Choose Departure Time"
          >
            Choose Departure Time
          </button>
        )}

        {/* SceneContainer bottom sheet */}
        {userState === USER_STATES.SELECTED_DEPARTURE && departureStation && (
          <div className={`scene-wrapper ${sceneVisibleClass}`}>
            <div className="scene-container-header">
              <button
                className="toggle-scene-button"
                onClick={() => setSceneMinimized((prev) => !prev)}
              >
                {sceneMinimized ? "Expand 3D Map" : "Minimize 3D Map"}
              </button>
            </div>
            <SceneContainer center={departureStation.position} />
          </div>
        )}

        {/* MotionMenu bottom sheet */}
        {userState === USER_STATES.SELECTED_ARRIVAL &&
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

      {/* Render DepartTime Modal */}
      <DepartTime
        open={isDepartTimeOpen}
        onClose={() => setIsDepartTimeOpen(false)}
        onConfirm={handleDepartureTimeConfirm} // Handle departure time selection
      />

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
            getLabelPosition={(c, r) => ({
              lat: c.lat + r * 0.000009,
              lng: c.lng,
            })}
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

        {/* DistrictView and MeView: all station markers */}
        {(currentView.name === "DistrictView" ||
          currentView.name === "MeView") && (
          <StationMarkers
            stations={displayedStations}
            onStationClick={handleStationSelection}
          />
        )}

        {/* Other Views: StationMarkers based on displayedStations */}
        {currentView.name !== "CityView" &&
          currentView.name !== "DistrictView" &&
          currentView.name !== "MeView" && (
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
};

export default MapContainer;
