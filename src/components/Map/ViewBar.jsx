// src/components/Map/ViewBar.jsx

import React from "react";
import "./ViewBar.css"; // Ensure styles are correctly applied
import LocateMe from "./LocateMe"; // Import the LocateMe component
import HomeButton from "./HomeButton"; // Import HomeButton component
import ChooseDestinationButton from "./ChooseDestinationButton"; // Import the new component

const USER_STATES = {
  SELECTING_DEPARTURE: "SelectingDeparture",
  SELECTING_ARRIVAL: "SelectingArrival",
  DISPLAY_FARE: "DisplayFare",
};

const ViewBar = ({
  departure,
  arrival,
  onLocateMe,
  viewBarText,
  onClearDeparture,
  onClearArrival,
  showChooseDestination,
  onChooseDestination,
  onHome, // Handler for HomeButton
  isCityView, // Determines if HomeButton should be displayed
  userState, // Current user state
  isMeView, // Determines if LocateMe should be displayed
  distanceKm, // Distance in km
  estTime, // Estimated time
}) => {
  // Determine visibility of buttons based on userState and view
  const showLocateMe =
    !isMeView && userState === USER_STATES.SELECTING_DEPARTURE;

  const showHomeButton =
    !isCityView && userState === USER_STATES.SELECTING_DEPARTURE;

  // Determine if dynamic title should be shown
  const dynamicTitle =
    userState === USER_STATES.DISPLAY_FARE && distanceKm && estTime;

  return (
    <div className="view-bar">
      {/* Top Buttons Group: LocateMe and Home Buttons */}
      <div className="top-buttons-group">
        {showLocateMe && <LocateMe onLocateMe={onLocateMe} />}
        {showHomeButton && <HomeButton onClick={onHome} />}
      </div>

      {/* View Title */}
      <div className="view-title">
        {dynamicTitle
          ? `Distance: ${distanceKm} km, Est Time: ${estTime}`
          : viewBarText}
      </div>

      {/* Buttons Group: Clear Buttons and Choose Destination */}
      <div className="buttons-group">
        {/* Selection Buttons Container */}
        <div className="selection-buttons-container">
          {/* Clear Departure Button */}
          {departure && (
            <div className="selection-bar">
              <button
                className="clear-button"
                onClick={onClearDeparture}
                title="Clear Departure"
                aria-label="Clear Departure"
              >
                ✕
              </button>
              <span className="selection-text">Departure: {departure}</span>
            </div>
          )}

          {/* Clear Arrival Button */}
          {arrival && (
            <div className="selection-bar">
              <button
                className="clear-button"
                onClick={onClearArrival}
                title="Clear Arrival"
                aria-label="Clear Arrival"
              >
                ✕
              </button>
              <span className="selection-text">Arrival: {arrival}</span>
            </div>
          )}
        </div>

        {/* Choose Destination Button */}
        {showChooseDestination && (
          <ChooseDestinationButton onChooseDestination={onChooseDestination} />
        )}
      </div>
    </div>
  );
};

export default React.memo(ViewBar);
