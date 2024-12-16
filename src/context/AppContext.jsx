// src/context/AppContext.jsx

import React, { createContext, useState } from "react";
import PropTypes from "prop-types";

// Create the Context
export const AppContext = createContext();

// Create the Provider Component
export const AppProvider = ({ children }) => {
  const [currentMarkerType, setCurrentMarkerType] = useState("Cars");
  const [selectedStation, setSelectedStation] = useState(null);
  const [mapView, setMapView] = useState(null); // Add mapView state

  return (
    <AppContext.Provider
      value={{
        currentMarkerType,
        setCurrentMarkerType,
        selectedStation,
        setSelectedStation,
        mapView,
        setMapView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
