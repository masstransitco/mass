// src/components/Menu/MotionMenu.jsx

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { FaArrowRight } from "react-icons/fa";
import "./MotionMenu.css";

const MotionMenu = ({
  departureStation,
  arrivalStation,
  directions,
  calculateFare,
  onContinue,
  buttonText,
}) => {
  // Extract route from directions
  const route = useMemo(() => directions?.routes[0]?.legs[0], [directions]);

  // Calculate fareInfo using useMemo
  const fareInfo = useMemo(() => {
    if (!route) return null;
    const { distance, duration } = route; // distance.value in meters, duration.value in seconds
    return calculateFare(distance.value, duration.value);
  }, [route, calculateFare]);

  // Early return if data is missing
  if (
    !directions ||
    !departureStation ||
    !arrivalStation ||
    !route ||
    !fareInfo
  )
    return null;

  return (
    <div className="motion-menu-container visible">
      <div className="fare-info">
        <h4>Route Information</h4>
        <p>Distance: {fareInfo.distanceKm} km</p>
        <p>Estimated Time: {fareInfo.estTime}</p>
        <p>Your Fare: HK${fareInfo.ourFare.toFixed(2)}</p>
        <p>Taxi Fare Estimate: HK${fareInfo.taxiFareEstimate.toFixed(2)}</p>
      </div>
      <button className="continue-button" onClick={onContinue}>
        {buttonText} <FaArrowRight style={{ marginLeft: "8px" }} />
      </button>
    </div>
  );
};

MotionMenu.propTypes = {
  departureStation: PropTypes.shape({
    place: PropTypes.string.isRequired,
    position: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }).isRequired,
    district: PropTypes.string,
  }).isRequired,
  arrivalStation: PropTypes.shape({
    place: PropTypes.string.isRequired,
    position: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }).isRequired,
    district: PropTypes.string,
  }).isRequired,
  directions: PropTypes.object, // Google Maps directions result object
  calculateFare: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
  buttonText: PropTypes.string, // Button text, default to "Choose departure time"
};

MotionMenu.defaultProps = {
  buttonText: "Choose departure time",
};

export default MotionMenu;
