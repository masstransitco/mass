// src/components/Map/ViewBar.jsx

import React from "react";
import PropTypes from "prop-types";
import LocateMe from "./LocateMe"; // Import LocateMe component
import "./ViewBar.css";

const ViewBar = ({
  departure,
  arrival,
  viewBarText,
  onClearDeparture,
  onClearArrival,
  showChooseDestination,
  onChooseDestination,
  onHome,
  onLocateMe, // Added onLocateMe prop
  isMeView,
  isDistrictView,
  isStationView,
}) => {
  // Determine if "View all stations" should be displayed
  const showViewAllStations = isMeView || isDistrictView || isStationView;

  return (
    <div className="view-bar">
      {/* Left: Locate Me Button (visible except on MeView) */}
      {!isMeView && <LocateMe onLocateMe={onLocateMe} />}

      {/* Center: Title and Info */}
      <div className="view-bar-center">
        {/* Pill-shaped Title Container */}
        <div className="view-bar-title-pill">
          <h2>{viewBarText}</h2>
        </div>

        {/* Departure and Arrival Information */}
        <div className="view-bar-info">
          {departure && (
            <div className="departure-info">
              <span>Departure: {departure}</span>
              <button
                onClick={onClearDeparture}
                className="clear-button"
                aria-label="Clear Departure"
              >
                Clear
              </button>
            </div>
          )}
          {arrival && (
            <div className="arrival-info">
              <span>Arrival: {arrival}</span>
              <button
                onClick={onClearArrival}
                className="clear-button"
                aria-label="Clear Arrival"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="view-bar-actions">
        {showChooseDestination && (
          <button
            onClick={onChooseDestination}
            className="choose-destination-button"
            aria-label="Choose Destination"
          >
            Choose Destination
          </button>
        )}

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
  onClearDeparture: PropTypes.func.isRequired,
  onClearArrival: PropTypes.func.isRequired,
  showChooseDestination: PropTypes.bool.isRequired,
  onChooseDestination: PropTypes.func.isRequired,
  onHome: PropTypes.func.isRequired,
  onLocateMe: PropTypes.func.isRequired, // Added to PropTypes
  isMeView: PropTypes.bool.isRequired,
  isDistrictView: PropTypes.bool.isRequired,
  isStationView: PropTypes.bool.isRequired,
};

export default ViewBar;
