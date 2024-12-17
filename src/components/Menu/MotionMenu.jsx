// src/components/Menu/MotionMenu.jsx

import React from "react";
import PropTypes from "prop-types";
import { FaArrowRight } from "react-icons/fa";
import "./MotionMenu.css";

const MotionMenu = ({ fareInfo }) => {
  if (!fareInfo) return null;

  const handleContinue = () => {
    // Handle continue action: may navigate to another view or do something else
    console.log("Continue pressed");
  };

  return (
    <div className="motion-menu-container">
      <div className="fare-info">
        <h4>Route Information</h4>
        <p>Distance: {fareInfo.distanceKm} km</p>
        <p>Estimated Time: {fareInfo.estTime}</p>
        <p>Your Fare: HK${fareInfo.ourFare.toFixed(2)}</p>
        <p>Taxi Fare Estimate: HK${fareInfo.taxiFareEstimate.toFixed(2)}</p>
      </div>
      <button className="continue-button" onClick={handleContinue}>
        Continue <FaArrowRight style={{ marginLeft: "8px" }} />
      </button>
    </div>
  );
};

MotionMenu.propTypes = {
  fareInfo: PropTypes.shape({
    ourFare: PropTypes.number.isRequired,
    taxiFareEstimate: PropTypes.number.isRequired,
    distanceKm: PropTypes.string.isRequired,
    estTime: PropTypes.string.isRequired,
  }),
};

export default MotionMenu;
