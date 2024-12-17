// src/App.jsx
import React, { useContext, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import "bootstrap/dist/css/bootstrap.min.css";
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

  // SceneContainer visible if we have either a selectedStation or a selectedDistrict
  const showSceneContainer = selectedStation || selectedDistrict;

  useEffect(() => {
    // If we select a station, clear district
    if (selectedStation) setSelectedDistrict(null);
  }, [selectedStation]);

  useEffect(() => {
    // If we select a district, clear station
    if (selectedDistrict) setSelectedStation(null);
  }, [selectedDistrict]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleStationDeselect = () => {
    setSelectedStation(null);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
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
        {/* MapContainer occupies the remaining space */}
        <div style={{ flex: 1 }}>
          <MapContainer
            onStationSelect={handleStationSelect}
            onStationDeselect={handleStationDeselect}
            onDistrictSelect={handleDistrictSelect}
          />
        </div>

        {/* SceneContainer occupies the bottom 30% of the viewport */}
        {showSceneContainer && (
          <div style={{ height: "30vh" }}>
            <SceneContainer
              selectedStation={selectedStation}
              selectedDistrict={selectedDistrict}
            />
          </div>
        )}

        {/* Other Components */}
        <PulseStrip className="pulse-strip" />
      </main>
      <MotionMenu className="motion-menu" />
      <Footer />
    </div>
  );
}

export default App;
