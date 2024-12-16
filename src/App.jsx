/* App.jsx */

import React, { useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import Header from "./components/Header/Header.jsx";
import MapContainer from "./components/Map/MapContainer.jsx";
import MotionMenu from "./components/Menu/MotionMenu.jsx";
import PulseStrip from "./components/PulseStrip/PulseStrip.jsx";
import Footer from "./components/Footer/Footer.jsx";
import "./Index.css";
import "./App.css";

function App() {
  const { user, loading } = useContext(AuthContext);

  // Disable right-click context menu
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  if (loading) {
    return <div className="loading">Initializing...</div>;
  }

  return (
    <div className="App">
      <Header user={user} />
      <main className="main-content">
        {/* Ensure content doesn’t overlap with the MotionMenu */}
        <MapContainer />
        <PulseStrip className="pulse-strip" />
      </main>
      <MotionMenu className="motion-menu" />
      <Footer />
    </div>
  );
}

export default App;
