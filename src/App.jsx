// src/App.jsx

import React, { useContext, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import "bootstrap/dist/css/bootstrap.min.css";
import PropTypes from "prop-types";

import { AuthContext } from "./context/AuthContext";
import Header from "./components/Header/Header.jsx";
import MapContainer from "./components/Map/MapContainer.jsx";
import SceneContainer from "./components/Scene/SceneContainer.jsx";
import MotionMenu from "./components/Menu/MotionMenu.jsx";
import PulseStrip from "./components/PulseStrip/PulseStrip.jsx";
import Footer from "./components/Footer/Footer.jsx";
import "./Index.css";
import "./App.css";
import "./LoadingSpinner.css";

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <svg className="spinner" viewBox="0 0 100 100">
        <circle className="circle" cx="50" cy="50" r="45" />
      </svg>
      <p>Initializing...</p>
    </div>
  );
};

function App() {
  const { user, loading } = useContext(AuthContext);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [fareInfo, setFareInfo] = useState(null);

  // Center for SceneContainer
  const [sceneCenter, setSceneCenter] = useState(null);

  // SceneContainer visible if we have either a selectedStation or a selectedDistrict
  const showSceneContainer = selectedStation || selectedDistrict;

  useEffect(() => {
    // If a station is selected, clear district and fareInfo, set SceneContainer center
    if (selectedStation) {
      setSelectedDistrict(null);
      setFareInfo(null);
      setSceneCenter({
        lat: selectedStation.position.lat,
        lng: selectedStation.position.lng,
      });
    }
  }, [selectedStation]);

  useEffect(() => {
    // If a district is selected, clear station and fareInfo, set SceneContainer center
    if (selectedDistrict) {
      setSelectedStation(null);
      setFareInfo(null);
      setSceneCenter({
        lat: selectedDistrict.position.lat,
        lng: selectedDistrict.position.lng,
      });
    }
  }, [selectedDistrict]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleStationDeselect = () => {
    setSelectedStation(null);
    setFareInfo(null);
    setSceneCenter(null);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
  };

  const handleFareInfo = (info) => {
    setFareInfo(info);
  };

  const handleMotionMenuContinue = () => {
    console.log("Continuing to next step...");
    // Implement navigation or state changes for the next step
    // For example, reset states to allow new selections
    setFareInfo(null);
    setSelectedStation(null);
    setSelectedDistrict(null);
    setSceneCenter(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Header user={user} />
      <Analytics />
      <main
        className="main-content"
        style={{ display: "flex", flexDirection: "column", height: "100vh" }}
      >
        {/* MapContainer occupies the remaining vertical space above the scene */}
        <div style={{ flex: 1 }}>
          <MapContainer
            onStationSelect={handleStationSelect}
            onStationDeselect={handleStationDeselect}
            onDistrictSelect={handleDistrictSelect}
            onFareInfo={handleFareInfo} // Passed onFareInfo callback
          />
        </div>

        {/* SceneContainer occupies the bottom 30% of the viewport */}
        {showSceneContainer && sceneCenter && (
          <div style={{ height: "30vh" }}>
            <SceneContainer center={sceneCenter} />
          </div>
        )}

        {/* Additional Components */}
        <PulseStrip className="pulse-strip" />
      </main>

      {/* MotionMenu is rendered based on fareInfo state */}
      {fareInfo && (
        <MotionMenu fareInfo={fareInfo} onContinue={handleMotionMenuContinue} />
      )}

      <Footer />
    </div>
  );
}

App.propTypes = {
  user: PropTypes.object,
  loading: PropTypes.bool,
};

export default App;
