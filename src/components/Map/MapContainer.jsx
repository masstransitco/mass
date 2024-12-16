// src/components/Map/MapContainer.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Polyline,
} from "@react-google-maps/api";

import ViewBar from "./ViewBar";
// Removed unused import: ChooseDestinationButton
import MotionMenu from "../Menu/MotionMenu";
import FareInfoWindow from "./FareInfoWindow";
import RouteInfoWindow from "./RouteInfoWindow";
import UserOverlay from "./UserOverlay";
import UserCircles from "./UserCircles";
import DistrictMarkers from "./DistrictMarkers";
import StationMarkers from "./StationMarkers";

import useFetchGeoJSON from "../../hooks/useFetchGeoJSON";
import useMapGestures from "../../hooks/useMapGestures";

import "./MapContainer.css";

// **Note:** Use environment variables for API keys in production.
// Keeping the API key hardcoded as per your request.
const GOOGLE_MAPS_API_KEY = "AIzaSyA8rDrxBzMRlgbA7BQ2DoY31gEXzZ4Ours";

// MapId for custom styling
const mapId = "94527c02bbb6243";

// Libraries needed by the Google Maps instance
const libraries = ["geometry", "places"];

// Container style for the map
const containerStyle = { width: "100%", height: "100vh" };

// Base city center coordinates (e.g., Hong Kong)
const BASE_CITY_CENTER = { lat: 22.236, lng: 114.191 };

// Views configuration
const CITY_VIEW = {
  name: "CityView",
  center: BASE_CITY_CENTER,
  zoom: 11,
  tilt: 45,
  heading: 0,
};

const STATION_VIEW_ZOOM = 12; // Defined zoom level for StationView

// Circle distances in meters
const CIRCLE_DISTANCES = [500, 1000]; // meters

// Peak hours assumption
const PEAK_HOURS = [
  { start: 8, end: 10 },
  { start: 18, end: 20 },
];

// Base map styles (if any)
const BASE_STYLES = [];

// Styles for StationView to hide almost everything except the selected station
const STATION_VIEW_STYLES = [
  {
    featureType: "all",
    stylers: [{ visibility: "off" }],
  },
];

// Styles for RouteView to dim buildings and hide unnecessary info
const ROUTE_VIEW_STYLES = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape.man_made",
    stylers: [
      { color: "#e0e0e0" },
      { visibility: "simplified" },
      { lightness: 80 },
    ],
  },
  {
    featureType: "building",
    elementType: "geometry",
    stylers: [{ visibility: "on" }, { color: "#cccccc" }, { lightness: 80 }],
  },
];

// **User States**
const USER_STATES = {
  SELECTING_DEPARTURE: "SelectingDeparture",
  SELECTING_ARRIVAL: "SelectingArrival",
  DISPLAY_FARE: "DisplayFare",
};

const MapContainer = () => {
  // State Hooks
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [viewHistory, setViewHistory] = useState([CITY_VIEW]);
  const [showCircles, setShowCircles] = useState(false);
  const [departureStation, setDepartureStation] = useState(null);
  const [destinationStation, setDestinationStation] = useState(null);
  const [fareInfo, setFareInfo] = useState(null);
  const [userState, setUserState] = useState(USER_STATES.SELECTING_DEPARTURE);
  const [viewBarText, setViewBarText] = useState("Stations near me"); // Updated to "Stations near me"
  const [routeInfo, setRouteInfo] = useState(null);

  const currentView = viewHistory[viewHistory.length - 1];

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // **Fetch GeoJSON Data**
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

  // **Parse and Transform Stations Data**
  const stations = useMemo(() => {
    return stationsData.map((feature) => ({
      id: feature.id,
      place: feature.properties.Place,
      address: feature.properties.Address,
      position: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      },
      district: feature.properties.District,
    }));
  }, [stationsData]);

  // **Parse and Transform Districts Data**
  const districts = useMemo(() => {
    return districtsData.map((feature) => ({
      id: feature.id,
      name: feature.properties.District,
      position: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      },
      description: feature.properties.Description,
    }));
  }, [districtsData]);

  // **Apply Gesture Handling Hook**
  useMapGestures(map);

  // **Navigate to a given view**
  const navigateToView = useCallback(
    (view) => {
      if (!map) return;

      setViewHistory((prevHistory) => [...prevHistory, view]);

      map.panTo(view.center);
      map.setZoom(view.zoom);
      if (view.tilt !== undefined) map.setTilt(view.tilt);
      if (view.heading !== undefined) map.setHeading(view.heading);

      // Apply styles based on the view
      if (view.name === "RouteView") {
        map.setOptions({ styles: ROUTE_VIEW_STYLES });
      } else if (view.name === "StationView") {
        map.setOptions({ styles: STATION_VIEW_STYLES });
      } else {
        map.setOptions({ styles: BASE_STYLES });
      }

      // Update ViewBar text based on view
      if (view.name === "CityView") {
        setViewBarText("Hong Kong");
      } else if (view.name === "DistrictView") {
        setViewBarText(view.districtName || "District");
      } else if (view.name === "StationView") {
        setViewBarText(view.districtName || "Station"); // Updated to display district name
      } else if (view.name === "MeView") {
        setViewBarText("Stations near me"); // Updated to "Stations near me"
      } else if (view.name === "DriveView") {
        // This will be updated later with distance and estimated time
      }
    },
    [map]
  );

  // **Navigate to DriveView**
  const navigateToDriveView = useCallback(() => {
    if (!map || !departureStation || !destinationStation) return;

    // Calculate heading from departure to destination
    const departureLatLng = new window.google.maps.LatLng(
      departureStation.position.lat,
      departureStation.position.lng
    );
    const destinationLatLng = new window.google.maps.LatLng(
      destinationStation.position.lat,
      destinationStation.position.lng
    );
    const heading = window.google.maps.geometry.spherical.computeHeading(
      departureLatLng,
      destinationLatLng
    );

    const driveView = {
      name: "DriveView",
      center: departureStation.position,
      zoom: 14,
      tilt: 0,
      heading: heading,
    };
    navigateToView(driveView);
  }, [map, navigateToView, departureStation, destinationStation]);

  // **Handle station selection based on user state**
  const handleStationSelection = useCallback(
    (station) => {
      if (userState === USER_STATES.SELECTING_DEPARTURE) {
        setDepartureStation(station);
        setViewBarText(`Stations near me`); // Optional: could remain "Stations near me"
        // Navigate to StationView
        const stationView = {
          name: "StationView",
          center: station.position,
          zoom: STATION_VIEW_ZOOM, // Zoom level 12
          tilt: 0,
          heading: 0,
          districtName: station.district, // Pass district name for ViewBar
        };
        navigateToView(stationView);
        setUserState(USER_STATES.SELECTING_DEPARTURE); // Remain in SELECTING_DEPARTURE
      } else if (userState === USER_STATES.SELECTING_ARRIVAL) {
        setDestinationStation(station);
        setUserState(USER_STATES.DISPLAY_FARE);
        // **Invoke navigateToDriveView after setting arrival station**
        navigateToDriveView();
      }
    },
    [userState, navigateToView, navigateToDriveView]
  );

  // **Handle "Choose Destination" button click**
  const handleChooseDestination = () => {
    const chooseDestinationView = {
      name: "CityView",
      center: BASE_CITY_CENTER,
      zoom: CITY_VIEW.zoom,
      tilt: CITY_VIEW.tilt,
      heading: CITY_VIEW.heading,
    };
    navigateToView(chooseDestinationView);
    setUserState(USER_STATES.SELECTING_ARRIVAL);
    setDestinationStation(null);
    setDirections(null);
    setFareInfo(null);
    setViewBarText("Select your arrival station"); // Updated title
  };

  // **Compute fare once both departure and arrival are selected**
  useEffect(() => {
    if (departureStation && destinationStation) {
      // Fetch directions between departure and arrival
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
            // Compute fare based on distance and duration
            const route = result.routes[0].legs[0];
            const distance = route.distance.value; // in meters
            // Removed the unused 'duration' variable
            const fare = calculateFare(distance, route.duration.value); // Pass duration in seconds
            setFareInfo(fare);

            // Update ViewBar title with distance and estimated time
            const distanceKm = (distance / 1000).toFixed(2);
            const durationMinutes = Math.floor(route.duration.value / 60);
            const durationHours = Math.floor(durationMinutes / 60);
            const remainingMinutes = durationMinutes % 60;
            const estTime = `${
              durationHours > 0 ? `${durationHours} hr ` : ""
            }${remainingMinutes} mins`;
            setViewBarText(`Distance: ${distanceKm} km, Est Time: ${estTime}`);
          } else {
            console.error(`Error fetching directions: ${result}`);
          }
        }
      );
    }
  }, [departureStation, destinationStation]);

  // **Fare Calculation Function**
  const calculateFare = (distance, durationInSeconds) => {
    // distance in meters, duration in seconds
    // Base fare: HK$24 for first 2km + HK$1 for each 200m beyond 2km
    const baseTaxi = 24;
    const extraMeters = Math.max(0, distance - 2000);
    const increments = Math.floor(extraMeters / 200) * 1;
    const taxiFareEstimate = baseTaxi + increments;

    // Our pricing:
    // Peak hours: starting fare = $65, off-peak = $35
    const isPeak = isPeakHour(new Date());
    const startingFare = isPeak ? 65 : 35;
    // Aim for ~50% of taxi fare
    const ourFare = Math.max(taxiFareEstimate * 0.5, startingFare);

    return { ourFare, taxiFareEstimate };
  };

  // **Check if current time is peak hour**
  const isPeakHour = (date) => {
    const hour = date.getHours();
    return PEAK_HOURS.some((p) => hour >= p.start && hour < p.end);
  };

  // **Locate the user**
  const locateMe = useCallback(() => {
    setDirections(null);
    setFareInfo(null);
    // Do not clear selectedStation here

    if (!map) {
      console.error("Map not ready.");
      return;
    }

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
            tilt: 45,
          };
          navigateToView(meView);
          setShowCircles(true);
          setViewBarText("Stations near me"); // Updated title
        },
        (error) => {
          console.error(
            "Unable to access your location. Please enable location services.",
            error
          );
        }
      );
    } else {
      console.error("Geolocation not supported by your browser.");
    }
  }, [map, navigateToView]);

  // **Handle Home button click**
  const handleHomeClick = useCallback(() => {
    const homeView = {
      name: "CityView",
      center: BASE_CITY_CENTER,
      zoom: CITY_VIEW.zoom,
      tilt: CITY_VIEW.tilt,
      heading: CITY_VIEW.heading,
    };
    setViewHistory([homeView]);
    map.panTo(homeView.center);
    map.setZoom(homeView.zoom);
    if (homeView.tilt !== undefined) map.setTilt(homeView.tilt);
    if (homeView.heading !== undefined) map.setHeading(homeView.heading);
    map.setOptions({ styles: BASE_STYLES });
    setDepartureStation(null);
    setDestinationStation(null);
    setDirections(null);
    setFareInfo(null);
    setShowCircles(false);
    setViewBarText("Hong Kong"); // Reset to "Hong Kong"
    setUserState(USER_STATES.SELECTING_DEPARTURE); // Reset to SELECTING_DEPARTURE
  }, [map]);

  // **Handle Clear Departure Selection**
  const handleClearDeparture = () => {
    setDepartureStation(null);
    setDirections(null);
    setFareInfo(null);
    setViewBarText("Stations near me"); // Reset to "Stations near me"
    setUserState(USER_STATES.SELECTING_DEPARTURE);
  };

  // **Handle Clear Arrival Selection**
  const handleClearArrival = () => {
    setDestinationStation(null);
    setDirections(null);
    setFareInfo(null);
    setViewBarText(
      departureStation
        ? `Departure: ${departureStation.district}, ${departureStation.place}`
        : "Stations near me"
    );
    setUserState(USER_STATES.SELECTING_ARRIVAL);
  };

  // **Handle district click**
  const handleDistrictClick = useCallback(
    (district) => {
      const districtView = {
        name: "DistrictView",
        center: district.position,
        zoom: 14, // Adjusted zoom level for district view
        districtName: district.name,
      };
      navigateToView(districtView);
      setViewBarText("Select your arrival station"); // Updated title
      // Do not change userState here to prevent reverting from SELECTING_ARRIVAL
    },
    [navigateToView]
  );

  // **Handle map load**
  const onLoadMap = useCallback((mapInstance) => {
    console.log("Map loaded");
    setMap(mapInstance);
  }, []);

  // **Invoke locateMe when map is set**
  useEffect(() => {
    if (map) {
      console.log("Invoking locateMe after map is set");
      locateMe();
    }
  }, [map, locateMe]);

  // **Compute distance between user and a position (used for station filters)**
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

  // **Check if we are in MeView to filter stations**
  const inMeView = currentView.name === "MeView";
  const filteredStations = useMemo(() => {
    if (!inMeView || !userLocation) return stations;
    return stations.filter((st) => computeDistance(st.position) <= 1000);
  }, [inMeView, userLocation, stations, computeDistance]);

  // **Get label position for radius circles**
  const getCircleLabelPosition = useCallback((center, radius) => {
    const latOffset = radius * 0.000009; // Approx conversion of meters to lat offset
    return {
      lat: center.lat + latOffset,
      lng: center.lng,
    };
  }, []);

  // **Directions Renderer options**
  const directionsOptions = useMemo(() => {
    return {
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#276ef1",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      },
    };
  }, []);

  // **Handle route click (to show info windows)**
  const handleRouteClick = useCallback(() => {
    if (currentView.name === "RouteView") {
      setRouteInfo({
        title: "Walking Route Info",
        description: `Estimated walking time: ${directions?.routes[0]?.legs[0]?.duration.text}`,
        position: departureStation.position,
      });
    } else if (currentView.name === "DriveView") {
      setRouteInfo({
        title: "Driving Route Info",
        description: `Estimated driving time: ${
          directions?.routes[0]?.legs[0]?.duration.text
        }. Fare: HK$${fareInfo?.ourFare.toFixed(
          2
        )} (Taxi Estimate: HK$${fareInfo?.taxiFareEstimate.toFixed(2)})`,
        position: destinationStation.position,
      });
    }
  }, [
    currentView.name,
    directions,
    fareInfo,
    departureStation,
    destinationStation,
  ]);

  // **Loading and Error States for Data Fetching**
  if (loadError) {
    return (
      <div className="error-message">
        Error loading maps. Please check your API key and network connection.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="loading-message">Loading map...</div>;
  }

  if (stationsLoading || districtsLoading) {
    return <div className="loading-message">Loading map data...</div>;
  }

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
      {/* ViewBar without Back Button */}
      <ViewBar
        departure={departureStation?.place}
        arrival={destinationStation?.place}
        onLocateMe={locateMe}
        viewBarText={viewBarText}
        onClearDeparture={handleClearDeparture}
        onClearArrival={handleClearArrival}
        showChooseDestination={
          departureStation &&
          !destinationStation &&
          userState === USER_STATES.SELECTING_DEPARTURE
        }
        onChooseDestination={handleChooseDestination}
        onHome={handleHomeClick} // Pass handleHomeClick function to ViewBar
        isCityView={currentView.name === "CityView"} // Pass isCityView flag to ViewBar
        userState={userState} // Pass current userState
        isMeView={currentView.name === "MeView"} // Pass isMeView flag
        distanceKm={fareInfo ? (fareInfo.distanceKm || 0).toFixed(2) : null} // Pass distance
        estTime={fareInfo ? fareInfo.estTime : null} // Pass estimated time
      />

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentView.center}
        zoom={currentView.zoom}
        options={{
          mapId: mapId, // Reintroduced mapId for custom styling
          tilt: currentView.tilt || 0,
          heading: currentView.heading || 0,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: "none", // **Disabled all default gesture handling**
          rotateControl: false, // Optionally disable rotate control if not needed
          minZoom: 10,
          draggable: false, // **Disabled dragging to rely on custom gestures**
          scrollwheel: false, // **Disabled scrollwheel zooming**
          disableDoubleClickZoom: true, // **Disabled double-click zooming**
          styles:
            currentView.name === "RouteView"
              ? ROUTE_VIEW_STYLES
              : currentView.name === "StationView"
              ? STATION_VIEW_STYLES
              : currentView.name === "DriveView"
              ? BASE_STYLES
              : BASE_STYLES,
        }}
        onLoad={onLoadMap}
        onClick={() => {
          /* Optionally handle map clicks */
        }}
      >
        {/* User Location Circles */}
        {userLocation && showCircles && (
          <UserCircles
            userLocation={userLocation}
            distances={CIRCLE_DISTANCES}
            getLabelPosition={getCircleLabelPosition}
          />
        )}

        {/* District Overlays (in CityView) */}
        {currentView.name === "CityView" && (
          <DistrictMarkers
            districts={districts}
            onDistrictClick={handleDistrictClick}
          />
        )}

        {/* Station Overlays (in MeView or DistrictView) */}
        {(currentView.name === "MeView" ||
          currentView.name === "DistrictView") && (
          <StationMarkers
            stations={filteredStations}
            onStationClick={handleStationSelection}
            selectedStations={{
              departure: departureStation,
              destination: destinationStation,
            }}
          />
        )}

        {/* User Arrow Overlay */}
        {userLocation && (
          <UserOverlay
            userLocation={userLocation}
            mapHeading={map?.getHeading() || 0}
          />
        )}

        {/* Directions Renderer */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={directionsOptions}
          />
        )}

        {/* Polyline for Clickable Route */}
        {directions &&
          directions.routes.map((route, routeIndex) =>
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
                  onClick={handleRouteClick}
                />
              ))
            )
          )}

        {/* Fare Info Window */}
        {fareInfo &&
          userState === USER_STATES.DISPLAY_FARE &&
          destinationStation && (
            <FareInfoWindow
              position={destinationStation.position}
              fareInfo={{
                duration: directions.routes[0].legs[0].duration.text,
                ourFare: fareInfo.ourFare,
                taxiFareEstimate: fareInfo.taxiFareEstimate,
              }}
              onClose={() => setFareInfo(null)}
            />
          )}

        {/* Route Info Window */}
        {routeInfo && (
          <RouteInfoWindow
            position={routeInfo.position}
            info={routeInfo} // Updated to pass 'info' prop
            onClose={() => setRouteInfo(null)}
          />
        )}
      </GoogleMap>

      {/* MotionMenu for displaying fare information */}
      {userState === USER_STATES.DISPLAY_FARE && (
        <MotionMenu fareInfo={fareInfo} />
      )}
    </div>
  );
};

export default MapContainer;
