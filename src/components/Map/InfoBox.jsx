// src/components/Map/InfoBox.jsx

import React from "react";
import PropTypes from "prop-types";
import "./InfoBox.css"; // Styles specific to InfoBox

const InfoBox = ({ type, location, onClear }) => {
  return (
    <div className="info-box">
      <span className="info-text">
        {type}: {location}
      </span>
      <button
        className="clear-button"
        onClick={onClear}
        aria-label={`Clear ${type}`}
      >
        Clear
      </button>
    </div>
  );
};

InfoBox.propTypes = {
  type: PropTypes.oneOf(["Departure", "Arrival"]).isRequired,
  location: PropTypes.string.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default InfoBox;
