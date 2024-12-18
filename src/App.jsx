// src/App.jsx

import React, { useContext, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import "bootstrap/dist/css/bootstrap.min.css";

import USER_STATES from "./constants/userStates"; // Import user states
import { AuthContext } from "./context/AuthContext";
import Header from "./components/Header/Header.jsx";
import MapContainer from "./components/Map/MapContainer.jsx";
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
  const [userState, setUserState] = useState(USER_STATES.SELECTING_DEPARTURE);

  useEffect(() => {
    // If a station is selected, clear district and fareInfo
    if (selectedStation) {
      setSelectedDistrict(null);
      setFareInfo(null);
    }
  }, [selectedStation]);

  useEffect(() => {
    // If a district is selected, clear station and fareInfo
    if (selectedDistrict) {
      setSelectedStation(null);
      setFareInfo(null);
    }
  }, [selectedDistrict]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setUserState(USER_STATES.SELECTED_DEPARTURE);
  };

  const handleStationDeselect = () => {
    setSelectedStation(null);
    setFareInfo(null);
    setUserState(USER_STATES.SELECTING_DEPARTURE);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setUserState(USER_STATES.SELECTING_DEPARTURE);
  };

  const handleFareInfo = (info) => {
    setFareInfo(info);
    setUserState(USER_STATES.DISPLAY_FARE);
  };

  const handleMotionMenuContinue = () => {
    // After finishing fare, reset state for new selection
    setFareInfo(null);
    setSelectedStation(null);
    setSelectedDistrict(null);
    setUserState(USER_STATES.SELECTING_DEPARTURE);
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
        <div style={{ flex: 1 }}>
          <MapContainer
            onStationSelect={handleStationSelect}
            onStationDeselect={handleStationDeselect}
            onDistrictSelect={handleDistrictSelect}
            onFareInfo={handleFareInfo}
            userState={userState}
            setUserState={setUserState}
          />
        </div>

        <PulseStrip className="pulse-strip" />
      </main>

      {fareInfo && (
        <MotionMenu fareInfo={fareInfo} onContinue={handleMotionMenuContinue} />
      )}

      <Footer />
    </div>
  );
}

export default App;
