// src/components/Map/ViewBar.jsx

import React from "react";
import PropTypes from "prop-types";
import LocateMe from "./LocateMe";
import "./ViewBar.css";

const ViewBar = ({
  departure,
  arrival,
  viewBarText,
  onHome,
  onLocateMe,
  isMeView,
  isDistrictView,
  isStationView,
}) => {
  // Determine if "View all stations" should be displayed
  const showViewAllStations = isMeView || isDistrictView || isStationView;

  return (
    <div className="view-bar">
      {/* Locate Me button (hidden if MeView) */}
      {!isMeView && <LocateMe onLocateMe={onLocateMe} />}

      <div className="view-bar-center">
        <div className="view-bar-title-pill">
          {/* Title text now black and always visible */}
          <h2>{viewBarText}</h2>
        </div>

        <div className="view-bar-info">
          {/* Show departure and arrival info without clear buttons here */}
          {departure && (
            <div className="departure-info">
              <span style={{ color: "#000" }}>Departure: {departure}</span>
            </div>
          )}
          {arrival && (
            <div className="arrival-info">
              <span style={{ color: "#000" }}>Arrival: {arrival}</span>
            </div>
          )}
        </div>
      </div>

      <div className="view-bar-actions">
        {showViewAllStations && (
          <button
            onClick={onHome}
            className="view-all-stations-button"
            aria-label="View all stations"
          >
            View all stations
          </button>
        )}
      </div>
    </div>
  );
};

ViewBar.propTypes = {
  departure: PropTypes.string,
  arrival: PropTypes.string,
  viewBarText: PropTypes.string.isRequired,
  onHome: PropTypes.func.isRequired,
  onLocateMe: PropTypes.func.isRequired,
  isMeView: PropTypes.bool.isRequired,
  isDistrictView: PropTypes.bool.isRequired,
  isStationView: PropTypes.bool.isRequired,
};

export default ViewBar;
