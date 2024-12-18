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
      {!isMeView && <LocateMe onLocateMe={onLocateMe} />}

      <div className="view-bar-center">
        <div className="view-bar-title-pill">
          <h2>{viewBarText}</h2>
        </div>
        {/* Removed departure and arrival info lines here */}
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
